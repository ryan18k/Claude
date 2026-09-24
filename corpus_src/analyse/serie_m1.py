# Analyse I — Série -1 (Prélude) et son corrigé officiel.
# Transcription fidèle des PDF EPFL (Serie__-1_v01.pdf, Corrige_Serie__-1_v01.pdf), P. Wittwer.
# « corrige » reproduit le corrigé officiel tel quel, erreurs comprises : on ne corrige rien ici.
# « check » dit comment SymPy vérifie ; « answer » est la réponse officielle traduite en syntaxe SymPy.

N = {  # notions du Prélude (identifiants provisoires, reliés plus tard à la carte des notions)
    "pow": "AN1.N.puissances", "rac": "AN1.N.racines", "dev": "AN1.N.developper",
    "fact": "AN1.N.factoriser", "frac": "AN1.N.fractions-rationnelles", "ratio": "AN1.N.rationaliser",
    "carre": "AN1.N.completer-carre", "eq": "AN1.N.equations", "ineq": "AN1.N.inequations",
    "abs": "AN1.N.valeur-absolue", "rad": "AN1.N.trigo-radians", "trigv": "AN1.N.trigo-valeurs",
    "trigid": "AN1.N.trigo-identites", "graphe": "AN1.N.graphe-fonction", "dom": "AN1.N.domaine",
    "transf": "AN1.N.transformations-graphe", "comp": "AN1.N.composition",
    "recip": "AN1.N.fonction-reciproque", "expln": "AN1.N.exp-ln", "logique": "AN1.N.logique",
    "quant": "AN1.N.quantificateurs", "somme": "AN1.N.sommes",
}


def it(sub, enonce, corrige, check=None, note=None, figure=None):
    d = {"sub": sub, "enonce": enonce, "corrige": corrige, "check": check}
    if note:
        d["note"] = note
    if figure:
        d["figure_corrige"] = figure
    return d


def eq(expr, answer, **kw):
    return {"type": "eq", "expr": expr, "answer": answer, **kw}


def form(expr, answer, f, **kw):
    return {"type": "form", "expr": expr, "answer": answer, "form": f, **kw}


PQ = {"p": {"real": True, "nonzero": True}, "q": {"real": True, "nonzero": True}}

SERIE = {
    "id": "AN1.S-1",
    "matiere": "AN1",
    "numero": -1,
    "titre": "Série -1",
    "chapitre": "Prélude",
    "sources": {"enonce": "pdf/Serie__-1_v01.pdf", "corrige": "pdf/Corrige_Serie__-1_v01.pdf"},
    "avant_propos": (
        "Le but est de repérer les faiblesses que vous pourriez avoir. Si vous avez des difficultés pour "
        "résoudre ces exercices, il est vivement conseillé de rattraper le matériel en question. "
        "♦ Les sujets des exercices avec ce symbole vont (brièvement) réapparaître dans le cours ou les "
        "exercices. Néanmoins ces concepts devraient déjà être connus (et donc ces exercices aussi résolus "
        "maintenant)."),
    "parties": [],
}

