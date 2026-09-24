"""Construit le corpus d'une série : exercices à identifiants stables, corrigé officiel, vérification SymPy.

Usage : python3 scripts/build_series.py corpus_src/analyse/serie_m1.py

Écrit :
  corpus/analyse/series/<id>.json   — les exercices, prêts pour l'application
  corpus/analyse/fig/*.png          — les figures découpées dans les PDF
  corpus/analyse/rapports/<id>.md   — ce que SymPy confirme, contredit ou ne peut pas vérifier
"""
import importlib.util
import json
import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tuteur"))
import sympy_checks  # noqa: E402

RAW = ROOT / "data/raw/analyse"
OUT = ROOT / "corpus/analyse"

# Figures : (pdf, page 1-indexée, rectangle en points x0, y0, x1, y1). Plusieurs rectangles = plusieurs images.
CROPS = {
    "S-1_II5_triangle": [("Serie__-1_v01.pdf", 2, (245, 670, 372, 745))],
    "S-1_III1_graphe": [("Serie__-1_v01.pdf", 3, (80, 248, 200, 355))],
    "S-1_IV_tables": [("Serie__-1_v01.pdf", 4, (62, 294, 540, 362))],
    "S-1_II9_corrige": [("Corrige_Serie__-1_v01.pdf", 2, (80, 248, 370, 335))],
    "S-1_III5_corrige": [("Corrige_Serie__-1_v01.pdf", 2, (80, 500, 535, 712)),
                         ("Corrige_Serie__-1_v01.pdf", 3, (80, 34, 535, 144))],
    "S-1_III9_corrige": [("Corrige_Serie__-1_v01.pdf", 3, (62, 322, 590, 690)),
                         ("Corrige_Serie__-1_v01.pdf", 4, (62, 36, 590, 697))],
    "S-1_IV1_corrige": [("Corrige_Serie__-1_v01.pdf", 5, (62, 258, 590, 730)),
                        ("Corrige_Serie__-1_v01.pdf", 6, (62, 34, 590, 735)),
                        ("Corrige_Serie__-1_v01.pdf", 7, (62, 34, 590, 306))],
    "S-1_IV2_corrige": [("Corrige_Serie__-1_v01.pdf", 7, (62, 305, 590, 756)),
                        ("Corrige_Serie__-1_v01.pdf", 8, (62, 55, 590, 124))],
    "S-1_IV3_corrige": [("Corrige_Serie__-1_v01.pdf", 8, (62, 145, 590, 356))],
}


def crop(stem):
    """Découpe une figure et renvoie les chemins relatifs au corpus."""
    files = []
    for k, (pdf, page, rect) in enumerate(CROPS[stem]):
        name = f"fig/{stem}{'' if len(CROPS[stem]) == 1 else f'_{k + 1}'}.png"
        doc = pymupdf.open(RAW / "pdf" / pdf)
        pix = doc[page - 1].get_pixmap(dpi=150, clip=pymupdf.Rect(*rect))
        (OUT / name).parent.mkdir(parents=True, exist_ok=True)
        pix.save(OUT / name)
        files.append(name)
    return files


def fig(ref):
    return crop(Path(ref).stem) if ref else None


STATUT = {True: "conforme", False: "divergence", None: "non_tranche"}


def verify(check):
    if check is None:
        return {"statut": "non_verifiable"}
    checks = check if isinstance(check, list) else [check]
    results = [sympy_checks.run(c) for c in checks]
    oks = [r["ok"] for r in results]
    ok = False if False in oks else None if None in oks else True
    return {"statut": STATUT[ok], "methode": sorted({r["methode"] for r in results}),
            "sympy": " ; ".join(r["sympy"] for r in results), "detail": " ; ".join(r["detail"] for r in results),
            "spec": checks}


