/**
 * Réglages communs à la carte native (iOS/Android) et à l'aperçu web.
 *
 * Fond de carte : tuiles vectorielles swisstopo (données ouvertes de la
 * Confédération, gratuites, attribution obligatoire). Aucune donnée Google.
 * Les marqueurs sont regroupés (« clusters ») quand on dézoome : c'est la
 * bibliothèque de carte qui le fait, très rapidement, même avec des milliers de points.
 */
import { boundsOf, type Bounds, type LatLng } from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';
import type { Feature, FeatureCollection, Point } from 'geojson';

export const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ||
  'https://vectortiles.geo.admin.ch/styles/ch.swisstopo.lightbasemap.vt/style.json';

export const MAP_ATTRIBUTION = '© swisstopo';

/** Vue de départ : de Lausanne à Montreux. */
export const INITIAL_CENTER: LatLng = { lat: 46.475, lng: 6.76 };
export const INITIAL_ZOOM = 10.2;
export const FOCUS_ZOOM = 14;

/** Marges autour des restaurants au démarrage (barre de recherche en haut, boutons en bas). */
export const FIT_PADDING = { top: 140, right: 40, bottom: 180, left: 40 };

/**
 * Rectangle de départ : tous les restaurants affichés, ou null s'il n'y en a pas
 * (ou un seul) — on utilise alors INITIAL_CENTER / INITIAL_ZOOM.
 */
export function initialBounds(restaurants: readonly RestaurantCard[]): Bounds | null {
  const bounds = boundsOf(restaurants.map((r) => r.location));
  if (!bounds) return null;
  const [west, south, east, north] = bounds;
  return east - west < 0.001 && north - south < 0.001 ? null : bounds;
}

export const CLUSTER_RADIUS = 45;
export const CLUSTER_MAX_ZOOM = 15;

/** Police disponible sur le serveur de glyphes swisstopo (pour les nombres des groupes). */
const FONT = ['Frutiger Neue Regular'];

export interface MarkerProperties {
  id: string;
}

export function toFeatureCollection(
  restaurants: readonly RestaurantCard[],
): FeatureCollection<Point, MarkerProperties> {
  return {
    type: 'FeatureCollection',
    features: restaurants.map((r): Feature<Point, MarkerProperties> => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.location.lng, r.location.lat] },
      properties: { id: r.id },
    })),
  };
}

export function userFeature(position: LatLng): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [position.lng, position.lat] },
        properties: {},
      },
    ],
  };
}

/**
 * Couches de la carte, au format standard « MapLibre Style » : la même
 * définition sert à la carte native et à l'aperçu web.
 */
export function markerLayers(primary: string, outline: string, selectedId: string | null) {
  return {
    clusters: {
      id: 'clusters',
      type: 'circle' as const,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': primary,
        'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
        'circle-stroke-width': 2,
        'circle-stroke-color': outline,
      },
    },
    clusterCount: {
      id: 'cluster-count',
      type: 'symbol' as const,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': FONT,
        'text-size': 13,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': outline },
    },
    points: {
      id: 'points',
      type: 'circle' as const,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': primary,
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': outline,
      },
    },
    selected: {
      id: 'selected',
      type: 'circle' as const,
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], selectedId ?? '']],
      paint: {
        'circle-color': outline,
        'circle-radius': 12,
        'circle-stroke-width': 5,
        'circle-stroke-color': primary,
      },
    },
  };
}

export const USER_LAYER = {
  id: 'user-position',
  type: 'circle' as const,
  paint: {
    'circle-color': '#1A73E8',
    'circle-radius': 7,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#FFFFFF',
  },
};

/** Demande de recentrage de la carte (une nouvelle « key » déclenche le mouvement). */
export interface MapFocus {
  center: LatLng;
  zoom: number;
  key: number;
}

export interface RestaurantMapProps {
  restaurants: readonly RestaurantCard[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userPosition: LatLng | null;
  focus: MapFocus | null;
  /** Espace à laisser en bas (boutons flottants), en points. */
  bottomInset: number;
}
