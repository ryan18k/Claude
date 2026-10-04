# Plan détaillé et architecture — Annuaire des restaurants halal de Suisse romande

> **Statut : proposition en attente de validation.** Aucune ligne de code applicatif ne sera écrite avant ton accord.
> Nom de code provisoire du projet : `halal-romandie` (le nom commercial et l'identifiant de l'app restent à choisir, voir §13).

---

## 0. Résumé en 10 lignes

1. **Monorepo** (pnpm + Turborepo) : une app mobile **Expo / React Native** (iOS + Android), une app **Next.js** (fiches publiques SEO, espace restaurateur, back-office admin), et des **packages partagés** (types, logique métier, traductions).
2. **Supabase** hébergé à **Zurich** (`eu-central-2`) : Auth, PostgreSQL + PostGIS, Storage, Edge Functions, **RLS sur toutes les tables**.
3. **Les règles critiques vivent dans la base de données** (RLS, triggers, fonctions SQL), pas seulement dans les apps : une app peut être contournée, la base non.
4. **Carte** : MapLibre + tuiles vectorielles **swisstopo** (gratuites, données ouvertes de la Confédération) ; géocodage via l'API geo.admin.ch. **Rien de Google Maps.**
5. **Paiements** : Stripe Billing en CHF, **uniquement sur le web**. Les apps iOS et Android sont **100 % côté client** : aucun prix, bouton ou lien d'achat (voir §2, recherche faite sur les règles actuelles).
6. **Intégrité** : un paiement n'achète que de la visibilité ; le statut halal n'est modifiable que par un admin ; le classement organique et le sponsorisé sont deux listes distinctes ; tout est couvert par des tests (unitaires + tests SQL de RLS).
7. **Langues** : français d'abord, infrastructure i18n prête dès la phase 1 pour **anglais, arabe (droite à gauche), espagnol et allemand**.
8. **Juridique** : modèles de documents « À RELIRE PAR UN JURISTE » + une matrice `docs/legal/OBLIGATIONS.md` qui relie chaque obligation au code qui la met en œuvre.
9. **7 phases**, avec démonstration et validation à la fin de chacune.
10. **Décisions à prendre maintenant** : voir §13 (6 questions).

---

## 1. Architecture

### 1.1 Vue d'ensemble

```
┌──────────────────────────┐        ┌──────────────────────────────────────┐
│  apps/mobile (Expo)      │        │  apps/web (Next.js)                  │
│  iOS + Android           │        │  • /[langue]/restaurant/[slug] (SEO) │
│  • carte, liste, filtres │        │  • /[langue]/espace-restaurant       │
│  • fiches, avis, favoris │        │  • /admin (back-office)              │
│  • compte, export, suppr.│        │  • paiements Stripe (web seulement)  │
└────────────┬─────────────┘        └───────────────┬──────────────────────┘
             │  utilisent                            │
             ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ packages/core      types, schémas zod, logique métier pure (horaires,    │
│                    libellés halal, classement, filtres, tarifs)          │
│ packages/i18n      catalogues de traduction fr/en/ar/es/de (format ICU)  │
│ packages/supabase  client typé, types générés depuis la base, requêtes   │
│ packages/config    configs partagées (TypeScript, ESLint, design tokens) │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTPS (clé publique « anon » + jeton utilisateur)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Supabase — région Zurich (eu-central-2)                                  │
│  • Auth (e-mail, Apple, Google)                                          │
│  • PostgreSQL + PostGIS + RLS + triggers d'intégrité + journal d'audit   │
│  • Storage (photos publiques ; preuves de vérification en bucket privé)  │
│  • Edge Functions : webhook Stripe, revendication, vérif. IDE/UID,       │
│    export de données, suppression de compte, récap mensuel par e-mail    │
│  • pg_cron : rappels de revérification annuelle, agrégation des stats    │
└──────────────────────────────────────────────────────────────────────────┘
        ▲ webhooks                 ▲ API publique            ▲ tuiles / géocodage
     Stripe (CHF)          Registre UID / Zefix         swisstopo / geo.admin.ch
```

