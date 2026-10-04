-- =============================================================================
-- 2. Tables
-- =============================================================================
-- Conventions :
-- - identifiants : uuid générés par la base ;
-- - montants : en CENTIMES de CHF (entiers) ;
-- - dates « calendrier » : type date ; instants : timestamptz (avec fuseau) ;
-- - les règles de cohérence simples sont des contraintes CHECK : elles
--   s'appliquent quoi qu'il arrive, même en cas de bug dans une app.

-- Met à jour automatiquement la colonne updated_at.
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Utilisateurs
-- -----------------------------------------------------------------------------

-- Profil PUBLIC : seul le pseudonyme, visible à côté des avis publiés.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Réglages PRIVÉS. La langue préférée peut révéler une origine ou une religion :
-- elle n'est jamais publique.
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_locale text not null default 'fr' check (preferred_locale in ('fr', 'en', 'ar', 'es', 'de')),
  -- Mesure d'audience non essentielle : désactivée tant que l'utilisateur n'a pas accepté.
  analytics_consent boolean not null default false,
  analytics_consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role)
);

-- -----------------------------------------------------------------------------
-- Restaurants
-- -----------------------------------------------------------------------------

-- Types de cuisine. Les libellés sont dans les traductions (clé cuisine.<slug>).
create table public.cuisines (
  slug text primary key check (slug ~ '^[a-z][a-z0-9_]*$'),
  sort_order integer not null default 100
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  street text not null check (char_length(street) <= 120),
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  city text not null check (char_length(city) <= 80),
  -- Cantons romands (+ BE pour le Jura bernois).
  canton text not null check (canton in ('VD', 'GE', 'FR', 'NE', 'VS', 'JU', 'BE')),
  location extensions.geography (Point, 4326) not null,
  phone text check (phone is null or phone ~ '^\+[0-9]{8,15}$'),
  website text check (website is null or website ~ '^https://'),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  price_range smallint check (price_range between 1 and 4),
  -- Numéro IDE (registre UID), ex. CHE-123.456.789
  uid_number text check (uid_number is null or uid_number ~ '^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$'),
  status public.publication_status not null default 'draft',
  -- Données de démonstration : jamais en production.
  is_fictional boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index restaurants_location_idx on public.restaurants using gist (location);
create index restaurants_name_trgm_idx on public.restaurants using gin (name extensions.gin_trgm_ops);
create index restaurants_status_idx on public.restaurants (status);

create table public.restaurant_cuisines (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  cuisine_slug text not null references public.cuisines (slug) on update cascade,
  primary key (restaurant_id, cuisine_slug)
);

-- Horaires habituels. Si closes <= opens, la plage se termine le lendemain.
create table public.opening_hours (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  iso_weekday smallint not null check (iso_weekday between 1 and 7), -- 1 = lundi
  opens time not null,
  closes time not null
);
create index opening_hours_restaurant_idx on public.opening_hours (restaurant_id);

-- Horaires exceptionnels (jours fériés, Ramadan…) : remplacent l'horaire du jour.
create table public.special_hours (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  date date not null,
  closed boolean not null default false,
  opens time,
  closes time,
  note text not null default '' check (char_length(note) <= 200),
  check ((closed and opens is null and closes is null) or (not closed and opens is not null and closes is not null))
);
create index special_hours_restaurant_date_idx on public.special_hours (restaurant_id, date);

-- -----------------------------------------------------------------------------
-- Statut halal (écriture réservée aux admins, voir migration "integrity")
-- -----------------------------------------------------------------------------

-- Organismes de certification. Pas de colonne « logo » : on n'utilise
-- aucun logo sans autorisation écrite de l'organisme.
create table public.certifiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 120),
  website text check (website is null or website ~ '^https://'),
  country text not null default 'CH' check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);

