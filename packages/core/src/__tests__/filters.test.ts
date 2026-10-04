import { describe, expect, it } from 'vitest';
import { matchesFilters, normalizeText, searchFiltersSchema } from '../filters';
import { distanceMeters, formatDistance } from '../geo';
import { formatChf, vatAmountCents } from '../money';
import { reviewInputSchema } from '../reviews';
import { CERTIFIED_VALID, MONDAY_NOON_ZURICH, UNVERIFIED, makeRestaurant } from './fixtures';

const filters = (input: Record<string, unknown> = {}) => searchFiltersSchema.parse(input);
const ctx = { now: MONDAY_NOON_ZURICH, position: { lat: 46.4628, lng: 6.8419 } };

describe('matchesFilters', () => {
  it('sans filtre, tout correspond', () => {
    expect(matchesFilters(makeRestaurant(), filters(), ctx)).toBe(true);
  });

  it('recherche texte insensible aux accents et à la casse', () => {
    const r = makeRestaurant({ name: '[FICTIF] Le Cèdre Libanais', cuisines: ['lebanese'] });
    expect(matchesFilters(r, filters({ query: 'cedre' }), ctx)).toBe(true);
    expect(matchesFilters(r, filters({ query: 'LIBANAIS' }), ctx)).toBe(true);
    expect(matchesFilters(r, filters({ query: 'sushi' }), ctx)).toBe(false);
    expect(normalizeText('  Crème BRÛLÉE ')).toBe('creme brulee');
  });

  it('type de cuisine : au moins un en commun', () => {
    const r = makeRestaurant({ cuisines: ['burger', 'chicken'] });
    expect(matchesFilters(r, filters({ cuisines: ['chicken', 'pizza'] }), ctx)).toBe(true);
    expect(matchesFilters(r, filters({ cuisines: ['pizza'] }), ctx)).toBe(false);
  });

  it('gamme de prix maximale', () => {
    expect(
      matchesFilters(makeRestaurant({ priceRange: 2 }), filters({ maxPriceRange: 2 }), ctx),
    ).toBe(true);
    expect(
      matchesFilters(makeRestaurant({ priceRange: 3 }), filters({ maxPriceRange: 2 }), ctx),
    ).toBe(false);
    expect(
      matchesFilters(makeRestaurant({ priceRange: null }), filters({ maxPriceRange: 4 }), ctx),
    ).toBe(false);
  });

  it('distance maximale (Vevey → Lausanne ≈ 17 km)', () => {
    const lausanne = makeRestaurant({ location: { lat: 46.5167, lng: 6.6292 } });
    expect(matchesFilters(lausanne, filters({ maxDistanceMeters: 5000 }), ctx)).toBe(false);
    expect(matchesFilters(lausanne, filters({ maxDistanceMeters: 20_000 }), ctx)).toBe(true);
    // Sans position partagée, le filtre de distance est ignoré.
    expect(matchesFilters(lausanne, filters({ maxDistanceMeters: 5000 }), { now: ctx.now })).toBe(
      true,
    );
  });

  it('ouvert maintenant', () => {
    const closedMonday = makeRestaurant({
      schedule: { periods: [{ isoWeekday: 2, opens: '11:00', closes: '23:00' }], specialDays: [] },
    });
    expect(matchesFilters(makeRestaurant(), filters({ openNow: true }), ctx)).toBe(true);
    expect(matchesFilters(closedMonday, filters({ openNow: true }), ctx)).toBe(false);
  });

  it('viande certifiée : exige un organisme ET une vérification', () => {
    expect(matchesFilters(makeRestaurant(), filters({ certifiedMeatOnly: true }), ctx)).toBe(true);
    const unverified = makeRestaurant({ verification: UNVERIFIED });
    expect(matchesFilters(unverified, filters({ certifiedMeatOnly: true }), ctx)).toBe(false);
    const noCertifier = makeRestaurant({
      halal: { ...makeRestaurant().halal, meatCertifierName: null },
      verification: CERTIFIED_VALID,
    });
    expect(matchesFilters(noCertifier, filters({ certifiedMeatOnly: true }), ctx)).toBe(false);
  });

  it('sans alcool, 100 % halal, vérifié uniquement', () => {
    const withAlcohol = makeRestaurant({
      halal: { ...makeRestaurant().halal, alcoholServed: 'yes' },
    });
    const unknownAlcohol = makeRestaurant({
      halal: { ...makeRestaurant().halal, alcoholServed: 'unknown' },
    });
    expect(matchesFilters(withAlcohol, filters({ noAlcohol: true }), ctx)).toBe(false);
    expect(matchesFilters(unknownAlcohol, filters({ noAlcohol: true }), ctx)).toBe(false);

    const options = makeRestaurant({
      halal: { ...makeRestaurant().halal, scope: 'halal_options' },
    });
    expect(matchesFilters(options, filters({ fullyHalalOnly: true }), ctx)).toBe(false);

    expect(
      matchesFilters(
        makeRestaurant({ verification: UNVERIFIED }),
        filters({ verifiedOnly: true }),
        ctx,
      ),
    ).toBe(false);
  });

  it('les filtres se combinent', () => {
    const f = filters({ cuisines: ['kebab'], noAlcohol: true, openNow: true, verifiedOnly: true });
    expect(matchesFilters(makeRestaurant(), f, ctx)).toBe(true);
    expect(matchesFilters(makeRestaurant({ cuisines: ['pizza'] }), f, ctx)).toBe(false);
  });

  it('refuse des filtres invalides', () => {
    expect(() => filters({ maxPriceRange: 7 })).toThrow();
    expect(() => filters({ query: 'x'.repeat(101) })).toThrow();
  });
});

