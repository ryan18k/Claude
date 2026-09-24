"""Vérifications SymPy des réponses mathématiques.

Ce module sert à deux endroits, avec le même code :
- hors ligne, pour vérifier les corrigés officiels du corpus (scripts/build_series.py) ;
- dans l'application, sous Pyodide, pour vérifier les réponses de l'élève et les variantes générées.

Chaque vérification reçoit une spécification (dict) et une réponse à tester, et renvoie un dict :
  {"ok": True/False/None, "methode": "symbolique" | "numerique" | "enumeration",
   "sympy": <réponse calculée par SymPy, en LaTeX>, "detail": <explication courte>}
ok=None signifie que SymPy n'a pas pu conclure : le résultat est alors « non vérifié ».
"""
import random

import sympy as sp
from sympy.calculus.util import continuous_domain, function_range
from sympy.logic.boolalg import Equivalent, Implies, to_cnf
from sympy.logic.inference import satisfiable
from sympy.parsing.sympy_parser import (convert_xor, implicit_application, implicit_multiplication,
                                        parse_expr, standard_transformations)

# « 2x » et « sin x » sont acceptés ; « ^ » vaut « ** ». Les noms de plusieurs lettres ne sont pas coupés.
_T = standard_transformations + (convert_xor, implicit_multiplication, implicit_application)

# Hypothèses par défaut sur les lettres : a, b (et c, d) strictement positifs comme dans les
# exercices « où a, b > 0 » ; les autres lettres sont réelles. Une spec peut les changer.
_DEFAULT = {
    **{n: dict(real=True) for n in "xyzhtuvnmkpqrsCTθαβ"},
    **{n: dict(positive=True) for n in "abcd"},
}


def symbols(assume=None):
    spec = dict(_DEFAULT)
    for name, kw in (assume or {}).items():
        spec[name] = kw
    out = {name: sp.Symbol(name, **kw) for name, kw in spec.items()}
    out.update({"theta": out["θ"], "alpha": out["α"], "beta": out["β"], "e": sp.E, "E": sp.E,
                "pi": sp.pi, "oo": sp.oo, "ln": sp.log, "log": sp.log, "sqrt": sp.sqrt,
                "abs": sp.Abs, "Abs": sp.Abs, "Sum": sp.Sum})
    return out


def P(s, assume=None):
    """Lit une expression écrite en syntaxe Python/SymPy (x**2, sqrt(x), pi, oo…)."""
    if isinstance(s, (int, float)):
        return sp.nsimplify(s)
    return parse_expr(s, local_dict=symbols(assume), transformations=_T, evaluate=True)


def tex(e):
    try:
        return sp.latex(e)
    except Exception:
        return str(e)


def _is_zero(d, free):
    """Teste d == 0 : d'abord symboliquement, sinon numériquement en des points aléatoires."""
    for f in (sp.simplify, lambda z: sp.simplify(sp.powsimp(sp.expand(z), force=True)),
              sp.trigsimp, lambda z: sp.simplify(sp.powdenest(sp.expand_power_base(z, force=True), force=True))):
        try:
            if f(d) == 0:
                return True, "symbolique"
        except Exception:
            pass
    # Contrôle numérique : on échantillonne des valeurs compatibles avec les hypothèses.
    rng = random.Random(0)
    ok_pts = 0
    for _ in range(60):
        subs = {}
        for s in free:
            v = rng.uniform(0.3, 3.0)
            if not s.is_positive and rng.random() < 0.5:
                v = -v
            if s.is_integer:
                v = rng.randint(-4, 6)
            subs[s] = v
        try:
            val = complex(d.subs(subs).evalf())
        except Exception:
            continue
        if abs(val) > 1e-9 * (1 + abs(val)):
            return False, "numerique"
        ok_pts += 1
        if ok_pts >= 20:
            return True, "numerique"
    return None, "numerique"


def check_eq(spec, answer):
    """La réponse est égale à l'expression (calcul, simplification, identité)."""
    A = spec.get("assume")
    e, r = P(spec["expr"], A), P(answer, A)
    ok, how = _is_zero(e - r, (e - r).free_symbols)
    return {"ok": ok, "methode": how, "sympy": tex(sp.simplify(e)),
            "detail": "égalité " + ("confirmée" if ok else "infirmée" if ok is False else "non tranchée")}


