/**
 * Calcul des résultats (fonction pure, sans interface : facile à tester).
 * filtrage → classement ORGANIQUE (sans aucune donnée de paiement) →
 * résultats sponsorisés séparés, limités et étiquetés.
 */
import {
  buildSearchResults,
  DEFAULT_MAX_SPONSORED,
  defaultSortMode,
  distanceMeters,
  matchesFilters,
  rankOrganic,
  textRelevance,
  type LatLng,
  type SearchFilters,
  type SponsoredPlacement,
} from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';

/** Filtre et classe les restaurants. Fonction pure, réutilisée pour le compteur de l'écran Filtres. */
export function computeResults(
  restaurants: readonly RestaurantCard[],
  filters: SearchFilters,
  query: string,
  position: LatLng | null,
  cuisineLabel: (slug: string) => string,
  placements: readonly SponsoredPlacement[],
  now = new Date(),
) {
  const trimmed = query.trim();
  const matching = restaurants.filter((r) =>
    matchesFilters(r, { ...filters, query: trimmed || undefined }, { now, position, cuisineLabel }),
  );
  const distances = new Map<string, number>();
  if (position) for (const r of matching) distances.set(r.id, distanceMeters(position, r.location));

  const order = rankOrganic(
    matching.map((r) => ({
      id: r.id,
      name: r.name,
      distanceMeters: distances.get(r.id) ?? null,
      textScore: trimmed
        ? textRelevance(trimmed, r.name, [r.city, ...r.cuisines.map(cuisineLabel)])
        : 0,
      ratingAverage: r.ratingAverage,
      ratingCount: r.ratingCount,
    })),
    defaultSortMode(Boolean(trimmed), Boolean(position)),
  );
  const byId = new Map(matching.map((r) => [r.id, r]));
  const ranked = order.map((id) => byId.get(id)).filter((r): r is RestaurantCard => Boolean(r));
  const results = buildSearchResults(ranked, placements, {
    now,
    kind: 'search',
    maxSponsored: DEFAULT_MAX_SPONSORED,
  });
  return { results, distances, matching: ranked };
}
