# Architecture

Ce document explique **comment le projet est construit et pourquoi**. Il est mis à jour à chaque phase.

## Vue d'ensemble

```
          ┌───────────────────────────────┐
          │ apps/mobile (Expo)            │   écrans, navigation, affichage
          └──────┬───────────────┬────────┘
                 │ utilise       │ utilise
   ┌─────────────▼───┐   ┌───────▼─────────────┐
   │ packages/core   │   │ packages/i18n       │  logique métier pure │ traductions
   └─────────────▲───┘   └─────────────────────┘
                 │ utilise
   ┌─────────────┴─────────┐
   │ packages/supabase     │  lecture + validation des données (ou mode démo)
   └─────────────┬─────────┘
                 │ HTTPS, clé publique « anon » (+ jeton utilisateur en phase 3)
   ┌─────────────▼──────────────────────────────────────────────┐
   │ Supabase : PostgreSQL + PostGIS                             │
   │  • RLS : qui peut lire / écrire chaque ligne                │
   │  • déclencheurs d'intégrité : règles qui s'appliquent même  │
   │    au serveur (webhook Stripe) et aux admins si nécessaire  │
   │  • journal d'audit                                          │
   └─────────────────────────────────────────────────────────────┘
```

## Pourquoi les règles importantes sont dans la base de données

L'app mobile contient une clé **publique** : n'importe qui peut l'extraire et envoyer ses propres requêtes à l'API. Une règle écrite seulement dans l'app peut donc être contournée. La base de données est le seul point par lequel **toutes** les écritures passent ; c'est là que vivent les règles non négociables :

| Règle                                                                              | Où                                                                 | Testée par                                            |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| Seul un admin modifie le statut halal (même pas le serveur / webhook)              | trigger `a_guard_halal_write` + RLS                                | `supabase/tests/database/02_halal_integrity.test.sql` |
| « Viande certifiée » exige un organisme                                            | contrainte `certified_meat_requires_certifier`                     | `02_halal_integrity`                                  |
| « Certifié par un organisme » exige une preuve                                     | contrainte différée `certified_requires_evidence`                  | `02_halal_integrity`                                  |
| Revérification au moins annuelle                                                   | contrainte `review_at_least_yearly` + calcul `effectiveHalalLevel` | `02`, `halal-status.test.ts`                          |
| Un restaurant ne modifie pas son nom, son adresse ou son statut                    | trigger `a_guard_restaurant_update`                                | `02_halal_integrity`                                  |
| Une modification halal déclarée par un restaurant repasse en « non vérifié »       | fonction `approve_change_request`                                  | `02_halal_integrity`                                  |
| Personne d'autre que l'auteur ne modifie le contenu d'un avis                      | trigger `a_reviews_before_update`                                  | `03_reviews_integrity`                                |
| Anti-faux avis (e-mail confirmé, compte récent → modération, 3 avis/jour, rafales) | trigger `a_reviews_before_insert`                                  | `03_reviews_integrity`                                |
| Un membre ne note pas son propre restaurant                                        | trigger `a_reviews_before_insert`                                  | `03_reviews_integrity`                                |
| Un paiement ne change ni le statut halal ni les notes                              | séparation des tables + triggers                                   | `04_payments_integrity`                               |
| RLS activée sur toutes les tables ; aucun droit d'écriture pour les visiteurs      | migration `security`                                               | `01_rls_and_access`                                   |

La logique d'**affichage** (libellés, classement, filtres, horaires) est dans `packages/core`, pure et testée, partagée par toutes les apps :

| Règle                                                           | Où                 | Testée par                                  |
| --------------------------------------------------------------- | ------------------ | ------------------------------------------- |
| Jamais « certifié » sans organisme, preuve et date valides      | `halal-status.ts`  | `halal-status.test.ts` (3 888 combinaisons) |
| Classement organique sans aucune donnée de paiement             | `ranking.ts`       | `integrity-ranking.test.ts`                 |
| Sponsorisé séparé, limité, toujours étiqueté                    | `sponsored.ts`     | `integrity-ranking.test.ts`                 |
| « Ouvert maintenant » en heure suisse (été/hiver, après minuit) | `opening-hours.ts` | `opening-hours.test.ts`                     |

## Rôles PostgreSQL

| Rôle            | Qui                                      | Ce qu'il peut faire                                                                                                           |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `anon`          | visiteur non connecté                    | lire les restaurants publiés ; **aucune écriture**                                                                            |
| `authenticated` | utilisateur connecté                     | ses favoris, ses avis… ; les droits admin/modérateur/membre d'un restaurant dépendent de `user_roles` et `restaurant_members` |
| `service_role`  | Edge Functions (serveur)                 | contourne la RLS, **mais pas** les déclencheurs d'intégrité                                                                   |
| `postgres`      | migrations, données de test, éditeur SQL | tout (session de confiance)                                                                                                   |

## Modèle de données

Les tables et leurs règles sont décrites dans les migrations, commentées en français :

1. `supabase/migrations/…_types.sql` : types énumérés (identiques à `packages/core/src/domain.ts`)
2. `…_tables.sql` : toutes les tables et contraintes
3. `…_security.sql` : fonctions d'aide, droits (GRANT) et règles RLS
4. `…_integrity.sql` : déclencheurs d'intégrité, fonctions métier, journal d'audit
5. `…_views_storage.sql` : vue `restaurant_cards`, stockage des photos et des preuves

**Ajouter une modification de la base** : créer un nouveau fichier avec `pnpm exec supabase migration new nom_du_changement`. On ne modifie jamais une migration déjà appliquée en production.

## Traductions

- Catalogues : `packages/i18n/messages/<langue>.json`, format ICU (`{variable}`, `{count, plural, …}`).
- Le français contient toutes les clés ; une clé manquante dans une autre langue retombe sur le français.
- Les tests vérifient : syntaxe ICU valide, pas de clé inconnue, mêmes variables qu'en français, et que toutes les clés produites par `describeHalalStatus` existent.
- Langues activées dans l'app : `ENABLED_LOCALES` (français seul jusqu'à la phase 7).

## Choix et écarts par rapport au plan initial

- `packages/config` (prévu au plan) n'a pas été créé : les configurations communes (TypeScript, ESLint, Prettier) sont à la racine, c'est plus simple. Les couleurs sont dans `apps/mobile/src/theme.ts` tant qu'il n'y a qu'une app.
- Les types de la base ne sont pas encore générés automatiquement : les lignes lues sont **validées à l'exécution** par zod (`packages/supabase/src/restaurant-cards.ts`). On ajoutera `pnpm db:types` quand le schéma sera plus stable.
- L'aperçu web de l'app mobile (`pnpm --filter @swisshalal/mobile export:web`) ne sert qu'à faire des captures d'écran : ce n'est pas un site public.
