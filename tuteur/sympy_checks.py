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
    elif form == "carre":  # a(x + h)^2 + k
        good = _is_completed_square(r)
        res["sympy"] = tex(_completed_square(P(spec["expr"], A), symbols(A)[spec.get("var", "x")]))
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
    return parse_expr(s, local_dict=loc, transformations=_T, evaluate=True)


def _completed_square(e, x):
    a, b, c = sp.Poly(sp.expand(e), x).all_coeffs()
    h = sp.nsimplify(b / (2 * a))
    k = sp.nsimplify(c - b ** 2 / (4 * a))
    sq = sp.Pow(x + h, 2, evaluate=False)
    return sp.Add(sq if a == 1 else sp.Mul(a, sq, evaluate=False), k, evaluate=False)


def _is_completed_square(r):
    """Vrai si r s'écrit a*(x + h)**2 + k (un seul carré d'un binôme du premier degré, plus une constante)."""
    terms = sp.Add.make_args(r)
    squares = [t for t in terms if any(isinstance(f, sp.Pow) and f.exp == 2 and sp.Poly(f.base).degree() == 1
                                       for f in sp.Mul.make_args(t))]
    rest = [t for t in terms if t not in squares]
    return len(squares) == 1 and all(t.is_number for t in rest)


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


# ---------------------------------------------------------------- Lecture des réponses « comme sur papier »
import re

_SUP = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺", "0123456789-+")
_SUPRUN = re.compile(r"[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+")


def _sqrt_unicode(s):
    """√3 → sqrt(3), √(x+1) → sqrt(x+1), √x → sqrt(x), ∛8 → 8**(1/3)."""
    out, i = [], 0
    while i < len(s):
        ch = s[i]
        if ch in "√∛":
            j = i + 1
            if j < len(s) and s[j] == "(":
                depth, k = 0, j
                while k < len(s):
                    depth += s[k] == "("
                    depth -= s[k] == ")"
                    if depth == 0:
                        break
                    k += 1
                arg, i = s[j + 1:k], k + 1
            else:
                m = re.match(r"[0-9.]+|[A-Za-zπ]", s[j:])
                arg = m.group(0) if m else ""
                i = j + len(arg)
            out.append(f"sqrt({arg})" if ch == "√" else f"({arg})**(1/3)")
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def _group(s, j):
    """Renvoie (contenu, fin) du groupe parenthésé qui commence en s[j] == '('."""
    depth = 0
    for k in range(j, len(s)):
        depth += s[k] == "("
        depth -= s[k] == ")"
        if depth == 0:
            return s[j + 1:k], k + 1
    return s[j + 1:], len(s)


def _nroot(s):
    """√[n](x) → (x)**(1/(n))  (clavier maths)."""
    while True:
        m = re.search(r"√\[([^\]]+)\]\(", s)
        if not m:
            return s
        arg, end = _group(s, m.end() - 1)
        s = s[:m.start()] + f"(({arg})**(1/({m.group(1)})))" + s[end:]


def _logbase(s):
    """log_2(x), log_(a)(x), log_a(x) → log(x, base)."""
    while True:
        m = re.search(r"log_(?:(\()|([A-Za-z0-9.]+)\s*\()", s)
        if not m:
            return s
        if m.group(1):
            base, j = _group(s, m.start() + 4)
            if j >= len(s) or s[j] != "(":
                return s
        else:
            base, j = m.group(2), m.end() - 1
        arg, end = _group(s, j)
        s = s[:m.start()] + f"log({arg}, {base})" + s[end:]


def normalize_expr(t, decimal_comma=True):
    """Écriture manuscrite/clavier → syntaxe SymPy pour une expression."""
    s = t.strip()
    s = s.replace("−", "-").replace("–", "-").replace("×", "*").replace("·", "*").replace("÷", "/")
    s = s.replace("π", "pi").replace("∞", "oo").replace("≤", "<=").replace("≥", ">=").replace("≠", "!=")
    s = s.replace("θ", "theta").replace("α", "alpha").replace("β", "beta").replace("°", "")
    s = _SUPRUN.sub(lambda m: "**(" + m.group(0).translate(_SUP) + ")", s)
    s = s.replace("▢", "")
    s = _nroot(s)
    s = _sqrt_unicode(s)
    s = _logbase(s)
    s = re.sub(r"\bln\b", "log", s)
    s = re.sub(r"\btg\b", "tan", s)
    s = re.sub(r"\barctg\b|\bArctg\b|\bArctan\b", "atan", s)
    s = re.sub(r"\barcsin\b|\bArcsin\b", "asin", s)
    s = re.sub(r"\barccos\b|\bArccos\b", "acos", s)
    if decimal_comma:
        s = re.sub(r"(\d),(\d)", r"\1.\2", s)
    s = re.sub(r"^\s*[a-zA-Z]\w*\s*(\([a-z]\))?\s*=\s*", "", s)  # « x = … », « f(x) = … »
    return s


