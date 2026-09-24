"""Télécharge les PDF et les transcriptions d'un cours à partir de son inventaire.

Usage : python3 scripts/download_assets.py data/inventaire/analyse.json data/raw/analyse

Produit <dest>/pdf/*.pdf, <dest>/transcripts/*.srt et <dest>/manifest.json,
qui relie chaque fichier à sa place dans le cours (chapitre > séquence > unité).
Les fichiers déjà présents ne sont pas retéléchargés.
"""
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


def slug(s, n=40):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"\\\(|\\\)|\\mathbb\{(\w)\}", r"\1", s)
    return re.sub(r"[^A-Za-z0-9.]+", "-", s).strip("-")[:n] or "x"


def walk(node, path=()):
    if not node.get("children"):
        yield node, path
    for c in node.get("children", []):
        yield from walk(c, path + (node,))


def fetch(url, dest, tries=4):
    if dest.exists() and dest.stat().st_size > 0:
        return "cache"
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
            dest.write_bytes(data)
            return "ok"
        except Exception as e:  # réseau instable : on réessaie avec un délai croissant
            err = e
            time.sleep(2 ** (i + 1))
    return f"erreur: {err}"


def main(inv_path, dest):
    inv = json.load(open(inv_path))
    dest = Path(dest)
    (dest / "pdf").mkdir(parents=True, exist_ok=True)
    (dest / "transcripts").mkdir(parents=True, exist_ok=True)

    items, seen = [], {}
    video_n = {}
    for leaf, path in walk(inv["tree"]):
        names = [p["name"] for p in path[1:]] + [leaf["name"]]
        where = {"chapitre": names[0] if names else "", "sequence": names[1] if len(names) > 1 else "",
                 "unite": names[2] if len(names) > 2 else "", "bloc": leaf["id"]}
        for url in leaf.get("files", []):
            fname = urllib.parse.unquote(url.rsplit("/", 1)[-1])
            if fname in seen:
                seen[fname]["aussi"].append(where)
                continue
            it = {"kind": "pdf", "url": url, "file": f"pdf/{fname}", **where, "aussi": []}
            seen[fname] = it
            items.append(it)
        if leaf["type"] == "video":
            seq = path[2]["id"] if len(path) > 2 else ""
            video_n[seq] = video_n.get(seq, 0) + 1
            for lang, url in leaf.get("transcripts", {}).items():
                name = f"{slug(where['chapitre'], 14)}__{slug(where['sequence'])}__v{video_n[seq]}.{lang}.srt"
                items.append({"kind": "transcript", "lang": lang, "url": url,
                              "file": f"transcripts/{name}", "videoUrls": leaf.get("videoUrls", []), **where})

    with ThreadPoolExecutor(4) as ex:
        results = list(ex.map(lambda it: fetch(it["url"], dest / it["file"]), items))
    for it, r in zip(items, results):
        it["status"] = r
        p = dest / it["file"]
        it["bytes"] = p.stat().st_size if p.exists() else 0

    json.dump({"cours": inv["summary"]["cours"], "items": items},
              open(dest / "manifest.json", "w"), ensure_ascii=False, indent=1)
    bad = [it for it in items if it["status"].startswith("erreur")]
    print(f"{len(items)} fichiers, {sum(it['bytes'] for it in items) / 1e6:.1f} Mo, {len(bad)} erreurs")
    for it in bad:
        print("  ", it["file"], it["status"])


if __name__ == "__main__":
    main(*sys.argv[1:3])