# ---------------------------------------------------------------- Partie I : Algèbre
I = {"num": "I", "titre": "Algèbre", "exercices": [
    {"num": 1, "page": 1, "notions": [N["pow"]],
     "consigne": r"Calculer, sans calculatrice, chacune des expressions suivantes.",
     "items": [
         it("a", r"(-2)^3", r"-8", eq("(-2)**3", "-8")),
         it("b", r"-2^3", r"-8", eq("-2**3", "-8")),
         it("c", r"2^{-3}", r"\frac{1}{8}", eq("2**(-3)", "1/8")),
         it("d", r"\frac{7^{19}}{7^{17}}", r"49", eq("7**19/7**17", "49")),
         it("e", r"\left(\frac{4}{5}\right)^{-2}", r"\frac{25}{16}", eq("(4/5)**(-2)", "25/16")),
         it("f", r"32^{-3/5}", r"\frac{1}{8}", eq("32**(-3/5)", "1/8")),
     ]},
    {"num": 2, "page": 1, "notions": [N["pow"], N["rac"]],
     "consigne": r"Simplifier chaque expression. Ecrire la réponse sans exposants négatifs.",
     "items": [
         it("a", r"\sqrt{300}-\sqrt{48}", r"6\sqrt{3}", eq("sqrt(300)-sqrt(48)", "6*sqrt(3)")),
         it("b", r"(9a^2b^4)(2ab^5)^3", r"72a^5b^{19}", eq("(9*a**2*b**4)*(2*a*b**5)**3", "72*a**5*b**19"),
            note="Dans le PDF du corrigé, l'exposant 19 est mal composé (le 9 est sur la ligne). "
                 "Le texte du PDF donne bien b^19."),
         it("c", r"\left(\frac{2x^3y^{3/2}}{x^2y^{-1/2}}\right)^{-3}", r"\frac{1}{8x^3y^6}",
            eq("(2*x**3*y**(3/2)/(x**2*y**(-1/2)))**(-3)", "1/(8*x**3*y**6)",
               assume={"x": {"positive": True}, "y": {"positive": True}}),
            note="Hypothèse x, y > 0 (exposants fractionnaires, convention du cours)."),
     ]},
    {"num": 3, "page": 1, "notions": [N["dev"]],
     "consigne": r"Développer et simplifier.",
     "items": [
         it("a", r"4(2x+6)+3(5x-8)", r"23x", form("4*(2*x+6)+3*(5*x-8)", "23*x", "developpee")),
         it("b", r"(2x+5)(7x-2)", r"14x^2+31x-10", form("(2*x+5)*(7*x-2)", "14*x**2+31*x-10", "developpee")),
         it("c", r"\left(\sqrt{a}+\sqrt{b}\right)\left(\sqrt{a}-\sqrt{b}\right)", r"a^{1/2}",
            eq("(sqrt(a)+sqrt(b))*(sqrt(a)-sqrt(b))", "a**(1/2)")),
         it("d", r"(2x+3)^2", r"9x^2+12x+4", form("(2*x+3)**2", "9*x**2+12*x+4", "developpee"),
            note="La réponse officielle correspond à (3x+2)^2."),
         it("e", r"(x+2)^3", r"8x^3+36x^2+54x+27", form("(x+2)**3", "8*x**3+36*x**2+54*x+27", "developpee"),
            note="La réponse officielle correspond à (2x+3)^3."),
         it("f", r"\left(a^{4/3}-a^{2/3}+1\right)\left(a^{2/3}+1\right)", r"a^2+1",
            eq("(a**(4/3)-a**(2/3)+1)*(a**(2/3)+1)", "a**2+1")),
     ]},
    {"num": 4, "page": 1, "notions": [N["fact"]],
     "consigne": r"Factoriser chaque expression.",
     "items": [
         it("a", r"9x^2-16", r"(3x-4)(3x+4)", form("9*x**2-16", "(3*x-4)*(3*x+4)", "factorisee")),
         it("b", r"3x^2+7x-6", r"(x+3)(3x-2)", form("3*x**2+7*x-6", "(x+3)*(3*x-2)", "factorisee")),
         it("c", r"x^3-3x^2-4x+12", r"(x-2)(x+2)(x-3)",
            form("x**3-3*x**2-4*x+12", "(x-2)*(x+2)*(x-3)", "factorisee")),
         it("d", r"x^3+x^2-2", r"(x-2)(x^2+2x+2)", form("x**3+x**2-2", "(x-2)*(x**2+2*x+2)", "factorisee")),
         it("e", r"2x^{3/2}-6x^{1/2}+4x^{-1/2}", r"\frac{2}{\sqrt{x}}(x-1)(x-2)",
            form("2*x**(3/2)-6*x**(1/2)+4*x**(-1/2)", "2/sqrt(x)*(x-1)*(x-2)", "factorisee",
                 assume={"x": {"positive": True}})),
         it("f", r"x^2y^2-3xy^3", r"xy^2(x-3y)", form("x**2*y**2-3*x*y**3", "x*y**2*(x-3*y)", "factorisee")),
     ]},
    {"num": 5, "page": 1, "notions": [N["frac"], N["fact"]],
     "consigne": r"Simplifier l'expression rationnelle.",
     "items": [
         it("a", r"\frac{x^2+4x+4}{x^2+3x+2}", r"1+\frac{1}{x+1}", eq("(x**2+4*x+4)/(x**2+3*x+2)", "1+1/(x+1)")),
         it("b", r"\frac{2x^2-3x-2}{x^2-16}\cdot\frac{x+4}{2x+1}", r"1+\frac{2}{x-4}",
            eq("(2*x**2-3*x-2)/(x**2-16)*(x+4)/(2*x+1)", "1+2/(x-4)")),
         it("c", r"\frac{x^2}{x^2-9}-\frac{x+1}{x+3}", r"\frac{2x+3}{x^2-9}",
            eq("x**2/(x**2-9)-(x+1)/(x+3)", "(2*x+3)/(x**2-9)")),
         it("d", r"\frac{\frac{y}{x}-\frac{x}{y}}{\frac{1}{y}-\frac{1}{x}}", r"-(y+x)",
            eq("(y/x-x/y)/(1/y-1/x)", "-(y+x)")),
     ]},
    {"num": 6, "page": 1, "notions": [N["ratio"], N["rac"]],
     "consigne": r"Rendre le dénominateur rationnel et simplifier.",
     "items": [
         it("a", r"\frac{\sqrt{10}}{5-\sqrt{2}}", r"\frac{5\sqrt{10}+2\sqrt{5}}{23}",
            eq("sqrt(10)/(5-sqrt(2))", "(5*sqrt(10)+2*sqrt(5))/23")),
         it("b", r"\frac{h}{\sqrt{h+4}+2}", r"\sqrt{h+4}-2",
            eq("h/(sqrt(h+4)+2)", "sqrt(h+4)-2", assume={"h": {"positive": True}}),
            note="Vérifié pour h > 0 (l'expression est définie pour h ≥ -4)."),
     ]},
    {"num": 7, "page": 1, "notions": [N["pow"]],
     "consigne": r"Simplifier les expressions, où $a,b>0$ et $p,q\in\mathbb{R}^*$.",
     "corrige_global": r"La réponse est $a^pb^q$ dans tous les cas.",
     "items": [it(s, e, r"a^pb^q", eq(x, "a**p*b**q", assume=PQ)) for s, e, x in [
         ("a", r"(ab)^pb^{q-p}", "(a*b)**p*b**(q-p)"),
         ("b", r"a^{p-q}(ab)^q", "a**(p-q)*(a*b)**q"),
         ("c", r"\frac{a^p}{b^{-q}}", "a**p/b**(-q)"),
         ("d", r"\frac{b^q}{a^{-p}}", "b**q/a**(-p)"),
         ("e", r"\left(ab^{\frac{q}{p}}\right)^p", "(a*b**(q/p))**p"),
         ("f", r"\left(a^{\frac{p}{q}}b\right)^q", "(a**(p/q)*b)**q"),
         ("g", r"\left(a^{\frac{1}{q}}b^{\frac{1}{p}}\right)^{pq}", "(a**(1/q)*b**(1/p))**(p*q)"),
         ("h", r"\sqrt{a^{2p}}\,b^q", "sqrt(a**(2*p))*b**q"),
         ("i", r"\left(\left(\tfrac{1}{a}\right)^q+\left(\tfrac{1}{b}\right)^p\right)\frac{a^p(ab)^q}{1+\frac{a^q}{b^p}}",
          "((1/a)**q+(1/b)**p)*a**p*(a*b)**q/(1+a**q/b**p)"),
         ("j", r"a^{p-q}b^{q-p}\left(a^q+b^p\right)\left(\left(\tfrac{1}{a}\right)^q+\left(\tfrac{1}{b}\right)^p\right)^{-1}",
          "a**(p-q)*b**(q-p)*(a**q+b**p)*((1/a)**q+(1/b)**p)**(-1)"),
         ("k", r"a^qb^p\left(\left(a^{\frac{1}{q}-\frac{1}{p}}\,b^{\frac{1}{p}-\frac{1}{q}}\right)^p\right)^q",
          "a**q*b**p*((a**(1/q-1/p)*b**(1/p-1/q))**p)**q"),
         ("m", r"\left(\sqrt{a^p\left(b^q+a^{-p}\right)}-1\right)\left(\sqrt{b^q\left(a^p+b^{-q}\right)}+1\right)",
          "(sqrt(a**p*(b**q+a**(-p)))-1)*(sqrt(b**q*(a**p+b**(-q)))+1)"),
     ]]},
    {"num": 8, "page": 1, "notions": [N["carre"]],
     "consigne": r"Compléter le carré.",
     "items": [
         it("a", r"x^2-x-1", r"\left(x-\tfrac{1}{2}\right)^2-\tfrac{5}{4}", form("x**2-x-1", "(x-1/2)**2-5/4", "carre")),
         it("b", r"3x^2-12x+11", r"3(x-2)^2-1", form("3*x**2-12*x+11", "3*(x-2)**2-1", "carre")),
         it("c", r"9x^2+8x+2", r"9\left(x+\tfrac{4}{9}\right)^2+\tfrac{2}{9}", form("9*x**2+8*x+2", "9*(x+4/9)**2+2/9", "carre")),
     ]},
    {"num": 9, "page": 2, "notions": [N["eq"]],
     "consigne": r"Résoudre l'équation. (Chercher seulement les solutions réelles.)",
     "items": [
         it("a", r"2x+9=12-\frac{1}{2}x", r"x=\tfrac{6}{5}",
            {"type": "solve", "lhs": "2*x+9", "rhs": "12-x/2", "answer": "FiniteSet(6/5)"}),
         it("b", r"\frac{3x+2}{x+1}=\frac{3x-1}{x}", r"\text{Cette équation n'admet pas de solutions.}",
            {"type": "solve", "lhs": "(3*x+2)/(x+1)", "rhs": "(3*x-1)/x", "answer": "EmptySet"}),
         it("c", r"x^2+7x+12=0", r"x_1=-3 \text{ et } x_2=-4",
            {"type": "solve", "lhs": "x**2+7*x+12", "rhs": "0", "answer": "FiniteSet(-3, -4)"}),
         it("d", r"2x^2+6x+3=0", r"x_{1,2}=-\tfrac{3}{2}\pm\tfrac{\sqrt{3}}{2}",
            {"type": "solve", "lhs": "2*x**2+6*x+3", "rhs": "0",
             "answer": "FiniteSet(-3/2+sqrt(3)/2, -3/2-sqrt(3)/2)"}),
         it("e", r"x^4-x^2-12=0",
            r"3=x^2 \text{ n'admet pas de solution, et } x^2=4\Rightarrow x_{1,2}=\pm 2",
            {"type": "solve", "lhs": "x**4-x**2-12", "rhs": "0", "answer": "FiniteSet(2, -2)"},
            note="Le résultat final ±2 est vérifiable. Dans le raisonnement officiel, « 3 = x² n'admet pas de "
                 "solution » est faux tel quel (x = ±√3) : il s'agit probablement de −3 = x², signe « − » "
                 "manquant. À confirmer par toi sur le PDF."),
         it("f", r"5\,|x-2|=12", r"x_1=\tfrac{22}{5},\ x_2=-\tfrac{2}{5}",
            {"type": "solve", "lhs": "5*Abs(x-2)", "rhs": "12", "answer": "FiniteSet(22/5, -2/5)"}),
         it("g", r"\frac{3x-1}{\sqrt{2-x}}-6\sqrt{2-x}=0", r"x=\tfrac{13}{9}",
            {"type": "solve", "lhs": "(3*x-1)/sqrt(2-x)-6*sqrt(2-x)", "rhs": "0", "answer": "FiniteSet(13/9)"}),
         it("h", r"\frac{3}{x-2}=\frac{1}{x-1}+\frac{3}{(x-1)(x-2)}",
            r"\text{Cette équation n'admet pas de solution (car on sait que) } x\neq 2",
            {"type": "solve", "lhs": "3/(x-2)", "rhs": "1/(x-1)+3/((x-1)*(x-2))", "answer": "EmptySet"}),
     ]},
    {"num": 10, "page": 2, "losange": True, "notions": [N["ineq"], N["abs"]],
     "consigne": r"Résoudre chaque inégalité. Ecrire les réponses sous forme d'intervalles.",
     "items": [
         it("a", r"-2<3-5x\le 18", r"x\in[-3,1[",
            {"type": "solve", "rel": "(-2 < 3-5*x) & (3-5*x <= 18)", "answer": "Interval.Ropen(-3, 1)"}),
         it("b", r"x^2<x+12", r"x\in\,]-3,4[",
            {"type": "solve", "rel": "x**2 < x+12", "answer": "Interval.open(-3, 4)"}),
         it("c", r"x(x-2)(x-4)<0", r"x\in\,]-\infty,0[\,\cup\,]2,4[",
            {"type": "solve", "rel": "x*(x-2)*(x-4) < 0",
             "answer": "Union(Interval.open(-oo, 0), Interval.open(2, 4))"}),
         it("d", r"|x-3|<2", r"x\in\,]1,5[", {"type": "solve", "rel": "Abs(x-3) < 2", "answer": "Interval.open(1, 5)"}),
         it("e", r"\frac{3x-2}{2x+1}\le 2", r"x\in\,]-\infty,-4]\,\cup\,]-\tfrac{1}{2},\infty[",
            {"type": "solve", "rel": "(3*x-2)/(2*x+1) <= 2",
             "answer": "Union(Interval(-oo, -4), Interval.open(-1/2, oo))"}),
         it("f", r"|x^2-4|\le 2", r"x\in\left[-\sqrt{6},-\sqrt{2}\right]\cup\left[\sqrt{2},\sqrt{6}\right]",
            {"type": "solve", "rel": "Abs(x**2-4) <= 2",
             "answer": "Union(Interval(-sqrt(6), -sqrt(2)), Interval(sqrt(2), sqrt(6)))"}),
     ]},
    {"num": 11, "page": 2, "notions": [N["pow"], N["rac"], N["frac"]],
     "consigne": r"Ces équations sont-elles vraies ou fausses ? Pour chaque équation, le domaine des variables "
                 r"est supposé tel que tout soit bien défini.",
     "items": [it(s, e, c, {"type": "truth", "lhs": l, "rhs": r, "answer": c.rstrip(".")}) for s, e, c, l, r in [
         ("a", r"(p+q)^2=p^2+q^2", "Faux.", "(p+q)**2", "p**2+q**2"),
         ("b", r"\sqrt{ab}=\sqrt{a}\sqrt{b}", "Vrai.", "sqrt(a*b)", "sqrt(a)*sqrt(b)"),
         ("c", r"\sqrt{a^2+b^2}=a+b", "Faux.", "sqrt(a**2+b**2)", "a+b"),
         ("d", r"\frac{1+TC}{C}=1+T", "Faux.", "(1+T*C)/C", "1+T"),
         ("e", r"(bc+1)\frac{a}{b}=\frac{(bc+1)ad}{bd}", "Vrai.", "(b*c+1)*a/b", "(b*c+1)*a*d/(b*d)"),
         ("f", r"\frac{1}{x-y}=\frac{1}{x}-\frac{1}{y}", "Faux.", "1/(x-y)", "1/x-1/y"),
         ("g", r"\frac{\frac{1}{x}}{\frac{a}{x}-\frac{b}{x}}=\frac{1}{a-b}", "Vrai.", "(1/x)/(a/x-b/x)", "1/(a-b)"),
         ("h", r"\frac{a}{b}+\frac{c}{d}=\frac{ad+bc}{bd}", "Vrai.", "a/b+c/d", "(a*d+b*c)/(b*d)"),
     ]]},
    {"num": 12, "page": 2, "notions": [N["pow"], N["somme"]],
     "consigne": r"Vérifier les identités.",
     "corrige_global": r"Les indications ci-après ne sont bien sûr pas les seules manières de vérifier les identités.",
     "items": [
         it("a", r"3^{2(n+1)+4}-2^{n+1}=9\left(3^{2n+4}-2^n\right)+7\cdot 2^n,\quad \text{où } n\in\mathbb{N}",
            r"\text{Commencer par la partie droite.}",
            eq("3**(2*(n+1)+4)-2**(n+1)", "9*(3**(2*n+4)-2**n)+7*2**n",
               assume={"n": {"integer": True, "nonnegative": True}}),
            note="Le corrigé donne une indication, pas un résultat : SymPy vérifie l'identité elle-même."),
         it("b", r"\left(\sum_{k=0}^{7}a^k\right)(1-a)=(1-a)(1+a)(1+a^2)(1+a^4)",
            r"\text{Pour la partie gauche, ne pas développer la somme parce qu'elle devient télescopique après "
            r"la multiplication. Pour la partie droite, utiliser la troisième identité remarquable. "
            r"Le résultat est } 1-a^8.",
            eq("(1+a+a**2+a**3+a**4+a**5+a**6+a**7)*(1-a)", "1-a**8", assume={"a": {"real": True}}),
            note="SymPy vérifie que les deux membres valent 1 − a⁸ (le membre de droite est vérifié à part)."),
     ]},
    {"num": 13, "page": 2, "notions": [N["pow"], N["eq"]],
     "consigne": r"Soient $b>0$ et $m\in\mathbb{Z}$. Simplifier l'expression "
                 r"$A=\left(-b(-b^{-2})^m\right)^{-2m}$. Déterminer $m$ pour que $A$ soit égal à $16^5$ lorsque $b=2$.",
     "items": [
         it("a", r"\text{Simplifier } A", r"A=b^{2m(2m-1)}",
            eq("(-b*(-b**(-2))**m)**(-2*m)", "b**(2*m*(2*m-1))", assume={"m": {"integer": True}})),
         it("b", r"\text{Déterminer } m \text{ pour que } A=16^5 \text{ lorsque } b=2",
            r"\text{On trouve } 2^{2m(2m-1)}=16^5 \Rightarrow m(2m-1)=10. \text{ Comme } m \text{ doit être entier, "
            r"la seule possibilité est } m=-2.",
            {"type": "solve", "lhs": "m*(2*m-1)", "rhs": "10", "var": "m", "domain": "Integers",
             "answer": "FiniteSet(-2)"}),
     ]},
]}

