"""Contrôle négatif : chaque réponse officielle jugée conforme doit être rejetée si on la modifie.
Un vérificateur qui dit « oui » à tout ne vaut rien. Lancer : python3 tests/test_sympy_checks.py"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tuteur"))
import sympy_checks as c  # noqa: E402

def _set_mutation(a):
    """Ajoute un point absent de l'ensemble ; s'il n'y en a pas, en retire un."""
    S = c._as_set(a)
    for pt in ("1000", "-1000", "0", "1", "-1", "1/7", "-7/3"):
        if not S.contains(c.P(pt)):
            return f"Union({a}, FiniteSet({pt}))"
    return f"Complement({a}, FiniteSet(1/7))"


MUTATE = {
    "eq": lambda a: f"({a})+1", "form": lambda a: f"({a})+1", "numeric": lambda a: f"({a})+1",
    "solve": _set_mutation, "domain": _set_mutation, "range": _set_mutation, "truth": lambda a: "Faux" if a.lower().startswith("v") else "Vrai",
}


def main():
    bad, n = [], 0
    for f in sorted((ROOT / "corpus").glob("*/series/*.json")):
        for e in json.load(open(f))["exercices"]:
            for i in e["items"]:
                v = i["verification"]
                if v["statut"] != "conforme":
                    continue
                for spec in v["spec"]:
                    if spec["type"] not in MUTATE:
                        continue
                    n += 1
                    r = c.run(spec, MUTATE[spec["type"]](spec["answer"]))
                    if r["ok"] is not False:
                        bad.append((i["id"], spec, r))
    print(f"{n} réponses modifiées, {len(bad)} acceptées à tort")
    for b in bad:
        print("  ", b)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
