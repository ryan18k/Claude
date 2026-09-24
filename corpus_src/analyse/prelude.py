# Analyse I — Prélude : théorie officielle (transcription des manuscrits), vidéos, et fiches du tuteur.
#
# Deux couches, jamais mélangées :
# - PASSAGES : transcription fidèle des polycopiés EPFL (P. Wittwer), en LaTeX. Rien n'est ajouté.
#   Chaque passage garde l'image de la page d'origine (« original ») pour contrôle.
# - NOTIONS : fiches courtes écrites par le tuteur (idée clé, formule, piège), qui citent les passages
#   et les exercices. Elles sont marquées « tuteur » dans l'application.
#
# Balisage du texte : $...$ formule en ligne, $$...$$ formule centrée, ligne commençant par « > » =
# encadré (les cadres magenta du polycopié), ligne vide = nouveau paragraphe.

M1 = "Manuscrit_Cours_Chapitre-1_Prelude__No01_v04.pdf"
M2 = "Manuscrit_Cours_Chapitre-1_Prelude__No02_v04.pdf"
M3 = "Manuscrit_Cours_Chapitre-1_Prelude__No03_v04.pdf"
C1 = "Complements_Chapitre-1_Prélude__1-1.pdf"
C2 = "Complements_Chapitre_Prelude.pdf"
V1 = "Prelude__Fonctions-elementaires__v1.fr.srt"
V2 = "Prelude__Paires-de-fonctions-reciproques__v1.fr.srt"
V3 = "Prelude__Puissances-racines-etc.-regles-de-calcul__v1.fr.srt"
V0 = "Prelude__Introduction__v1.fr.srt"

CHAPITRE = {
    "id": "AN1.CH-1",
    "matiere": "AN1",
    "numero": -1,
    "titre": "Prélude",
    "intro_video": V0,
    "but": "Faire le lien entre les mathématiques comme tu les connais et le contenu du cours. "
           "« Nombre » veut dire nombre réel, comme tu les connais ; la définition précise vient au chapitre 1.",
    "serie": "AN1.S-1",
}

