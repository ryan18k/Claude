-- Tests : RLS activée partout, accès en lecture selon le rôle.
-- Lancer avec `pnpm db:test` (Supabase local démarré). Tout est annulé à la fin (rollback).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

-- Aides de test -------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated, service_role;
create function tests.create_user(email text, confirmed boolean default true, age interval default interval '30 days')
returns uuid language sql as $$
  insert into auth.users (id, email, email_confirmed_at, created_at)
  values (gen_random_uuid(), email, case when confirmed then now() end, now() - age)
  returning id;
$$;
create function tests.login_as(target uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', target, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;
create function tests.login_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;
grant execute on all functions in schema tests to anon, authenticated, service_role;

create temporary table ids (name text primary key, id uuid);
grant select on ids to anon, authenticated, service_role;
insert into ids values
  ('alice', tests.create_user('alice@exemple.test')),
  ('bob', tests.create_user('bob@exemple.test'));
insert into public.favorites (user_id, restaurant_id)
select (select id from ids where name = 'alice'), id from public.restaurants where slug = 'fictif-le-cedre';

-- Structure -------------------------------------------------------------------------
select is(
  array(select tablename::text from pg_tables where schemaname = 'public' and not rowsecurity order by 1),
  '{}'::text[],
  'La RLS est activée sur toutes les tables du schéma public'
);

select is(
  array(select t.tablename::text from pg_tables t
        where t.schemaname = 'public'
          and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = t.tablename)
        order by 1),
  '{}'::text[],
  'Chaque table a au moins une règle d''accès'
);

select is(
  array(select distinct table_name::text from information_schema.role_table_grants
        where grantee = 'anon' and table_schema = 'public'
          and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
        order by 1),
  '{}'::text[],
  'Un visiteur anonyme n''a aucun droit d''écriture'
);

select is(
  array(select column_name::text from information_schema.columns
        where table_schema = 'public' and table_name = 'restaurant_cards'
          and column_name ~ '(plan|subscri|sponsor|stripe|boost|paid|premium)'),
  '{}'::text[],
  'La vue restaurant_cards ne contient aucune donnée de paiement'
);

-- Visiteur anonyme --------------------------------------------------------------------
create temporary table expected as
  select count(*) as published from public.restaurants where status = 'published';
grant select on expected to anon, authenticated;
select tests.login_as_anon();

select is(
  (select count(*) from public.restaurant_cards),
  (select published from expected),
  'Un visiteur voit tous les restaurants publiés'
);
select is(
  (select count(*) from public.restaurant_cards where slug = 'fictif-restaurant-en-preparation'),
  0::bigint,
  'Un visiteur ne voit pas un restaurant en brouillon'
);
select throws_ok(
  $$ select * from public.halal_verification_evidence $$,
  '42501', null,
  'Un visiteur ne peut pas lire les preuves de vérification'
);
select throws_ok(
  $$ select * from public.audit_log $$,
  '42501', null,
  'Un visiteur ne peut pas lire le journal d''audit'
);
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating) values (gen_random_uuid(), gen_random_uuid(), 5) $$,
  '42501', null,
  'Un visiteur ne peut pas publier d''avis'
);

-- Utilisateurs connectés ------------------------------------------------------------------
select tests.login_as((select id from ids where name = 'bob'));
select is(
  (select count(*) from public.favorites),
  0::bigint,
  'Bob ne voit pas les favoris d''Alice'
);
select is(
  (select count(*) from public.user_settings),
  1::bigint,
  'Bob ne voit que ses propres réglages'
);
select is(
  (select count(*) from public.halal_verification_evidence),
  0::bigint,
  'Un utilisateur connecté (non admin) ne voit aucune preuve'
);

select * from finish();
rollback;