def main(src):
    spec = importlib.util.spec_from_file_location("serie", src)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    S = mod.SERIE
    sid = S["id"]
    exercices = []
    for part in S["parties"]:
        for ex in part["exercices"]:
            ex_id = f"{sid}.{part['num']}.{ex['num']}"
            items = []
            for item in ex["items"]:
                iid = f"{ex_id}.{item['sub']}" if item["sub"] else ex_id
                v = verify(item["check"])
                rec = {"id": iid, "sub": item["sub"], "enonce": item["enonce"], "corrige": item["corrige"],
                       "verification": v}
                if item.get("note"):
                    rec["note"] = item["note"]
                if item.get("figure_corrige"):
                    rec["figures_corrige"] = fig(item["figure_corrige"])
                items.append(rec)
            e = {"id": ex_id, "partie": part["num"], "partie_titre": part["titre"], "num": ex["num"],
                 "losange": bool(ex.get("losange") or part.get("losange")), "page": ex["page"],
                 "consigne": ex["consigne"], "notions": ex["notions"], "items": items}
            for k in ("corrige_global", "apres"):
                if ex.get(k):
                    e[k] = ex[k]
            if ex.get("figure_enonce"):
                e["figures_enonce"] = fig(ex["figure_enonce"])
            if ex.get("figure_corrige"):
                e["figures_corrige"] = fig(ex["figure_corrige"])
            if part.get("intro") and ex is part["exercices"][0]:
                e["intro_partie"] = part["intro"]
                if part.get("figure_intro"):
                    e["figures_intro"] = fig(part["figure_intro"])
            exercices.append(e)

    extra = [{"ref": f"{sid}.{ref}", **verify(c)} for ref, c in getattr(mod, "EXTRA", [])]
    out = {k: S[k] for k in ("id", "matiere", "numero", "titre", "chapitre", "sources", "avant_propos")}
    out["exercices"] = exercices
    out["verifications_complementaires"] = extra
    (OUT / "series").mkdir(parents=True, exist_ok=True)
    json.dump(out, open(OUT / "series" / f"{sid}.json", "w"), ensure_ascii=False, indent=1)
    report(out)


def report(S):
    items = [(e, i) for e in S["exercices"] for i in e["items"]]
    by = {}
    for e, i in items:
        by.setdefault(i["verification"]["statut"], []).append((e, i))
    L = [f"# {S['id']} — {S['titre']} ({S['chapitre']}) : rapport de vérification", "",
         f"{len(items)} questions. " + ", ".join(f"{k} : {len(v)}" for k, v in sorted(by.items())), "",
         "- **conforme** : SymPy confirme la réponse du corrigé EPFL.",
         "- **divergence** : SymPy contredit le corrigé EPFL. Non tranché : à examiner.",
         "- **non_tranche** : SymPy n'a pas pu conclure.",
         "- **non_verifiable** : graphe, lecture de figure, réponse descriptive ou convention du cours.", ""]
    for statut in ("divergence", "non_tranche"):
        if by.get(statut):
            L += [f"## {statut.capitalize()}", ""]
            for e, i in by[statut]:
                v = i["verification"]
                L += [f"### {i['id']}", "", f"- Énoncé : $ {i['enonce'] or e['consigne']} $",
                      f"- Corrigé EPFL : $ {i['corrige']} $", f"- SymPy : $ {v['sympy']} $ ({', '.join(v['methode'])})",
                      f"- Détail : {v['detail']}"]
                if i.get("note"):
                    L.append(f"- Note : {i['note']}")
                L.append("")
    notes = [(e, i) for e, i in items if i.get("note") and i["verification"]["statut"] not in ("divergence", "non_tranche")]
    if notes:
        L += ["## Remarques et points douteux", ""]
        L += [f"- **{i['id']}** ({i['verification']['statut']}) : {i['note']}" for e, i in notes]
        L.append("")
    if S.get("verifications_complementaires"):
        L += ["## Vérifications complémentaires", ""]
        L += [f"- {x['ref']} : {x['statut']} — {x.get('detail', '')}" for x in S["verifications_complementaires"]]
        L.append("")
    L += ["## Méthodes", "",
          "- *symbolique* : SymPy démontre l'égalité ou calcule l'ensemble exact.",
          "- *numerique* : SymPy n'a pas simplifié jusqu'à 0 ; l'égalité est testée en 20 points aléatoires.",
          "- *enumeration* : quantificateurs testés sur tous les modèles à 1, 2 et 3 éléments. "
          "Un contre-exemple est une preuve ; l'absence de contre-exemple n'en est pas une.", ""]
    (OUT / "rapports").mkdir(parents=True, exist_ok=True)
    (OUT / "rapports" / f"{S['id']}.md").write_text("\n".join(L))
    print("\n".join(L[:4]))


if __name__ == "__main__":
    main(sys.argv[1])
