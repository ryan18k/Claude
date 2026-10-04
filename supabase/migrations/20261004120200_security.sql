-- =============================================================================
-- 3. Sécurité : fonctions d'aide, droits d'accès (GRANT) et Row Level Security
-- =============================================================================
-- Principe : l'app mobile utilise une clé PUBLIQUE ("anon"). N'importe qui peut
-- donc envoyer des requêtes à l'API. Ce sont les règles ci-dessous (RLS) qui
-- décident, ligne par ligne, qui peut lire ou modifier quoi.
--
-- Rôles PostgreSQL utilisés par Supabase :
-- - anon          : visiteur non connecté ;
-- - authenticated : utilisateur connecté (auth.uid() = son identifiant) ;
-- - service_role  : Edge Functions côté serveur (contourne la RLS, mais PAS
--                   les déclencheurs d'intégrité de la migration suivante).

-- Schéma « private » : fonctions internes, NON exposées par l'API.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Session « de confiance » : migrations, données de test, éditeur SQL du
-- tableau de bord, ou fonction SECURITY DEFINER qui a déjà vérifié les droits.
create function private.is_privileged_session() returns boolean
language sql stable set search_path = '' as $$
  select current_user in ('postgres', 'supabase_admin');
$$;

create function private.has_role(wanted public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = wanted
  );
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('admin');
$$;

-- Les admins sont aussi modérateurs.
create function private.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.has_role('admin') or private.has_role('moderator');
$$;

create function private.is_restaurant_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.restaurant_members
    where restaurant_id = target and user_id = (select auth.uid())
  );
$$;

-- Un restaurant est visible s'il est publié, ou pour ses membres et les admins.
create function private.can_view_restaurant(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.restaurants where id = target and status = 'published')
      or private.is_restaurant_member(target)
      or private.is_admin();
$$;

create function private.can_edit_restaurant(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.is_restaurant_member(target);
$$;

-- Le restaurant a-t-il un abonnement actif donnant accès à une fonction (ex. 'offers') ?
create function private.has_paid_feature(target uuid, feature text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.code = s.plan_code
    where s.restaurant_id = target
      and s.status in ('trialing', 'active')
      and coalesce((p.features ->> feature)::boolean, false)
  );
$$;

-- Le pseudonyme d'un utilisateur n'est public que s'il a au moins un avis publié.
create function private.has_published_review(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.reviews where author_id = target and status = 'published');
$$;

create function private.is_blocked_by_me(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_blocks
    where blocker_id = (select auth.uid()) and blocked_id = target
  );
$$;

grant execute on all functions in schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Droits de base (GRANT). On part de zéro puis on accorde le strict nécessaire :
-- un visiteur anonyme ne peut JAMAIS écrire.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to authenticated, service_role;

-- Lecture publique (filtrée ensuite par la RLS).
grant select on
  public.profiles, public.cuisines, public.restaurants, public.restaurant_cuisines,
  public.opening_hours, public.special_hours, public.certifiers, public.halal_profiles,
  public.halal_verifications, public.menu_sections, public.menu_items, public.photos,
  public.offers, public.reviews, public.review_confirmations, public.review_responses,
  public.restaurant_ratings, public.plans, public.sponsored_placements, public.app_settings
to anon, authenticated;

-- Lecture réservée aux utilisateurs connectés (filtrée par la RLS).
grant select on
  public.user_settings, public.user_roles, public.halal_verification_evidence,
  public.change_requests, public.reports, public.user_blocks, public.favorites,
  public.view_history, public.restaurant_members, public.restaurant_claims,
  public.subscriptions, public.restaurant_stats_daily, public.legal_acceptances,
  public.audit_log
to authenticated;

-- Écriture par les utilisateurs connectés (filtrée par la RLS et les déclencheurs).
grant insert, update, delete on
  public.user_roles, public.cuisines, public.restaurants, public.restaurant_cuisines,
  public.opening_hours, public.special_hours, public.certifiers, public.halal_profiles,
  public.halal_verifications, public.halal_verification_evidence, public.menu_sections,
  public.menu_items, public.photos, public.offers, public.reviews, public.review_confirmations,
  public.review_responses, public.user_blocks, public.favorites, public.view_history,
  public.restaurant_members, public.plans, public.sponsored_placements, public.app_settings
to authenticated;
grant update on public.profiles, public.user_settings, public.reports, public.restaurant_claims, public.change_requests to authenticated;
grant insert on public.reports, public.restaurant_claims, public.change_requests, public.legal_acceptances to authenticated;
-- Par défaut, Supabase donne TOUS les droits sur les nouvelles tables à anon et
-- authenticated. On retire ce comportement pour le rôle anon : une future table
-- ne sera jamais modifiable par un visiteur par oubli (un test le vérifie aussi).
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;

-- Volontairement AUCUN droit d'écriture via l'API sur : subscriptions,
-- restaurant_stats_daily, restaurant_ratings, audit_log (serveur/déclencheurs uniquement).

-- -----------------------------------------------------------------------------
-- Row Level Security : activée sur TOUTES les tables (un test le vérifie).
-- -----------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Utilisateurs -----------------------------------------------------------------
create policy "profil : le sien, ou celui d'un auteur d'avis publié" on public.profiles
  for select to anon, authenticated
  using (id = (select auth.uid()) or private.has_published_review(id));
create policy "profil : modifier le sien" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "réglages : les siens" on public.user_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "réglages : modifier les siens" on public.user_settings
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "rôles : les siens, ou tous pour un admin" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()) or private.is_admin());
create policy "rôles : gérés par un admin" on public.user_roles
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Référentiels publics ----------------------------------------------------------
create policy "cuisines : lecture publique" on public.cuisines
  for select to anon, authenticated using (true);
