/**
 * RÈGLE D'INTÉGRITÉ : un paiement n'achète que de la visibilité.
 * - le classement organique ne dépend d'aucune donnée de paiement ;
 * - les résultats sponsorisés sont séparés et toujours étiquetés.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import { rankOrganic, weightedRating, type OrganicCandidate } from '../ranking';
import type { RestaurantSummary } from '../restaurant';
import { buildSearchResults, type SponsoredPlacement } from '../sponsored';

const NOW = new Date('2026-10-04T10:00:00Z');

const candidates: OrganicCandidate[] = [
  {
    id: 'a',
    name: 'Alpha',
    distanceMeters: 900,
    textScore: 0.2,
    ratingAverage: 4.8,
    ratingCount: 40,
  },
  {
    id: 'b',
    name: 'Bravo',
    distanceMeters: 300,
    textScore: 0.9,
    ratingAverage: 3.9,
    ratingCount: 10,
  },
  {
    id: 'c',
    name: 'Charlie',
    distanceMeters: null,
    textScore: 0.5,
    ratingAverage: null,
    ratingCount: 0,
  },
  {
    id: 'd',
    name: 'Delta',
    distanceMeters: 1500,
    textScore: 0.9,
    ratingAverage: 4.5,
    ratingCount: 3,
  },
];

describe('classement organique', () => {
  it('trie par distance, pertinence ou note selon le mode', () => {
    expect(rankOrganic(candidates, 'distance')).toEqual(['b', 'a', 'd', 'c']);
    expect(rankOrganic(candidates, 'relevance')).toEqual(['d', 'b', 'c', 'a']);
    expect(rankOrganic(candidates, 'rating')).toEqual(['a', 'd', 'b', 'c']);
  });

  it('une seule note de 5/5 ne passe pas devant une bonne note très partagée', () => {
    expect(weightedRating(5, 1)).toBeLessThan(weightedRating(4.7, 80));
  });

  it('ignore toute donnée de paiement ajoutée aux candidats', () => {
    // On ajoute des propriétés « payantes » à certains candidats.
    const withPaidData = candidates.map((c, i) => ({
      ...c,
      plan: i % 2 === 0 ? 'premium' : 'free',
      isSponsored: i === 3,
      boost: 1000,
    }));
    for (const mode of ['distance', 'relevance', 'rating'] as const) {
      expect(rankOrganic(withPaidData, mode)).toEqual(rankOrganic(candidates, mode));
    }
  });

  it('deux restaurants identiques, l’un Premium et l’autre gratuit : même traitement', () => {
    const base = {
      name: 'Identique',
      distanceMeters: 500,
      textScore: 0.5,
      ratingAverage: 4,
      ratingCount: 10,
    };
    const premiumFirst = [
      { ...base, id: 'x', plan: 'premium' },
      { ...base, id: 'y', plan: 'free' },
    ];
    const freeFirst = [
      { ...base, id: 'x', plan: 'free' },
      { ...base, id: 'y', plan: 'premium' },
    ];
    // L'ordre ne dépend que de l'identifiant (départage neutre), pas de l'abonnement.
    expect(rankOrganic(premiumFirst, 'distance')).toEqual(['x', 'y']);
    expect(rankOrganic(freeFirst, 'distance')).toEqual(['x', 'y']);
  });

  it('les types ne contiennent aucun champ de paiement (vérifié à la compilation)', () => {
    expectTypeOf<keyof OrganicCandidate>().toEqualTypeOf<
      'id' | 'name' | 'distanceMeters' | 'textScore' | 'ratingAverage' | 'ratingCount'
    >();
    type PaidKeys =
      'plan' | 'subscription' | 'isSponsored' | 'sponsored' | 'boost' | 'stripeCustomerId';
    expectTypeOf<Extract<keyof RestaurantSummary, PaidKeys>>().toEqualTypeOf<never>();
  });
});

describe('résultats sponsorisés', () => {
  const ranked = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const placement = (
    restaurantId: string,
    position: number,
    extra: Partial<SponsoredPlacement> = {},
  ) =>
    ({
      restaurantId,
      kind: 'search',
      startsAt: '2026-10-01T00:00:00Z',
      endsAt: '2026-11-01T00:00:00Z',
      position,
      ...extra,
    }) satisfies SponsoredPlacement;

  it('la liste organique est identique avec ou sans emplacements sponsorisés', () => {
    const without = buildSearchResults(ranked, [], { now: NOW });
    const withAds = buildSearchResults(ranked, [placement('d', 1), placement('c', 2)], {
      now: NOW,
    });
    expect(withAds.organic).toEqual(without.organic);
    expect(withAds.organic.map((r) => r.item.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('chaque résultat sponsorisé porte l’étiquette « sponsored »', () => {
    const results = buildSearchResults(ranked, [placement('d', 1)], { now: NOW });
    expect(results.sponsored).toEqual([
      { kind: 'sponsored', label: 'sponsored', item: { id: 'd' } },
    ]);
    expectTypeOf(results.sponsored[0]!.label).toEqualTypeOf<'sponsored'>();
  });

  it('respecte le nombre maximal d’emplacements et l’ordre des positions', () => {
    const results = buildSearchResults(
      ranked,
      [placement('a', 3), placement('b', 1), placement('c', 2)],
      { now: NOW, maxSponsored: 2 },
    );
    expect(results.sponsored.map((r) => r.item.id)).toEqual(['b', 'c']);
  });

  it('ignore les emplacements expirés, futurs, d’un autre type ou en double', () => {
    const results = buildSearchResults(
      ranked,
      [
        placement('a', 1, { endsAt: '2026-10-02T00:00:00Z' }), // expiré
        placement('b', 2, { startsAt: '2026-10-10T00:00:00Z' }), // futur
        placement('c', 3, { kind: 'home' }), // écran d'accueil, pas la recherche
        placement('d', 4),
        placement('d', 5), // doublon
      ],
      { now: NOW, maxSponsored: 5 },
    );
    expect(results.sponsored.map((r) => r.item.id)).toEqual(['d']);
  });

  it('un restaurant sponsorisé qui ne correspond pas aux filtres n’apparaît pas', () => {
    const results = buildSearchResults(ranked, [placement('zzz-hors-filtres', 1)], { now: NOW });
    expect(results.sponsored).toEqual([]);
  });
});
