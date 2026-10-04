import { describeHalalStatus } from '@swisshalal/core';
import { describe, expect, it } from 'vitest';
import { loadDemoRestaurantCards, loadDemoSponsoredPlacements } from '../demo';
import demo from '../demo/restaurants.demo.json';
import { toRestaurantCard } from '../restaurant-cards';

describe('toRestaurantCard', () => {
  it('convertit toutes les lignes exportées de la vraie base (seed)', () => {
    const cards = demo.restaurants.map(toRestaurantCard);
    expect(cards).toHaveLength(24);
    expect(cards.every((c) => c.isFictional && c.name.startsWith('[FICTIF]'))).toBe(true);
  });

  it('refuse une ligne dont la forme ne correspond pas', () => {
    const broken = { ...demo.restaurants[0], verification_level: 'super_certifie' };
    expect(() => toRestaurantCard(broken)).toThrow();
  });

  it('accepte une note moyenne renvoyée sous forme de texte', () => {
    const row = { ...demo.restaurants[0], rating_average: '4.50', rating_count: 2 };
    expect(toRestaurantCard(row).ratingAverage).toBe(4.5);
  });
});

describe('données de démonstration', () => {
  it('les dates restent relatives à aujourd’hui', () => {
    const inOneYear = new Date(Date.parse(`${demo.meta.exportedOn}T12:00:00Z`) + 365 * 86_400_000);
    const exportDay = loadDemoRestaurantCards(new Date(`${demo.meta.exportedOn}T12:00:00Z`));
    const later = loadDemoRestaurantCards(inOneYear);
    const levels = (cards: typeof later, now: Date) =>
      cards.map((c) => describeHalalStatus(c.halal, c.verification, now).level);
    // Un an plus tard, les niveaux affichés sont les mêmes que le jour de l'export.
    expect(levels(later, inOneYear)).toEqual(
      levels(exportDay, new Date(`${demo.meta.exportedOn}T12:00:00Z`)),
    );
  });

  it('contient des cas variés : certifié, vérifié, non vérifié, certificat expiré', () => {
    const now = new Date();
    const levels = new Set(
      loadDemoRestaurantCards(now).map(
        (c) => describeHalalStatus(c.halal, c.verification, now).level,
      ),
    );
    expect(levels).toEqual(new Set(['certified_by_body', 'team_verified', 'unverified']));
    const warnings = loadDemoRestaurantCards(now).flatMap(
      (c) => describeHalalStatus(c.halal, c.verification, now).warnings,
    );
    expect(warnings).toContain('certificate_expired');
    expect(warnings).toContain('review_overdue');
  });

  it('les emplacements sponsorisés de démo sont actifs', () => {
    const now = new Date();
    const placements = loadDemoSponsoredPlacements(now);
    expect(placements.length).toBeGreaterThan(0);
    expect(placements.every((p) => Date.parse(p.startsAt) < now.getTime())).toBe(true);
  });
});