create table public.halal_profiles (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  meat public.meat_status not null default 'unknown',
  meat_certifier_id uuid references public.certifiers (id),
  scope public.halal_scope not null default 'unknown',
  alcohol_served public.tri_state not null default 'unknown',
  pork_served public.tri_state not null default 'unknown',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  -- Règle légale : « viande certifiée » exige un organisme nommé.
  constraint certified_meat_requires_certifier check (meat <> 'certified' or meat_certifier_id is not null)
);

-- Historique des vérifications : la plus récente fait foi.
create table public.halal_verifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  level public.halal_level not null,
  method public.verification_method,
  verified_at date,
  -- Texte public décrivant la source (ex. « Visite sur place »).
  source_description text not null default '' check (char_length(source_description) <= 200),
  certifier_id uuid references public.certifiers (id),
  certificate_expires_at date,
  -- Mis à jour automatiquement quand une preuve est ajoutée/supprimée.
  has_evidence boolean not null default false,
  next_review_due_at date,
  verified_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint verified_requires_date_and_method
    check (level = 'unverified' or (verified_at is not null and method is not null)),
  constraint certified_requires_certifier_and_expiry
    check (level <> 'certified_by_body' or (certifier_id is not null and certificate_expires_at is not null)),
  -- Revérification au moins annuelle.
  constraint review_at_least_yearly
    check (next_review_due_at is null or verified_at is null or next_review_due_at <= verified_at + 365)
);
create index halal_verifications_restaurant_idx on public.halal_verifications (restaurant_id, created_at desc);

-- Preuves (photos, documents) : PRIVÉES, dans une table séparée lisible par les seuls admins.
create table public.halal_verification_evidence (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.halal_verifications (id) on delete cascade,
  storage_path text not null, -- chemin dans le bucket privé "verification-evidence"
  internal_notes text not null default '',
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index halal_evidence_verification_idx on public.halal_verification_evidence (verification_id);

-- -----------------------------------------------------------------------------
-- Carte, photos, offres
-- -----------------------------------------------------------------------------
create table public.menu_sections (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position integer not null default 0,
  unique (id, restaurant_id)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null,
  restaurant_id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  price_cents integer check (price_cents is null or price_cents between 0 and 100000),
  position integer not null default 0,
  is_available boolean not null default true,
  -- Garantit que le plat appartient bien à une section du MÊME restaurant.
  foreign key (section_id, restaurant_id) references public.menu_sections (id, restaurant_id) on delete cascade
);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  storage_path text not null unique, -- bucket public "restaurant-photos"
  source public.photo_source not null,
  -- La personne qui envoie la photo confirme détenir les droits (ou l'accord du restaurant).
  rights_confirmed boolean not null check (rights_confirmed),
  rights_statement_version text not null,
  alt_text text not null default '' check (char_length(alt_text) <= 200),
  status public.moderation_status not null default 'pending',
  position integer not null default 0,
  uploaded_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index photos_restaurant_idx on public.photos (restaurant_id);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 500),
  starts_on date not null,
  ends_on date not null,
  status public.publication_status not null default 'published',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index offers_restaurant_idx on public.offers (restaurant_id);

-- Demandes de modification SENSIBLES faites par un restaurant : validées par un admin.
create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('halal_profile', 'restaurant_identity')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  justification text not null default '' check (char_length(justification) <= 1000),
  status public.change_request_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '',
  created_at timestamptz not null default now()
);
create index change_requests_status_idx on public.change_requests (status, created_at);

-- -----------------------------------------------------------------------------
-- Communauté : avis, signalements, blocages, favoris, historique
-- -----------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  status public.review_status not null default 'pending',
  moderation_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, author_id) -- un avis par restaurant et par compte
);
create index reviews_restaurant_status_idx on public.reviews (restaurant_id, status);
create index reviews_author_created_idx on public.reviews (author_id, created_at);

create table public.review_confirmations (
  review_id uuid not null references public.reviews (id) on delete cascade,
  claim public.review_claim not null,
  primary key (review_id, claim)
);