def check_form(spec, answer):
    """Égalité + forme demandée : 'developpee', 'factorisee', 'sans_exposant_negatif'."""
    res = check_eq(spec, answer)
    A = spec.get("assume")
    r = P(answer, A)
    form = spec["form"]
    if form == "developpee":
        good = sp.expand(r) == r
        res["sympy"] = tex(sp.expand(P(spec["expr"], A)))
    elif form == "factorisee":
        good = r.is_Mul or r.is_Pow
        res["sympy"] = tex(sp.factor(P(spec["expr"], A)))
    else:
        good = True
    if res["ok"] and not good:
        res["ok"] = False
        res["detail"] = f"égal, mais pas sous forme {form}"
    return res


def _as_set(s, assume=None):
    """Lit un ensemble : 'EmptySet', 'FiniteSet(1, 2)', 'Interval.Ropen(-3, 1)', 'Union(...)', 'Reals'…"""
    loc = symbols(assume)
    loc.update({"FiniteSet": sp.FiniteSet, "Interval": sp.Interval, "Union": sp.Union,
                "EmptySet": sp.S.EmptySet, "Reals": sp.S.Reals, "Complement": sp.Complement,
                "Integers": sp.S.Integers})
    return sp.sympify(s, locals=loc)


def check_solve(spec, answer):
    """Ensemble des solutions réelles d'une équation ou d'une inéquation."""
    A = spec.get("assume")
    x = symbols(A)[spec.get("var", "x")]
    dom = _as_set(spec.get("domain", "Reals"), A)
    if "rel" in spec:  # inéquation, écrite avec <, <=, >, >=
        rel = P(spec["rel"], A)
        parts = rel.args if isinstance(rel, sp.And) else (rel,)  # double inégalité a < f(x) <= b
        sol = dom
        for r in parts:
            sol = sp.Intersection(sol, sp.solveset(r, x, dom))
        sol = sp.simplify(sol)
    else:
        lhs, rhs = P(spec["lhs"], A), P(spec["rhs"], A)
        # Domaine de définition : on retire les points où l'un des membres n'est pas défini.
        try:
            d = continuous_domain(lhs - rhs, x, dom) if dom.is_subset(sp.S.Reals) and dom != sp.S.Integers else dom
        except Exception:
            d = dom
        sol = sp.solveset(sp.Eq(lhs, rhs), x, d)
    target = _as_set(answer, A)
    ok = sp.simplify(sp.Complement(sol, target)) == sp.S.EmptySet and \
        sp.simplify(sp.Complement(target, sol)) == sp.S.EmptySet
    return {"ok": bool(ok), "methode": "symbolique", "sympy": tex(sol),
            "detail": "ensemble des solutions " + ("identique" if ok else "différent")}


def check_truth(spec, answer):
    """Vrai/Faux pour une égalité supposée bien définie. answer: 'Vrai' ou 'Faux'."""
    A = spec.get("assume")
    lhs, rhs = P(spec["lhs"], A), P(spec["rhs"], A)
    d = lhs - rhs
    holds, how = _is_zero(d, d.free_symbols)
    claim = str(answer).strip().lower().startswith("v")
    ok = None if holds is None else (holds == claim)
    return {"ok": ok, "methode": how, "sympy": "Vrai" if holds else "Faux" if holds is False else "?",
            "detail": "l'égalité est " + ("toujours vraie" if holds else "fausse en général" if holds is False else "?")}


def check_domain(spec, answer):
    """Domaine de définition réel d'une fonction."""
    A = spec.get("assume")
    x = symbols(A)[spec.get("var", "x")]
    f = P(spec["expr"], A)
    dom = continuous_domain(f, x, sp.S.Reals)
    target = _as_set(answer, A)
    ok = sp.simplify(sp.SymmetricDifference(dom, target)) == sp.S.EmptySet
    return {"ok": bool(ok), "methode": "symbolique", "sympy": tex(dom),
            "detail": "domaine " + ("identique" if ok else "différent")}


