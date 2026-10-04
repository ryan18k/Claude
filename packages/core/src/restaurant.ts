import type { HalalProfile, HalalVerification, LatLng, PriceRange } from './domain';
import type { WeeklySchedule } from './opening-hours';

/**
 * Résumé d'un restaurant tel qu'affiché dans la liste et sur la carte.
 *
 * ⚠️ Ce type ne contient volontairement AUCUNE information d'abonnement
 * ou de paiement : la liste organique ne doit pas pouvoir en dépendre.
 */
export interface RestaurantSummary {
  id: string;
  slug: string;
  name: string;
  city: string;
  location: LatLng;
  /** Identifiants des types de cuisine (ex. 'kebab', 'libanais'). */
  cuisines: string[];
  priceRange: PriceRange | null;
  halal: HalalProfile;
  verification: HalalVerification;
  ratingAverage: number | null;
  ratingCount: number;
  schedule: WeeklySchedule;
}
