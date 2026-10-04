-- Tests : le statut halal ne peut être modifié QUE par un admin.
-- Ni un restaurant (même Premium), ni le serveur (webhook Stripe = service_role).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(22);

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
  ('owner', tests.create_user('patron@exemple.test')),
  ('restaurant', (select id from public.restaurants where slug = 'fictif-kebab-du-lac'));
insert into public.user_roles (user_id, role) values ((select id from ids where name = 'admin'), 'admin');
insert into public.restaurant_members (restaurant_id, user_id)
values ((select id from ids where name = 'restaurant'), (select id from ids where name = 'owner'));
-- Le restaurant a un abonnement Premium actif : cela ne doit RIEN changer au statut halal.
insert into public.subscriptions (restaurant_id, plan_code, status)
values ((select id from ids where name = 'restaurant'), 'premium', 'active');

-- 1. Le restaurant (Premium) ne peut pas modifier son statut halal -------------------
select tests.login_as((select id from ids where name = 'owner'));

select results_eq(
  $$ with u as (update public.halal_profiles set alcohol_served = 'no', scope = 'fully_halal'
                where restaurant_id = (select id from ids where name = 'restaurant') returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'Restaurant Premium : la modification directe du profil halal n''a aucun effet'
);
select throws_ok(
  $$ insert into public.halal_verifications (restaurant_id, level, method, verified_at)
     values ((select id from ids where name = 'restaurant'), 'team_verified', 'on_site_visit', current_date) $$,
  '42501', null,
  'Restaurant Premium : impossible de créer une vérification'
);
select results_eq(
  $$ with u as (update public.halal_verifications set level = 'certified_by_body'
                where restaurant_id = (select id from ids where name = 'restaurant') returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'Restaurant Premium : impossible de changer son niveau de vérification'
);
select throws_ok(
  $$ select public.approve_change_request(gen_random_uuid()) $$,
  '42501', null,
  'Restaurant : impossible d''approuver une demande'
);
select throws_ok(
  $$ update public.restaurants set name = '[FICTIF] Nouveau nom'
     where id = (select id from ids where name = 'restaurant') $$,
  '42501', null,
  'Restaurant : le nom passe par une demande de modification'
);
select lives_ok(
  $$ update public.restaurants set description = 'Nouvelle description fictive'
     where id = (select id from ids where name = 'restaurant') $$,
  'Restaurant : la description (non sensible) est modifiable directement'
);

-- 2. Demande de modification : le seul chemin pour un restaurant ------------------------
select throws_ok(
  $$ insert into public.change_requests (restaurant_id, requested_by, kind, payload)
     values ((select id from ids where name = 'restaurant'), (select id from ids where name = 'owner'),
             'halal_profile', '{"level": "certified_by_body"}') $$,
  '22023', null,
  'Une demande ne peut pas contenir le niveau de vérification'
);
select lives_ok(
  $$ insert into public.change_requests (restaurant_id, requested_by, kind, payload, status)
     values ((select id from ids where name = 'restaurant'), (select id from ids where name = 'owner'),
             'halal_profile', '{"alcohol_served": "yes"}', 'approved') $$,
  'Le restaurant peut déposer une demande de modification'
);
reset role;
select is(
  (select status::text from public.change_requests where restaurant_id = (select id from ids where name = 'restaurant')),
  'pending',
  'La demande est toujours créée « en attente », même si le client envoie « approuvée »'
);

-- 3. Le serveur (service_role, ex. webhook Stripe) ne peut pas toucher au statut halal ------
select tests.login_as_service();
select throws_ok(
  $$ update public.halal_profiles set alcohol_served = 'no' where restaurant_id = (select id from ids where name = 'restaurant') $$,
  '42501', null,
  'service_role : modification du profil halal refusée'
);
select throws_ok(
  $$ insert into public.halal_verifications (restaurant_id, level, method, verified_at)
     values ((select id from ids where name = 'restaurant'), 'team_verified', 'on_site_visit', current_date) $$,
  '42501', null,
  'service_role : création de vérification refusée'
);
select throws_ok(
  $$ delete from public.halal_verification_evidence $$,
  '42501', null,
  'service_role : suppression de preuves refusée'
);
reset role;

-- 4. L'admin peut tout faire, et tout est tracé ---------------------------------------------
select tests.login_as((select id from ids where name = 'admin'));
select lives_ok(
  $$ select public.approve_change_request(
       (select id from public.change_requests where restaurant_id = (select id from ids where name = 'restaurant')),
       'Vérifié par téléphone') $$,
  'Admin : approbation de la demande'
);
select is(
  (select alcohol_served::text from public.halal_profiles where restaurant_id = (select id from ids where name = 'restaurant')),
  'yes',
  'La demande approuvée est appliquée'
);
select is(
  (select verification_level::text from public.restaurant_cards where id = (select id from ids where name = 'restaurant')),
  'unverified',
  'Une information déclarée par le restaurant repasse en « non vérifié » jusqu''à la prochaine vérification'
);
select ok(
  exists (select 1 from public.audit_log
          where table_name = 'halal_profiles' and action = 'UPDATE'
            and actor_id = (select id from ids where name = 'admin')),
  'La modification du statut halal est inscrite au journal d''audit avec son auteur'
);
select throws_ok(
  $$ update public.halal_profiles set meat = 'certified', meat_certifier_id = null
     where restaurant_id = (select id from ids where name = 'restaurant') $$,
  '23514', null,
  '« Viande certifiée » sans organisme est refusé, même pour un admin'
);
select throws_ok(
  $$ do $d$ begin
       insert into public.halal_verifications (restaurant_id, level, method, verified_at, certifier_id, certificate_expires_at)
       values ((select id from ids where name = 'restaurant'), 'certified_by_body', 'certificate', current_date,
               '00000000-0000-4000-a000-00000000000a', current_date + 365);
       set constraints all immediate;
     end $d$ $$,
  '23514', null,
  '« Certifié par un organisme » sans preuve est refusé'
);
select results_eq(
  $$ with u as (update public.halal_verifications set has_evidence = true
                where restaurant_id = (select id from ids where name = 'restaurant') and level = 'unverified'
                returning has_evidence)
     select bool_or(has_evidence) from u $$,
  $$ values (false) $$,
  'has_evidence ne peut pas être forcé à « vrai » sans preuve réelle'
);
reset role;

-- 5. Photos : un restaurant ne peut pas s'auto-approuver ---------------------------------------
select tests.login_as((select id from ids where name = 'owner'));
select lives_ok(
  $$ insert into public.photos (restaurant_id, storage_path, source, rights_confirmed, rights_statement_version, status)
     values ((select id from ids where name = 'restaurant'), 'test/a.jpg', 'restaurant', true, '2026-10', 'approved') $$,
  'Restaurant : une photo peut être proposée'
);
select is(
  (select status::text from public.photos where storage_path = 'test/a.jpg'),
  'pending',
  'Restaurant : la photo reste « en attente » même si le client demande « approuvée »'
);
select throws_ok(
  $$ update public.photos set status = 'approved' where storage_path = 'test/a.jpg' $$,
  '42501', null,
  'Restaurant : impossible d''approuver sa propre photo'
);
reset role;

select * from finish();
rollback;
