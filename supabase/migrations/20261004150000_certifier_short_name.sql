-- =============================================================================
-- 6. Nom court des organismes de certification
-- =============================================================================
-- L'interface est volontairement épurée : dans la liste et sur la carte, le badge
-- affiche « Certifié · <nom court> ». Le nom complet reste affiché sur la fiche.

alter table public.certifiers
  add column short_name text check (short_name is null or char_length(short_name) between 2 and 20);

-- La vue est recréée pour exposer les noms courts (mêmes règles d'accès qu'avant).
create or replace view public.restaurant_cards with (security_invoker = true) as
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
  ), '[]'::jsonb) as special_days,
  -- Ajouts de cette migration (une vue ne peut recevoir de colonnes qu'à la fin)
  mc.short_name as meat_certifier_short_name,
  vc.short_name as certifier_short_name
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
