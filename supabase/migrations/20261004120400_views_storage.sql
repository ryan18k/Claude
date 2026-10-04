-- =============================================================================
-- 5. Vues de lecture et stockage des fichiers
-- =============================================================================

-- Vue « carte de restaurant » : tout ce qu'il faut pour la liste et la carte,
-- en une seule requête. « security_invoker » : la vue applique la RLS de la
-- personne qui la consulte (un visiteur ne voit que les restaurants publiés).
--
-- ⚠️ Volontairement AUCUNE colonne liée aux abonnements ou aux paiements :
-- l'affichage organique ne peut pas en dépendre (un test le vérifie).
create view public.restaurant_cards with (security_invoker = true) as
select
  r.id,
  r.slug,
  r.name,
  r.street,
  r.postal_code,
  r.city,
  r.canton,
  r.phone,
  r.website,
  r.price_range,
  r.is_fictional,
  extensions.st_y(r.location::extensions.geometry) as lat,
  extensions.st_x(r.location::extensions.geometry) as lng,
  coalesce(
    array(select rc.cuisine_slug from public.restaurant_cuisines rc where rc.restaurant_id = r.id order by rc.cuisine_slug),
    '{}'
  ) as cuisines,
  -- Profil halal
  coalesce(hp.meat, 'unknown') as meat,
  mc.name as meat_certifier_name,
  coalesce(hp.scope, 'unknown') as scope,
  coalesce(hp.alcohol_served, 'unknown') as alcohol_served,
  coalesce(hp.pork_served, 'unknown') as pork_served,
  -- Dernière vérification
  coalesce(v.level, 'unverified') as verification_level,
  v.method as verification_method,
  v.verified_at,
  v.source_description,
  vc.name as certifier_name,
  v.certificate_expires_at,
  coalesce(v.has_evidence, false) as has_evidence,
  v.next_review_due_at,
  -- Notes
  rr.rating_average,
  coalesce(rr.rating_count, 0) as rating_count,
  -- Horaires (au format attendu par packages/core)
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'isoWeekday', oh.iso_weekday,
      'opens', to_char(oh.opens, 'HH24:MI'),
      'closes', to_char(oh.closes, 'HH24:MI')
    ) order by oh.iso_weekday, oh.opens)
    from public.opening_hours oh where oh.restaurant_id = r.id
  ), '[]'::jsonb) as opening_periods,
  coalesce((
    select jsonb_agg(jsonb_build_object('date', d.date, 'closed', d.closed, 'ranges', d.ranges) order by d.date)
    from (
      select sh.date,
             bool_or(sh.closed) as closed,
             coalesce(jsonb_agg(jsonb_build_object(
               'opens', to_char(sh.opens, 'HH24:MI'),
               'closes', to_char(sh.closes, 'HH24:MI')
             ) order by sh.opens) filter (where not sh.closed), '[]'::jsonb) as ranges
      from public.special_hours sh
      where sh.restaurant_id = r.id and sh.date between current_date - 1 and current_date + 90
      group by sh.date
    ) d
  ), '[]'::jsonb) as special_days
from public.restaurants r
left join public.halal_profiles hp on hp.restaurant_id = r.id
left join public.certifiers mc on mc.id = hp.meat_certifier_id
left join lateral (
  select * from public.halal_verifications hv
  where hv.restaurant_id = r.id
  order by hv.created_at desc, hv.id desc
  limit 1
) v on true
left join public.certifiers vc on vc.id = v.certifier_id
left join public.restaurant_ratings rr on rr.restaurant_id = r.id;

revoke all on public.restaurant_cards from anon, authenticated;
grant select on public.restaurant_cards to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Stockage des fichiers (Supabase Storage)
-- -----------------------------------------------------------------------------
-- - restaurant-photos : PUBLIC en lecture ; chemin = <id du restaurant>/<fichier>
-- - verification-evidence : PRIVÉ (preuves de vérification), admins uniquement
-- Convertit un texte en uuid, ou null s'il n'est pas valide (au lieu d'une erreur).
create function private.try_uuid(value text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true),
       ('verification-evidence', 'verification-evidence', false)
on conflict (id) do nothing;

create policy "photos : envoi par un admin ou un membre du restaurant" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'restaurant-photos'
    and private.can_edit_restaurant(private.try_uuid((storage.foldername(name))[1]))
  );
create policy "photos : suppression par un admin ou un membre du restaurant" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'restaurant-photos'
    and private.can_edit_restaurant(private.try_uuid((storage.foldername(name))[1]))
  );
create policy "preuves : admins uniquement" on storage.objects
  for all to authenticated
  using (bucket_id = 'verification-evidence' and private.is_admin())
  with check (bucket_id = 'verification-evidence' and private.is_admin());

-- Fonctions définies dans les migrations précédentes et celle-ci.
grant execute on all functions in schema private to anon, authenticated, service_role;
