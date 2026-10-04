/**
 * État de la recherche, partagé entre l'écran carte/liste et l'écran des filtres :
 * texte recherché, filtres, position de l'utilisateur.
 *
 * `useExploreResults` applique la logique de packages/core :
 * filtrage → classement ORGANIQUE (sans aucune donnée de paiement) →
 * résultats sponsorisés séparés et limités.
 */
import { EMPTY_FILTERS, type LatLng, type SearchFilters } from '@swisshalal/core';
import { computeResults } from './explore';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { requestCurrentPosition } from './location';
import { useRestaurants, useSponsoredPlacements } from './queries';

type LocationStatus = 'unknown' | 'locating' | 'granted' | 'denied' | 'error';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  position: LatLng | null;
  locationStatus: LocationStatus;
  /** Demande la position (et la permission si besoin). Renvoie la position ou null. */
  locate: () => Promise<LatLng | null>;
}

const SearchContext = createContext<SearchState | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('unknown');

  const locate = useCallback(async () => {
    setLocationStatus('locating');
    const result = await requestCurrentPosition();
    setLocationStatus(result.status);
    if (result.status === 'granted') {
      setPosition(result.position);
      return result.position;
    }
    return null;
  }, []);

  const value = useMemo(
    () => ({ query, setQuery, filters, setFilters, position, locationStatus, locate }),
    [query, filters, position, locationStatus, locate],
  );
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchState {
  const state = useContext(SearchContext);
  if (!state) throw new Error('useSearch doit être utilisé dans <SearchProvider>.');
  return state;
}

export function useCuisineLabel() {
  const t = useTranslations();
  return useCallback((slug: string) => t(`cuisine.${slug}`), [t]);
}

export function useExploreResults(override?: { filters: SearchFilters }) {
  const restaurants = useRestaurants();
  const placements = useSponsoredPlacements();
  const { filters, query, position } = useSearch();
  const cuisineLabel = useCuisineLabel();
  const activeFilters = override?.filters ?? filters;

  const computed = useMemo(
    () =>
      restaurants.data
        ? computeResults(
            restaurants.data,
            activeFilters,
            query,
            position,
            cuisineLabel,
            placements.data ?? [],
          )
        : null,
    [restaurants.data, activeFilters, query, position, cuisineLabel, placements.data],
  );

  return {
    ...computed,
    isPending: restaurants.isPending,
    isError: restaurants.isError,
    refetch: () => {
      void restaurants.refetch();
      void placements.refetch();
    },
  };
}