create policy "cuisines : gérées par un admin" on public.cuisines
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "organismes : lecture publique" on public.certifiers
  for select to anon, authenticated using (true);
create policy "organismes : gérés par un admin" on public.certifiers
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Restaurants --------------------------------------------------------------------
create policy "restaurants : publiés, ou membres et admins" on public.restaurants
  for select to anon, authenticated
  using (status = 'published' or private.is_restaurant_member(id) or private.is_admin());
create policy "restaurants : création par un admin" on public.restaurants
  for insert to authenticated with check (private.is_admin());
-- Les membres peuvent modifier les champs NON sensibles (contrôlé par déclencheur).
create policy "restaurants : modification par un admin ou un membre" on public.restaurants
  for update to authenticated
  using (private.can_edit_restaurant(id)) with check (private.can_edit_restaurant(id));
create policy "restaurants : suppression par un admin" on public.restaurants
  for delete to authenticated using (private.is_admin());

-- Tables « enfants » d'un restaurant : visibles si le restaurant l'est,
-- modifiables par un admin ou un membre du restaurant.
do $$
declare t text;
begin
  foreach t in array array['restaurant_cuisines', 'opening_hours', 'special_hours', 'menu_sections', 'menu_items'] loop
    execute format(
      'create policy "lecture si le restaurant est visible" on public.%I
         for select to anon, authenticated using (private.can_view_restaurant(restaurant_id))', t);
    execute format(
      'create policy "écriture par un admin ou un membre" on public.%I
         for all to authenticated
         using (private.can_edit_restaurant(restaurant_id))
         with check (private.can_edit_restaurant(restaurant_id))', t);
  end loop;
end $$;

-- Statut halal : lecture publique, écriture ADMIN UNIQUEMENT --------------------
create policy "halal : lecture si le restaurant est visible" on public.halal_profiles
  for select to anon, authenticated using (private.can_view_restaurant(restaurant_id));
create policy "halal : écriture par un admin uniquement" on public.halal_profiles
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "vérifications : lecture si le restaurant est visible" on public.halal_verifications
  for select to anon, authenticated using (private.can_view_restaurant(restaurant_id));
create policy "vérifications : écriture par un admin uniquement" on public.halal_verifications
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "preuves : admin uniquement" on public.halal_verification_evidence
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Photos ----------------------------------------------------------------------------
create policy "photos : approuvées et visibles, ou membres et admins" on public.photos
  for select to anon, authenticated
  using (
    (status = 'approved' and private.can_view_restaurant(restaurant_id))
    or private.can_edit_restaurant(restaurant_id)
  );
create policy "photos : ajout par un admin, ou par un membre (en attente)" on public.photos
  for insert to authenticated
  with check (
    private.is_admin()
    or (private.is_restaurant_member(restaurant_id) and source = 'restaurant' and status = 'pending')
  );
create policy "photos : modification par un admin ou un membre" on public.photos
  for update to authenticated
  using (private.can_edit_restaurant(restaurant_id)) with check (private.can_edit_restaurant(restaurant_id));
create policy "photos : suppression par un admin ou un membre" on public.photos
  for delete to authenticated using (private.can_edit_restaurant(restaurant_id));

-- Offres : fonction payante (visibilité), réservée aux restaurants abonnés ------
create policy "offres : publiées et visibles, ou membres et admins" on public.offers
  for select to anon, authenticated
  using (
    (status = 'published' and private.can_view_restaurant(restaurant_id))
    or private.can_edit_restaurant(restaurant_id)
  );
create policy "offres : gestion par un admin ou un membre abonné" on public.offers
  for all to authenticated
  using (private.is_admin() or (private.is_restaurant_member(restaurant_id) and private.has_paid_feature(restaurant_id, 'offers')))
  with check (private.is_admin() or (private.is_restaurant_member(restaurant_id) and private.has_paid_feature(restaurant_id, 'offers')));

-- Demandes de modification sensibles ---------------------------------------------
create policy "demandes : visibles par le demandeur, les membres et les admins" on public.change_requests
  for select to authenticated
  using (requested_by = (select auth.uid()) or private.can_edit_restaurant(restaurant_id));
create policy "demandes : création par un membre" on public.change_requests
  for insert to authenticated
  with check (requested_by = (select auth.uid()) and private.is_restaurant_member(restaurant_id) and status = 'pending');
create policy "demandes : décision par un admin" on public.change_requests
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

-- Avis ---------------------------------------------------------------------------------
create policy "avis : publiés, les siens, ou modération" on public.reviews
  for select to anon, authenticated
  using (
    (status = 'published' and not private.is_blocked_by_me(author_id))
    or author_id = (select auth.uid())
    or private.is_moderator()
  );
-- Les contrôles anti-abus (e-mail confirmé, âge du compte, limites) sont dans un déclencheur.
create policy "avis : création par l'auteur connecté" on public.reviews
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy "avis : modification par l'auteur ou la modération" on public.reviews
  for update to authenticated
  using (author_id = (select auth.uid()) or private.is_moderator())
  with check (author_id = (select auth.uid()) or private.is_moderator());
create policy "avis : suppression par l'auteur ou un admin" on public.reviews
  for delete to authenticated using (author_id = (select auth.uid()) or private.is_admin());

create policy "confirmations : visibles avec l'avis" on public.review_confirmations
  for select to anon, authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id));
