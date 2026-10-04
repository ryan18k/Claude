/**
 * Source de données de DÉMONSTRATION (100 % fictive), sans serveur.
 *
 * Utile pour essayer l'app tout de suite (Expo Go) avant d'avoir configuré
 * Supabase. Les données viennent de supabase/seed.sql (export de la vue
 * restaurant_cards). Les dates sont décalées pour rester relatives à
 * aujourd'hui : un certificat qui expirait « dans 200 jours » le jour de
 * l'export expire toujours « dans 200 jours ».
 */
import { addDays, isoDateInZone, type SponsoredPlacement } from '@swisshalal/core';
import demo from './demo/restaurants.demo.json';
import { toRestaurantCard, type RestaurantCard } from './restaurant-cards';

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000,
  );
}

export function loadDemoRestaurantCards(now: Date = new Date()): RestaurantCard[] {
  const shift = daysBetween(demo.meta.exportedOn, isoDateInZone(now));
  const move = (date: string | null) => (date ? addDays(date, shift) : null);

  return demo.restaurants.map((raw) => {
    const card = toRestaurantCard(raw);
    return {
      ...card,
      verification: {
        ...card.verification,
        verifiedAt: move(card.verification.verifiedAt),
        certificateExpiresAt: move(card.verification.certificateExpiresAt),
        nextReviewDueAt: move(card.verification.nextReviewDueAt),
      },
      schedule: {
        ...card.schedule,
        specialDays: card.schedule.specialDays.map((day) => ({
          ...day,
          date: addDays(day.date, shift),
        })),
      },
    };
  });
}

export function loadDemoSponsoredPlacements(now: Date = new Date()): SponsoredPlacement[] {
  const day = 86_400_000;
  return demo.sponsoredPlacements.map((p) => ({
    restaurantId: p.restaurantId,
    kind: p.kind as SponsoredPlacement['kind'],
    position: p.position,
    startsAt: new Date(now.getTime() + p.startsInDays * day).toISOString(),
    endsAt: new Date(now.getTime() + p.endsInDays * day).toISOString(),
  }));
}