# ---------------------------------------------------------------- Partie II : Trigonométrie
II = {"num": "II", "titre": "Trigonométrie", "exercices": [
    {"num": 1, "page": 2, "notions": [N["rad"]],
     "consigne": r"Convertir de degrés en radians.",
     "items": [
         it("a", r"270^\circ", r"\frac{3\pi}{2}", eq("270*pi/180", "3*pi/2")),
         it("b", r"-24^\circ", r"-\frac{2\pi}{15}", eq("-24*pi/180", "-2*pi/15")),
         it("c", r"50^\circ", r"-\frac{5\pi}{18}", eq("50*pi/180", "-5*pi/18")),
     ]},
    {"num": 2, "page": 2, "notions": [N["rad"]],
     "consigne": r"Convertir de radians en degrés.",
     "items": [
         it("a", r"\frac{7\pi}{6}", r"210^\circ", eq("7*pi/6*180/pi", "210")),
         it("b", r"5", r"\frac{900}{\pi}\approx 286{,}5^\circ", eq("5*180/pi", "900/pi")),
         it("c", r"\frac{\pi}{4}", r"45^\circ", eq("pi/4*180/pi", "45")),
     ]},
    {"num": 3, "page": 2, "notions": [N["rad"]],
     "consigne": r"Calculer la longueur de l'arc d'un cercle de rayon 15 cm et d'angle $50^\circ$.",
     "items": [it("", "", r"13{,}09\ \text{cm}", {"type": "numeric", "expr": "15*50*pi/180", "answer": "13.09", "tol": 0.006})]},
    {"num": 4, "page": 2, "notions": [N["trigv"]],
     "consigne": r"Quelles sont les valeurs suivantes ?",
     "items": [
         it("a", r"\cos\left(\tfrac{7\pi}{6}\right)", r"-\frac{\sqrt{3}}{2}", eq("cos(7*pi/6)", "-sqrt(3)/2")),
         it("b", r"\sin\left(\tfrac{7\pi}{4}\right)", r"\frac{\sqrt{2}}{2}", eq("sin(7*pi/4)", "sqrt(2)/2")),
         it("c", r"\tan\left(\tfrac{2\pi}{3}\right)", r"-\sqrt{3}", eq("tan(2*pi/3)", "-sqrt(3)")),
     ]},
    {"num": 5, "page": 2, "notions": [N["trigv"]], "figure_enonce": "fig/S-1_II5_triangle.png",
     "consigne": r"Exprimer les longueurs $a$ et $b$ de la figure ci-dessous en termes de $\theta$. "
                 r"(Triangle rectangle d'hypoténuse 24, angle $\theta$ entre l'hypoténuse et le côté $b$ ; "
                 r"$a$ est le côté opposé à $\theta$.)",
     "items": [it("", "", r"a=24\sin(\theta),\quad b=24\cos(\theta)", None,
                  note="Lecture de figure : pas de vérification SymPy possible au-delà de a² + b² = 24².")]},
    {"num": 6, "page": 3, "notions": [N["trigid"], N["trigv"]],
     "consigne": r"Calculer $\sin(x+y)$ sachant que $\sin(x)=\frac{1}{3}$, $\cos(y)=\frac{4}{5}$ et que $x$ et $y$ "
                 r"sont compris entre $0$ et $\frac{\pi}{2}$.",
     "items": [it("", "", r"\frac{1}{15}\left(4+6\sqrt{2}\right)", eq("sin(asin(1/3)+acos(4/5))", "(4+6*sqrt(2))/15"))]},
    {"num": 7, "page": 3, "notions": [N["trigid"]],
     "consigne": r"Démontrer ces identités en supposant que tout soit bien défini.",
     "corrige_global": r"Développer les parties gauches en utilisant la définition de la fonction tan.",
     "items": [
         it("a", r"\tan(\theta)\sin(\theta)+\cos(\theta)=\frac{1}{\cos(\theta)}", r"\text{(indication ci-dessus)}",
            eq("tan(theta)*sin(theta)+cos(theta)", "1/cos(theta)")),
         it("b", r"\frac{2\tan(x)}{1+\tan(x)^2}=\sin(2x)", r"\text{(indication ci-dessus)}",
            eq("2*tan(x)/(1+tan(x)**2)", "sin(2*x)")),
         it("c", r"\cos(\alpha)\cos(\beta)=\tfrac{1}{2}\left(\cos(\alpha+\beta)+\cos(\alpha-\beta)\right)",
            r"\text{(indication ci-dessus)}", eq("cos(alpha)*cos(beta)", "(cos(alpha+beta)+cos(alpha-beta))/2")),
     ]},
    {"num": 8, "page": 3, "notions": [N["trigid"], N["eq"]],
     "consigne": r"Chercher toutes les valeurs de $x$ comprises entre $0$ et $2\pi$ telles que $\sin(2x)=\sin(x)$.",
     "items": [it("", "", r"x\in\left\{0,\tfrac{\pi}{3},\pi,\tfrac{5\pi}{3},2\pi\right\}",
                  {"type": "solve", "lhs": "sin(2*x)", "rhs": "sin(x)", "domain": "Interval(0, 2*pi)",
                   "answer": "FiniteSet(0, pi/3, pi, 5*pi/3, 2*pi)"})]},
    {"num": 9, "page": 3, "notions": [N["trigv"], N["transf"], N["graphe"]],
     "consigne": r"Dessiner le graphe de la fonction $y=1+\sin(2x)$ sans faire usage de la calculatrice.",
     "items": [it("", "", r"\text{(graphe)}", None, figure="fig/S-1_II9_corrige.png",
                  note="Réponse graphique : non vérifiable par SymPy.")]},
]}