def _split_top(s, seps):
    """Coupe s aux séparateurs de niveau 0 (hors parenthèses/crochets/accolades)."""
    parts, depth, cur = [], 0, ""
    i = 0
    while i < len(s):
        ch = s[i]
        if ch in "({":
            depth += 1
        elif ch in ")}":
            depth -= 1
        for sep in seps:
            if depth == 0 and s.startswith(sep, i):
                parts.append(cur)
                cur = ""
                i += len(sep)
                break
        else:
            cur += ch
            i += 1
    parts.append(cur)
    return [p.strip() for p in parts]


def normalize_set(t):
    """« ]-3,1] ∪ {5} », « x ∈ [1,4[ », « x1 = -3 et x2 = -4 », « ±2 », « ∅ », « ℝ\\{1} » → ensemble SymPy."""
    s = t.strip().replace("−", "-").replace("–", "-")
    low = s.lower()
    if re.search(r"∅|aucune solution|pas de solution|n'admet pas|ensemble vide|^\{\s*\}$", low):
        return "EmptySet"
    s = re.sub(r"^\s*[a-z]\s*∈\s*", "", s)
    s = s.replace("∪", " U ").replace("ℝ", "Reals").replace("\\", " minus ")
    s = re.sub(r"\bR\b", "Reals", s)
    # « x1 = -3 et x2 = -4 », « x = 2 ou x = -2 », « -3, -4 » (sans crochets)
    if not re.search(r"[\[\]{}]|Reals", s):
        vals = []
        for part in re.split(r"\s+(?:et|ou)\s+|;|,(?!\d)", s):
            part = part.strip()
            if not part:
                continue
            part = re.sub(r"^\s*[a-z]\w*\s*=\s*", "", part)
            if "±" in part:
                a, b = part.split("±", 1)
                a = a.strip() or "0"
                vals += [f"({normalize_expr(a)})+({normalize_expr(b)})", f"({normalize_expr(a)})-({normalize_expr(b)})"]
            else:
                vals.append(normalize_expr(part))
        return f"FiniteSet({', '.join(vals)})"
    pieces = []
    for piece in _split_top(s, [" U ", " minus "]):
        pieces.append(piece)
    ops = re.findall(r" U | minus ", s)
    def one(p):
        p = p.strip()
        if p == "Reals":
            return "Reals"
        m = re.fullmatch(r"([\[\]])(.*),(.*)([\[\]])", p)
        if m:
            lo, a, b, hi = m.groups()
            a, b = normalize_expr(a), normalize_expr(b)
            lopen, ropen = lo == "]", hi == "["
            return f"Interval({a}, {b}, {lopen}, {ropen})"
        m = re.fullmatch(r"\{(.*)\}", p)
        if m:
            return "FiniteSet(" + ", ".join(normalize_expr(x) for x in m.group(1).split(",") if x.strip()) + ")"
        return f"FiniteSet({normalize_expr(p)})"
    expr = one(pieces[0])
    for op, p in zip(ops, pieces[1:]):
        expr = f"Union({expr}, {one(p)})" if op.strip() == "U" else f"Complement({expr}, {one(p)})"
    return expr


def answer_from_text(spec, text):
    """Traduit la réponse de l'élève selon le type de question."""
    t = spec["type"]
    if t in ("solve", "domain", "range"):
        return normalize_set(text)
    if t == "truth":
        return "Vrai" if text.strip().lower().startswith("v") else "Faux"
    if t == "numeric":
        return normalize_expr(re.sub(r"[a-zA-Z° ]+$", "", text))
    return normalize_expr(text)


def check_text(spec, text):
    """Vérifie une réponse écrite par l'élève. Renvoie aussi l'interprétation lue."""
    try:
        ans = answer_from_text(spec, text)
    except Exception as e:
        return {"ok": None, "methode": "lecture", "sympy": "", "lu": "", "detail": f"réponse illisible : {e}"}
    r = run(spec, ans)
    try:
        A = spec.get("assume")
        r["lu"] = fr_set(_as_set(ans, A)) if spec["type"] in ("solve", "domain", "range") else \
            ans if spec["type"] == "truth" else tex(P(ans, A))
    except Exception:
        r["lu"] = ans
    return r