SECTIONS = [
    {"id": "AN1.CH-1.1", "titre": "Fonctions élémentaires (exemples)", "pdf": M1, "video": V1, "passages": [
        {"id": "AN1.CH-1.1.p1", "titre": "sin, cos : graphes", "page": 1, "crop": (60, 150, 590, 362),
         "video": ("00:00:00", "00:01:44"), "notions": ["AN1.N.trigo-valeurs", "AN1.N.transformations-graphe"],
         "tex": "Prélude — voir série -1.\n\n"
                "Fonctions élémentaires (exemples) : $\\sin(x)$, $\\cos(x)$, $\\tan(x)$.\n\n"
                "Graphes de $\\sin(x)$ et $\\cos(x)$ sur $[0, 2\\pi]$, avec les points $\\frac{\\pi}{6}$, "
                "$\\frac{\\pi}{4}$, $\\frac{\\pi}{3}$ marqués et la valeur $\\frac{\\sqrt{2}}{2}$ au croisement.\n\n"
                "$$\\cos(x) = \\sin\\left(x + \\frac{\\pi}{2}\\right)$$"},
        {"id": "AN1.CH-1.1.p2", "titre": "Triangle isocèle : sin et cos de π/4", "page": 1, "crop": (60, 385, 590, 522),
         "video": ("00:01:44", "00:05:24"), "notions": ["AN1.N.trigo-valeurs", "AN1.N.racines"],
         "tex": "Triangle isocèle rectangle de côtés $1$, $1$ ; hypoténuse $\\sqrt{2} = \\sqrt{1^2 + 1^2}$ par Pythagore. "
                "Angles : $\\frac{\\pi}{4}$, $\\frac{\\pi}{4}$, $\\frac{\\pi}{2}$.\n\n"
                "$$\\sin\\left(\\frac{\\pi}{4}\\right) = \\frac{1}{\\sqrt{2}} = \\frac{1}{\\sqrt{2}}\\cdot 1 = "
                "\\frac{1}{\\sqrt{2}}\\cdot\\frac{\\sqrt{2}}{\\sqrt{2}} = \\frac{\\sqrt{2}}{\\sqrt{2}\\sqrt{2}} = "
                "\\frac{\\sqrt{2}}{2}$$\n\n"
                "$$\\cos\\left(\\frac{\\pi}{4}\\right) = \\frac{1}{\\sqrt{2}}$$",
         "verifs": [{"type": "eq", "expr": "sin(pi/4)", "answer": "sqrt(2)/2"},
                    {"type": "eq", "expr": "cos(pi/4)", "answer": "1/sqrt(2)"}]},
        {"id": "AN1.CH-1.1.p3", "titre": "Triangle équilatéral : π/6 et π/3", "page": 1, "crop": (60, 522, 590, 690),
         "video": ("00:05:24", "00:08:33"), "notions": ["AN1.N.trigo-valeurs", "AN1.N.racines"],
         "tex": "Triangle équilatéral de côté $1$, coupé en deux : côtés $1$, $\\frac12$ et la hauteur, "
                "angles $\\frac{\\pi}{6}$ et $\\frac{\\pi}{3}$.\n\n"
                "Hauteur : $\\sqrt{1 - \\left(\\frac12\\right)^2} = \\sqrt{\\frac34} = \\frac{\\sqrt3}{2}$.\n\n"
                "$$\\sin\\left(\\frac{\\pi}{6}\\right) = \\frac{\\frac12}{1} = \\frac12,\\qquad "
                "\\cos\\left(\\frac{\\pi}{6}\\right) = \\frac{\\frac{\\sqrt3}{2}}{1} = \\frac{\\sqrt3}{2}$$\n\n"
                "$$\\sin\\left(\\frac{\\pi}{3}\\right) = \\frac{\\frac{\\sqrt3}{2}}{1} = \\frac{\\sqrt3}{2},\\qquad "
                "\\cos\\left(\\frac{\\pi}{3}\\right) = \\frac{\\frac12}{1} = \\frac12$$",
         "verifs": [{"type": "eq", "expr": "sin(pi/6)", "answer": "1/2"}, {"type": "eq", "expr": "cos(pi/6)", "answer": "sqrt(3)/2"},
                    {"type": "eq", "expr": "sin(pi/3)", "answer": "sqrt(3)/2"}, {"type": "eq", "expr": "cos(pi/3)", "answer": "1/2"},
                    {"type": "eq", "expr": "sqrt(1-(1/2)**2)", "answer": "sqrt(3)/2"}]},
        {"id": "AN1.CH-1.1.p4", "titre": "Valeurs approchées", "page": 1, "crop": (60, 705, 580, 808),
         "video": ("00:08:33", "00:09:40"), "notions": ["AN1.N.racines"],
         "tex": "> $\\sqrt2 = 1.414\\ldots,\\quad \\frac{\\sqrt2}{2} = 0.707\\ldots,$\n"
                "> $\\sqrt3 = 1.732\\ldots,\\quad \\frac{\\sqrt3}{2} = 0.866\\ldots,\\quad \\frac{\\sqrt3}{3} = 0.577\\ldots$",
         "verifs": [{"type": "numeric", "expr": "sqrt(2)", "answer": "1.414", "tol": 0.001},
                    {"type": "numeric", "expr": "sqrt(3)/3", "answer": "0.577", "tol": 0.001}]},
        {"id": "AN1.CH-1.1.p5", "titre": "tan : définition et notations", "page": 2, "crop": (60, 29, 590, 230),
         "video": ("00:09:36", "00:11:25"), "notions": ["AN1.N.trigo-valeurs"],
         "tex": "Graphe de $\\tan(x)$ (asymptotes verticales en $\\frac{\\pi}{2}$, $\\frac{3\\pi}{2}$, …).\n\n"
                "$\\mathrm{tg}(x) \\equiv \\tan(x)$ : « $\\equiv$ » signifie notations équivalentes.\n\n"
                "$$\\tan(x) := \\frac{\\sin(x)}{\\cos(x)}$$\n\n"
                "« $:=$ » se lit « est par définition égal à »."},
        {"id": "AN1.CH-1.1.p6", "titre": "tan de π/4, π/6, π/3", "page": 2, "crop": (50, 230, 590, 418),
         "video": ("00:11:25", "00:14:00"), "notions": ["AN1.N.trigo-valeurs", "AN1.N.fractions-rationnelles"],
         "tex": "$$\\tan\\left(\\frac{\\pi}{4}\\right) = \\frac{\\sin(\\frac{\\pi}{4})}{\\cos(\\frac{\\pi}{4})} = "
                "\\frac{\\frac{\\sqrt2}{2}}{\\frac{\\sqrt2}{2}} = 1$$\n\n"
                "$$\\tan\\left(\\frac{\\pi}{6}\\right) = \\frac{\\sin(\\frac{\\pi}{6})}{\\cos(\\frac{\\pi}{6})} = "
                "\\frac{\\frac12}{\\frac{\\sqrt3}{2}} = \\frac{1}{\\sqrt3} = \\frac{\\sqrt3}{3}$$\n\n"
                "$$\\tan\\left(\\frac{\\pi}{3}\\right) = \\frac{\\sin(\\frac{\\pi}{3})}{\\cos(\\frac{\\pi}{3})} = "
                "\\frac{\\frac{\\sqrt3}{2}}{\\frac12} = \\sqrt3$$",
         "verifs": [{"type": "eq", "expr": "tan(pi/4)", "answer": "1"}, {"type": "eq", "expr": "tan(pi/6)", "answer": "sqrt(3)/3"},
                    {"type": "eq", "expr": "tan(pi/3)", "answer": "sqrt(3)"}]},
    ]},
    {"id": "AN1.CH-1.2", "titre": "Paires de fonctions réciproques", "pdf": M2, "video": V2, "passages": [
        {"id": "AN1.CH-1.2.p1", "titre": "x² et √x", "page": 1, "crop": (50, 205, 590, 425),
         "video": ("00:00:00", "00:04:28"), "notions": ["AN1.N.fonction-reciproque", "AN1.N.racines"],
         "tex": "i) $x^2$, $\\sqrt{x}$. Graphes de $y = x^2$, $y = \\sqrt{x}$ et de la diagonale $y = x$.\n\n"
                "Pour $x$ un nombre positif ou zéro :\n\n"
                "$$\\sqrt{x^2} = x,\\qquad \\left(\\sqrt{x}\\right)^2 = x \\qquad (*)$$\n\n"
                "$(*)$ implique que $x^2$ et $\\sqrt{x}$ sont des fonctions réciproques.",
         "verifs": [{"type": "eq", "expr": "sqrt(x**2)", "answer": "x", "assume": {"x": {"nonnegative": True}}}]},
        {"id": "AN1.CH-1.2.p2", "titre": "eˣ et ln(x)", "page": 1, "crop": (50, 440, 590, 805),
         "video": ("00:04:28", "00:09:28"), "notions": ["AN1.N.fonction-reciproque", "AN1.N.exp-ln"],
         "tex": "ii) $e^x \\equiv \\exp(x)$, $\\ln(x)$ ($=$ logarithme népérien). Autre notation : $\\mathrm{Log}(x) \\equiv \\ln(x)$.\n\n"
                "Graphes de $y = e^x$, $y = \\ln(x)$ et de la diagonale $y = x$.\n\n"
                "Pour $x$ un nombre positif : $e^{\\ln(x)} = x$.\n\n"
                "Pour $x$ un nombre « quelconque » (positif, zéro ou négatif) : $\\ln(e^x) = x$. $\\quad(*)$\n\n"
                "$(*)$ implique que $e^x$ et $\\ln(x)$ sont des fonctions réciproques.",
         "verifs": [{"type": "eq", "expr": "exp(log(x))", "answer": "x", "assume": {"x": {"positive": True}}},
                    {"type": "eq", "expr": "log(exp(x))", "answer": "x"}]},
        {"id": "AN1.CH-1.2.p3", "titre": "tan(x) et arctan(x)", "page": 2, "crop": (40, 40, 590, 405),
         "video": ("00:09:28", "00:14:30"), "notions": ["AN1.N.fonction-reciproque", "AN1.N.trigo-valeurs"],
         "tex": "iii) $\\tan(x)$, $\\arctan(x)$. Graphes de $y = \\tan(x)$ sur $]-\\frac{\\pi}{2}, \\frac{\\pi}{2}[$, "
                "de $y = \\arctan(x)$ (asymptotes horizontales $y = \\pm\\frac{\\pi}{2}$) et de la diagonale.\n\n"
                "Pour $x$ un nombre « quelconque » : $\\tan(\\arctan(x)) = x$.\n\n"
                "Pour $x$ un nombre entre $-\\frac{\\pi}{2}$ et $\\frac{\\pi}{2}$ : $\\arctan(\\tan(x)) = x$. $\\quad(*)$\n\n"
                "$(*)$ implique que $\\tan(x)$ et $\\arctan(x)$ sont des fonctions réciproques.",
         "verifs": [{"type": "eq", "expr": "tan(atan(x))", "answer": "x"}]},
    ]},
    {"id": "AN1.CH-1.3", "titre": "Puissances, racines, etc. (règles de calcul)", "pdf": M3, "video": V3, "passages": [
        {"id": "AN1.CH-1.3.p1", "titre": "Convention a⁰ = 1 et règles des puissances", "page": 1, "crop": (35, 205, 525, 520),
         "video": ("00:00:00", "00:03:37"), "notions": ["AN1.N.puissances"],
         "tex": "Pour $a, b$ des nombres positifs et $m, n$ des entiers positifs ou zéro :\n\n"
                "> Convention : $a^0 = 1$\n\n"
                "> $a^n\\cdot a^m = a^{n+m},\\qquad (a^n)^m = a^{mn} = (a^m)^n$\n"
                "> $(a\\cdot b)^m = a^m\\cdot b^m$\n"
                "> $\\left(\\frac{a}{b}\\right)^m = \\frac{a^m}{b^m} = a^m\\cdot b^{-m} = \\frac{b^{-m}}{a^{-m}} = \\left(\\frac{b}{a}\\right)^{-m}$\n"
                "> $\\frac{a^n}{a^m} = a^{n-m}$",
         "verifs": [{"type": "eq", "expr": "(a/b)**m", "answer": "(b/a)**(-m)", "assume": {"m": {"integer": True}}},
                    {"type": "eq", "expr": "a**n/a**m", "answer": "a**(n-m)", "assume": {"m": {"integer": True}, "n": {"integer": True}}}]},
        {"id": "AN1.CH-1.3.p2", "titre": "Exposants non entiers, racine n-ième", "page": 1, "crop": (50, 530, 590, 665),
         "video": ("00:03:37", "00:04:54"), "notions": ["AN1.N.puissances", "AN1.N.racines"],
         "tex": "On a les mêmes règles de calcul pour $a^x$ pour $x$ un nombre non entier. En particulier on écrit\n\n"
                "> $\\sqrt[n]{a} \\equiv a^{\\frac1n}\\qquad$ (où $a > 0$ !)\n\n"
                "pour (l'unique) nombre positif tel que $\\left(a^{\\frac1n}\\right)^n = a$."},
        {"id": "AN1.CH-1.3.p3", "titre": "Remarque : racine d'un nombre négatif", "page": 1, "crop": (40, 670, 590, 826),
         "video": ("00:04:54", "00:07:36"), "notions": ["AN1.N.racines"],
         "tex": "> Remarque : pour $n$ un entier naturel impair on trouve dans la littérature la notation "
                "$\\sqrt[n]{a}$ aussi pour $a < 0$, et dans ce cas, et dans ce cas seulement,\n"
                "> $$\\sqrt[n]{a} = -\\sqrt[n]{|a|}$$"},
        {"id": "AN1.CH-1.3.p4", "titre": "log_a : réciproque de aˣ", "page": 2, "crop": (50, 55, 580, 258),
         "video": ("00:07:36", "00:08:58"), "notions": ["AN1.N.exp-ln", "AN1.N.fonction-reciproque"],
         "tex": "La fonction réciproque de la fonction $a^x$, $a > 0$, $a \\neq 1$, est appelée $\\log_a(x)$, ce qui veut dire que\n\n"
                "> $a^{\\log_a(x)} = x\\qquad$ pour $x$ un nombre positif\n"
                "> $\\log_a(a^x) = x\\qquad$ pour $x$ un nombre quelconque"},
        {"id": "AN1.CH-1.3.p5", "titre": "Identités des logarithmes", "page": 2, "crop": (50, 258, 580, 585),
         "video": ("00:08:58", "00:11:53"), "notions": ["AN1.N.exp-ln"],
         "tex": "Identités qui découlent de la réciprocité :\n\n"
                "> $\\log_a(1) = 0\\quad$ et $\\quad\\log_a(a) = 1\\qquad$ pourquoi ?\n\n"
                "> $\\log_a(x\\cdot y) = \\log_a(x) + \\log_a(y)$\n"
                "> $\\log_a\\left(\\frac1x\\right) = -\\log_a(x)$\n"
                "> $\\log_a\\left(\\frac{x}{y}\\right) = \\log_a(x) - \\log_a(y)\\qquad$ ($x, y$ des nombres positifs)\n"
                "> $\\log_a(x^r) = r\\cdot\\log_a(x)\\qquad$ ($x$ un nombre positif, $r$ un nombre quelconque)",
         "complement": "AN1.CH-1.c1",
         "verifs": [{"type": "eq", "expr": "log(x*y, a)", "answer": "log(x, a)+log(y, a)", "assume": {"x": {"positive": True}, "y": {"positive": True}}},
                    {"type": "eq", "expr": "log(x**r, a)", "answer": "r*log(x, a)", "assume": {"x": {"positive": True}}}]},
        {"id": "AN1.CH-1.3.p6", "titre": "Remarque : ln = log_e", "page": 2, "crop": (50, 580, 580, 630),
         "video": ("00:11:53", "00:12:40"), "notions": ["AN1.N.exp-ln"],
         "tex": "> Remarque : $\\ln(x) \\equiv \\log_e(x)$, $e = 2.718281828\\ldots$"},
        {"id": "AN1.CH-1.3.p7", "titre": "Challenge du jour", "page": 2, "crop": (50, 655, 580, 805),
         "video": ("00:12:40", "00:14:10"), "notions": ["AN1.N.exp-ln", "AN1.N.puissances"],
         "tex": "$$\\log_a(\\sqrt5) = \\log_a\\left(5^{\\frac12}\\right) = \\frac12\\log_a(5) \\neq \\left(\\log_a(5)\\right)^{\\frac12}$$\n\n"
                "en général ! Mais on a égalité pour $a = $ ?",
         "complement": "AN1.CH-1.c2"},
    ]},
]

