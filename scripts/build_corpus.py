"""Construit le corpus d'un chapitre : théorie (passages + originaux + vidéo), fiches de notions, variantes.

Usage : python3 scripts/build_corpus.py corpus_src/analyse/prelude.py corpus_src/analyse/variantes_m1.py

Lit aussi corpus/analyse/series/<serie>.json (produit par build_series.py) pour relier notions et exercices.
Écrit corpus/analyse/{chapitres,notions,variantes}/…json, corpus/analyse/orig/*.png, et un rapport.
"""
import importlib.util
import json
import re
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tuteur"))
import sympy_checks  # noqa: E402

RAW = ROOT / "data/raw/analyse"
OUT = ROOT / "corpus/analyse"


def load(path):
    spec = importlib.util.spec_from_file_location(Path(path).stem, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def crop(pdf, page, rect, name):
    doc = pymupdf.open(RAW / "pdf" / pdf)
    pix = doc[page - 1].get_pixmap(dpi=110, clip=pymupdf.Rect(*rect))
    path = OUT / "orig" / f"{name}.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(path)
    return f"orig/{name}.png"


def srt_cues(fname):
    """Transcription SRT → [(début 'hh:mm:ss', texte)], sans les numéros ni les fins de ligne."""
    t = (RAW / "transcripts" / fname).read_text()
    cues = []
    for block in re.split(r"\n\s*\n", t.strip()):
        lines = block.splitlines()
        if len(lines) >= 3:
            cues.append((lines[1][:8], " ".join(lines[2:]).replace("𝝅", "π").strip()))
    return cues


def excerpt(cues, start, end):
    return " ".join(tx for ts, tx in cues if start <= ts < end)


def verify_all(specs):
    out = []
    for s in specs or []:
        r = sympy_checks.run(s)
        out.append({"spec": s, "ok": r["ok"], "methode": r["methode"], "detail": r["detail"]})
    return out


def statut(verifs):
    if not verifs:
        return "non_verifiable"
    oks = [v["ok"] for v in verifs]
    return "divergence" if False in oks else "non_tranche" if None in oks else "conforme"


def main(theory_src, variants_src=None):
    T = load(theory_src)
    C = T.CHAPITRE
    problems = []

    # Théorie : passages officiels, image d'origine, extrait de la vidéo correspondante
    sections = []
    for sec in T.SECTIONS:
        cues = srt_cues(sec["video"])
        passages = []
        for p in sec["passages"]:
            v = verify_all(p.get("verifs"))
            rec = {"id": p["id"], "titre": p["titre"], "tex": p["tex"], "notions": p["notions"],
                   "source": {"pdf": sec["pdf"], "page": p["page"]},
                   "original": crop(sec["pdf"], p["page"], p["crop"], p["id"]),
                   "video": {"fichier": sec["video"], "debut": p["video"][0], "fin": p["video"][1],
                             "transcription": excerpt(cues, *p["video"])},
                   "verification": {"statut": statut(v), "details": v}}
            if p.get("complement"):
                rec["complement"] = p["complement"]
            passages.append(rec)
            if statut(v) in ("divergence", "non_tranche"):
                problems.append((p["id"], v))
        sections.append({"id": sec["id"], "titre": sec["titre"], "passages": passages})
    complements = []
    for c in T.COMPLEMENTS:
        v = verify_all(c.get("verifs"))
        rec = {k: c[k] for k in ("id", "titre", "pour", "notions", "tex")}
        rec.update({"source": {"pdf": c["pdf"], "page": c["page"]}, "original": crop(c["pdf"], c["page"], c["crop"], c["id"]),
                    "verification": {"statut": statut(v), "details": v}})
        if c.get("note"):
            rec["note"] = c["note"]
        complements.append(rec)
        if statut(v) in ("divergence", "non_tranche"):
            problems.append((c["id"], v))
    intro = excerpt(srt_cues(C["intro_video"]), "00:00:00", "99:99:99")
    chapitre = {**{k: C[k] for k in ("id", "matiere", "numero", "titre", "but", "serie")},
                "intro_video": intro, "sections": sections, "complements": complements}
    (OUT / "chapitres").mkdir(parents=True, exist_ok=True)
    json.dump(chapitre, open(OUT / "chapitres" / f"{C['id']}.json", "w"), ensure_ascii=False, indent=1)

    # Notions : fiches du tuteur + exercices officiels qui les travaillent
    serie = json.load(open(OUT / "series" / f"{C['serie']}.json"))
    ex_by_notion = {}
    for e in serie["exercices"]:
        for n in e["notions"]:
            ex_by_notion.setdefault(n, []).append(e["id"])
    notions = []
    known = {n["id"] for n in T.NOTIONS}
    for n in T.NOTIONS:
        v = verify_all(n.get("verifs"))
        for pre in n["prerequis"]:
            assert pre in known, f"{n['id']} : prérequis inconnu {pre}"
        notions.append({**{k: n[k] for k in ("id", "titre", "prerequis", "idee", "formule", "piege", "passages")},
                        "chapitre": C["id"], "exercices": ex_by_notion.get(n["id"], []), "origine": "tuteur",
                        "verification": {"statut": statut(v), "details": v}})
        if statut(v) in ("divergence", "non_tranche"):
            problems.append((n["id"], v))
    orphans = sorted(set(ex_by_notion) - known)
    assert not orphans, f"notions citées par la série mais sans fiche : {orphans}"
    (OUT / "notions").mkdir(parents=True, exist_ok=True)
    json.dump({"chapitre": C["id"], "notions": notions}, open(OUT / "notions" / f"{C['id']}.json", "w"),
              ensure_ascii=False, indent=1)

    # Variantes : SymPy calcule la solution puis la revérifie ; sinon la variante est écartée
    variants, dropped = [], []
    if variants_src:
        V = load(variants_src)
        counts = {}
        base_ids = {f"{e['partie']}.{e['num']}": e for e in serie["exercices"]}
        for base, enonce, spec in V.VARIANTES:
            ex = base_ids[base]
            counts[base] = counts.get(base, 0) + 1
            vid = f"{ex['id']}.v{counts[base]}"
            try:
                sol = sympy_checks.compute(spec)
                check = sympy_checks.run(spec, sol["answer"])
                if check["ok"] is not True:
                    raise ValueError("la solution calculée ne se revérifie pas")
                variants.append({"id": vid, "base": ex["id"], "consigne": ex["consigne"], "enonce": enonce,
                                 "notions": ex["notions"], "spec": spec, "solution": sol["answer"],
                                 "solution_tex": sol["latex"], "origine": "tuteur",
                                 "verification": {"statut": "solution_sympy"}})
            except Exception as err:
                dropped.append((vid, enonce, str(err)))
        (OUT / "variantes").mkdir(parents=True, exist_ok=True)
        json.dump({"serie": serie["id"], "variantes": variants}, open(OUT / "variantes" / f"{serie['id']}.json", "w"),
                  ensure_ascii=False, indent=1)

    n_pass = sum(len(s["passages"]) for s in sections)
    L = [f"# {C['id']} — {C['titre']} : rapport", "",
         f"- {n_pass} passages officiels, {len(complements)} compléments, {len(notions)} fiches de notions, "
         f"{len(variants)} variantes ({len(dropped)} écartées).", ""]
    L += ["## Vérifications SymPy en échec", ""] + ([f"- {i} : {v}" for i, v in problems] or ["Aucune."]) + [""]
    L += ["## Variantes écartées", ""] + ([f"- {i} ${e}$ : {r}" for i, e, r in dropped] or ["Aucune."]) + [""]
    L += ["## Points à contrôler par toi", "",
          "- Transcriptions des manuscrits : chaque passage garde l'image d'origine à côté, pour comparaison.",
          "- Les fiches de notions sont écrites par le tuteur ; elles citent leurs sources.", ""]
    (OUT / "rapports" / f"{C['id']}.md").write_text("\n".join(L))
    print("\n".join(L))


if __name__ == "__main__":
    main(*sys.argv[1:3])
