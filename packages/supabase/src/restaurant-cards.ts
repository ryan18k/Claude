/**
 * Lecture de la vue SQL `restaurant_cards` et conversion vers les types métier.
 *
 * Chaque ligne reçue est VALIDÉE avec zod : si la base et l'app ne sont plus
 * d'accord sur la forme des données (oubli de migration, champ renommé…),
 * on obtient une erreur claire au lieu d'un affichage faux.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  HALAL_LEVELS,
  HALAL_SCOPES,
  MEAT_STATUSES,
  TRI_STATES,
  VERIFICATION_METHODS,
  type PriceRange,
  type RestaurantSummary,
} from '@swisshalal/core';
import { z } from 'zod';

const timeRange = z.object({ opens: z.string(), closes: z.string() });

/** PostgreSQL renvoie parfois les nombres décimaux sous forme de texte. */
const nullableNumber = z
  .union([z.number(), z.string()])
  .nullable()
  .transform((value) => (value === null ? null : Number(value)));

export const restaurantCardRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  street: z.string(),
  postal_code: z.string(),
  city: z.string(),
  canton: z.string(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  price_range: z.number().int().min(1).max(4).nullable(),
  is_fictional: z.boolean(),
  lat: z.number(),
  lng: z.number(),
  cuisines: z.array(z.string()),
  meat: z.enum(MEAT_STATUSES),
  meat_certifier_name: z.string().nullable(),
  scope: z.enum(HALAL_SCOPES),
  alcohol_served: z.enum(TRI_STATES),
  pork_served: z.enum(TRI_STATES),
  verification_level: z.enum(HALAL_LEVELS),
  verification_method: z.enum(VERIFICATION_METHODS).nullable(),
  verified_at: z.string().nullable(),
  source_description: z.string().nullable(),
  certifier_name: z.string().nullable(),
  certificate_expires_at: z.string().nullable(),
  has_evidence: z.boolean(),
  next_review_due_at: z.string().nullable(),
  rating_average: nullableNumber,
  rating_count: z.number().int(),
  opening_periods: z.array(timeRange.extend({ isoWeekday: z.number().int().min(1).max(7) })),
  special_days: z.array(
    z.object({ date: z.string(), closed: z.boolean(), ranges: z.array(timeRange) }),
  ),
});

export type RestaurantCardRow = z.input<typeof restaurantCardRowSchema>;

/** Restaurant prêt à afficher : résumé métier + coordonnées pour la fiche. */
export interface RestaurantCard extends RestaurantSummary {
  street: string;
  postalCode: string;
  canton: string;
  phone: string | null;
  website: string | null;
  isFictional: boolean;
}

/** Convertit une ligne SQL (snake_case) en objet métier (camelCase). */
export function toRestaurantCard(raw: unknown): RestaurantCard {
  const row = restaurantCardRowSchema.parse(raw);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    street: row.street,
    postalCode: row.postal_code,
    canton: row.canton,
    phone: row.phone,
    website: row.website,
    isFictional: row.is_fictional,
    location: { lat: row.lat, lng: row.lng },
    cuisines: row.cuisines,
    priceRange: row.price_range as PriceRange | null,
    halal: {
      meat: row.meat,
      meatCertifierName: row.meat_certifier_name,
      scope: row.scope,
      alcoholServed: row.alcohol_served,
      porkServed: row.pork_served,
    },
    verification: {
      level: row.verification_level,
      method: row.verification_method,
      verifiedAt: row.verified_at,
      sourceDescription: row.source_description,
      certifierName: row.certifier_name,
      certificateExpiresAt: row.certificate_expires_at,
      hasEvidence: row.has_evidence,
      nextReviewDueAt: row.next_review_due_at,
    },
    ratingAverage: row.rating_average,
    ratingCount: row.rating_count,
    schedule: { periods: row.opening_periods, specialDays: row.special_days },
  };
}

/** Tous les restaurants visibles (la RLS filtre côté serveur : publiés uniquement pour un visiteur). */
export async function fetchRestaurantCards(client: SupabaseClient): Promise<RestaurantCard[]> {
  const { data, error } = await client.from('restaurant_cards').select('*').order('name');
  if (error) throw new Error(`Lecture des restaurants impossible : ${error.message}`);
  return (data ?? []).map(toRestaurantCard);
}

export async function fetchRestaurantCardBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<RestaurantCard | null> {
  const { data, error } = await client
    .from('restaurant_cards')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`Lecture du restaurant impossible : ${error.message}`);
  return data ? toRestaurantCard(data) : null;
}
