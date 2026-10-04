-- Tests : avis — protections anti-faux avis, modération, et aucune influence
-- du restaurant (ni de son abonnement) sur les avis et les notes.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(24);

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
  ('ancien', tests.create_user('ancien@exemple.test')),
  ('nouveau', tests.create_user('nouveau@exemple.test', true, interval '1 hour')),
  ('non_confirme', tests.create_user('non-confirme@exemple.test', false)),
  ('patron', tests.create_user('patron@exemple.test')),
  ('moderateur', tests.create_user('moderateur@exemple.test')),
  ('bloqueur', tests.create_user('bloqueur@exemple.test')),
  ('r1', (select id from public.restaurants where slug = 'fictif-kebab-du-lac')),
  ('r2', (select id from public.restaurants where slug = 'fictif-le-cedre')),
  ('r3', (select id from public.restaurants where slug = 'fictif-le-riad')),
  ('r4', (select id from public.restaurants where slug = 'fictif-chicken-house')),
  ('rafale', (select id from public.restaurants where slug = 'fictif-beyrouth-express')),
  ('brouillon', (select id from public.restaurants where slug = 'fictif-restaurant-en-preparation'));
insert into public.user_roles (user_id, role) values ((select id from ids where name = 'moderateur'), 'moderator');
insert into public.restaurant_members (restaurant_id, user_id)
values ((select id from ids where name = 'r1'), (select id from ids where name = 'patron'));
insert into public.subscriptions (restaurant_id, plan_code, status)
values ((select id from ids where name = 'r1'), 'premium', 'active');
-- Comptes « anciens » pour le test de rafale.
insert into ids select 'rafale' || n, tests.create_user('rafale' || n || '@exemple.test') from generate_series(1, 6) n;

-- 1. Création d'un avis ----------------------------------------------------------------
select tests.login_as((select id from ids where name = 'ancien'));
select lives_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating, body, status)
     values ((select id from ids where name = 'r1'), (select id from ids where name = 'ancien'), 4, 'Très bon (fictif)', 'published') $$,
  'Un compte confirmé et ancien peut publier un avis'
);
select is(
  (select status::text from public.reviews where author_id = (select id from ids where name = 'ancien') and restaurant_id = (select id from ids where name = 'r1')),
  'published',
  'Compte ancien : avis publié directement'
);
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating)
     values ((select id from ids where name = 'r2'), (select id from ids where name = 'nouveau'), 5) $$,
  '42501', null,
  'Impossible de publier un avis au nom de quelqu''un d''autre'
);
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating)
     values ((select id from ids where name = 'brouillon'), (select id from ids where name = 'ancien'), 5) $$,
  '42501', null,
  'Impossible de noter un restaurant non publié'
);
select lives_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating) values
       ((select id from ids where name = 'r2'), (select id from ids where name = 'ancien'), 5),
       ((select id from ids where name = 'r3'), (select id from ids where name = 'ancien'), 3) $$,
  'Trois avis dans la journée : autorisé'
);
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating)
     values ((select id from ids where name = 'r4'), (select id from ids where name = 'ancien'), 5) $$,
  '42501', null,
  'Quatrième avis en 24 h : refusé (limite quotidienne)'
);

select tests.login_as((select id from ids where name = 'nouveau'));
select lives_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating, status)
     values ((select id from ids where name = 'r1'), (select id from ids where name = 'nouveau'), 5, 'published') $$,
  'Un compte récent peut écrire un avis'
);
select is(
  (select status::text from public.reviews where author_id = (select id from ids where name = 'nouveau')),
  'pending',
  'Compte récent : l''avis attend la modération, même si le client demande « publié »'
);
select throws_ok(
  $$ update public.reviews set status = 'published' where author_id = (select id from ids where name = 'nouveau') $$,
  '42501', null,
  'L''auteur ne peut pas publier lui-même un avis en attente'
);

select tests.login_as((select id from ids where name = 'non_confirme'));
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating)
     values ((select id from ids where name = 'r1'), (select id from ids where name = 'non_confirme'), 5) $$,
  '42501', null,
  'E-mail non confirmé : avis refusé'
);