def check_range(spec, answer):
    """Ensemble image d'une fonction sur un intervalle (domaine de la réciproque)."""
    A = spec.get("assume")
    x = symbols(A)[spec.get("var", "x")]
    f = P(spec["expr"], A)
    I = _as_set(spec["interval"], A)
    rng = function_range(f, x, I)
    if rng == sp.S.EmptySet and I != sp.S.EmptySet:  # limite connue de function_range (ex. (1/2)**x)
        rng = function_range(f.rewrite(sp.exp), x, I)
    if rng == sp.S.EmptySet and I != sp.S.EmptySet:
        return {"ok": None, "methode": "symbolique", "sympy": "", "detail": "SymPy n'a pas calculé l'image"}
    target = _as_set(answer, A)
    ok = sp.simplify(sp.SymmetricDifference(rng, target)) == sp.S.EmptySet
    return {"ok": bool(ok), "methode": "symbolique", "sympy": tex(rng),
            "detail": "image " + ("identique" if ok else "différente")}


def check_numeric(spec, answer):
    """Valeur approchée : |réponse - valeur exacte| <= tol."""
    e = P(spec["expr"])
    r = P(answer)
    tol = spec.get("tol", 0.01)
    ok = abs(float(e) - float(r)) <= tol
    return {"ok": ok, "methode": "numerique", "sympy": f"{float(e):.4f}",
            "detail": f"écart {abs(float(e) - float(r)):.4g} (tolérance {tol})"}


def _logic(s):
    names = {n: sp.Symbol(n) for n in "pqr"}
    names.update({"Equivalent": Equivalent, "Implies": Implies})
    return sp.sympify(s, locals=names)


def check_logic(spec, answer=None):
    """Tautologie propositionnelle : 'expr' doit être vraie pour toutes les valeurs de p, q, r."""
    e = _logic(spec["expr"])
    counter = satisfiable(sp.Not(e))
    ok = counter is False
    return {"ok": ok, "methode": "symbolique", "sympy": "tautologie" if ok else f"contre-exemple {counter}",
            "detail": "vraie pour toutes les valeurs de vérité" if ok else "pas une tautologie"}


def check_quantifiers(spec, answer=None):
    """Énoncé avec ∀/∃ sur des ensembles finis : vérifié sur tous les modèles à n éléments (n ≤ 3).
    Une implication confirmée ainsi n'est pas une preuve générale ; un contre-exemple, si."""
    kind = spec["kind"]  # 'implies' | 'converse_fails'
    found = None
    for n in (1, 2, 3):
        E = range(n)
        preds = spec["preds"]  # 'p' ou 'pq' (une variable) ou 'p2' (deux variables)
        if preds == "p2":
            cells = [(i, j) for i in E for j in E]
            for bits in range(2 ** len(cells)):
                val = {c: bool(bits >> k & 1) for k, c in enumerate(cells)}
                p = lambda i, j: val[(i, j)]
                env = {"E": E, "p": p, "all": all, "any": any}
                L, R = eval(spec["lhs"], env), eval(spec["rhs"], env)
                if L and not R:
                    found = found or {"n": n, "p": {f"{i},{j}": v for (i, j), v in val.items()}}
        else:
            for bits in range(2 ** (2 * n)):
                pv = [bool(bits >> k & 1) for k in range(n)]
                qv = [bool(bits >> (n + k) & 1) for k in range(n)]
                env = {"E": E, "p": lambda i: pv[i], "q": lambda i: qv[i], "all": all, "any": any}
                L, R = eval(spec["lhs"], env), eval(spec["rhs"], env)
                if L and not R:
                    found = found or {"n": n, "p": pv, "q": qv}
    if kind == "implies":
        ok = found is None
        return {"ok": ok, "methode": "enumeration", "sympy": "aucun contre-exemple (n ≤ 3)" if ok else str(found),
                "detail": "implication vraie sur tous les modèles finis testés" if ok else "contre-exemple trouvé"}
    ok = found is not None
    return {"ok": ok, "methode": "enumeration", "sympy": str(found) if found else "aucun",
            "detail": "la réciproque est fausse (contre-exemple)" if ok else "aucun contre-exemple trouvé"}


CHECKS = {"eq": check_eq, "form": check_form, "solve": check_solve, "truth": check_truth,
          "domain": check_domain, "range": check_range, "numeric": check_numeric,
          "logic": check_logic, "quantifiers": check_quantifiers}


def run(spec, answer=None):
    """Point d'entrée unique. spec['type'] choisit la vérification."""
    try:
        return CHECKS[spec["type"]](spec, answer if answer is not None else spec.get("answer"))
    except Exception as e:  # une spec illisible ne doit jamais passer pour « vérifiée »
        return {"ok": None, "methode": "erreur", "sympy": "", "detail": f"{type(e).__name__}: {e}"}
