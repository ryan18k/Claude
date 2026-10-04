/** Données de test 100 % fictives, partagées par les fichiers de test. */
import type { HalalProfile, HalalVerification } from '../domain';
import type { RestaurantSummary } from '../restaurant';

export const VERIFIED_RECENTLY: HalalVerification = {
  level: 'team_verified',
  method: 'on_site_visit',
  verifiedAt: '2026-06-01',
  sourceDescription: 'Visite sur place',
  certifierName: null,
  certificateExpiresAt: null,
  hasEvidence: true,
  nextReviewDueAt: null,
};

export const CERTIFIED_VALID: HalalVerification = {
  level: 'certified_by_body',
  method: 'certificate',
  verifiedAt: '2026-05-15',
  sourceDescription: 'Certificat présenté par le restaurant',
  certifierName: 'Organisme Fictif de Certification',
  certificateExpiresAt: '2027-05-14',
  hasEvidence: true,
  nextReviewDueAt: null,
};

export const UNVERIFIED: HalalVerification = {
  level: 'unverified',
  method: null,
  verifiedAt: null,
  sourceDescription: null,
  certifierName: null,
  certificateExpiresAt: null,
  hasEvidence: false,
  nextReviewDueAt: null,
};

export const CERTIFIED_MEAT_NO_ALCOHOL: HalalProfile = {
  meat: 'certified',
  meatCertifierName: 'Organisme Fictif de Certification',
  scope: 'fully_halal',
  alcoholServed: 'no',
  porkServed: 'no',
};

/** Fabrique un restaurant fictif ; on ne précise que ce qui change. */
export function makeRestaurant(overrides: Partial<RestaurantSummary> = {}): RestaurantSummary {
  return {
    id: 'r-001',
    slug: 'fictif-restaurant-exemple-01',
    name: '[FICTIF] Restaurant Exemple 01',
    city: 'Vevey',
    location: { lat: 46.4628, lng: 6.8419 },
    cuisines: ['kebab'],
    priceRange: 1,
    halal: CERTIFIED_MEAT_NO_ALCOHOL,
    verification: VERIFIED_RECENTLY,
    ratingAverage: 4.2,
    ratingCount: 12,
    schedule: {
      periods: [1, 2, 3, 4, 5, 6, 7].map((isoWeekday) => ({
        isoWeekday,
        opens: '11:00',
        closes: '23:00',
      })),
      specialDays: [],
    },
    ...overrides,
  };
}

/** Lundi 5 octobre 2026, 12:00 à Zurich (heure d'été, UTC+2). */
export const MONDAY_NOON_ZURICH = new Date('2026-10-05T10:00:00Z');
