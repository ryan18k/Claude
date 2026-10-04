/**
 * Filtres de recherche combinables.
 *
 * Le schéma zod sert à la fois à valider les entrées (par ex. des paramètres
 * d'URL) et à produire le type TypeScript `SearchFilters`.
 */
import { z } from 'zod';
import { isoDateInZone } from './dates';
import type { LatLng } from './domain';
import { distanceMeters } from './geo';
import { canClaimCertifiedMeat, effectiveHalalLevel } from './halal-status';
import { isOpenAt } from './opening-hours';
import type { RestaurantSummary } from './restaurant';

export const searchFiltersSchema = z.object({
  query: z.string().trim().max(100).optional(),
  cuisines: z.array(z.string().min(1)).max(20).default([]),
  maxPriceRange: z.number().int().min(1).max(4).optional(),
  maxDistanceMeters: z.number().positive().max(200_000).optional(),
  openNow: z.boolean().default(false),
  /** Uniquement la viande certifiée par un organisme ET vérifiée. */
  certifiedMeatOnly: z.boolean().default(false),
  /** Uniquement les restaurants qui ne servent pas d'alcool. */
  noAlcohol: z.boolean().default(false),
  /** Uniquement les établissements 100 % halal. */
  fullyHalalOnly: z.boolean().default(false),
  /** Uniquement les informations vérifiées (équipe ou organisme), à jour. */
  verifiedOnly: z.boolean().default(false),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export interface FilterContext {
  now: Date;
  /** Position de l'utilisateur, si elle a été partagée. */
  position?: LatLng | null;
}

/** Minuscules et sans accents : « Libanais », « libanais » et « LIBANAÎS » se valent. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function matchesFilters(
  restaurant: RestaurantSummary,
  filters: SearchFilters,
  context: FilterContext,
): boolean {
  const today = isoDateInZone(context.now);

  if (filters.query) {
    const needle = normalizeText(filters.query);
    const haystack = normalizeText(
      [restaurant.name, restaurant.city, ...restaurant.cuisines].join(' '),
    );
    if (!haystack.includes(needle)) return false;
  }

  if (filters.cuisines.length > 0) {
    if (!restaurant.cuisines.some((c) => filters.cuisines.includes(c))) return false;
  }

  if (filters.maxPriceRange !== undefined) {
    if (restaurant.priceRange === null || restaurant.priceRange > filters.maxPriceRange) {
      return false;
    }
  }

  if (filters.maxDistanceMeters !== undefined && context.position) {
    if (distanceMeters(context.position, restaurant.location) > filters.maxDistanceMeters) {
      return false;
    }
  }

  if (filters.openNow && !isOpenAt(restaurant.schedule, context.now)) return false;

  if (
    filters.certifiedMeatOnly &&
    !canClaimCertifiedMeat(restaurant.halal, restaurant.verification, today)
  ) {
    return false;
  }

  if (filters.noAlcohol && restaurant.halal.alcoholServed !== 'no') return false;

  if (filters.fullyHalalOnly && restaurant.halal.scope !== 'fully_halal') return false;

  if (
    filters.verifiedOnly &&
    effectiveHalalLevel(restaurant.verification, today) === 'unverified'
  ) {
    return false;
  }

  return true;
}
