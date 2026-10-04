import type { LatLng } from './domain';

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Distance « à vol d'oiseau » entre deux points (formule de haversine).
 * Suffisant pour trier et filtrer ; la distance réelle à pied est plus longue.
 */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** « 350 m » ou « 1,2 km », formaté selon la langue (locale BCP 47, ex. "fr-CH"). */
export function formatDistance(meters: number, locale: string): string {
  if (meters < 1000) {
    const rounded = Math.max(10, Math.round(meters / 10) * 10);
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'meter' }).format(rounded);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: meters < 10_000 ? 1 : 0,
  }).format(meters / 1000);
}

/** Rectangle géographique : [ouest, sud, est, nord] (longitudes et latitudes). */
export type Bounds = [west: number, south: number, east: number, north: number];

/** Plus petit rectangle contenant tous les points (null si aucun point). */
export function boundsOf(points: readonly LatLng[]): Bounds | null {
  if (points.length === 0) return null;
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}