describe('utilitaires', () => {
  it('distance et format', () => {
    const d = distanceMeters({ lat: 46.4628, lng: 6.8419 }, { lat: 46.5167, lng: 6.6292 });
    expect(d).toBeGreaterThan(16_000);
    expect(d).toBeLessThan(19_000);
    expect(formatDistance(347, 'fr-CH')).toContain('350');
    expect(formatDistance(1234, 'fr-CH')).toMatch(/1[.,]2/);
  });

  it('TVA désactivée par défaut, calcul au centime quand elle est activée', () => {
    expect(vatAmountCents(2500, { enabled: false, rateBasisPoints: 810 })).toBe(0);
    expect(vatAmountCents(2500, { enabled: true, rateBasisPoints: 810 })).toBe(203);
    expect(formatChf(2500, 'fr-CH')).toContain('CHF');
  });

  it('validation des avis', () => {
    expect(reviewInputSchema.parse({ rating: 5 })).toEqual({ rating: 5, body: '', claims: [] });
    expect(() => reviewInputSchema.parse({ rating: 0 })).toThrow();
    expect(() => reviewInputSchema.parse({ rating: 4.5 })).toThrow();
    expect(() =>
      reviewInputSchema.parse({ rating: 4, claims: ['no_alcohol_confirmed', 'alcohol_seen'] }),
    ).toThrow();
  });
});

describe('recherche et filtres de l’écran carte', () => {
  it('trouve un restaurant par le libellé traduit de sa cuisine', async () => {
    const { matchesFilters: match, searchFiltersSchema: schema } = await import('../filters');
    const r = makeRestaurant({ name: '[FICTIF] Chez Exemple', cuisines: ['lebanese'] });
    const label = (slug: string) => ({ lebanese: 'Libanais' })[slug] ?? slug;
    expect(match(r, schema.parse({ query: 'libanais' }), { ...ctx, cuisineLabel: label })).toBe(
      true,
    );
    expect(match(r, schema.parse({ query: 'libanais' }), ctx)).toBe(false);
  });

  it('classe la pertinence : début du nom > nom > autres champs', async () => {
    const { textRelevance } = await import('../filters');
    expect(textRelevance('ced', '[FICTIF] Le Cèdre', [])).toBe(0.7);
    expect(textRelevance('le ce', '[FICTIF] Le Cèdre', [])).toBe(1);
    expect(textRelevance('vevey', '[FICTIF] Le Cèdre', ['Vevey'])).toBe(0.4);
    expect(textRelevance('sushi', '[FICTIF] Le Cèdre', ['Vevey'])).toBe(0);
    expect(textRelevance('  ', '[FICTIF] Le Cèdre', [])).toBe(0);
  });

  it('compte les filtres actifs', async () => {
    const { countActiveFilters, EMPTY_FILTERS } = await import('../filters');
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        cuisines: ['kebab', 'pizza'],
        noAlcohol: true,
        maxDistanceMeters: 1000,
      }),
    ).toBe(3);
  });

  it('calcule le rectangle qui contient des points', async () => {
    const { boundsOf } = await import('../geo');
    expect(boundsOf([])).toBeNull();
    expect(
      boundsOf([
        { lat: 46.4, lng: 6.9 },
        { lat: 46.5, lng: 6.6 },
      ]),
    ).toEqual([6.6, 46.4, 6.9, 46.5]);
  });
});