-- Droit de réponse du restaurant (une réponse par avis).
create table public.review_responses (
  review_id uuid primary key references public.reviews (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Moyenne des notes publiées, tenue à jour par un déclencheur (lecture rapide).
create table public.restaurant_ratings (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  rating_average numeric(3, 2),
  rating_count integer not null default 0
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users (id) on delete set null,
  target_type public.report_target not null,
  target_id uuid not null,
  reason public.report_reason not null,
  details text not null default '' check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  handled_by uuid references auth.users (id) on delete set null,
  handled_at timestamptz,
  resolution_note text not null default '',
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at);

-- Blocage d'un utilisateur abusif (exigence App Store 1.2).
create table public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- Historique de consultation : une ligne par restaurant (la plus récente), purgé régulièrement.
create table public.view_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- -----------------------------------------------------------------------------
-- Espace restaurant, offres payantes, statistiques
-- -----------------------------------------------------------------------------
create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'owner',
  verified_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
create index restaurant_members_user_idx on public.restaurant_members (user_id);

create table public.restaurant_claims (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Au lancement : appel de l'admin au numéro PUBLIC du restaurant.
  method text not null default 'admin_phone_call' check (method in ('admin_phone_call', 'phone_code')),
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_role text not null default '' check (char_length(contact_role) <= 80),
  uid_number_provided text check (uid_number_provided is null or uid_number_provided ~ '^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$'),
  uid_check_result jsonb,
  status public.claim_status not null default 'pending',
  admin_note text not null default '',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index restaurant_claims_one_pending_idx
  on public.restaurant_claims (restaurant_id, user_id) where status = 'pending';

-- Offres et PRIX configurables par l'admin (jamais codés en dur dans les apps).
create table public.plans (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'CHF' check (currency = 'CHF'),
  billing_interval text not null check (billing_interval in ('month', 'year', 'one_time')),
  trial_days integer not null default 0 check (trial_days >= 0),
  -- Nombre maximal d'abonnés (ex. 10 partenaires fondateurs, emplacements d'accueil limités).
  max_subscribers integer check (max_subscribers is null or max_subscribers > 0),
  -- Fonctions de visibilité incluses (ex. {"search_boost": true, "offers": true}).
  features jsonb not null default '{}'::jsonb,
  stripe_price_id text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Écrit UNIQUEMENT par le webhook Stripe (clé de service).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  plan_code text not null references public.plans (code),
  status public.subscription_status not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_restaurant_idx on public.subscriptions (restaurant_id);

create table public.sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  kind public.placement_kind not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  position smallint not null default 1 check (position between 1 and 20),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index sponsored_placements_active_idx on public.sponsored_placements (kind, starts_at, ends_at);

-- Statistiques AGRÉGÉES par jour : aucun identifiant d'utilisateur ni d'appareil.
create table public.restaurant_stats_daily (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  day date not null,
  event public.stat_event not null,
  count integer not null default 0 check (count >= 0),
  primary key (restaurant_id, day, event)
);

-- Réglages modifiables par l'admin (TVA, limites anti-abus, nombre d'emplacements…).
create table public.app_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.]*$'),
  value jsonb not null,
  is_public boolean not null default false,
  description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- Acceptation des CGU / CGV / politique de confidentialité (version et date).
create table public.legal_acceptances (
  user_id uuid not null references auth.users (id) on delete cascade,
  document text not null check (document in ('cgu', 'cgv', 'privacy')),
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, document, version)
);

-- Journal d'audit : qui a modifié quoi, et quand (alimenté par déclencheurs).
create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  db_role text not null default current_user,
  action text not null,
  table_name text not null,
  row_pk text,
  old_data jsonb,
  new_data jsonb
);
create index audit_log_table_idx on public.audit_log (table_name, occurred_at desc);

-- Colonnes updated_at automatiques.
create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.restaurants for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.halal_profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.review_responses for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.plans for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();
