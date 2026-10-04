-- Tests : un paiement n'achète QUE de la visibilité.
-- Un abonnement et un emplacement sponsorisé ne changent ni le statut halal,
-- ni le niveau de vérification, ni les notes. Les prix sont gérés par l'admin.
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
create function tests.login_as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role": "service_role"}', true);
  perform set_config('role', 'service_role', true);
end;
$$;
grant execute on all functions in schema tests to anon, authenticated, service_role;

create temporary table ids (name text primary key, id uuid);
grant select on ids to anon, authenticated, service_role;
insert into ids values
  ('admin', tests.create_user('admin@exemple.test')),
  ('patron', tests.create_user('patron@exemple.test')),
  ('restaurant', (select id from public.restaurants where slug = 'fictif-grill-du-port'));
insert into public.user_roles (user_id, role) values ((select id from ids where name = 'admin'), 'admin');
insert into public.restaurant_members (restaurant_id, user_id)
values ((select id from ids where name = 'restaurant'), (select id from ids where name = 'patron'));

-- Photo « avant paiement » de tout ce qui n'est pas de la visibilité.
create temporary table before_payment as
  select meat, meat_certifier_name, scope, alcohol_served, pork_served, verification_level,
         verified_at, certifier_name, certificate_expires_at, rating_average, rating_count
  from public.restaurant_cards where id = (select id from ids where name = 'restaurant');

-- 1. Le restaurant ne peut pas s'attribuer lui-même un abonnement ou un emplacement ------------
select tests.login_as((select id from ids where name = 'patron'));
select throws_ok(
  $$ insert into public.subscriptions (restaurant_id, plan_code, status)
     values ((select id from ids where name = 'restaurant'), 'premium', 'active') $$,
  '42501', null,
  'Un restaurant ne peut pas créer lui-même un abonnement'
);
select throws_ok(
  $$ insert into public.sponsored_placements (restaurant_id, kind, starts_at, ends_at)
     values ((select id from ids where name = 'restaurant'), 'home', now(), now() + interval '30 days') $$,
  '42501', null,
  'Un restaurant ne peut pas s''attribuer un emplacement sponsorisé'
);
select throws_ok(
  $$ insert into public.offers (restaurant_id, title, starts_on, ends_on)
     values ((select id from ids where name = 'restaurant'), 'Offre fictive', current_date, current_date + 7) $$,
  '42501', null,
  'Sans abonnement, le restaurant ne peut pas publier d''offre'
);
select results_eq(
  $$ with u as (update public.plans set price_cents = 0 where code = 'premium' returning 1) select count(*)::int from u $$,
  $$ values (0) $$,
  'Un restaurant ne peut pas modifier les prix'
);

-- 2. Paiement reçu : le webhook Stripe (service_role) active l'abonnement -------------------
select tests.login_as_service();
select lives_ok(
  $$ insert into public.subscriptions (restaurant_id, plan_code, status, stripe_subscription_id)
     values ((select id from ids where name = 'restaurant'), 'premium', 'active', 'sub_FICTIF_123') $$,
  'Le webhook peut enregistrer un abonnement'
);
select lives_ok(
  $$ insert into public.sponsored_placements (restaurant_id, kind, starts_at, ends_at)
     values ((select id from ids where name = 'restaurant'), 'search', now() - interval '1 hour', now() + interval '30 days') $$,
  'Le webhook peut créer un emplacement sponsorisé'
);
select throws_ok(
  $$ update public.halal_verifications set level = 'certified_by_body'
     where restaurant_id = (select id from ids where name = 'restaurant') $$,
  '42501', null,
  'Le webhook ne peut pas modifier le niveau de vérification'
);
reset role;

-- 3. Rien d'autre que la visibilité n'a changé --------------------------------------------
select results_eq(
  $$ select meat, meat_certifier_name, scope, alcohol_served, pork_served, verification_level,
            verified_at, certifier_name, certificate_expires_at, rating_average, rating_count
     from public.restaurant_cards where id = (select id from ids where name = 'restaurant') $$,
  $$ select * from before_payment $$,
  'Après paiement : statut halal, vérification et notes strictement identiques'
);

-- 4. Les fonctions de visibilité payées sont bien débloquées ------------------------------
select tests.login_as((select id from ids where name = 'patron'));
select lives_ok(
  $$ insert into public.offers (restaurant_id, title, starts_on, ends_on)
     values ((select id from ids where name = 'restaurant'), 'Menu fictif du Ramadan', current_date, current_date + 30) $$,
  'Avec Premium, le restaurant peut publier une offre'
);
select is(
  (select count(*) from public.sponsored_placements where restaurant_id = (select id from ids where name = 'restaurant')),
  1::bigint,
  'L''emplacement sponsorisé actif est visible'
);

-- 5. Les prix sont configurables par l'admin -------------------------------------------------
select tests.login_as((select id from ids where name = 'admin'));
select lives_ok(
  $$ update public.plans set price_cents = 2900 where code = 'premium' $$,
  'L''admin peut modifier un prix'
);
reset role;
select ok(
  exists (select 1 from public.audit_log where table_name = 'plans' and action = 'UPDATE'
          and actor_id = (select id from ids where name = 'admin')),
  'Le changement de prix est inscrit au journal d''audit'
);

select * from finish();
rollback;
