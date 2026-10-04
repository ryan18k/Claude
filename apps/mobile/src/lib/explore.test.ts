/**
 * Tests de l'écran carte/liste : recherche, filtres, tri par distance et
 * séparation stricte des résultats sponsorisés (règle d'intégrité).
 */
import { EMPTY_FILTERS, type SponsoredPlacement } from '@swisshalal/core';
import { loadDemoRestaurantCards } from '@swisshalal/supabase';
import { describe, expect, it } from 'vitest';
import { getMessages, lookup } from '@swisshalal/i18n';
import { computeResults } from './explore';

const NOW = new Date('2026-10-05T10:00:00Z'); // lundi 12:00 à Zurich
const restaurants = loadDemoRestaurantCards(NOW);
const messages = getMessages('fr');
const label = (slug: string) => lookup(messages, `cuisine.${slug}`) ?? slug;
const VEVEY = { lat: 46.4628, lng: 6.8419 };
const bySlug = (slug: string) => restaurants.find((r) => r.slug === slug)!;
const placement = (slug: string): SponsoredPlacement => ({
  restaurantId: bySlug(slug).id,
  kind: 'search',
  startsAt: '2026-10-01T00:00:00Z',
  endsAt: '2026-11-01T00:00:00Z',
  position: 1,
});
const run = (
  overrides: Partial<Parameters<typeof computeResults>[1]> = {},
  query = '',
  position: typeof VEVEY | null = null,
  placements: SponsoredPlacement[] = [],
) =>
  computeResults(
    restaurants,
    { ...EMPTY_FILTERS, ...overrides },
    query,
    position,
    label,
    placements,
    NOW,
  );

describe('écran carte / liste', () => {
  it('sans filtre : tous les restaurants publiés', () => {
    expect(run().results.organic).toHaveLength(24);
  });

  it('recherche en français sur le type de cuisine (« libanais »)', () => {
    const names = run({}, 'libanais').results.organic.map((r) => r.item.slug);
    expect(names).toContain('fictif-le-cedre');
    expect(names).toContain('fictif-beyrouth-express');
    expect(names.every((slug) => bySlug(slug).cuisines.includes('lebanese'))).toBe(true);
  });

  it('avec la position : tri du plus proche au plus loin, distances calculées', () => {
    const { results, distances } = run({}, '', VEVEY);
    const list = results.organic.map((r) => distances.get(r.item.id)!);
    expect(list).toEqual([...list].sort((a, b) => a - b));
    expect(list[0]).toBeLessThan(500);
  });

  it('filtres combinés : kebab + sans alcool + 2 km autour de Vevey', () => {
    const { results } = run(
      { cuisines: ['kebab'], noAlcohol: true, maxDistanceMeters: 2000 },
      '',
      VEVEY,
    );
    expect(results.organic.map((r) => r.item.slug)).toEqual([
      'fictif-kebab-du-lac',
      'fictif-grill-du-port',
    ]);
  });

  it('intégrité : un emplacement sponsorisé ne modifie pas la liste organique', () => {
    const without = run({}, '', VEVEY);
    const withAd = run({}, '', VEVEY, [placement('fictif-chicken-house')]);
    expect(withAd.results.organic).toEqual(without.results.organic);
    expect(withAd.results.sponsored.map((s) => [s.label, s.item.slug])).toEqual([
      ['sponsored', 'fictif-chicken-house'],
    ]);
  });

  it('intégrité : un sponsorisé qui ne correspond pas aux filtres n’est pas affiché', () => {
    const { results } = run({ cuisines: ['pizza'] }, '', null, [placement('fictif-chicken-house')]);
    expect(results.sponsored).toEqual([]);
  });
});