# ---------------------------------------------------------------- Partie III : Fonctions réelles
III = {"num": "III", "titre": "Fonctions réelles", "exercices": [
    {"num": 1, "page": 3, "notions": [N["graphe"], N["dom"]], "figure_enonce": "fig/S-1_III1_graphe.png",
     "consigne": r"La figure ci-dessous montre le graphe d'une fonction $f$.",
     "items": [it(s, e, c, None, note="Lecture de graphe : non vérifiable par SymPy.") for s, e, c in [
         ("a", r"\text{Quelle est la valeur } f(-1)\,?", r"-2"),
         ("b", r"\text{Que vaut } f(2)\,?", r"2.8"),
         ("c", r"\text{Pour quelles valeurs de } x \text{ a-t-on } f(x)=2\,?", r"-3,\ 1"),
         ("d", r"\text{Chercher les valeurs de } x \text{ pour lesquelles } f(x)=0.", r"-2.5,\ 0.3"),
         ("e", r"\text{Déterminer le domaine de définition et l'ensemble image de } f.",
          r"\text{domaine } [-3,3],\ \text{image } [-2,3]"),
     ]]},
    {"num": 2, "page": 3, "notions": [N["dev"]],
     "consigne": r"Pour $f(x)=x^3$, calculer le quotient différentiel $\frac{f(2+h)-f(2)}{h}$ et le simplifier.",
     "items": [it("", "", r"12+6h+h^2", eq("((2+h)**3-8)/h", "12+6*h+h**2"))]},
    {"num": 3, "page": 3, "notions": [N["dom"]],
     "consigne": r"Déterminer le domaine de définition de la fonction.",
     "items": [
         it("a", r"f(x)=\frac{2x+1}{x^2+x-2}", r"]-\infty,-2[\,\cup\,]-2,1[\,\cup\,]1,\infty[",
            {"type": "domain", "expr": "(2*x+1)/(x**2+x-2)",
             "answer": "Union(Interval.open(-oo, -2), Interval.open(-2, 1), Interval.open(1, oo))"}),
         it("b", r"g(x)=\frac{x^{1/3}}{x^2+1}", r"]0,\infty[",
            None, note="Le corrigé applique la convention du cours (note 1) : « les puissances avec exposants "
                       "non-entiers sont définies seulement pour les nombres strictement positifs ». "
                       "Réponse conventionnelle : SymPy n'est pas utilisé ici."),
         it("c", r"h(x)=\sqrt{4-x}+\sqrt{x^2-1}", r"]-\infty,-1]\,\cup\,[1,4]",
            {"type": "domain", "expr": "sqrt(4-x)+sqrt(x**2-1)",
             "answer": "Union(Interval(-oo, -1), Interval(1, 4))"}),
     ]},
    {"num": 4, "page": 3, "losange": True, "notions": [N["transf"]],
     "consigne": r"Par quelles transformations du graphe de $f$ obtient-on les graphes des fonctions suivantes ?",
     "items": [it(s, e, c, None, note="Réponse descriptive : non vérifiable par SymPy.") for s, e, c in [
         ("a", r"y=-f(x)", r"\text{Réflexion par rapport à l'axe } Ox."),
         ("b", r"y=2f(x)-1", r"\text{Étirement vertical d'un facteur 2, suivi d'une translation d'une unité vers le bas.}"),
         ("c", r"y=f(x-3)+2", r"\text{Translation de trois unités vers la droite, puis de deux unités vers le haut.}"),
     ]]},
    {"num": 5, "page": 3, "notions": [N["graphe"], N["transf"]],
     "consigne": r"Esquisser à la main et sans l'aide d'une calculatrice les graphes suivants.",
     "items": [it(s, e, r"\text{(graphe)}", None, figure="fig/S-1_III5_corrige.png",
                  note="Réponse graphique : non vérifiable par SymPy.") for s, e in [
         ("a", r"y=x^3"), ("b", r"y=(x+1)^3"), ("c", r"y=(x-2)^3+3"), ("d", r"y=4-x^2"),
         ("e", r"y=\sqrt{x}"), ("f", r"y=2\sqrt{x}"), ("g", r"y=-2^x"), ("h", r"y=1+x^{-1}")]]},
    {"num": 6, "page": 3, "losange": True, "notions": [N["graphe"]],
     "consigne": r"Soit $f(x)=\begin{cases}1-x^2, & \text{si } x\le 0\\ 2x+1, & \text{si } x>0\end{cases}$.",
     "items": [
         it("a", r"\text{Calculer } f(-2) \text{ et } f(1).", r"f(-2)=-3,\ f(1)=3",
            [eq("1-(-2)**2", "-3"), eq("2*1+1", "3")]),
         it("b", r"\text{Dessiner le graphe de } f.", r"\text{Ci-dessus (à la fin de l'Ex. 5).}", None,
            figure="fig/S-1_III5_corrige.png", note="Réponse graphique : non vérifiable par SymPy."),
     ]},
    {"num": 7, "page": 3, "losange": True, "notions": [N["comp"]],
     "consigne": r"Soient $f(x)=x^2+2x-1$ et $g(x)=2x-3$. Déterminer les fonctions suivantes.",
     "items": [
         it("a", r"f\circ g", r"4x^2-8x+2", eq("(2*x-3)**2+2*(2*x-3)-1", "4*x**2-8*x+2")),
         it("b", r"g\circ f", r"2x^2+4x-5", eq("2*(x**2+2*x-1)-3", "2*x**2+4*x-5")),
         it("c", r"g\circ g\circ g", r"8x-21", eq("2*(2*(2*x-3)-3)-3", "8*x-21")),
     ]},
    {"num": 8, "page": 3, "notions": [N["expln"], N["pow"]],
     "consigne": r"Soit $a,b>0$ et $p,q\in\mathbb{R}$. Simplifier les expressions suivantes.",
     "corrige_global": r"La réponse est $a^pb^q$ dans tous les cas.",
     "items": [it(s, e, r"a^pb^q", eq(x, "a**p*b**q")) for s, e, x in [
         ("a", r"\exp\big(p\ln(a)+q\ln(b)\big)", "exp(p*log(a)+q*log(b))"),
         ("b", r"\exp\big(p(\ln(a)-\ln(b))+\ln(b)(p+q)\big)", "exp(p*(log(a)-log(b))+log(b)*(p+q))"),
         ("c", r"\exp\big(p\ln(ab^{-1})+\ln(b^{p+q})\big)", "exp(p*log(a/b)+log(b**(p+q)))"),
         ("d", r"\exp\big(q\ln\left(\tfrac{b}{a}\right)+\ln(a^q)+p\ln(a)\big)", "exp(q*log(b/a)+log(a**q)+p*log(a))"),
     ]]},
    {"num": 9, "page": 4, "losange": True, "notions": [N["recip"], N["trigv"], N["expln"]],
     "consigne": r"Pour chaque fonction $f$ définie sur l'intervalle $I$, trouver le domaine de définition de la "
                 r"fonction réciproque $f^{-1}$ et dessiner les graphes de $f$ et $f^{-1}$. "
                 r"N.B. : Tous les domaines $I$ sont choisis en sorte que la fonction réciproque existe. "
                 r"Rappel : La fonction réciproque d'une fonction bijective $f\colon X\to Y$ fait correspondre à tout "
                 r"élément $y$ de $Y$ l'unique élément $x$ de $X$ qui est solution de l'équation $f(x)=y$. "
                 r"On a donc $f^{-1}(y)=x$.",
     "corrige_global": r"Le domaine $D(f^{-1})$ de la fonction réciproque $f^{-1}$ est l'image de $f$. En effet, "
                       r"$I$ a été choisi pour que $f$ soit injective, et donc $f$ est bijective entre $I$ et son "
                       r"image. Une fois qu'on a tracé le graphe de $f$, on peut trouver le graphe de $f^{-1}$ "
                       r"géométriquement en faisant une réflexion par rapport à la droite $y=x$.",
     "items": [it(s, e, c, {"type": "range", "expr": x, "interval": iv, "answer": ans},
                  figure="fig/S-1_III9_corrige.png") for s, e, c, x, iv, ans in [
         ("a", r"f(x)=\sin(x) \text{ sur } I=\left[-\tfrac{\pi}{2},\tfrac{\pi}{2}\right]", r"D(f^{-1})=[-1,1]",
          "sin(x)", "Interval(-pi/2, pi/2)", "Interval(-1, 1)"),
         ("b", r"f(x)=\cos(x) \text{ sur } I=[0,\pi]", r"D(f^{-1})=[-1,1]", "cos(x)", "Interval(0, pi)", "Interval(-1, 1)"),
         ("c", r"f(x)=\tan(x) \text{ sur } I=\left]-\tfrac{\pi}{2},\tfrac{\pi}{2}\right[", r"D(f^{-1})=\mathbb{R}",
          "tan(x)", "Interval.open(-pi/2, pi/2)", "Reals"),
         ("d", r"f(x)=e^x \text{ sur } I=\mathbb{R}", r"D(f^{-1})=\,]0,\infty[", "exp(x)", "Reals", "Interval.open(0, oo)"),
         ("e", r"f(x)=e^{-x} \text{ sur } I=\mathbb{R}", r"D(f^{-1})=\,]0,\infty[", "exp(-x)", "Reals", "Interval.open(0, oo)"),
         ("f", r"f(x)=a^x \text{ avec } a=\tfrac{1}{2} \text{ sur } I=\mathbb{R}", r"D(f^{-1})=\,]0,\infty[",
          "(1/2)**x", "Reals", "Interval.open(0, oo)"),
     ]]},
]}

