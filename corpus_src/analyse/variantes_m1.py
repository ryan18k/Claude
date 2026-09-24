# Banque de variantes de la série -1. Écrites par le tuteur (pas EPFL) : proches des exercices officiels
# mais différentes. Aucune solution n'est écrite ici : SymPy la calcule au build (scripts/build_corpus.py),
# puis la revérifie. Une variante que SymPy ne sait pas résoudre est écartée.
# Format : (exercice de base, énoncé LaTeX, spécification SymPy sans réponse)

def eq(e, **kw): return {"type": "eq", "expr": e, **kw}
def dev(e): return {"type": "form", "expr": e, "form": "developpee"}
def fac(e, **kw): return {"type": "form", "expr": e, "form": "factorisee", **kw}
def sol(l, r="0", **kw): return {"type": "solve", "lhs": l, "rhs": r, **kw}
def ine(rel): return {"type": "solve", "rel": rel}

POS = {"x": {"positive": True}, "y": {"positive": True}}

VARIANTES = [
    ("I.1", r"(-3)^3", eq("(-3)**3")), ("I.1", r"5^{-2}", eq("5**(-2)")),
    ("I.1", r"\frac{2^{15}}{2^{12}}", eq("2**15/2**12")), ("I.1", r"\left(\frac{2}{3}\right)^{-3}", eq("(2/3)**(-3)")),
    ("I.1", r"27^{-2/3}", eq("27**(-2/3)")), ("I.1", r"-3^2", eq("-3**2")),
    ("I.2", r"\sqrt{200}-\sqrt{18}", eq("sqrt(200)-sqrt(18)")),
    ("I.2", r"(3a^3b^2)(2a^2b)^3", eq("(3*a**3*b**2)*(2*a**2*b)**3")),
    ("I.2", r"\left(\frac{3x^2y^{1/2}}{xy^{-3/2}}\right)^{-2}", eq("(3*x**2*y**(1/2)/(x*y**(-3/2)))**(-2)", assume=POS)),
    ("I.3", r"(3x-1)(2x+4)", dev("(3*x-1)*(2*x+4)")), ("I.3", r"(x-3)^2", dev("(x-3)**2")),
    ("I.3", r"(2x-1)^3", dev("(2*x-1)**3")), ("I.3", r"(3x+2)^2", dev("(3*x+2)**2")),
    ("I.4", r"4x^2-25", fac("4*x**2-25")), ("I.4", r"2x^2+5x-3", fac("2*x**2+5*x-3")),
    ("I.4", r"x^3+2x^2-x-2", fac("x**3+2*x**2-x-2")), ("I.4", r"x^3-x^2-4", fac("x**3-x**2-4")),
    ("I.4", r"x^3y-4xy^3", fac("x**3*y-4*x*y**3")),
    ("I.5", r"\frac{x^2-9}{x^2+x-6}", eq("(x**2-9)/(x**2+x-6)")),
    ("I.5", r"\frac{x^2}{x^2-4}-\frac{x+1}{x+2}", eq("x**2/(x**2-4)-(x+1)/(x+2)")),
    ("I.5", r"\frac{\frac{a}{b}-\frac{b}{a}}{\frac{1}{a}+\frac{1}{b}}", eq("(a/b-b/a)/(1/a+1/b)")),
    ("I.6", r"\frac{\sqrt{6}}{3-\sqrt{3}}", eq("sqrt(6)/(3-sqrt(3))")),
    ("I.6", r"\frac{h}{\sqrt{h+9}-3}", eq("h/(sqrt(h+9)-3)", assume={"h": {"positive": True}})),
    ("I.8", r"x^2+3x+1", {"type": "form", "expr": "x**2+3*x+1", "form": "carre"}),
    ("I.8", r"2x^2-8x+5", {"type": "form", "expr": "2*x**2-8*x+5", "form": "carre"}),
    ("I.9", r"3x-4=2+\frac{x}{3}", sol("3*x-4", "2+x/3")), ("I.9", r"x^2-5x+6=0", sol("x**2-5*x+6")),
    ("I.9", r"x^4-5x^2+4=0", sol("x**4-5*x**2+4")), ("I.9", r"2|x+1|=7", sol("2*Abs(x+1)", "7")),
    ("I.9", r"\frac{2x+1}{\sqrt{3-x}}-4\sqrt{3-x}=0", sol("(2*x+1)/sqrt(3-x)-4*sqrt(3-x)")),
    ("I.9", r"\frac{2}{x-3}=\frac{1}{x+1}+\frac{8}{(x+1)(x-3)}", sol("2/(x-3)", "1/(x+1)+8/((x+1)*(x-3))")),
    ("I.10", r"1<2x+3\le 9", ine("(1 < 2*x+3) & (2*x+3 <= 9)")), ("I.10", r"x^2<2x+8", ine("x**2 < 2*x+8")),
    ("I.10", r"(x+1)(x-3)(x-5)>0", ine("(x+1)*(x-3)*(x-5) > 0")), ("I.10", r"|2x-1|\le 3", ine("Abs(2*x-1) <= 3")),
    ("I.10", r"\frac{x+3}{x-1}\ge 2", ine("(x+3)/(x-1) >= 2")), ("I.10", r"|x^2-5|<4", ine("Abs(x**2-5) < 4")),
    ("II.1", r"135^\circ", eq("135*pi/180")), ("II.1", r"-210^\circ", eq("-210*pi/180")),
    ("II.2", r"\frac{5\pi}{4}", eq("5*pi/4*180/pi")), ("II.2", r"\frac{2\pi}{9}", eq("2*pi/9*180/pi")),
    ("II.4", r"\cos\left(\tfrac{5\pi}{6}\right)", eq("cos(5*pi/6)")), ("II.4", r"\sin\left(\tfrac{4\pi}{3}\right)", eq("sin(4*pi/3)")),
    ("II.4", r"\tan\left(\tfrac{3\pi}{4}\right)", eq("tan(3*pi/4)")), ("II.4", r"\cos\left(\tfrac{11\pi}{6}\right)", eq("cos(11*pi/6)")),
    ("II.8", r"\cos(2x)=\cos(x),\ x\in[0,2\pi]", sol("cos(2*x)", "cos(x)", domain="Interval(0, 2*pi)")),
    ("III.2", r"f(x)=x^2:\ \frac{f(3+h)-f(3)}{h}", eq("((3+h)**2-9)/h")),
    ("III.3", r"f(x)=\frac{x-1}{x^2-4x+3}", {"type": "domain", "expr": "(x-1)/(x**2-4*x+3)"}),
    ("III.3", r"h(x)=\sqrt{9-x^2}+\sqrt{x}", {"type": "domain", "expr": "sqrt(9-x**2)+sqrt(x)"}),
    ("III.7", r"f(x)=x^2-1,\ g(x)=3x+2:\ f\circ g", dev("(3*x+2)**2-1")),
    ("III.7", r"f(x)=x^2-1,\ g(x)=3x+2:\ g\circ f", dev("3*(x**2-1)+2")),
    ("III.9", r"f(x)=e^{2x} \text{ sur } \mathbb{R}", {"type": "range", "expr": "exp(2*x)", "interval": "Reals"}),
    ("III.9", r"f(x)=x^2 \text{ sur } [0,\infty[", {"type": "range", "expr": "x**2", "interval": "Interval(0, oo)"}),
]