create policy "confirmations : gérées par l'auteur de l'avis" on public.review_confirmations
  for all to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid())))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid())));

create policy "réponses : publiées, ou membres et modération" on public.review_responses
  for select to anon, authenticated
  using (status = 'published' or private.can_edit_restaurant(restaurant_id) or private.is_moderator());
create policy "réponses : création par un membre du restaurant" on public.review_responses
  for insert to authenticated
  with check (private.is_restaurant_member(restaurant_id) and author_id = (select auth.uid()));
create policy "réponses : modification par un membre ou la modération" on public.review_responses
  for update to authenticated
  using (private.is_restaurant_member(restaurant_id) or private.is_moderator())
  with check (private.is_restaurant_member(restaurant_id) or private.is_moderator());
create policy "réponses : suppression par un membre ou un admin" on public.review_responses
  for delete to authenticated using (private.is_restaurant_member(restaurant_id) or private.is_admin());

create policy "notes moyennes : lecture si le restaurant est visible" on public.restaurant_ratings
  for select to anon, authenticated using (private.can_view_restaurant(restaurant_id));

-- Signalements, blocages, favoris, historique ------------------------------------------
create policy "signalements : création par un utilisateur connecté" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()) and status = 'open');
create policy "signalements : les siens, ou modération" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()) or private.is_moderator());
create policy "signalements : traitement par la modération" on public.reports
  for update to authenticated using (private.is_moderator()) with check (private.is_moderator());

create policy "blocages : les siens" on public.user_blocks
  for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

create policy "favoris : les siens" on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "historique : le sien" on public.view_history
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Espace restaurant ---------------------------------------------------------------------
create policy "membres : les siens, ceux de son restaurant, ou admin" on public.restaurant_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.can_edit_restaurant(restaurant_id));
create policy "membres : gérés par un admin" on public.restaurant_members
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "revendications : les siennes, ou admin" on public.restaurant_claims
  for select to authenticated using (user_id = (select auth.uid()) or private.is_admin());
create policy "revendications : création par l'utilisateur connecté" on public.restaurant_claims
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
create policy "revendications : décision par un admin" on public.restaurant_claims
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "offres payantes : actives publiques, toutes pour un admin" on public.plans
  for select to anon, authenticated using (is_active or private.is_admin());
create policy "offres payantes : gérées par un admin" on public.plans
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "abonnements : membres du restaurant et admins" on public.subscriptions
  for select to authenticated using (private.can_edit_restaurant(restaurant_id));

create policy "sponsorisés : actifs publics, tous pour membres et admins" on public.sponsored_placements
  for select to anon, authenticated
  using ((starts_at <= now() and ends_at > now()) or private.can_edit_restaurant(restaurant_id));
create policy "emplacements sponsorisés : gérés par un admin" on public.sponsored_placements
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "statistiques : membres du restaurant et admins" on public.restaurant_stats_daily
  for select to authenticated using (private.can_edit_restaurant(restaurant_id));

create policy "réglages : publics, ou tous pour un admin" on public.app_settings
  for select to anon, authenticated using (is_public or private.is_admin());
create policy "réglages : gérés par un admin" on public.app_settings
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy "acceptations : les siennes" on public.legal_acceptances
  for select to authenticated using (user_id = (select auth.uid()));
create policy "acceptations : enregistrer les siennes" on public.legal_acceptances
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "audit : lecture par un admin" on public.audit_log
  for select to authenticated using (private.is_admin());