COMPLEMENTS = [
    {"id": "AN1.CH-1.c1", "titre": "Pourquoi log_a(1) = 0 et log_a(a) = 1", "pdf": C1, "page": 1, "crop": (30, 55, 430, 160),
     "pour": "AN1.CH-1.3.p5", "notions": ["AN1.N.exp-ln"],
     "tex": "En utilisant l'identité $\\log_a(a^x) = x$ on obtient\n\n"
            "$$\\log_a(1) = \\log_a(a^0) = 0$$\n\n$$\\log_a(a) = \\log_a(a^1) = 1$$",
     "verifs": [{"type": "eq", "expr": "log(1, a)", "answer": "0"}, {"type": "eq", "expr": "log(a, a)", "answer": "1"}]},
    {"id": "AN1.CH-1.c2", "titre": "Solution du challenge du jour", "pdf": C2, "page": 1, "crop": (40, 70, 470, 180),
     "pour": "AN1.CH-1.3.p7", "notions": ["AN1.N.exp-ln", "AN1.N.equations"],
     "tex": "Trouver $a$ t.q. $\\frac12\\log_a(5) = \\left(\\log_a(5)\\right)^{\\frac12}$.\n\n"
            "Soit $x := \\log_a 5$ ; alors $\\frac12 x = x^{\\frac12} \\Rightarrow x^{\\frac12} = 2 \\Rightarrow x = 4$\n\n"
            "$\\Rightarrow a^x = 5 \\Rightarrow a^4 = 5 \\Rightarrow a = 5^{\\frac14}$.",
     "verifs": [{"type": "eq", "expr": "log(5, 5**(1/4))/2", "answer": "sqrt(log(5, 5**(1/4)))"}],
     "note": "Le passage « x^{1/2} = 2 » divise par x^{1/2} : cela écarte x = 0, qui est impossible ici car "
             "log_a(5) = 0 voudrait dire 5 = 1. Remarque du tuteur, pas du corrigé."},
]

