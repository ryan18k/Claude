-- =============================================================================
-- 4. Règles d'intégrité (déclencheurs) et fonctions métier
-- =============================================================================
-- La RLS dit QUI peut toucher une ligne. Les déclencheurs ci-dessous ajoutent
-- des règles plus fines, qui s'appliquent même au rôle service_role (Edge
-- Functions, webhook Stripe), car la RLS ne s'applique pas à lui :
--
--   • un paiement n'achète que de la visibilité : seul un ADMIN peut modifier
--     le statut halal ; personne d'autre que l'auteur ne modifie un avis ;
--   • un restaurant ne modifie pas lui-même ses champs sensibles ;
--   • protections anti-faux avis.
--
-- Les fonctions de contrôle sont « SECURITY INVOKER » (par défaut) : elles
-- voient le VRAI rôle de l'appelant (current_user). Elles s'appuient sur de
-- petites fonctions « SECURITY DEFINER » pour lire ce que l'appelant n'a pas
-- le droit de lire lui-même (date de création du compte, etc.).

-- -----------------------------------------------------------------------------
-- Fonctions d'aide
-- -----------------------------------------------------------------------------

-- Réglage numérique de app_settings, avec une valeur par défaut.
create function private.setting_int(setting_key text, fallback integer) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::integer from public.app_settings where key = setting_key), fallback);
$$;

create function private.account_created_at(target uuid) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select created_at from auth.users where id = target;
$$;

create function private.account_email_confirmed(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select email_confirmed_at is not null from auth.users where id = target), false);
$$;

