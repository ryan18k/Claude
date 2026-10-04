-- =============================================================================
-- DONNÉES DE TEST — 100 % FICTIVES
-- =============================================================================
-- ⚠️ Aucun de ces restaurants n'existe. Noms préfixés « [FICTIF] », adresses
-- « Rue Fictive », aucun numéro de téléphone, organismes de certification
-- inventés. Toutes les lignes ont is_fictional = true.
-- Ce fichier est exécuté par `supabase db reset` (développement local
-- uniquement) ; il ne doit JAMAIS être exécuté sur la base de production.
-- Les dates sont relatives à aujourd'hui pour que les cas de test (certificat
-- expiré, revérification en retard…) restent valables dans le temps.
-- =============================================================================

-- Types de cuisine ----------------------------------------------------------------
insert into public.cuisines (slug, sort_order) values
  ('kebab', 10), ('chicken', 20), ('burger', 30), ('tacos', 40), ('pizza', 50), ('grill', 60),
  ('lebanese', 70), ('turkish', 80), ('moroccan', 90), ('tunisian', 100), ('algerian', 110),
  ('syrian', 120), ('afghan', 130), ('indian', 140), ('pakistani', 150), ('asian', 160),
  ('traditional', 170), ('sandwich', 180), ('bakery', 190), ('cafe', 200);

-- Organismes de certification INVENTÉS --------------------------------------------
insert into public.certifiers (id, name, website) values
  ('00000000-0000-4000-a000-00000000000a', 'Organisme Fictif de Certification A', null),
  ('00000000-0000-4000-a000-00000000000b', 'Organisme Fictif de Certification B', null);