# ---------------------------------------------------------------- Fiches du tuteur (une par notion)
# idee : une phrase. formule : l'essentiel en LaTeX. piege : l'erreur typique (sourcée quand elle vient du cours).
# « source » dit d'où vient chaque affirmation ; « verifs » est exécuté par SymPy au build.
NOTIONS = [
    {"id": "AN1.N.puissances", "titre": "Puissances", "prerequis": [],
     "idee": "Même base : on additionne les exposants. Puissance d'une puissance : on multiplie.",
     "formule": "a^n a^m = a^{n+m},\\quad (a^n)^m = a^{nm},\\quad (ab)^m = a^m b^m,\\quad a^{-m} = \\frac{1}{a^m},\\quad a^0 = 1",
     "piege": "$-2^2 = -4$ mais $(-2)^2 = 4$ : l'exposant ne porte que sur ce qui est juste avant lui.",
     "passages": ["AN1.CH-1.3.p1", "AN1.CH-1.3.p2"],
     "verifs": [{"type": "eq", "expr": "-2**2", "answer": "-4"}, {"type": "eq", "expr": "(-2)**2", "answer": "4"},
                {"type": "eq", "expr": "a**(-m)", "answer": "1/a**m"}]},
    {"id": "AN1.N.racines", "titre": "Racines", "prerequis": ["AN1.N.puissances"],
     "idee": "La racine n-ième est la puissance $\\frac1n$, pour $a > 0$ : toutes les règles des puissances s'appliquent.",
     "formule": "\\sqrt[n]{a} = a^{1/n},\\quad \\sqrt{ab} = \\sqrt a\\,\\sqrt b,\\quad \\sqrt{a^2 + b^2} \\neq a + b",
     "piege": "Dans ce cours on n'écrit jamais $\\sqrt[3]{-8}$ mais $-\\sqrt[3]{8}$ (vidéo Puissances, 06:16).",
     "passages": ["AN1.CH-1.3.p2", "AN1.CH-1.3.p3"],
     "verifs": [{"type": "truth", "lhs": "sqrt(a**2+b**2)", "rhs": "a+b", "answer": "Faux"}]},
    {"id": "AN1.N.developper", "titre": "Développer (identités remarquables)", "prerequis": ["AN1.N.puissances"],
     "idee": "Chaque terme de la première parenthèse multiplie chaque terme de la seconde.",
     "formule": "(a+b)^2 = a^2 + 2ab + b^2,\\quad (a+b)(a-b) = a^2 - b^2,\\quad (a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3",
     "piege": "$(p+q)^2 \\neq p^2 + q^2$ : on oublie le double produit $2pq$ (série -1, I.11a).",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "(a+b)**3", "answer": "a**3+3*a**2*b+3*a*b**2+b**3"}]},
    {"id": "AN1.N.factoriser", "titre": "Factoriser", "prerequis": ["AN1.N.developper"],
     "idee": "Mettre en évidence, reconnaître une identité remarquable, ou trouver une racine $r$ et diviser par $(x - r)$.",
     "formule": "x^3 + x^2 - 2 \\text{ s'annule en } x = 1 \\ \\Rightarrow\\ x^3 + x^2 - 2 = (x - 1)(x^2 + 2x + 2)",
     "piege": "Toujours re-développer pour contrôler : c'est ainsi qu'on voit l'erreur du corrigé officiel en I.4d.",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "x**3+x**2-2", "answer": "(x-1)*(x**2+2*x+2)"}]},
    {"id": "AN1.N.fractions-rationnelles", "titre": "Fractions (et doubles fractions)", "prerequis": ["AN1.N.factoriser"],
     "idee": "Factoriser numérateur et dénominateur, puis simplifier. Diviser par une fraction = multiplier par son inverse.",
     "formule": "\\frac{\\frac{a}{b}}{\\frac{c}{d}} = \\frac{a}{b}\\cdot\\frac{d}{c},\\qquad \\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}",
     "piege": "$\\frac{1}{x - y} \\neq \\frac1x - \\frac1y$ (série -1, I.11f).",
     "passages": ["AN1.CH-1.1.p6"],
     "verifs": [{"type": "eq", "expr": "(a/b)/(c/d)", "answer": "a*d/(b*c)"}]},
    {"id": "AN1.N.rationaliser", "titre": "Rendre un dénominateur rationnel", "prerequis": ["AN1.N.racines", "AN1.N.developper"],
     "idee": "Multiplier en haut et en bas par l'expression conjuguée, pour utiliser $(a+b)(a-b) = a^2 - b^2$.",
     "formule": "\\frac{1}{\\sqrt2} = \\frac{1}{\\sqrt2}\\cdot\\frac{\\sqrt2}{\\sqrt2} = \\frac{\\sqrt2}{2},\\qquad "
                "\\frac{1}{5 - \\sqrt2} = \\frac{5 + \\sqrt2}{25 - 2}",
     "piege": "On multiplie par $1$ écrit astucieusement ; ne changer que le dénominateur change la valeur.",
     "passages": ["AN1.CH-1.1.p2", "AN1.CH-1.1.p6"],
     "verifs": [{"type": "eq", "expr": "1/(5-sqrt(2))", "answer": "(5+sqrt(2))/23"}]},
    {"id": "AN1.N.completer-carre", "titre": "Compléter le carré", "prerequis": ["AN1.N.developper"],
     "idee": "Écrire $ax^2 + bx + c$ comme $a(x + \\ldots)^2 + $ constante, en corrigeant le terme ajouté.",
     "formule": "ax^2 + bx + c = a\\left(x + \\frac{b}{2a}\\right)^2 + c - \\frac{b^2}{4a}",
     "piege": "Mettre $a$ en évidence d'abord : le terme correcteur est $\\frac{b^2}{4a}$, pas $\\frac{b^2}{4}$.",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "a*x**2+b*x+c", "answer": "a*(x+b/(2*a))**2+c-b**2/(4*a)"}]},
    {"id": "AN1.N.equations", "titre": "Équations", "prerequis": ["AN1.N.factoriser", "AN1.N.completer-carre", "AN1.N.fractions-rationnelles"],
     "idee": "Noter d'abord le domaine (dénominateurs $\\neq 0$, racines $\\geq 0$), résoudre, puis rejeter les solutions hors domaine.",
     "formule": "ax^2 + bx + c = 0 \\iff x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\quad (b^2 - 4ac \\geq 0)",
     "piege": "En I.9h, $x = 2$ sort du calcul mais est interdit : l'équation n'a pas de solution.",
     "passages": [],
     "verifs": [{"type": "solve", "lhs": "3/(x-2)", "rhs": "1/(x-1)+3/((x-1)*(x-2))", "answer": "EmptySet"}]},
    {"id": "AN1.N.inequations", "titre": "Inéquations", "prerequis": ["AN1.N.equations"],
     "idee": "Tout passer d'un côté, factoriser, puis faire un tableau de signes.",
     "formule": "\\frac{3x-2}{2x+1} \\leq 2 \\iff \\frac{-x-4}{2x+1} \\leq 0 \\iff x \\in\\, ]-\\infty, -4] \\cup ]-\\tfrac12, \\infty[",
     "piege": "Ne jamais multiplier par une expression de signe inconnu (comme $2x + 1$) : le sens de l'inégalité pourrait changer.",
     "passages": [],
     "verifs": [{"type": "solve", "rel": "(3*x-2)/(2*x+1) <= 2", "answer": "Union(Interval(-oo, -4), Interval.open(-1/2, oo))"}]},
    {"id": "AN1.N.valeur-absolue", "titre": "Valeur absolue", "prerequis": ["AN1.N.inequations"],
     "idee": "$|x - a|$ est la distance entre $x$ et $a$.",
     "formule": "|x - a| < r \\iff a - r < x < a + r",
     "piege": "$|x - 2| = \\frac{12}{5}$ a deux solutions : $x - 2 = \\pm\\frac{12}{5}$.",
     "passages": [],
     "verifs": [{"type": "solve", "rel": "Abs(x-3) < 2", "answer": "Interval.open(1, 5)"}]},
    {"id": "AN1.N.trigo-radians", "titre": "Radians", "prerequis": [],
     "idee": "$180^\\circ = \\pi$ rad ; la longueur d'un arc est rayon × angle en radians.",
     "formule": "\\theta_{\\text{rad}} = \\theta_{\\text{deg}}\\cdot\\frac{\\pi}{180},\\qquad s = r\\,\\theta",
     "piege": "$50^\\circ = \\frac{5\\pi}{18}$, positif : le corrigé officiel (II.1c) a un signe moins en trop.",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "50*pi/180", "answer": "5*pi/18"}]},
    {"id": "AN1.N.trigo-valeurs", "titre": "Valeurs de sin, cos, tan", "prerequis": ["AN1.N.trigo-radians", "AN1.N.racines"],
     "idee": "Les valeurs en $\\frac\\pi6, \\frac\\pi4, \\frac\\pi3$ viennent du triangle isocèle et du demi-triangle équilatéral ; $\\tan := \\frac{\\sin}{\\cos}$.",
     "formule": "\\sin\\tfrac\\pi6 = \\tfrac12,\\ \\sin\\tfrac\\pi4 = \\tfrac{\\sqrt2}{2},\\ \\sin\\tfrac\\pi3 = \\tfrac{\\sqrt3}{2};\\quad "
                "\\cos\\tfrac\\pi6 = \\tfrac{\\sqrt3}{2},\\ \\cos\\tfrac\\pi3 = \\tfrac12;\\quad \\tan\\tfrac\\pi4 = 1",
     "piege": "Hors de $[0, \\frac\\pi2]$, le signe dépend du quadrant : $\\sin\\frac{7\\pi}{4} = -\\frac{\\sqrt2}{2}$ (le corrigé officiel II.4b oublie le signe).",
     "passages": ["AN1.CH-1.1.p2", "AN1.CH-1.1.p3", "AN1.CH-1.1.p5", "AN1.CH-1.1.p6"],
     "verifs": [{"type": "eq", "expr": "sin(7*pi/4)", "answer": "-sqrt(2)/2"}]},
    {"id": "AN1.N.trigo-identites", "titre": "Identités trigonométriques", "prerequis": ["AN1.N.trigo-valeurs"],
     "idee": "Presque tout se déduit de $\\sin^2 + \\cos^2 = 1$ et des formules d'addition.",
     "formule": "\\sin^2 x + \\cos^2 x = 1,\\quad \\sin(x + y) = \\sin x\\cos y + \\cos x\\sin y,\\quad \\sin 2x = 2\\sin x\\cos x",
     "piege": "Connaissant $\\sin x$, $\\cos x = \\sqrt{1 - \\sin^2 x}$ seulement si $\\cos x \\geq 0$ (d'où « $x$ entre $0$ et $\\frac\\pi2$ » en II.6).",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "sin(2*x)", "answer": "2*sin(x)*cos(x)"},
                {"type": "eq", "expr": "sin(x+y)", "answer": "sin(x)*cos(y)+cos(x)*sin(y)"}]},
    {"id": "AN1.N.graphe-fonction", "titre": "Lire un graphe", "prerequis": [],
     "idee": "$f(a)$ se lit à la verticale de $a$ ; « $f(x) = c$ » se lit à l'horizontale de hauteur $c$.",
     "formule": "\\text{domaine} = \\text{projection sur } Ox,\\qquad \\text{image} = \\text{projection sur } Oy",
     "piege": "Le prof insiste : avoir le réflexe de dessiner le graphe de chaque fonction (vidéo Paires, 00:46).",
     "passages": ["AN1.CH-1.1.p1"], "verifs": []},
    {"id": "AN1.N.domaine", "titre": "Domaine de définition", "prerequis": ["AN1.N.inequations"],
     "idee": "Exclure ce qui est interdit : dénominateur nul, racine carrée d'un négatif, $\\ln$ d'un nombre $\\leq 0$.",
     "formule": "\\text{Convention du cours : } x^{r} \\text{ avec } r \\text{ non entier n'est défini que pour } x > 0",
     "piege": "À cause de cette convention, $x^{1/3}$ a pour domaine $]0, \\infty[$ dans ce cours (corrigé III.3b, note 1).",
     "passages": ["AN1.CH-1.3.p2"],
     "verifs": [{"type": "domain", "expr": "sqrt(4-x)+sqrt(x**2-1)", "answer": "Union(Interval(-oo, -1), Interval(1, 4))"}]},
    {"id": "AN1.N.transformations-graphe", "titre": "Transformer un graphe", "prerequis": ["AN1.N.graphe-fonction"],
     "idee": "Modifier l'argument déplace horizontalement (à l'envers) ; modifier la valeur déplace verticalement.",
     "formule": "f(x - 3):\\ \\to 3,\\quad f(x) + 2:\\ \\uparrow 2,\\quad -f(x):\\ \\text{réflexion } Ox,\\quad 2f(x):\\ \\text{étirement vertical}",
     "piege": "$\\cos(x) = \\sin(x + \\frac\\pi2)$ : ajouter $\\frac\\pi2$ dans l'argument pousse le graphe vers la gauche (vidéo Fonctions élémentaires, 00:54).",
     "passages": ["AN1.CH-1.1.p1"],
     "verifs": [{"type": "eq", "expr": "sin(x+pi/2)", "answer": "cos(x)"}]},
    {"id": "AN1.N.composition", "titre": "Composition", "prerequis": ["AN1.N.developper"],
     "idee": "$(f\\circ g)(x) = f(g(x))$ : on remplace $x$ par $g(x)$ dans $f$. L'ordre compte.",
     "formule": "f(x) = x^2 + 2x - 1,\\ g(x) = 2x - 3:\\quad f\\circ g = 4x^2 - 8x + 2,\\quad g\\circ f = 2x^2 + 4x - 5",
     "piege": "$f\\circ g \\neq g\\circ f$ en général.",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "(2*x-3)**2+2*(2*x-3)-1", "answer": "4*x**2-8*x+2"}]},
    {"id": "AN1.N.fonction-reciproque", "titre": "Fonctions réciproques", "prerequis": ["AN1.N.composition", "AN1.N.graphe-fonction"],
     "idee": "$f^{-1}$ défait $f$ : $f^{-1}(f(x)) = x$. Son graphe est le reflet de celui de $f$ par rapport à $y = x$.",
     "formule": "D(f^{-1}) = \\text{image de } f;\\quad \\sqrt{x^2} = x\\ (x\\geq 0),\\quad \\ln(e^x) = x,\\quad \\arctan(\\tan x) = x\\ (|x| < \\tfrac\\pi2)",
     "piege": "Chaque identité a sa condition : $\\sqrt{x^2} = x$ seulement pour $x \\geq 0$ (sinon $\\sqrt{x^2} = |x|$).",
     "passages": ["AN1.CH-1.2.p1", "AN1.CH-1.2.p2", "AN1.CH-1.2.p3"],
     "verifs": [{"type": "eq", "expr": "sqrt(x**2)", "answer": "Abs(x)"}]},
    {"id": "AN1.N.exp-ln", "titre": "Exponentielle et logarithmes", "prerequis": ["AN1.N.fonction-reciproque", "AN1.N.puissances"],
     "idee": "$\\log_a$ est la réciproque de $a^x$ ; ses règles viennent de celles des puissances.",
     "formule": "\\log_a(xy) = \\log_a x + \\log_a y,\\quad \\log_a(x^r) = r\\log_a x,\\quad \\log_a 1 = 0,\\quad \\ln = \\log_e",
     "piege": "$\\log_a(\\sqrt5) = \\frac12\\log_a 5$, pas $(\\log_a 5)^{1/2}$ : la puissance mal placée est une faute fréquente (challenge du jour).",
     "passages": ["AN1.CH-1.2.p2", "AN1.CH-1.3.p4", "AN1.CH-1.3.p5", "AN1.CH-1.3.p6", "AN1.CH-1.3.p7"],
     "verifs": [{"type": "eq", "expr": "log(sqrt(5), a)", "answer": "log(5, a)/2"}]},
    {"id": "AN1.N.sommes", "titre": "Sommes et télescopage", "prerequis": ["AN1.N.puissances"],
     "idee": "Multiplier $\\sum a^k$ par $(1 - a)$ fait se simplifier les termes deux à deux.",
     "formule": "\\left(\\sum_{k=0}^{n} a^k\\right)(1 - a) = 1 - a^{n+1}",
     "piege": "Ne pas développer la somme terme à terme : écrire les deux lignes et barrer (indication du corrigé I.12b).",
     "passages": [],
     "verifs": [{"type": "eq", "expr": "(1+a+a**2+a**3)*(1-a)", "answer": "1-a**4"}]},
    {"id": "AN1.N.logique", "titre": "Calcul propositionnel", "prerequis": [],
     "idee": "Une proposition est vraie ou fausse ; on prouve une équivalence en comparant les tableaux de vérité.",
     "formule": "(p\\Rightarrow q) \\iff (\\neg p \\vee q),\\qquad (p\\Rightarrow q) \\iff (\\neg q \\Rightarrow \\neg p)",
     "piege": "La réciproque $q \\Rightarrow p$ n'a aucun rapport avec $p \\Rightarrow q$ (série -1, partie IV). "
              "Sujet marqué ♦ : il revient au chapitre 0.",
     "passages": [],
     "verifs": [{"type": "logic", "expr": "Equivalent(Implies(p, q), Implies(~q, ~p))"}]},
    {"id": "AN1.N.quantificateurs", "titre": "Quantificateurs ∀ et ∃", "prerequis": ["AN1.N.logique"],
     "idee": "Nier échange $\\forall$ et $\\exists$ ; l'ordre des quantificateurs change le sens.",
     "formule": "\\neg(\\forall x,\\ p(x)) \\iff \\exists x,\\ \\neg p(x);\\qquad \\exists x\\,\\forall y \\Rightarrow \\forall y\\,\\exists x \\text{ (pas l'inverse)}",
     "piege": "Pour réfuter une implication, un seul contre-exemple suffit (corrigé IV.2e, IV.2f, IV.3c).",
     "passages": [], "verifs": []},
]

# Exercices de la série -1 rattachés à chaque notion : dérivés automatiquement au build
# à partir du champ « notions » des exercices.