### 1.2 Arborescence prévue

```
apps/
  mobile/            Expo (Expo Router, EAS Build)
  web/               Next.js (App Router)
packages/
  core/              logique métier pure + tests Vitest
  i18n/              messages fr, en, ar, es, de
  supabase/          client, types générés, requêtes
  config/            tsconfig, eslint, design tokens (couleurs, tailles)
supabase/
  migrations/        schéma SQL versionné
  seed.sql           données de test 100 % fictives
  functions/         Edge Functions (Deno)
  tests/             tests SQL pgTAP (RLS, triggers d'intégrité)
docs/
  PLAN.md            ce document
  RECHERCHE_STORES_PAIEMENTS.md
  ARCHITECTURE.md    (phase 1)
  legal/             modèles de documents + OBLIGATIONS.md
  publication/       checklists App Store / Google Play (phase 6)
.env.example         variables d'environnement, sans aucune valeur secrète
```

### 1.3 Ce que je garde de ta proposition, et ce que je propose d'améliorer

| Sujet | Ta proposition | Mon avis |
|---|---|---|
| Monorepo Expo + Next.js + packages partagés | ✅ | Validé. Outil : **pnpm + Turborepo**. Depuis Expo SDK 54, pnpm et les monorepos sont officiellement pris en charge. |
| Partage de l'interface entre mobile et web | (non précisé) | **Je déconseille de partager les composants d'interface** (React Native Web, Tamagui…) : c'est la source de bugs la plus fréquente dans ce type de projet et c'est difficile à apprendre en même temps que le reste. On partage la **logique**, les **types**, les **traductions** et les **design tokens** (couleurs, espacements) ; chaque app a ses propres composants visuels. |
| Supabase en Europe | ✅ | Je propose **Zurich** plutôt que Francfort : les données restent en Suisse, ce qui simplifie la politique de confidentialité nLPD (pas de transfert à l'étranger pour la base). |
| Logique métier dans un package partagé | ✅ | Oui pour l'affichage et les calculs, **mais les règles d'intégrité sont aussi imposées dans PostgreSQL** (RLS + triggers). Raison : un client mobile ou web peut être modifié ou contourné ; la base de données est le seul point par lequel tout passe. |
| MapLibre / OpenStreetMap | ✅ | Validé, avec une précision importante : on **ne doit pas** utiliser les tuiles du serveur `tile.openstreetmap.org` pour une app en production (leur politique d'usage l'interdit). Je propose les **tuiles vectorielles swisstopo** : gratuites, données ouvertes (OGD), couvrent la Suisse et les régions frontalières, compatibles MapLibre, attribution obligatoire. Plan B si besoin hors de Suisse : Protomaps (fichier de tuiles auto-hébergé) ou MapTiler. |
| Géocodage (adresse → coordonnées) | (non précisé) | API de recherche **geo.admin.ch** (gratuite), utilisée seulement dans le back-office quand tu crées une fiche. Aucune API Google. |
| Bouton itinéraire | ✅ | Ouvre l'app de navigation de l'utilisateur (Plans d'Apple, Google Maps, Waze) avec les coordonnées. C'est un simple lien sortant : on ne récupère aucune donnée de Google, ce qui est autorisé. |
| Stripe en CHF | ✅ | Stripe Checkout + Customer Portal (résiliation, factures, changement de carte gérés par Stripe) + webhook vers Supabase. **Web uniquement.** |
| Hébergement du site web | (non précisé) | ⚠️ Le plan gratuit de Vercel (Hobby) **interdit l'usage commercial** ; dès qu'on vend des abonnements, il faut Vercel Pro (~20 USD/mois). Alternative gratuite : Cloudflare. **Décision à prendre (§13).** |
| E-mails (connexion, récap mensuel) | (non précisé) | Le serveur d'e-mails par défaut de Supabase est limité et réservé aux tests. Il faudra un fournisseur SMTP (de préférence suisse ou européen). Décision en phase 3. |

### 1.4 Choix techniques secondaires (modifiables facilement, je les prends par défaut)

- **TypeScript partout**, mode strict.
- **Expo Router** (navigation par fichiers, proche de Next.js : une seule logique à apprendre).
- **TanStack Query** pour les données côté mobile et côté client web.
- **zod** pour valider les données (les mêmes schémas sur mobile, web et Edge Functions).
- **Tailwind CSS** sur le web ; `StyleSheet` + design tokens sur mobile.
- **Tests** : Vitest (logique), pgTAP via `supabase test db` (sécurité de la base), Playwright (quelques parcours web), Jest/`jest-expo` (quelques composants mobiles).
- **CI GitHub Actions** : lint, typecheck, tests, recherche de secrets.
- **Polices** : une police qui couvre aussi l'arabe (famille Noto Sans / Noto Sans Arabic).

> Note : la carte MapLibre nécessite du code natif, donc **Expo Go ne suffira pas** : on utilisera des *development builds* (une version de développement de l'app installée sur ton téléphone ou ton simulateur, construite par EAS Build ou sur ton Mac).

---

## 2. Paiements et règles des stores — ce que j'ai trouvé

Détail et citations : [`RECHERCHE_STORES_PAIEMENTS.md`](./RECHERCHE_STORES_PAIEMENTS.md). Résumé :

1. **Apple 3.1.1** : débloquer une fonctionnalité *dans l'app* (abonnement, contenu premium…) impose l'achat intégré d'Apple.
2. **Apple 3.1.3(g)** dit explicitement que l'achat de publicité **affichée dans la même app** (exemple cité : les « boosts ») est un achat numérique qui **doit passer par l'achat intégré** lorsqu'il est fait dans l'app. C'est exactement le cas d'une mise en avant sponsorisée.
3. **Apple 3.1.3(b)** : une fonctionnalité achetée sur le web ne peut être utilisée dans l'app iOS que si elle est **aussi** vendue en achat intégré. → Si le tableau de bord Premium (statistiques détaillées, publication d'offres) était dans l'app iOS, Apple pourrait exiger l'achat intégré.
4. **Liens vers un paiement externe** : autorisés **uniquement sur le storefront des États-Unis** (et selon des régimes particuliers dans l'UE). **Aucune exception pour la Suisse** dans les règles actuelles. L'enquête de la COMCO (WEKO) ouverte en décembre 2025 concerne l'accès NFC (Twint / Apple Pay), pas les achats dans les apps.
5. **Google Play** : même logique (facturation Google obligatoire pour les fonctionnalités et logiciels vendus dans l'app, y compris les « logiciels de productivité pour entreprises » ; pas d'incitation vers un paiement externe sauf programmes spécifiques à certains pays).

**Recommandation (= ton choix par défaut, confirmé par la recherche)** :
- Les apps iOS et Android sont **exclusivement destinées aux clients** : aucune fonctionnalité restaurateur payante, aucun prix, aucun bouton ni lien vers l'espace restaurateur.
- Tout l'espace restaurateur (revendication, tableau de bord, statistiques, paiements) est **sur le web**.
- Les restaurants peuvent être informés **en dehors de l'app** (e-mail, visite, site web), ce qu'Apple autorise expressément.
- Dans l'app, on se limite à un lien neutre « Signaler une erreur sur cette fiche » (formulaire gratuit, sans aucune mention commerciale).
- Les fiches sponsorisées s'affichent dans l'app (étiquetées « Sponsorisé ») : c'est de la publicité vendue hors de l'app, comme dans n'importe quelle app gratuite financée par la publicité. Le risque résiduel est faible mais non nul ; il est documenté et la checklist de soumission (phase 6) prévoit une note explicative pour l'équipe de revue d'Apple.
- Je **revérifierai ces règles juste avant la phase 5 et avant la soumission** (elles changent souvent).

---

## 3. Modèle de données (aperçu)

Toutes les tables ont la **RLS activée**. « Admin » = utilisateur ayant le rôle `admin` dans `user_roles`. Les écritures marquées « service » ne sont faites que par les Edge Functions avec la clé de service (jamais exposée aux apps).

| Table | Rôle | Lecture | Écriture |
|---|---|---|---|
| `profiles` | nom affiché, langue préférée | soi-même ; nom affiché public pour les avis | soi-même |
| `user_roles` | admin, modérateur | admin | admin |
| `restaurants` | fiche : nom, slug, adresse, `location` (PostGIS), téléphone, site, gamme de prix, statut de publication, n° IDE | public (si publiée) | admin ; membres du restaurant pour les champs **non sensibles** |
| `cuisines`, `restaurant_cuisines` | types de cuisine/produits | public | admin ; membres |
| `opening_hours`, `special_hours` | horaires, fermetures exceptionnelles, horaires du Ramadan | public | admin ; membres |
| `halal_profiles` | viande (certifiée / déclarée par le fournisseur / inconnue), périmètre (100 % halal / options halal), alcool servi, porc servi | public | **admin uniquement** (trigger qui refuse tout le reste) |
| `halal_verifications` | historique : niveau (non vérifié / vérifié par l'équipe / certifié par un organisme), méthode, date, preuve, organisme, date d'expiration, prochaine revérification | public (sans la preuve) | **admin uniquement** |
| `certifiers` | organismes de certification (nom, site ; **pas de logo**) | public | admin |
| `menu_sections`, `menu_items` | carte et prix en CHF | public | admin ; membres |
| `photos` | photos, source (équipe / restaurant), accord de droits, statut de modération, texte alternatif | public si approuvée | admin ; membres (en attente de modération) |
| `offers` | offres (menu du Ramadan, promo étudiante…) | public si active | membres d'un restaurant **Premium** ; admin |
| `change_requests` | demandes de modification sensibles (halal, certification, alcool) | demandeur ; admin | membres (création) ; admin (décision) |
| `reviews` | note 1–5 + texte, statut (en attente / publié / masqué / retiré) | public si publié ; l'auteur voit le sien | auteur (avec limites, voir §5) ; admin/modérateur |
| `review_confirmations` | « viande certifiée confirmée », « pas d'alcool servi »… | public (agrégé) | auteur de l'avis |
| `review_responses` | droit de réponse du restaurant | public | membres du restaurant ; admin |
| `reports` | signalements (avis, réponse, photo, info erronée, contenu illicite) | auteur du signalement ; admin | utilisateur connecté (création) ; admin |
| `user_blocks` | blocage d'un utilisateur (exigé par Apple 1.2) | soi-même | soi-même |
| `favorites`, `view_history` | favoris, historique (limité, effaçable, durée de conservation courte) | soi-même | soi-même |
| `restaurant_claims` | revendications : méthode, code (haché), essais, n° IDE vérifié, statut | demandeur ; admin | service ; admin |
| `restaurant_members` | qui gère quel restaurant | membres ; admin | service ; admin |
| `plans` | offres et **prix configurables** (CHF, intervalle, id de prix Stripe, places limitées) | public (web) | admin |
| `subscriptions` | état de l'abonnement Stripe d'un restaurant | membres ; admin | **service (webhook Stripe) uniquement** |
| `sponsored_placements` | emplacements sponsorisés (accueil, résultats), dates, position, nombre limité | public (actifs) | service ; admin |
| `restaurant_stats_daily` | compteurs agrégés par jour (vues, itinéraires, appels, apparitions) — **sans aucune donnée personnelle** | membres ; admin | service |
| `app_settings` | réglages (TVA activée/taux, nombre de places « fondateur », durée de conservation…) | public (partiel) | admin |
| `audit_log` | qui a modifié quoi et quand (surtout statut halal, modération, abonnements) | admin | triggers uniquement |
| `legal_acceptances` | version des CGU/CGV acceptée et date | soi-même ; admin | soi-même |

**Données de test** : restaurants nommés « [FICTIF] Restaurant Exemple 01 », adresses « Rue Fictive », coordonnées dispersées autour de Vevey, Montreux, La Tour-de-Peilz et Lausanne, aucun nom réel, aucun numéro de téléphone réel (numéros réservés à la fiction).

---

## 4. Règle d'intégrité : comment elle est garantie

« Un paiement n'achète que de la visibilité » est imposé à **quatre niveaux** :

1. **Base de données** :
   - `halal_profiles` et `halal_verifications` ne sont modifiables que par un admin (RLS **et** trigger de défense en profondeur).
   - Un restaurant ne peut que **créer une demande** (`change_requests`) ; elle n'est publiée qu'après approbation par un admin.
   - Les tables `reviews`, notes et confirmations n'ont **aucun lien** avec `subscriptions` ou `plans` ; un membre d'un restaurant ne peut ni modifier, ni masquer, ni noter son propre établissement.
   - Le webhook Stripe n'a le droit d'écrire que dans `subscriptions` et `sponsored_placements`.
   - Chaque modification du statut halal est inscrite dans `audit_log`.
2. **Logique métier (`packages/core`)** :
   - La fonction de classement organique **ne reçoit pas** les données d'abonnement (c'est visible dans sa signature TypeScript, donc impossible à utiliser par erreur).
   - Les résultats de recherche ont la forme `{ sponsorises: [...], organiques: [...] }` : deux listes séparées, jamais fusionnées.
   - Tout élément sponsorisé porte obligatoirement l'étiquette « Sponsorisé » (le type l'impose).
   - Le libellé halal est produit par une seule fonction qui **ne peut pas** produire le mot « certifié » sans organisme, preuve et date valides.
3. **Interface** : composant unique `<BadgeSponsorise>` et bloc unique `<StatutHalal>` sur mobile et web.
4. **Tests automatiques** (exemples) :
   - « un restaurant Premium qui tente de modifier `halal_profiles` reçoit une erreur » (pgTAP) ;
   - « le webhook Stripe ne peut pas modifier une note ou un avis » (pgTAP) ;
   - « deux restaurants identiques, l'un Premium et l'autre gratuit, ont le même rang organique » (Vitest) ;
   - « un certificat expiré n'est jamais affiché comme certifié » (Vitest) ;
   - « un élément sponsorisé sans étiquette ne compile pas / échoue au test » (Vitest).

---

## 5. Statut halal, avis et modération

**Affichage du statut halal** (jamais « certifié » sans source) :
- *Certifié par un organisme* : « Viande certifiée par [Organisme] — certificat valable jusqu'au JJ.MM.AAAA — informations vérifiées le JJ.MM.AAAA ».
- *Vérifié par l'équipe* : « Informations vérifiées par notre équipe le JJ.MM.AAAA (méthode : visite sur place / document fourni par le restaurant) ».
- *Non vérifié* : « Informations non vérifiées — déclarées par [source] ».
- Toujours suivi d'un **avertissement** : la vérification reflète la situation à la date indiquée, elle ne garantit pas chaque plat ni chaque livraison ; en cas de doute, demander au restaurant.
- Certificat expiré ou revérification dépassée → le statut redescend automatiquement d'un niveau et l'admin reçoit un rappel.
- Les confirmations de la communauté (« pas d'alcool servi ») sont affichées **séparément** et ne modifient jamais le statut officiel ; des confirmations contradictoires déclenchent une alerte de revérification pour l'admin.

**Protections contre les faux avis** : compte avec e-mail vérifié obligatoire ; un avis par restaurant et par compte (modifiable) ; délai minimal après création du compte (ex. 24 h, configurable) ; limite par jour ; les avis des comptes récents passent en file de modération ; détection des rafales (trop d'avis sur un même restaurant en peu de temps → mise en attente) ; les membres d'un restaurant ne peuvent pas noter leur établissement ; signalement, blocage d'utilisateur, droit de réponse.

**Modération** : politique de modération publiée ; procédure de retrait des contenus signalés comme illicites ou diffamatoires (accusé de réception, décision motivée, possibilité de contestation) ; délais cibles affichés.

---

## 6. Statistiques et vie privée

- Les statistiques restaurants (vues, itinéraires, appels, apparitions) sont des **compteurs agrégés par jour**, **sans identifiant d'utilisateur ni d'appareil**.
- **Aucun SDK publicitaire, aucun pistage entre apps** → pas besoin de l'App Tracking Transparency.
- Toute mesure d'audience non essentielle (ex. analyse produit) est **désactivée par défaut** et soumise à consentement.
- La position GPS sert uniquement à la recherche ; elle n'est **pas enregistrée** sur le serveur.
- Export des données (JSON) et suppression du compte **depuis l'app** (exigence Apple) et **page web de demande de suppression** (exigence Google Play).

---

## 7. Langues

- Langues : **français** (référence), **anglais, arabe, espagnol, allemand**.
- Catalogues partagés au format ICU dans `packages/i18n` ; `next-intl` sur le web (URL `/fr/…`, `/de/…` + balises `hreflang` pour Google) et `use-intl` (même moteur) sur mobile → **mêmes fichiers, même syntaxe**.
- Arabe : affichage de droite à gauche dès la phase 1 (propriétés CSS logiques sur le web, `I18nManager` sur mobile — changer de sens d'écriture sur mobile demande un redémarrage de l'app, c'est une limite de React Native).
- Dates au format suisse (JJ.MM.AAAA), prix en CHF formatés selon la langue.
- Les traductions anglaises, arabes, espagnoles et allemandes sont faites en phase 7 ; d'ici là, les clés manquantes retombent sur le français. **Les textes juridiques traduits devront aussi être relus.**

---

## 8. Accessibilité, performance, sécurité

- **Accessibilité** : contrastes WCAG AA, tailles de texte dynamiques, libellés pour lecteurs d'écran (VoiceOver, TalkBack), cibles tactiles ≥ 44 pt, la liste offre une alternative complète à la carte, information jamais transmise par la couleur seule (le statut halal a toujours un texte).
- **Performance de la carte** : regroupement des marqueurs natif de MapLibre (côté GPU), chargement des restaurants de la zone visible via une requête PostGIS indexée, données de marqueurs minimales (id, position, catégorie), images redimensionnées.
- **Sécurité** : RLS partout avec des tests ; clé de service uniquement dans les Edge Functions ; vérification de la signature des webhooks Stripe ; limitation du nombre de tentatives (codes de revendication, avis) ; preuves de vérification dans un bucket privé ; `.env.example` uniquement ; analyse de secrets dans la CI.

---

## 9. Juridique : ce qui sera dans le dépôt

Tous marqués **« À RELIRE PAR UN JURISTE — NE PAS PUBLIER EN L'ÉTAT »** :
- `docs/legal/politique-confidentialite.md` (nLPD + RGPD)
- `docs/legal/mentions-legales.md` (LCD : identité et coordonnées complètes)
- `docs/legal/cgu-clients.md`
- `docs/legal/cgv-restaurants.md` (abonnements, résiliation, CHF, TVA désactivée mais activable)
- `docs/legal/politique-moderation.md` et procédure de retrait
- `docs/legal/methodologie-verification-halal.md` (ce que signifie chaque niveau)
- `docs/legal/politique-photos-et-marques.md`
- `docs/legal/sous-traitants.md` (Supabase, Stripe, hébergeur web, e-mails… et pays de traitement)
- **`docs/legal/OBLIGATIONS.md`** : tableau « obligation → texte de loi / règle du store → fichier(s) de code → test(s) », mis à jour à chaque phase.

Points déjà repérés pour ton juriste :
- **« Tarif réduit à vie »** (partenaire fondateur) : formulation risquée au regard de la LCD si le service s'arrête ou change ; je propose « tant que l'abonnement reste actif sans interruption ».
- **Utilisateurs de l'UE** (frontaliers autour de Genève) : vérifier si le RGPD et éventuellement le règlement européen sur les services numériques (DSA) s'appliquent, selon le ciblage.
- Les prix aux restaurants sont des offres entre professionnels ; mentionner clairement « TVA non applicable » tant que tu n'es pas assujetti.

---

## 10. Les 7 phases

À la fin de chaque phase : démonstration (captures d'écran web, résultats des tests, explications), mise à jour de `OBLIGATIONS.md`, puis **ta validation avant de passer à la suivante**.

### Phase 1 — Fondations
- Monorepo (pnpm, Turborepo, TypeScript, ESLint, Prettier, CI GitHub Actions).
- Projet Supabase local : migrations du schéma complet (§3), RLS, triggers d'intégrité, `audit_log`, données fictives.
- `packages/core` : types, schémas zod, horaires (« ouvert maintenant » en heure suisse, y compris les horaires qui passent minuit), libellés halal, classement + premiers tests.
- `packages/i18n` : structure 5 langues (fr rempli), droite à gauche prévu.
- Squelettes `apps/mobile` et `apps/web` qui affichent une liste de restaurants fictifs.
- README « lancer le projet de zéro », `.env.example`, `docs/ARCHITECTURE.md`, première version de `OBLIGATIONS.md`.
- **Ce que tu devras faire** : créer un compte Supabase (gratuit pour commencer).

### Phase 2 — MVP clients
- Mobile : carte MapLibre + tuiles swisstopo, géolocalisation avec texte d'explication clair, regroupement des marqueurs, liste synchronisée avec la carte, filtres combinables (cuisine, prix, distance, ouvert maintenant, critères halal), fiche complète (photos, horaires, carte et prix, adresse, téléphone, itinéraire, bloc statut halal + avertissement).
- Web : pages publiques des restaurants rendues côté serveur, SEO (métadonnées, données structurées schema.org `Restaurant`, sitemap, `hreflang`), carte web.
- Back-office minimal : création manuelle de fiches avec géocodage geo.admin.ch, workflow de vérification halal (niveaux, preuves, expiration, rappel annuel).

### Phase 3 — Comptes, avis, modération
- Connexion e-mail, Apple, Google (Apple obligatoire dès qu'on propose Google, règle 4.8), favoris, historique.
- Avis + confirmations précises, signalements, blocage, file de modération, protections anti-faux avis.
- Export des données, suppression du compte dans l'app + page web de demande de suppression.
- Fournisseur d'e-mails configuré.

### Phase 4 — Espace restaurant (web)
- Revendication : code de vérification au numéro **public** du restaurant + vérification du n° IDE dans le registre UID (service public gratuit, 20 requêtes/min) / Zefix (accès gratuit sur demande à l'Office fédéral de la justice). ⚠️ Beaucoup de restaurants ont un numéro fixe : un SMS ne suffit pas ; il faut un appel vocal automatique ou, au lancement, **un appel manuel de ta part** (voir §13).
- Tableau de bord : infos, photos (avec accord sur les droits), carte et prix, horaires, offres, réponses aux avis, demandes de modification sensibles.
- Statistiques + récapitulatif mensuel par e-mail.

### Phase 5 — Paiements Stripe (web), offres, sponsorisé
- Revérification des règles des stores.
- Plans configurables par l'admin (Gratuit, Premium ~25 CHF, Partenaire fondateur limité à 10, mise en avant accueil limitée), Stripe Checkout + Customer Portal + webhook, TVA désactivable, factures.
- Emplacements sponsorisés étiquetés, classement séparé, tests d'intégrité complets.

### Phase 6 — Préparation à la publication
- EAS Build, TestFlight, Google Play test fermé.
- ⚠️ **Google Play** : un compte développeur *personnel* créé après novembre 2023 doit faire un **test fermé avec au moins 12 testeurs pendant 14 jours** avant de pouvoir publier. Un compte *organisation* en est dispensé mais demande un numéro D-U-N-S. À anticiper (il faut trouver 12 testeurs).
- Étiquettes de confidentialité Apple, formulaire « Sécurité des données » Google, captures d'écran, textes des fiches store, checklist complète de soumission.

### Phase 7 — Traductions
- Anglais, arabe, espagnol, allemand ; vérification de l'affichage arabe ; pages web traduites et indexables ; versions traduites des textes juridiques à faire relire.

---

## 11. Ce que je peux vérifier moi-même, et ce que tu devras tester

Je travaille dans un conteneur Linux dans le cloud : je peux écrire et tester la logique, la base de données, le site web (y compris des captures d'écran). **Je ne peux pas lancer un simulateur iOS.** Pour l'app mobile, tu la testeras sur ton téléphone via une *development build* (EAS Build dans le cloud, ou Xcode si tu as un Mac). Je te donnerai les commandes exactes.

## 12. Coûts estimés (ordre de grandeur, à vérifier au moment de souscrire)

| Poste | Coût |
|---|---|
| Apple Developer Program | ~99 USD / an |
| Google Play Console | 25 USD une fois |
| Supabase | gratuit en développement ; plan Pro ~25 USD / mois en production (le plan gratuit met le projet en pause après une semaine d'inactivité) |
| Hébergement web | Vercel Pro ~20 USD / mois, ou Cloudflare (gratuit) |
| Tuiles de carte swisstopo / géocodage geo.admin.ch | gratuit (attribution obligatoire) |
| E-mails | gratuit à ~15 CHF / mois selon le volume |
| Stripe | pas d'abonnement ; commission par paiement + frais Stripe Billing |
| Nom de domaine | ~15–30 CHF / an |
| EAS Build (Expo) | gratuit avec un nombre limité de builds par mois |

---

## 13. Décisions à prendre maintenant

1. **Nom de l'app et identifiant** : l'identifiant de l'app (ex. `ch.monappli.app`) est **définitif** une fois publié. Je peux travailler avec le nom de code `halal-romandie` et ne figer l'identifiant qu'en phase 6. D'accord ?
2. **Périmètre des apps mobiles** : 100 % clients, aucun espace restaurateur ni lien vers celui-ci (recommandé), ou ajouter plus tard dans l'app des fonctions restaurateur **gratuites** (répondre aux avis), avec un petit risque face à Apple ?
3. **Hébergement du site web** : Vercel Pro (~20 USD/mois, le plus simple avec Next.js) ou Cloudflare (gratuit, un peu plus de configuration) ?
4. **Région Supabase** : Zurich (recommandé) ou Francfort ?
5. **Vérification des revendications au lancement** : appel manuel de ta part au numéro public + vérification IDE automatique (gratuit, recommandé pour les 10 premiers restaurants), ou code automatique par SMS/appel vocal dès la phase 4 (service payant) ?
6. **Dépôt** : j'ai créé la branche `halal-romandie` **sans historique commun** avec le reste du dépôt (le dépôt contient un projet sans rapport, le tuteur de maths ; repartir d'une branche vide donne une racine propre au monorepo). À terme, je te conseille un **dépôt GitHub dédié** à ce projet (plus clair pour la CI, les secrets et les déploiements) ; je peux t'y aider quand tu veux.
