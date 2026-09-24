# AN1.S-1 — Série -1 (Prélude) : rapport de vérification

140 questions. conforme : 108, divergence : 6, non_verifiable : 26

- **conforme** : SymPy confirme la réponse du corrigé EPFL.
- **divergence** : SymPy contredit le corrigé EPFL. Non tranché : à examiner.
- **non_tranche** : SymPy n'a pas pu conclure.
- **non_verifiable** : graphe, lecture de figure, réponse descriptive ou convention du cours.

## Divergence

### AN1.S-1.I.3.c

- Énoncé : $ \left(\sqrt{a}+\sqrt{b}\right)\left(\sqrt{a}-\sqrt{b}\right) $
- Corrigé EPFL : $ a^{1/2} $
- SymPy : $ a - b $ (numerique)
- Détail : égalité infirmée

### AN1.S-1.I.3.d

- Énoncé : $ (2x+3)^2 $
- Corrigé EPFL : $ 9x^2+12x+4 $
- SymPy : $ 4 x^{2} + 12 x + 9 $ (numerique)
- Détail : égalité infirmée
- Note : La réponse officielle correspond à (3x+2)^2.

### AN1.S-1.I.3.e

- Énoncé : $ (x+2)^3 $
- Corrigé EPFL : $ 8x^3+36x^2+54x+27 $
- SymPy : $ x^{3} + 6 x^{2} + 12 x + 8 $ (numerique)
- Détail : égalité infirmée
- Note : La réponse officielle correspond à (2x+3)^3.

### AN1.S-1.I.4.d

- Énoncé : $ x^3+x^2-2 $
- Corrigé EPFL : $ (x-2)(x^2+2x+2) $
- SymPy : $ \left(x - 1\right) \left(x^{2} + 2 x + 2\right) $ (numerique)
- Détail : égalité infirmée

### AN1.S-1.II.1.c

- Énoncé : $ 50^\circ $
- Corrigé EPFL : $ -\frac{5\pi}{18} $
- SymPy : $ \frac{5 \pi}{18} $ (numerique)
- Détail : égalité infirmée

### AN1.S-1.II.4.b

- Énoncé : $ \sin\left(\tfrac{7\pi}{4}\right) $
- Corrigé EPFL : $ \frac{\sqrt{2}}{2} $
- SymPy : $ - \frac{\sqrt{2}}{2} $ (numerique)
- Détail : égalité infirmée

## Remarques et points douteux

- **AN1.S-1.I.2.b** (conforme) : Dans le PDF du corrigé, l'exposant 19 est mal composé (le 9 est sur la ligne). Le texte du PDF donne bien b^19.
- **AN1.S-1.I.2.c** (conforme) : Hypothèse x, y > 0 (exposants fractionnaires, convention du cours).
- **AN1.S-1.I.6.b** (conforme) : Vérifié pour h > 0 (l'expression est définie pour h ≥ -4).
- **AN1.S-1.I.9.e** (conforme) : Le résultat final ±2 est vérifiable. Dans le raisonnement officiel, « 3 = x² n'admet pas de solution » est faux tel quel (x = ±√3) : il s'agit probablement de −3 = x², signe « − » manquant. À confirmer par toi sur le PDF.
- **AN1.S-1.I.12.a** (conforme) : Le corrigé donne une indication, pas un résultat : SymPy vérifie l'identité elle-même.
- **AN1.S-1.I.12.b** (conforme) : SymPy vérifie que les deux membres valent 1 − a⁸ (le membre de droite est vérifié à part).
- **AN1.S-1.II.5** (non_verifiable) : Lecture de figure : pas de vérification SymPy possible au-delà de a² + b² = 24².
- **AN1.S-1.II.9** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.1.a** (non_verifiable) : Lecture de graphe : non vérifiable par SymPy.
- **AN1.S-1.III.1.b** (non_verifiable) : Lecture de graphe : non vérifiable par SymPy.
- **AN1.S-1.III.1.c** (non_verifiable) : Lecture de graphe : non vérifiable par SymPy.
- **AN1.S-1.III.1.d** (non_verifiable) : Lecture de graphe : non vérifiable par SymPy.
- **AN1.S-1.III.1.e** (non_verifiable) : Lecture de graphe : non vérifiable par SymPy.
- **AN1.S-1.III.3.b** (non_verifiable) : Le corrigé applique la convention du cours (note 1) : « les puissances avec exposants non-entiers sont définies seulement pour les nombres strictement positifs ». Réponse conventionnelle : SymPy n'est pas utilisé ici.
- **AN1.S-1.III.4.a** (non_verifiable) : Réponse descriptive : non vérifiable par SymPy.
- **AN1.S-1.III.4.b** (non_verifiable) : Réponse descriptive : non vérifiable par SymPy.
- **AN1.S-1.III.4.c** (non_verifiable) : Réponse descriptive : non vérifiable par SymPy.
- **AN1.S-1.III.5.a** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.b** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.c** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.d** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.e** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.f** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.g** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.5.h** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.III.6.b** (non_verifiable) : Réponse graphique : non vérifiable par SymPy.
- **AN1.S-1.IV.1.j** (conforme) : Dans le corrigé, les tableaux (j) et (k) ont 8 lignes pour 2 variables : chaque ligne apparaît deux fois. C'est sans conséquence sur le résultat.
- **AN1.S-1.IV.2.a** (non_verifiable) : Le corrigé officiel ne traite que (e) et (f).
- **AN1.S-1.IV.3.a** (non_verifiable) : Le corrigé officiel ne traite que (c).

## Vérifications complémentaires

- AN1.S-1.IV.2.e : conforme — implication vraie sur tous les modèles finis testés
- AN1.S-1.IV.2.f : conforme — implication vraie sur tous les modèles finis testés
- AN1.S-1.IV.3.c : conforme — implication vraie sur tous les modèles finis testés

## Méthodes

- *symbolique* : SymPy démontre l'égalité ou calcule l'ensemble exact.
- *numerique* : SymPy n'a pas simplifié jusqu'à 0 ; l'égalité est testée en 20 points aléatoires.
- *enumeration* : quantificateurs testés sur tous les modèles à 1, 2 et 3 éléments. Un contre-exemple est une preuve ; l'absence de contre-exemple n'en est pas une.
