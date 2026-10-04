-- =============================================================================
-- 1. Extensions et types énumérés
-- =============================================================================
-- Les valeurs des types ENUM doivent rester IDENTIQUES à celles de
-- packages/core/src/domain.ts (le code TypeScript s'appuie dessus).

create extension if not exists postgis with schema extensions;   -- géolocalisation
create extension if not exists pg_trgm with schema extensions;   -- recherche approximative
create extension if not exists unaccent with schema extensions;  -- recherche sans accents

-- Statut halal --------------------------------------------------------------
create type public.halal_level as enum ('unverified', 'team_verified', 'certified_by_body');
create type public.meat_status as enum ('certified', 'supplier_declared', 'unknown', 'no_meat');
create type public.halal_scope as enum ('fully_halal', 'halal_options', 'unknown');
create type public.tri_state as enum ('yes', 'no', 'unknown');
create type public.verification_method as enum ('on_site_visit', 'phone_call', 'documents', 'certificate');

-- Rôles et publication --------------------------------------------------------
create type public.app_role as enum ('admin', 'moderator');
create type public.publication_status as enum ('draft', 'published', 'archived');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.photo_source as enum ('team', 'restaurant');

-- Avis et signalements ---------------------------------------------------------
create type public.review_status as enum ('pending', 'published', 'hidden', 'removed');
create type public.review_claim as enum (
  'certified_meat_confirmed', 'no_alcohol_confirmed', 'alcohol_seen', 'fully_halal_confirmed', 'pork_seen'
);
create type public.report_target as enum ('review', 'review_response', 'photo', 'restaurant');
create type public.report_reason as enum (
  'spam', 'fake_review', 'offensive', 'defamatory', 'illegal', 'incorrect_information', 'other'
);
create type public.report_status as enum ('open', 'resolved_removed', 'resolved_kept', 'dismissed');

-- Restaurants partenaires -----------------------------------------------------------
create type public.claim_status as enum ('pending', 'verified', 'rejected', 'expired');
create type public.member_role as enum ('owner', 'manager');
create type public.change_request_status as enum ('pending', 'approved', 'rejected');
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid'
);
create type public.placement_kind as enum ('search', 'home');
create type public.stat_event as enum (
  'profile_view', 'directions_click', 'call_click', 'website_click', 'search_impression'
);