# ---------------------------------------------------------------- Solutions calculées par SymPy (variantes)

def fr_set(S):
    """Ensemble → LaTeX à la française : ]a,b[, ∅, ℝ."""
    if S == sp.S.EmptySet:
        return r"\emptyset"
    if S == sp.S.Reals:
        return r"\mathbb{R}"
    if isinstance(S, sp.Interval):
        lo = "]" if S.left_open else "["
        hi = "[" if S.right_open else "]"
        return f"{lo}{tex(S.start)},\\,{tex(S.end)}{hi}".replace("\\infty", "\\infty")
    if isinstance(S, sp.Union):
        return r"\,\cup\,".join(fr_set(a) for a in S.args)
    if isinstance(S, sp.FiniteSet):
        return r"\left\{" + ",\\ ".join(tex(a) for a in sorted(S.args, key=lambda z: float(z))) + r"\right\}"
    if isinstance(S, sp.Complement):
        return fr_set(S.args[0]) + r"\setminus " + fr_set(S.args[1])
    return tex(S)


def compute(spec):
    """Calcule la réponse attendue avec SymPy seul. Renvoie {"answer": str SymPy, "latex": str} ou lève."""
    A = spec.get("assume")
    t = spec["type"]
    if t in ("eq", "form"):
        e = P(spec["expr"], A)
        f = spec.get("form")
        if f == "carre":
            r = _completed_square(e, symbols(A)[spec.get("var", "x")])
            return {"answer": sp.sstr(r), "latex": tex(r)}
        r = sp.expand(e) if f == "developpee" else sp.factor(e) if f == "factorisee" else sp.simplify(e)
        return {"answer": sp.sstr(r), "latex": tex(r)}
    if t == "solve":
        x = symbols(A)[spec.get("var", "x")]
        dom = _as_set(spec.get("domain", "Reals"), A)
        if "rel" in spec:
            rel = P(spec["rel"], A)
            sol = dom
            for r_ in (rel.args if isinstance(rel, sp.And) else (rel,)):
                sol = sp.Intersection(sol, sp.solveset(r_, x, dom))
        else:
            lhs, rhs = P(spec["lhs"], A), P(spec["rhs"], A)
            d = continuous_domain(lhs - rhs, x, dom) if dom != sp.S.Integers else dom
            sol = sp.solveset(sp.Eq(lhs, rhs), x, d)
        sol = sp.simplify(sol)
        if isinstance(sol, (sp.ConditionSet, sp.ImageSet)):
            raise ValueError("SymPy ne résout pas cette équation exactement")
        return {"answer": sp.srepr(sol) if False else str(sol), "latex": fr_set(sol)}
    if t == "domain":
        x = symbols(A)[spec.get("var", "x")]
        d = continuous_domain(P(spec["expr"], A), x, sp.S.Reals)
        return {"answer": str(d), "latex": fr_set(d)}
    if t == "range":
        x = symbols(A)[spec.get("var", "x")]
        r = function_range(P(spec["expr"], A), x, _as_set(spec["interval"], A))
        return {"answer": str(r), "latex": fr_set(r)}
    if t == "numeric":
        return {"answer": str(float(P(spec["expr"]))), "latex": f"{float(P(spec['expr'])):.4g}"}
    raise ValueError(f"type {t} : pas de calcul automatique")


# ---------------------------------------------------------------- Graphiques du tableau
def plot_points(expr, xmin, xmax, n=400, var="x"):
    """Points (x, y) d'une fonction pour le tableau. y = None là où la fonction n'est pas définie
    (racine d'un négatif, puissance non entière d'un négatif — convention du cours —, division par 0)."""
    import math
    x = symbols()[var]
    e = P(expr)
    f = sp.lambdify(x, e, modules=["math"])
    pts = []
    for i in range(n + 1):
        xv = xmin + (xmax - xmin) * i / n
        try:
            y = f(xv)
            y = float(y) if isinstance(y, (int, float)) and math.isfinite(y) else None
        except Exception:
            y = None
        pts.append([round(xv, 6), None if y is None else round(y, 6)])
    return {"points": pts, "latex": tex(e)}
