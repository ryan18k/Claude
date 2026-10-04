# Swiss Halal

Annuaire des restaurants halal de Suisse romande (Riviera–Lausanne d'abord, puis Genève et le reste de la Romandie), avec des informations **vérifiées et datées** : viande certifiée ou non, alcool servi ou non, établissement 100 % halal ou options halal.

- App mobile **iOS + Android** (Expo / React Native), gratuite et sans fonction payante pour les clients.
- Base de données **Supabase** (PostgreSQL + PostGIS), sécurisée par des règles d'accès sur chaque table.
- Langues : français (référence), puis anglais, arabe, espagnol, allemand.

> **Statut : phase 2 en cours** (carte, recherche, filtres). Voir [`docs/phases/phase-2/RAPPORT.md`](docs/phases/phase-2/RAPPORT.md) et, pour les fondations, [`docs/phases/phase-1/RAPPORT.md`](docs/phases/phase-1/RAPPORT.md).
> Plan complet : [`docs/PLAN.md`](docs/PLAN.md) · Décisions : [`docs/DECISIONS.md`](docs/DECISIONS.md) · Obligations légales : [`docs/legal/OBLIGATIONS.md`](docs/legal/OBLIGATIONS.md)

---

## Lancer le projet de zéro

### 1. Installer les outils (une seule fois)

| Outil                             | Pourquoi                                  | Installation                                     |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| **Git**                           | récupérer le code                         | <https://git-scm.com>                            |
| **Node.js 22**                    | exécuter JavaScript sur ton ordinateur    | <https://nodejs.org> (version « LTS » 22)        |
| **pnpm**                          | installer les dépendances du monorepo     | dans un terminal : `corepack enable`             |
| **Expo Go** (sur ton téléphone)   | essayer l'app sans la compiler            | App Store / Google Play                          |
| **Docker Desktop** _(facultatif)_ | faire tourner Supabase sur ton ordinateur | <https://www.docker.com/products/docker-desktop> |

### 2. Récupérer le code et installer les dépendances

```bash
git clone https://github.com/ryan18k/Claude.git swiss-halal
cd swiss-halal
git checkout halal-romandie
corepack enable
pnpm install
```

### 3. Lancer l'app en mode démonstration (sans serveur)

```bash
pnpm dev:mobile
```

Un QR code s'affiche : scanne-le avec **Expo Go** (Android) ou l'appareil photo (iPhone). Ton téléphone et ton ordinateur doivent être sur le même Wi-Fi ; sinon, lance `pnpm --filter @swisshalal/mobile start --tunnel`.

Sans configuration, l'app utilise des **données 100 % fictives** intégrées (un bandeau jaune le signale).

> À partir de la phase 2 (carte), Expo Go ne suffira plus : il faudra une _development build_ (instructions ajoutées à ce moment-là).

### 4. Vérifier que tout fonctionne

```bash
pnpm test        # tests de la logique métier, des traductions, des contrastes de couleurs
pnpm lint        # recherche d'erreurs probables
pnpm typecheck   # vérification des types TypeScript
```

### 5. (Facultatif) Base de données locale avec Supabase

Nécessite **Docker Desktop** démarré.

```bash
pnpm db:start    # démarre Supabase en local, applique les migrations et les données fictives
pnpm db:test     # lance les tests de sécurité de la base (RLS, règles d'intégrité)
pnpm db:reset    # repart de zéro (efface la base locale, réapplique tout)
pnpm db:stop     # arrête Supabase
```

`pnpm db:start` affiche une **API URL** et une **anon key**. Pour que l'app lise cette base :

```bash
cp apps/mobile/.env.example apps/mobile/.env
# puis renseigne EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans apps/mobile/.env
```

Sur un téléphone, remplace `127.0.0.1` par l'adresse IP locale de ton ordinateur.
Studio (interface d'administration de la base) : <http://127.0.0.1:54323>.

**Donner le rôle admin à un compte** (dans le SQL Editor de Studio, après avoir créé l'utilisateur dans _Authentication_) :

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'ton-adresse@exemple.ch';
```

---

## Organisation du dépôt

```
apps/mobile/          App Expo (iOS + Android) — écrans dans src/app/
packages/core/        Logique métier pure : horaires, statut halal, classement, filtres (+ tests)
packages/i18n/        Traductions fr / en / ar / es / de (format ICU)
packages/supabase/    Lecture des données + validation + données de démonstration
supabase/migrations/  Schéma SQL, sécurité (RLS), règles d'intégrité
supabase/seed.sql     Données de test 100 % fictives
supabase/tests/       Tests pgTAP de la base (sécurité et intégrité)
docs/                 Plan, architecture, décisions, juridique, rapports de phase
```

Détails : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Règles du projet

- **Aucun secret dans le dépôt** : seuls les fichiers `.env.example` sont commités. Les clés secrètes (Stripe, clé `service_role`…) vont dans les secrets Supabase ou de la CI.
- **Un paiement n'achète que de la visibilité** : le statut halal, la vérification, les notes et les avis ne dépendent jamais d'un abonnement. Des tests le garantissent (`packages/core/src/__tests__/integrity-ranking.test.ts`, `supabase/tests/database/02…04`).
- **Jamais « certifié » sans source** : toute l'interface passe par `describeHalalStatus` (`packages/core/src/halal-status.ts`).
- **Données fictives clairement marquées** : préfixe « [FICTIF] », `is_fictional = true`.
- Chaque évolution qui touche une obligation légale met à jour [`docs/legal/OBLIGATIONS.md`](docs/legal/OBLIGATIONS.md).
