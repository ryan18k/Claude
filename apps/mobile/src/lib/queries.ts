/**
 * Accès aux données avec TanStack Query : mise en cache, rechargement,
 * états « chargement » et « erreur » gérés pour nous.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RestaurantCard } from '@swisshalal/supabase';
import { getRestaurant, getRestaurants, getSponsoredPlacements } from './data';

export function useRestaurants() {
  return useQuery({ queryKey: ['restaurants'], queryFn: getRestaurants });
}

export function useSponsoredPlacements() {
  return useQuery({ queryKey: ['sponsored-placements'], queryFn: getSponsoredPlacements });
}

export function useRestaurant(slug: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => getRestaurant(slug),
    // Si la liste est déjà chargée, on affiche tout de suite la fiche.
    initialData: () =>
      queryClient.getQueryData<RestaurantCard[]>(['restaurants'])?.find((r) => r.slug === slug),
  });
}
