/**
 * Source des données de l'app.
 *
 * - Si EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY sont définies
 *   (fichier apps/mobile/.env), on lit la base Supabase.
 * - Sinon, on utilise les données de DÉMONSTRATION fictives intégrées à l'app :
 *   pratique pour essayer l'app sans rien configurer.
 */
import 'react-native-url-polyfill/auto';
import type { SponsoredPlacement } from '@swisshalal/core';
import {
  createSupabaseClient,
  fetchActiveSponsoredPlacements,
  fetchRestaurantCardBySlug,
  fetchRestaurantCards,
  loadDemoRestaurantCards,
  loadDemoSponsoredPlacements,
  type RestaurantCard,
} from '@swisshalal/supabase';

// Les variables EXPO_PUBLIC_* sont intégrées à l'app au moment de la compilation.
// Elles sont donc PUBLIQUES : ne jamais y mettre de secret.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const dataSource: 'supabase' | 'demo' = url && anonKey ? 'supabase' : 'demo';

// Pas encore de connexion utilisateur (phase 3) : inutile de garder une session.
const client =
  dataSource === 'supabase'
    ? createSupabaseClient({ url, anonKey }, { auth: { persistSession: false } })
    : null;

export async function getRestaurants(): Promise<RestaurantCard[]> {
  return client ? fetchRestaurantCards(client) : loadDemoRestaurantCards();
}

export async function getRestaurant(slug: string): Promise<RestaurantCard | null> {
  if (client) return fetchRestaurantCardBySlug(client, slug);
  return loadDemoRestaurantCards().find((r) => r.slug === slug) ?? null;
}

export async function getSponsoredPlacements(): Promise<SponsoredPlacement[]> {
  return client ? fetchActiveSponsoredPlacements(client) : loadDemoSponsoredPlacements();
}