create function private.count_reviews_by_author_since(target uuid, since timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.reviews where author_id = target and created_at >= since;
$$;

create function private.count_reviews_on_restaurant_since(target uuid, since timestamptz) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.reviews where restaurant_id = target and created_at >= since;
$$;

create function private.is_published_restaurant(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.restaurants where id = target and status = 'published');
$$;

-- Restaurant d'un avis PUBLIÉ (null sinon) : on ne répond qu'à un avis publié.
create function private.published_review_restaurant(target uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select restaurant_id from public.reviews where id = target and status = 'published';
$$;

-- Erreur « accès refusé » (code SQL 42501), avec un message en français.
create function private.deny(message text) returns void
language plpgsql set search_path = '' as $$
begin
  raise exception using errcode = '42501', message = message;
end;
$$;

grant execute on all functions in schema private to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- -----------------------------------------------------------------------------
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- STATUT HALAL : écriture réservée aux admins (même pour service_role)
-- -----------------------------------------------------------------------------
create function private.guard_halal_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not (private.is_privileged_session() or private.is_admin()) then
    perform private.deny('Seul un administrateur peut modifier le statut halal ou sa vérification.');
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger a_guard_halal_write before insert or update or delete on public.halal_profiles
  for each row execute function private.guard_halal_write();
create trigger a_guard_halal_write before insert or update or delete on public.halal_verifications
  for each row execute function private.guard_halal_write();
create trigger a_guard_halal_write before insert or update or delete on public.halal_verification_evidence
  for each row execute function private.guard_halal_write();

-- Qui a modifié le statut halal / qui a vérifié.
create function private.stamp_halal_author() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'halal_profiles' then
    new.updated_by := coalesce((select auth.uid()), new.updated_by);
  elsif tg_table_name = 'halal_verifications' and tg_op = 'INSERT' then
    new.verified_by := coalesce(new.verified_by, (select auth.uid()));
  end if;
  return new;
end;
$$;
create trigger b_stamp_author before insert or update on public.halal_profiles
  for each row execute function private.stamp_halal_author();
create trigger b_stamp_author before insert on public.halal_verifications
  for each row execute function private.stamp_halal_author();

-- has_evidence est TOUJOURS recalculé : impossible de le mettre à « vrai » à la main.
create function private.compute_has_evidence() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.has_evidence := exists (
    select 1 from public.halal_verification_evidence where verification_id = new.id
  );
  return new;
end;
$$;
create trigger c_compute_has_evidence before insert or update on public.halal_verifications
  for each row execute function private.compute_has_evidence();

-- Quand une preuve est ajoutée ou supprimée, on rafraîchit la vérification.
create function private.refresh_has_evidence() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.halal_verifications
    set has_evidence = has_evidence -- le déclencheur c_compute_has_evidence recalcule la valeur
  where id = coalesce(new.verification_id, old.verification_id);
  return null;
end;
$$;
create trigger refresh_has_evidence after insert or update or delete on public.halal_verification_evidence
  for each row execute function private.refresh_has_evidence();

-- « Certifié par un organisme » exige une preuve. Contrôle DIFFÉRÉ à la fin de la
-- transaction, pour pouvoir créer la vérification puis sa preuve.
create function private.check_certified_has_evidence() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.halal_verifications
    where id = new.id and level = 'certified_by_body' and not has_evidence
  ) then
    raise exception using errcode = '23514',
      message = 'Une vérification « certifié par un organisme » doit avoir une preuve enregistrée.';
  end if;
  return null;
end;
$$;
create constraint trigger certified_requires_evidence
  after insert or update on public.halal_verifications
  deferrable initially deferred
  for each row execute function private.check_certified_has_evidence();

-- -----------------------------------------------------------------------------
-- RESTAURANTS : un membre ne modifie pas les champs sensibles
-- -----------------------------------------------------------------------------
create function private.guard_restaurant_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.is_privileged_session() or private.is_admin() then
    return new;
  end if;
  if (new.slug, new.name, new.street, new.postal_code, new.city, new.canton, new.location::text,
      new.uid_number, new.status, new.is_fictional, new.created_by)
     is distinct from
     (old.slug, old.name, old.street, old.postal_code, old.city, old.canton, old.location::text,
      old.uid_number, old.status, old.is_fictional, old.created_by) then
    perform private.deny('Le nom, l''adresse et le statut passent par une demande de modification validée par l''équipe.');
  end if;
  return new;
end;
$$;
create trigger a_guard_restaurant_update before update on public.restaurants
  for each row execute function private.guard_restaurant_update();

-- -----------------------------------------------------------------------------
-- PHOTOS : un membre ne peut pas s'auto-approuver
-- -----------------------------------------------------------------------------
create function private.guard_photo_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.is_privileged_session() or private.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.uploaded_by := (select auth.uid());
    new.reviewed_by := null;
    new.reviewed_at := null;
  elsif (new.status, new.source, new.storage_path, new.restaurant_id, new.rights_confirmed,
         new.rights_statement_version, new.uploaded_by, new.reviewed_by, new.reviewed_at)
        is distinct from
        (old.status, old.source, old.storage_path, old.restaurant_id, old.rights_confirmed,
         old.rights_statement_version, old.uploaded_by, old.reviewed_by, old.reviewed_at) then
    perform private.deny('Seule l''équipe peut valider une photo.');
  end if;
  return new;
end;
$$;
create trigger a_guard_photo_write before insert or update on public.photos
  for each row execute function private.guard_photo_write();

-- -----------------------------------------------------------------------------
-- AVIS : protections anti-faux avis et intégrité
-- -----------------------------------------------------------------------------
create function private.reviews_before_insert() returns trigger
language plpgsql set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  min_age_hours integer := private.setting_int('reviews.min_account_age_hours', 24);
  max_per_day integer := private.setting_int('reviews.max_per_day', 3);
  burst_window_hours integer := private.setting_int('reviews.burst_window_hours', 24);
  burst_threshold integer := private.setting_int('reviews.burst_threshold', 5);
begin
  if private.is_privileged_session() then
    return new; -- données de test
  end if;
  if uid is null or new.author_id is distinct from uid then
    perform private.deny('Un avis doit être publié depuis le compte de son auteur.');
  end if;
  if not private.is_published_restaurant(new.restaurant_id) then
    perform private.deny('Ce restaurant n''est pas publié.');
  end if;
  if private.is_restaurant_member(new.restaurant_id) then
    perform private.deny('Un membre d''un restaurant ne peut pas noter son propre établissement.');
  end if;
  if not private.account_email_confirmed(uid) then
    perform private.deny('Confirmez votre adresse e-mail avant de publier un avis.');
  end if;
  if private.count_reviews_by_author_since(uid, now() - interval '24 hours') >= max_per_day then
    perform private.deny('Limite d''avis atteinte pour aujourd''hui. Réessayez demain.');
  end if;

  -- Le statut est TOUJOURS décidé ici, jamais par le client.
  new.status := 'published';
  new.moderation_note := '';
  -- Compte récent : l'avis attend la modération.
  if private.account_created_at(uid) > now() - make_interval(hours => min_age_hours) then
    new.status := 'pending';
    new.moderation_note := 'auto: compte récent';
  end if;
  -- Rafale d'avis sur le même restaurant : tout nouvel avis attend la modération.
  if private.count_reviews_on_restaurant_since(new.restaurant_id, now() - make_interval(hours => burst_window_hours)) >= burst_threshold then
    new.status := 'pending';
    new.moderation_note := 'auto: rafale d''avis';
  end if;
  return new;
end;
$$;
create trigger a_reviews_before_insert before insert on public.reviews
  for each row execute function private.reviews_before_insert();

create function private.reviews_before_update() returns trigger
language plpgsql set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
begin
  if private.is_privileged_session() then
    return new;
  end if;
  if (new.author_id, new.restaurant_id, new.created_at) is distinct from (old.author_id, old.restaurant_id, old.created_at) then
    perform private.deny('L''auteur, le restaurant et la date d''un avis ne peuvent pas changer.');
  end if;
  -- Contenu (note, texte) : uniquement l'auteur, jamais le restaurant, un admin ou le serveur.
  if (new.rating, new.body) is distinct from (old.rating, old.body) then
    if uid is null or uid <> old.author_id then
      perform private.deny('Seul l''auteur peut modifier la note ou le texte d''un avis.');
    end if;
    if old.status in ('hidden', 'removed') then
      perform private.deny('Cet avis a été retiré par la modération et ne peut plus être modifié.');
    end if;
  end if;
  -- Statut : uniquement la modération.
  if (new.status, new.moderation_note) is distinct from (old.status, old.moderation_note)
     and not private.is_moderator() then
    perform private.deny('Seule la modération peut changer le statut d''un avis.');
  end if;
  return new;
end;
$$;
create trigger a_reviews_before_update before update on public.reviews
  for each row execute function private.reviews_before_update();

-- Moyenne des notes publiées, recalculée à chaque changement.
create function private.refresh_restaurant_rating() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target uuid := coalesce(new.restaurant_id, old.restaurant_id);
begin
  insert into public.restaurant_ratings (restaurant_id, rating_average, rating_count)
  select target, round(avg(rating)::numeric, 2), count(*)
  from public.reviews where restaurant_id = target and status = 'published'
  on conflict (restaurant_id) do update
    set rating_average = excluded.rating_average, rating_count = excluded.rating_count;
  return null;
end;
$$;
create trigger refresh_restaurant_rating after insert or update or delete on public.reviews
  for each row execute function private.refresh_restaurant_rating();

-- Confirmations contradictoires interdites (« pas d'alcool » ET « alcool vu »).
create function private.check_review_confirmations() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.claim = 'no_alcohol_confirmed' and exists (
        select 1 from public.review_confirmations where review_id = new.review_id and claim = 'alcohol_seen'))
     or (new.claim = 'alcohol_seen' and exists (
        select 1 from public.review_confirmations where review_id = new.review_id and claim = 'no_alcohol_confirmed')) then
    raise exception using errcode = '23514', message = 'Confirmations contradictoires sur l''alcool.';
  end if;
  return new;
end;
$$;
create trigger a_check_review_confirmations before insert on public.review_confirmations
  for each row execute function private.check_review_confirmations();

-- Réponse du restaurant : rattachée automatiquement au bon restaurant.
create function private.review_responses_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if private.is_privileged_session() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.restaurant_id := private.published_review_restaurant(new.review_id);
    if new.restaurant_id is null then
      perform private.deny('On ne peut répondre qu''à un avis publié.');
    end if;
    new.author_id := (select auth.uid());
    new.status := 'published';
  else
    if (new.review_id, new.restaurant_id, new.author_id) is distinct from (old.review_id, old.restaurant_id, old.author_id) then
      perform private.deny('Une réponse ne peut pas changer d''avis ni d''auteur.');
    end if;
    if new.status is distinct from old.status and not private.is_moderator() then
      perform private.deny('Seule la modération peut changer le statut d''une réponse.');
    end if;
    if new.body is distinct from old.body and not private.is_restaurant_member(old.restaurant_id) then
      perform private.deny('Seul le restaurant peut modifier sa réponse.');
    end if;
  end if;
  return new;
end;
$$;
create trigger a_review_responses_before_write before insert or update on public.review_responses
  for each row execute function private.review_responses_before_write();

-- -----------------------------------------------------------------------------
-- DEMANDES DE MODIFICATION sensibles
-- -----------------------------------------------------------------------------
create function private.change_requests_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  allowed text[];
  extra text[];
begin
  if tg_op = 'INSERT' then
    if not private.is_privileged_session() then
      new.requested_by := (select auth.uid());
      new.status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.review_note := '';
    end if;
    allowed := case new.kind
      when 'halal_profile' then array['meat', 'meat_certifier_id', 'scope', 'alcohol_served', 'pork_served']
      when 'restaurant_identity' then array['name', 'street', 'postal_code', 'city', 'canton', 'lat', 'lng']
    end;
    select array_agg(k) into extra from jsonb_object_keys(new.payload) as k where k <> all (allowed);
    if extra is not null then
      raise exception using errcode = '22023', message = 'Champs non autorisés dans la demande : ' || array_to_string(extra, ', ');
    end if;
  elsif (new.restaurant_id, new.requested_by, new.kind, new.payload, new.created_at)
        is distinct from (old.restaurant_id, old.requested_by, old.kind, old.payload, old.created_at) then
    perform private.deny('Le contenu d''une demande ne peut pas être modifié après envoi.');
  end if;
  return new;
end;
$$;
create trigger a_change_requests_before_write before insert or update on public.change_requests
  for each row execute function private.change_requests_before_write();

-- Approuver une demande (admin). Appel depuis l'app : supabase.rpc('approve_change_request', …)
create function public.approve_change_request(request_id uuid, note text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare
  req public.change_requests;
begin
  if not private.is_admin() then
    perform private.deny('Réservé aux administrateurs.');
  end if;
  select * into req from public.change_requests where id = request_id for update;
  if not found or req.status <> 'pending' then
    raise exception using errcode = '22023', message = 'Demande introuvable ou déjà traitée.';
  end if;

  if req.kind = 'halal_profile' then
    insert into public.halal_profiles (restaurant_id) values (req.restaurant_id) on conflict do nothing;
    update public.halal_profiles set
      meat = coalesce((req.payload ->> 'meat')::public.meat_status, meat),
      meat_certifier_id = case when req.payload ? 'meat_certifier_id'
                               then (req.payload ->> 'meat_certifier_id')::uuid else meat_certifier_id end,
      scope = coalesce((req.payload ->> 'scope')::public.halal_scope, scope),
      alcohol_served = coalesce((req.payload ->> 'alcohol_served')::public.tri_state, alcohol_served),
      pork_served = coalesce((req.payload ->> 'pork_served')::public.tri_state, pork_served)
    where restaurant_id = req.restaurant_id;
    -- Une information DÉCLARÉE par le restaurant n'a pas été vérifiée sur place :
    -- le statut repasse en « non vérifié » jusqu'à la prochaine vérification de l'équipe.
    insert into public.halal_verifications (restaurant_id, level, source_description)
    values (req.restaurant_id, 'unverified',
            'Modification déclarée par le restaurant, en attente de vérification');
  elsif req.kind = 'restaurant_identity' then
    update public.restaurants set
      name = coalesce(req.payload ->> 'name', name),
      street = coalesce(req.payload ->> 'street', street),
      postal_code = coalesce(req.payload ->> 'postal_code', postal_code),
      city = coalesce(req.payload ->> 'city', city),
      canton = coalesce(req.payload ->> 'canton', canton),
      location = case when req.payload ? 'lat' and req.payload ? 'lng'
        then extensions.st_setsrid(extensions.st_makepoint((req.payload ->> 'lng')::float8, (req.payload ->> 'lat')::float8), 4326)::extensions.geography
        else location end
    where id = req.restaurant_id;
  end if;

  update public.change_requests
    set status = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = coalesce(note, '')
  where id = request_id;
end;
$$;

create function public.reject_change_request(request_id uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    perform private.deny('Réservé aux administrateurs.');
  end if;
  update public.change_requests
    set status = 'rejected', reviewed_by = (select auth.uid()), reviewed_at = now(), review_note = coalesce(note, '')
  where id = request_id and status = 'pending';
  if not found then
    raise exception using errcode = '22023', message = 'Demande introuvable ou déjà traitée.';
  end if;
end;
$$;

revoke execute on function public.approve_change_request(uuid, text) from public, anon;
revoke execute on function public.reject_change_request(uuid, text) from public, anon;
grant execute on function public.approve_change_request(uuid, text) to authenticated;
grant execute on function public.reject_change_request(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- JOURNAL D'AUDIT
-- -----------------------------------------------------------------------------
create function private.write_audit(
  p_action text, p_table text, p_row_pk text, p_old jsonb, p_new jsonb, p_db_role text
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, db_role, action, table_name, row_pk, old_data, new_data)
  values ((select auth.uid()), p_db_role, p_action, p_table, p_row_pk, p_old, p_new);
$$;

-- SECURITY INVOKER : current_user est bien le rôle de l'appelant.
create function private.audit_row() returns trigger
language plpgsql set search_path = '' as $$
declare
  row_data jsonb := to_jsonb(coalesce(new, old));
begin
  perform private.write_audit(
    tg_op,
    tg_table_name,
    coalesce(row_data ->> 'id', row_data ->> 'review_id', row_data ->> 'restaurant_id',
             row_data ->> 'user_id', row_data ->> 'code', row_data ->> 'key'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    current_user
  );
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'restaurants', 'halal_profiles', 'halal_verifications', 'halal_verification_evidence',
    'reviews', 'review_responses', 'reports', 'photos', 'change_requests', 'restaurant_members',
    'restaurant_claims', 'subscriptions', 'sponsored_placements', 'plans', 'app_settings', 'user_roles'
  ] loop
    execute format(
      'create trigger z_audit after insert or update or delete on public.%I
         for each row execute function private.audit_row()', t);
  end loop;
end $$;