# ---------------------------------------------------------------- Partie IV : Calcul propositionnel
IV_INTRO = (r"Une « proposition (logique) » est un énoncé qui peut être vrai ou faux (mais pas les deux à la fois). "
            r"Soit $p$ et $q$ des propositions. Par les tableaux de vérité suivants, on introduit les opérations "
            r"$\neg$ (« non » logique), $\wedge$ (« et » logique), $\vee$ (« ou » logique), $\Leftrightarrow$ "
            r"(l'équivalence logique) et $\Rightarrow$ (l'implication logique), où $V:=$ vrai, et $F:=$ faux.")


def lg(sub, enonce, expr, note=None):
    return it(sub, enonce, r"\text{Par la construction des tableaux de vérité (voir corrigé).}",
              {"type": "logic", "expr": expr}, note=note)


IV = {"num": "IV", "titre": "Calcul propositionnel", "losange": True, "intro": IV_INTRO,
      "figure_intro": "fig/S-1_IV_tables.png", "exercices": [
    {"num": 1, "page": 4, "notions": [N["logique"]],
     "consigne": r"(Équivalences logiques) Soient $p$, $q$ et $r$ des propositions. Montrer que :",
     "corrige_global": r"Toutes les propositions de cet exercice se montrent par la construction des tableaux "
                       r"de vérité à partir des tableaux de vérité des définitions.",
     "figure_corrige": "fig/S-1_IV1_corrige.png",
     "apres": r"A noter que la véracité de la réciproque de la proposition $p\Rightarrow q$ c'est-à-dire la "
              r"proposition $q\Rightarrow p$ n'a aucun rapport avec la véracité de la proposition $p\Rightarrow q$. "
              r"Dans la suite, pour économiser des parenthèses, nous utiliserons les priorités habituelles sur les "
              r"opérations et, si convenable, nous écrirons que $p\Leftarrow q$ au lieu de $q\Rightarrow p$.",
     "items": [
         lg("a", r"(\neg(\neg p))\Leftrightarrow p \text{ (loi de la double négation)}", "Equivalent(~(~p), p)"),
         lg("b", r"(p\wedge p)\Leftrightarrow p \text{ et } (p\vee p)\Leftrightarrow p \text{ (idempotence)}",
            "Equivalent(p & p, p) & Equivalent(p | p, p)"),
         lg("c", r"(p\wedge q)\Leftrightarrow(q\wedge p) \text{ et } (p\vee q)\Leftrightarrow(q\vee p) \text{ (commutativité)}",
            "Equivalent(p & q, q & p) & Equivalent(p | q, q | p)"),
         lg("d", r"(\neg(p\wedge q))\Leftrightarrow((\neg p)\vee(\neg q)) \text{ et } (\neg(p\vee q))\Leftrightarrow"
                 r"((\neg p)\wedge(\neg q)) \text{ (lois de De Morgan)}",
            "Equivalent(~(p & q), ~p | ~q) & Equivalent(~(p | q), ~p & ~q)"),
         lg("e", r"((p\wedge q)\wedge r)\Leftrightarrow(p\wedge(q\wedge r)) \text{ et } ((p\vee q)\vee r)\Leftrightarrow"
                 r"(p\vee(q\vee r)) \text{ (associativité)}",
            "Equivalent((p & q) & r, p & (q & r)) & Equivalent((p | q) | r, p | (q | r))"),
         lg("f", r"((p\wedge q)\vee r)\Leftrightarrow((p\vee r)\wedge(q\vee r)) \text{ et } ((p\vee q)\wedge r)"
                 r"\Leftrightarrow((p\wedge r)\vee(q\wedge r)) \text{ (distributivité)}",
            "Equivalent((p & q) | r, (p | r) & (q | r)) & Equivalent((p | q) & r, (p & r) | (q & r))"),
         lg("g", r"(p\Rightarrow q)\Leftrightarrow((\neg p)\vee q) \text{ (définition de l'implication)}",
            "Equivalent(Implies(p, q), ~p | q)"),
         lg("h", r"(\neg(p\Rightarrow q))\Leftrightarrow(p\wedge(\neg q)) \text{ (négation de l'implication)}",
            "Equivalent(~Implies(p, q), p & ~q)"),
         lg("i", r"((p\Rightarrow q)\wedge(q\Rightarrow r))\Rightarrow(p\Rightarrow r) \text{ (transitivité de l'implication)}",
            "Implies(Implies(p, q) & Implies(q, r), Implies(p, r))"),
         lg("j", r"(p\Leftrightarrow q)\Leftrightarrow((p\Rightarrow q)\wedge(q\Rightarrow p)) \text{ (propositions équivalentes)}",
            "Equivalent(Equivalent(p, q), Implies(p, q) & Implies(q, p))",
            note="Dans le corrigé, les tableaux (j) et (k) ont 8 lignes pour 2 variables : chaque ligne apparaît "
                 "deux fois. C'est sans conséquence sur le résultat."),
         lg("k", r"((\neg q)\Rightarrow(\neg p))\Leftrightarrow(p\Rightarrow q) \text{ (contraposé de l'implication)}",
            "Equivalent(Implies(~q, ~p), Implies(p, q))"),
     ]},
    {"num": 2, "page": 5, "notions": [N["quant"], N["logique"]],
     "consigne": r"(Les quantificateurs $\forall$ et $\exists$, une variable) Soit $E$ un ensemble et pour $x\in E$ "
                 r"soit $p(x)$ et $q(x)$ des propositions (dont les valeurs de vérité peuvent dépendre de $x$). "
                 r"On écrira $\forall x\in E,\ p(x)$ pour dire que « pour tous les éléments $x\in E$, la proposition "
                 r"$p(x)$ est vraie », et $\exists x\in E,\ p(x)$ pour dire que « il existe $x\in E$ tel que la "
                 r"proposition $p(x)$ est vraie ». Se convaincre que : [...] Pour les deux cas où il n'y a pas "
                 r"équivalence, trouver un contre-exemple à la proposition réciproque.",
     "items": [
         it("a", r"(\neg(\forall x\in E,p(x)))\Leftrightarrow(\exists x\in E,\neg(p(x)))", r"\text{(pas de corrigé)}", None,
            note="Le corrigé officiel ne traite que (e) et (f)."),
         it("b", r"(\neg(\exists x\in E,p(x)))\Leftrightarrow(\forall x\in E,\neg(p(x)))", r"\text{(pas de corrigé)}", None),
         it("c", r"(\forall x\in E,p(x)\wedge q(x))\Leftrightarrow((\forall x\in E,p(x))\wedge(\forall x\in E,q(x)))",
            r"\text{(pas de corrigé)}", None),
         it("d", r"(\exists x\in E,p(x)\vee q(x))\Leftrightarrow((\exists x\in E,p(x))\vee(\exists x\in E,q(x)))",
            r"\text{(pas de corrigé)}", None),
         it("e", r"(\forall x\in E,p(x)\vee q(x))\Leftarrow((\forall x\in E,p(x))\vee(\forall x\in E,q(x)))",
            r"\text{Soit } E=\{1,2\} \text{ et } p(x), q(x) \text{ telles que } p(1) \text{ et } q(2) \text{ sont vraies et } "
            r"p(2) \text{ et } q(1) \text{ sont fausses. Alors } \forall x\in E,\ p(x)\vee q(x) \text{ est vraie mais } "
            r"(\forall x\in E,\ p(x))\vee(\forall x\in E,\ q(x)) \text{ est fausse : la réciproque } (\Rightarrow) \text{ est fausse.}",
            {"type": "quantifiers", "kind": "converse_fails", "preds": "pq",
             "lhs": "all(p(x) or q(x) for x in E)", "rhs": "all(p(x) for x in E) or all(q(x) for x in E)"},
            figure="fig/S-1_IV2_corrige.png"),
         it("f", r"(\exists x\in E,p(x)\wedge q(x))\Rightarrow((\exists x\in E,p(x))\wedge(\exists x\in E,q(x)))",
            r"\text{Même } E \text{ et mêmes } p, q \text{ : } (\exists x\in E,\ p(x))\wedge(\exists x\in E,\ q(x)) "
            r"\text{ est vraie mais } \exists x\in E,\ p(x)\wedge q(x) \text{ est fausse : la réciproque } (\Leftarrow) "
            r"\text{ est fausse.}",
            {"type": "quantifiers", "kind": "converse_fails", "preds": "pq",
             "lhs": "any(p(x) for x in E) and any(q(x) for x in E)", "rhs": "any(p(x) and q(x) for x in E)"},
            figure="fig/S-1_IV2_corrige.png"),
     ]},
    {"num": 3, "page": 5, "notions": [N["quant"], N["logique"]],
     "consigne": r"(Les quantificateurs $\forall$ et $\exists$, deux variables) Soit $E$ et $F$ des ensembles et pour "
                 r"$x\in E$ et $y\in F$ soit $p(x,y)$ des propositions (dont les valeurs de vérité peuvent dépendre de "
                 r"$x$ et de $y$). Se convaincre que : [...] Pour le cas où il n'y a pas équivalence, trouver un "
                 r"contre-exemple à la proposition réciproque.",
     "items": [
         it("a", r"((\forall x\in E),(\forall y\in F),p(x,y))\Leftrightarrow((\forall y\in F),(\forall x\in E),p(x,y))",
            r"\text{(pas de corrigé)}", None, note="Le corrigé officiel ne traite que (c)."),
         it("b", r"((\exists x\in E),(\exists y\in F),p(x,y))\Leftrightarrow((\exists y\in F),(\exists x\in E),p(x,y))",
            r"\text{(pas de corrigé)}", None),
         it("c", r"((\exists x\in E),(\forall y\in F),p(x,y))\Rightarrow((\forall y\in F),(\exists x\in E),p(x,y))",
            r"\text{Soit } E=F=\{1,2\} \text{ et } p(x,y) \text{ telle que } p(1,1) \text{ et } p(2,2) \text{ sont vraies et } "
            r"p(1,2) \text{ et } p(2,1) \text{ sont fausses. Alors } \forall y\in F,\ \exists x\in E,\ p(x,y) \text{ est "
            r"vraie mais } \exists x\in E,\ \forall y\in F,\ p(x,y) \text{ est fausse : la réciproque est fausse.}",
            {"type": "quantifiers", "kind": "converse_fails", "preds": "p2",
             "lhs": "all(any(p(x, y) for x in E) for y in E)", "rhs": "any(all(p(x, y) for y in E) for x in E)"},
            figure="fig/S-1_IV3_corrige.png"),
     ]},
]}

SERIE["parties"] = [I, II, III, IV]

# Vérifications complémentaires faites en plus des réponses officielles (sens direct des implications).
EXTRA = [
    ("IV.2.e", {"type": "quantifiers", "kind": "implies", "preds": "pq",
                "lhs": "all(p(x) for x in E) or all(q(x) for x in E)", "rhs": "all(p(x) or q(x) for x in E)"}),
    ("IV.2.f", {"type": "quantifiers", "kind": "implies", "preds": "pq",
                "lhs": "any(p(x) and q(x) for x in E)", "rhs": "any(p(x) for x in E) and any(q(x) for x in E)"}),
    ("IV.3.c", {"type": "quantifiers", "kind": "implies", "preds": "p2",
                "lhs": "any(all(p(x, y) for y in E) for x in E)", "rhs": "all(any(p(x, y) for x in E) for y in E)"}),
]