-- 2. Le restaurant (même Premium) n'a aucune prise sur les avis --------------------------
select tests.login_as((select id from ids where name = 'patron'));
select throws_ok(
  $$ insert into public.reviews (restaurant_id, author_id, rating)
     values ((select id from ids where name = 'r1'), (select id from ids where name = 'patron'), 5) $$,
  '42501', null,
  'Un membre ne peut pas noter son propre restaurant'
);
select results_eq(
  $$ with u as (update public.reviews set rating = 5, status = 'hidden'
                where restaurant_id = (select id from ids where name = 'r1') returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$,
  'Restaurant Premium : impossible de modifier ou masquer un avis'
);
select results_eq(
  $$ with d as (delete from public.reviews where restaurant_id = (select id from ids where name = 'r1') returning 1)
     select count(*)::int from d $$,
  $$ values (0) $$,
  'Restaurant Premium : impossible de supprimer un avis'
);
select lives_ok(
  $$ insert into public.review_responses (review_id, body)
     values ((select id from public.reviews where author_id = (select id from ids where name = 'ancien') and restaurant_id = (select id from ids where name = 'r1')),
             'Merci pour votre avis (réponse fictive)') $$,
  'Le restaurant peut répondre à un avis publié'
);
select throws_ok(
  $$ insert into public.review_responses (review_id, body)
     values ((select id from public.reviews where author_id = (select id from ids where name = 'ancien') and restaurant_id = (select id from ids where name = 'r2')),
             'Réponse à un autre restaurant') $$,
  '42501', null,
  'Le restaurant ne peut pas répondre aux avis d''un autre restaurant'
);

-- 3. Serveur (webhook) et modération -------------------------------------------------------
select tests.login_as_service();
select throws_ok(
  $$ update public.reviews set rating = 5 where restaurant_id = (select id from ids where name = 'r1') $$,
  '42501', null,
  'service_role (ex. webhook Stripe) : impossible de modifier une note'
);

select tests.login_as((select id from ids where name = 'moderateur'));
select lives_ok(
  $$ update public.reviews set status = 'published' where author_id = (select id from ids where name = 'nouveau') $$,
  'La modération peut publier un avis en attente'
);
select throws_ok(
  $$ update public.reviews set rating = 1 where author_id = (select id from ids where name = 'nouveau') $$,
  '42501', null,
  'La modération ne peut pas modifier la note d''un avis'
);
select lives_ok(
  $$ update public.reviews set status = 'hidden', moderation_note = 'Test'
     where author_id = (select id from ids where name = 'ancien') and restaurant_id = (select id from ids where name = 'r3') $$,
  'La modération peut masquer un avis'
);
reset role;
select is(
  (select rating_count from public.restaurant_ratings where restaurant_id = (select id from ids where name = 'r3')),
  0,
  'Un avis masqué ne compte plus dans la note moyenne'
);
select is(
  (select (rating_average, rating_count)::text from public.restaurant_ratings where restaurant_id = (select id from ids where name = 'r1')),
  '(4.50,2)',
  'La note moyenne ne compte que les avis publiés (l''abonnement Premium n''y change rien)'
);

-- 4. Rafale d'avis sur un même restaurant -------------------------------------------------
do $$
declare n integer;
begin
  for n in 1..5 loop
    perform tests.login_as((select id from ids where name = 'rafale' || n));
    insert into public.reviews (restaurant_id, author_id, rating)
    values ((select id from ids where name = 'rafale'), (select id from ids where name = 'rafale' || n), 5);
  end loop;
  perform tests.login_as((select id from ids where name = 'rafale6'));
  insert into public.reviews (restaurant_id, author_id, rating)
  values ((select id from ids where name = 'rafale'), (select id from ids where name = 'rafale6'), 5);
end $$;
reset role;
select is(
  (select status::text from public.reviews where author_id = (select id from ids where name = 'rafale6')),
  'pending',
  'Rafale d''avis : le 6e avis en 24 h est mis en attente de modération'
);

-- 5. Blocage et confidentialité -------------------------------------------------------------
insert into public.user_blocks (blocker_id, blocked_id)
values ((select id from ids where name = 'bloqueur'), (select id from ids where name = 'ancien'));
select tests.login_as((select id from ids where name = 'bloqueur'));
select is(
  (select count(*) from public.reviews where author_id = (select id from ids where name = 'ancien')),
  0::bigint,
  'Les avis d''un utilisateur bloqué ne sont plus affichés'
);
select tests.login_as_anon();
select is(
  (select count(*) from public.profiles where id in ((select id from ids where name = 'ancien'), (select id from ids where name = 'non_confirme'))),
  1::bigint,
  'Seul le pseudonyme des auteurs d''avis publiés est visible publiquement'
);
reset role;

select * from finish();
rollback;