-- Offres payantes (PRIX CONFIGURABLES par l'admin, valeurs de départ) ----------------
insert into public.plans (code, name, description, price_cents, billing_interval, trial_days, max_subscribers, features, sort_order) values
  ('free', 'Gratuit', 'Fiche de base, revendication, réponse aux avis.', 0, 'month', 0, null, '{}', 10),
  ('premium', 'Premium', 'Mise en avant (étiquetée « Sponsorisé »), photos et carte complètes, offres, statistiques détaillées.',
    2500, 'month', 0, null,
    '{"search_boost": true, "offers": true, "full_gallery": true, "full_menu": true, "detailed_stats": true}', 20),
  ('founding_partner', 'Partenaire fondateur', 'Réservé aux 10 premiers restaurants : 3 mois de Premium offerts, puis tarif réduit tant que l''abonnement reste actif.',
    900, 'month', 90, 10,
    '{"search_boost": true, "offers": true, "full_gallery": true, "full_menu": true, "detailed_stats": true}', 30),
  ('home_featured', 'Mise en avant sur l''accueil', 'Supplément, nombre d''emplacements limité. Prix de départ à définir.',
    4900, 'month', 0, 3, '{"home_featured": true}', 40);

-- Réglages -------------------------------------------------------------------------------
insert into public.app_settings (key, value, is_public, description) values
  ('vat', '{"enabled": false, "rateBasisPoints": 810}', true, 'TVA désactivée tant que l''entreprise n''est pas assujettie.'),
  ('reviews.min_account_age_hours', '24', false, 'Avis d''un compte plus récent : mis en attente de modération.'),
  ('reviews.max_per_day', '3', false, 'Nombre maximal d''avis par compte et par 24 h.'),
  ('reviews.burst_window_hours', '24', false, 'Fenêtre de détection des rafales d''avis.'),
  ('reviews.burst_threshold', '5', false, 'Au-delà, les nouveaux avis du restaurant sont mis en attente.'),
  ('sponsored.max_per_search', '2', true, 'Nombre maximal de résultats sponsorisés par recherche.'),
  ('sponsored.home_slots', '3', true, 'Nombre d''emplacements sponsorisés sur l''accueil.'),
  ('history.retention_days', '90', false, 'Durée de conservation de l''historique de consultation.');

-- Restaurants fictifs --------------------------------------------------------------------
create temporary table seed_restaurants (
  n integer, slug text, name text, street text, postal_code text, city text,
  lat double precision, lng double precision, price smallint, cuisines text[],
  meat public.meat_status, meat_certifier char(1), scope public.halal_scope,
  alcohol public.tri_state, pork public.tri_state,
  level public.halal_level, verified_days_ago integer, method public.verification_method, source text,
  certifier char(1), cert_expires_in_days integer, hours text, status public.publication_status
);

insert into seed_restaurants values
  -- Vevey ------------------------------------------------------------------------------------------------
  (1,  'fictif-kebab-du-lac', '[FICTIF] Kebab du Lac', 'Rue Fictive 1', '1800', 'Vevey', 46.4612, 6.8421, 1, '{kebab}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 40, 'on_site_visit', 'Visite sur place', null, null, 'continuous', 'published'),
  (2,  'fictif-le-cedre', '[FICTIF] Le Cèdre', 'Rue Fictive 2', '1800', 'Vevey', 46.4625, 6.8457, 2, '{lebanese}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'certified_by_body', 100, 'certificate', 'Certificat présenté sur place', 'A', 200, 'lunch_dinner', 'published'),
  (3,  'fictif-burger-riviera', '[FICTIF] Burger Riviera', 'Avenue Imaginaire 3', '1800', 'Vevey', 46.4598, 6.8402, 2, '{burger,chicken}',
       'supplier_declared', null, 'halal_options', 'yes', 'no', 'unverified', null, null, null, null, null, 'late', 'published'),
  (4,  'fictif-pizzeria-exemple', '[FICTIF] Pizzeria Exemple', 'Rue Fictive 4', '1800', 'Vevey', 46.4631, 6.8389, 2, '{pizza}',
       'certified', 'B', 'halal_options', 'yes', 'yes', 'team_verified', 345, 'documents', 'Factures du fournisseur', null, null, 'lunch_dinner', 'published'),
  (5,  'fictif-tacos-de-la-gare', '[FICTIF] Tacos de la Gare', 'Place Inventée 5', '1800', 'Vevey', 46.4632, 6.8436, 1, '{tacos,chicken}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 400, 'on_site_visit', 'Visite sur place', null, null, 'late', 'published'),
  (6,  'fictif-saveurs-d-anatolie', '[FICTIF] Saveurs d''Anatolie', 'Rue Fictive 6', '1800', 'Vevey', 46.4589, 6.8461, 2, '{turkish,grill}',
       'certified', 'B', 'fully_halal', 'no', 'no', 'certified_by_body', 200, 'certificate', 'Certificat présenté sur place', 'B', -10, 'closed_monday', 'published'),
  -- Montreux ---------------------------------------------------------------------------------------------
  (7,  'fictif-le-riad', '[FICTIF] Le Riad', 'Grand-Rue Fictive 7', '1820', 'Montreux', 46.4330, 6.9105, 3, '{moroccan}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 20, 'on_site_visit', 'Visite sur place', null, null, 'lunch_dinner', 'published'),
  (8,  'fictif-chicken-house', '[FICTIF] Chicken House', 'Avenue Imaginaire 8', '1820', 'Montreux', 46.4298, 6.9122, 1, '{chicken,burger}',
       'certified', 'B', 'fully_halal', 'no', 'no', 'certified_by_body', 60, 'certificate', 'Certificat présenté sur place', 'B', 300, 'continuous', 'published'),
  (9,  'fictif-wok-exemple', '[FICTIF] Wok Exemple', 'Rue Fictive 9', '1820', 'Montreux', 46.4345, 6.9090, 2, '{asian}',
       'supplier_declared', null, 'halal_options', 'yes', 'yes', 'team_verified', 90, 'phone_call', 'Appel au restaurant', null, null, 'lunch_dinner', 'published'),
  (10, 'fictif-bistrot-du-quai', '[FICTIF] Bistrot du Quai', 'Quai Fictif 10', '1820', 'Montreux', 46.4321, 6.9139, 3, '{traditional}',
       'unknown', null, 'halal_options', 'yes', 'unknown', 'unverified', null, null, null, null, null, 'lunch_dinner', 'published'),
  (11, 'fictif-saveurs-de-kaboul', '[FICTIF] Saveurs de Kaboul', 'Rue Fictive 11', '1820', 'Montreux', 46.4287, 6.9150, 2, '{afghan,grill}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 150, 'on_site_visit', 'Visite sur place', null, null, 'closed_monday', 'published'),
  -- La Tour-de-Peilz -------------------------------------------------------------------------------------
  (12, 'fictif-le-petit-tunis', '[FICTIF] Le Petit Tunis', 'Rue Fictive 12', '1814', 'La Tour-de-Peilz', 46.4541, 6.8578, 1, '{tunisian,sandwich}',
       'supplier_declared', null, 'fully_halal', 'no', 'no', 'team_verified', 30, 'on_site_visit', 'Visite sur place', null, null, 'continuous', 'published'),
  (13, 'fictif-grill-du-port', '[FICTIF] Grill du Port', 'Quai Fictif 13', '1814', 'La Tour-de-Peilz', 46.4522, 6.8601, 2, '{grill,kebab}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'unverified', null, null, null, null, null, 'late', 'published'),
  (14, 'fictif-boulangerie-orientale', '[FICTIF] Boulangerie Orientale', 'Rue Fictive 14', '1814', 'La Tour-de-Peilz', 46.4549, 6.8615, 1, '{bakery,cafe}',
       'no_meat', null, 'fully_halal', 'no', 'no', 'team_verified', 10, 'on_site_visit', 'Visite sur place', null, null, 'daytime', 'published'),
  -- Lausanne ---------------------------------------------------------------------------------------------
  (15, 'fictif-beyrouth-express', '[FICTIF] Beyrouth Express', 'Rue Fictive 15', '1003', 'Lausanne', 46.5208, 6.6301, 1, '{lebanese,sandwich}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'certified_by_body', 30, 'certificate', 'Certificat présenté sur place', 'A', 330, 'continuous', 'published'),
  (16, 'fictif-istanbul-grill', '[FICTIF] Istanbul Grill', 'Avenue Imaginaire 16', '1004', 'Lausanne', 46.5232, 6.6290, 2, '{turkish,kebab,grill}',
       'certified', 'B', 'fully_halal', 'no', 'no', 'team_verified', 120, 'on_site_visit', 'Visite sur place', null, null, 'late', 'published'),
  (17, 'fictif-saveurs-de-marrakech', '[FICTIF] Saveurs de Marrakech', 'Rue Fictive 17', '1005', 'Lausanne', 46.5180, 6.6375, 3, '{moroccan}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 200, 'on_site_visit', 'Visite sur place', null, null, 'lunch_dinner', 'published'),
  (18, 'fictif-lahore-kitchen', '[FICTIF] Lahore Kitchen', 'Rue Fictive 18', '1004', 'Lausanne', 46.5225, 6.6255, 2, '{pakistani,indian}',
       'certified', 'B', 'fully_halal', 'no', 'no', 'team_verified', 60, 'documents', 'Certificat du fournisseur de viande', null, null, 'lunch_dinner', 'published'),
  (19, 'fictif-delices-de-delhi', '[FICTIF] Délices de Delhi', 'Rue Fictive 19', '1003', 'Lausanne', 46.5169, 6.6312, 2, '{indian}',
       'supplier_declared', null, 'halal_options', 'yes', 'no', 'unverified', null, null, null, null, null, 'closed_monday', 'published'),
  (20, 'fictif-campus-burger', '[FICTIF] Campus Burger', 'Route Inventée 20', '1015', 'Lausanne', 46.5220, 6.5680, 1, '{burger,chicken}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 15, 'on_site_visit', 'Visite sur place', null, null, 'continuous', 'published'),
  (21, 'fictif-pizza-du-flon', '[FICTIF] Pizza du Flon', 'Rue Fictive 21', '1003', 'Lausanne', 46.5214, 6.6283, 1, '{pizza}',
       'certified', 'B', 'fully_halal', 'no', 'no', 'certified_by_body', 45, 'certificate', 'Certificat présenté sur place', 'B', 320, 'late', 'published'),
  (22, 'fictif-jasmin-de-damas', '[FICTIF] Jasmin de Damas', 'Rue Fictive 22', '1006', 'Lausanne', 46.5100, 6.6330, 2, '{syrian,lebanese}',
       'certified', 'A', 'fully_halal', 'no', 'no', 'team_verified', 340, 'on_site_visit', 'Visite sur place', null, null, 'lunch_dinner', 'published'),
  (23, 'fictif-le-petit-alger', '[FICTIF] Le Petit Alger', 'Rue Fictive 23', '1004', 'Lausanne', 46.5250, 6.6340, 1, '{algerian,sandwich}',
       'unknown', null, 'unknown', 'unknown', 'unknown', 'unverified', null, null, null, null, null, 'continuous', 'published'),
  (24, 'fictif-brasserie-exemple', '[FICTIF] Brasserie Exemple', 'Place Inventée 24', '1003', 'Lausanne', 46.5195, 6.6350, 3, '{traditional}',
       'certified', 'A', 'halal_options', 'yes', 'yes', 'team_verified', 75, 'on_site_visit', 'Visite sur place : plats halal indiqués sur la carte', null, null, 'lunch_dinner', 'published'),
  -- Brouillon (non publié) : sert à tester qu'un visiteur ne le voit pas.
  (25, 'fictif-restaurant-en-preparation', '[FICTIF] Restaurant en préparation', 'Rue Fictive 25', '1003', 'Lausanne', 46.5190, 6.6290, 2, '{kebab}',
       'unknown', null, 'unknown', 'unknown', 'unknown', 'unverified', null, null, null, null, null, 'continuous', 'draft');

insert into public.restaurants (slug, name, street, postal_code, city, canton, location, price_range, status, is_fictional, description)
select slug, name, street, postal_code, city, 'VD',
       extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
       price, status, true,
       'Restaurant FICTIF créé pour les tests. Il n''existe pas.'
from seed_restaurants;

insert into public.restaurant_cuisines (restaurant_id, cuisine_slug)
select r.id, unnest(s.cuisines)
from seed_restaurants s join public.restaurants r on r.slug = s.slug;

insert into public.halal_profiles (restaurant_id, meat, meat_certifier_id, scope, alcohol_served, pork_served)
select r.id, s.meat,
       case s.meat_certifier when 'A' then '00000000-0000-4000-a000-00000000000a'::uuid
                             when 'B' then '00000000-0000-4000-a000-00000000000b'::uuid end,
       s.scope, s.alcohol, s.pork
from seed_restaurants s join public.restaurants r on r.slug = s.slug;

-- Vérifications ET preuves fictives dans UNE seule instruction : la règle « certifié
-- exige une preuve » est vérifiée à la fin de la transaction.
with inserted as (
  insert into public.halal_verifications (restaurant_id, level, method, verified_at, source_description, certifier_id, certificate_expires_at)
  select r.id, s.level, s.method,
         current_date - s.verified_days_ago,
         coalesce(s.source, ''),
         case s.certifier when 'A' then '00000000-0000-4000-a000-00000000000a'::uuid
                          when 'B' then '00000000-0000-4000-a000-00000000000b'::uuid end,
         current_date + s.cert_expires_in_days
  from seed_restaurants s join public.restaurants r on r.slug = s.slug
  returning id, restaurant_id, level
)
insert into public.halal_verification_evidence (verification_id, storage_path, internal_notes)
select id, 'fictif/' || restaurant_id || '/preuve-exemple.jpg', 'Preuve FICTIVE (données de test)'
from inserted
where level <> 'unverified';

-- Horaires selon un « modèle » par restaurant.
insert into public.opening_hours (restaurant_id, iso_weekday, opens, closes)
select r.id, d.wd, h.opens::time, h.closes::time
from seed_restaurants s
join public.restaurants r on r.slug = s.slug
cross join generate_series(1, 7) as d(wd)
cross join lateral (
  values
    -- Midi et soir, tous les jours
    ('lunch_dinner', '11:30', '14:00', true),
    ('lunch_dinner', '18:00', '22:30', true),
    -- Service continu
    ('continuous', '11:00', '23:00', true),
    -- Tard : jusqu'à minuit en semaine, 03:00 le vendredi et le samedi
    ('late', '11:00', '00:00', d.wd between 1 and 4),
    ('late', '11:00', '03:00', d.wd in (5, 6)),
    ('late', '12:00', '23:00', d.wd = 7),
    -- Fermé le lundi
    ('closed_monday', '11:30', '14:30', d.wd <> 1),
    ('closed_monday', '18:00', '22:00', d.wd <> 1),
    -- Journée (boulangerie)
    ('daytime', '07:00', '18:30', d.wd <= 6),
    ('daytime', '08:00', '13:00', d.wd = 7)
) as h(pattern, opens, closes, applies)
where h.pattern = s.hours and h.applies;

-- Horaires exceptionnels : soirée type Ramadan, et un jour de fermeture.
insert into public.special_hours (restaurant_id, date, closed, opens, closes, note)
select id, current_date + 3, false, '19:00', '02:00', 'Horaires de soirée (exemple fictif)'
from public.restaurants where slug = 'fictif-le-cedre';
insert into public.special_hours (restaurant_id, date, closed, note)
select id, current_date + 7, true, 'Fermeture exceptionnelle (exemple fictif)'
from public.restaurants where slug = 'fictif-le-riad';

-- Cartes et prix (en centimes) pour quelques restaurants.
with sections as (
  insert into public.menu_sections (restaurant_id, name, position)
  select r.id, s.name, s.position
  from public.restaurants r
  join (values ('fictif-kebab-du-lac', 'Kebabs', 1), ('fictif-kebab-du-lac', 'Boissons', 2),
               ('fictif-le-cedre', 'Mezzés', 1), ('fictif-le-cedre', 'Plats', 2),
               ('fictif-campus-burger', 'Burgers', 1)) as s(slug, name, position)
    on r.slug = s.slug
  returning id, restaurant_id, name
)
insert into public.menu_items (section_id, restaurant_id, name, description, price_cents, position)
select s.id, s.restaurant_id, i.name, i.description, i.price, i.position
from sections s
join (values
  ('Kebabs', 'Kebab pita', 'Exemple fictif', 1200, 1),
  ('Kebabs', 'Kebab assiette', 'Exemple fictif', 1850, 2),
  ('Boissons', 'Ayran', 'Exemple fictif', 350, 1),
  ('Mezzés', 'Houmous', 'Exemple fictif', 900, 1),
  ('Mezzés', 'Taboulé', 'Exemple fictif', 950, 2),
  ('Plats', 'Chich taouk', 'Exemple fictif', 2400, 1),
  ('Burgers', 'Burger classique', 'Exemple fictif', 1450, 1),
  ('Burgers', 'Burger poulet', 'Exemple fictif', 1390, 2)
) as i(section, name, description, price, position) on i.section = s.name;

-- Emplacements sponsorisés de démonstration (étiquetés « Sponsorisé » dans l'app).
insert into public.sponsored_placements (restaurant_id, kind, starts_at, ends_at, position)
select id, 'search', now() - interval '1 day', now() + interval '30 days', 1
from public.restaurants where slug = 'fictif-chicken-house';
insert into public.sponsored_placements (restaurant_id, kind, starts_at, ends_at, position)
select id, 'home', now() - interval '1 day', now() + interval '30 days', 1
from public.restaurants where slug = 'fictif-istanbul-grill';

drop table seed_restaurants;
