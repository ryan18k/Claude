/**
 * Classement ORGANIQUE (non payant) des résultats.
 *
 * Règle d'intégrité : le classement organique ne dépend d'aucune donnée
 * de paiement. Pour le garantir :
 * 1. le type `OrganicCandidate` ne contient que des critères « neutres » ;
 * 2. `rankOrganic` recopie uniquement ces champs avant de trier : même si
 *    on lui passe un objet qui contient d'autres propriétés (abonnement…),
 *    elles sont ignorées ;
 * 3. des tests vérifient que deux restaurants identiques, l'un payant et
 *    l'autre non, obtiennent un classement équivalent.
 *
 * Critères, publiés dans la méthodologie (transparence vis-à-vis de la LCD) :
 * - avec une recherche texte : pertinence d'abord ;
 * - sinon, avec la position de l'utilisateur : distance d'abord ;
 * - sinon : note moyenne pondérée ;
 * - égalités départagées par la note pondérée, puis le nom, puis l'identifiant.
 */

export interface OrganicCandidate {
  id: string;
  name: string;
  /** Distance à l'utilisateur en mètres, ou null si position inconnue. */
  distanceMeters: number | null;
  /** Pertinence de la recherche texte entre 0 et 1 (0 sans recherche). */
  textScore: number;
  ratingAverage: number | null;
  ratingCount: number;
}

export type SortMode = 'relevance' | 'distance' | 'rating';

/** Champs autorisés : toute autre propriété est ignorée. */
const ALLOWED_KEYS = [
  'id',
  'name',
  'distanceMeters',
  'textScore',
  'ratingAverage',
  'ratingCount',
] as const satisfies readonly (keyof OrganicCandidate)[];

/** Paramètres de la moyenne pondérée (bayésienne). */
export const RATING_PRIOR_MEAN = 3.5;
export const RATING_PRIOR_WEIGHT = 5;

/**
 * Note pondérée : un restaurant avec une seule note de 5/5 ne passe pas devant
 * un restaurant noté 4,7/5 par 80 personnes. On « tire » chaque moyenne vers
 * une moyenne a priori, d'autant plus fort qu'il y a peu d'avis.
 */
export function weightedRating(average: number | null, count: number): number {
  if (average === null || count <= 0) return RATING_PRIOR_MEAN;
  return (
    (RATING_PRIOR_WEIGHT * RATING_PRIOR_MEAN + average * count) / (RATING_PRIOR_WEIGHT + count)
  );
}

export function defaultSortMode(hasQuery: boolean, hasPosition: boolean): SortMode {
  if (hasQuery) return 'relevance';
  if (hasPosition) return 'distance';
  return 'rating';
}

function pickAllowed(candidate: OrganicCandidate): OrganicCandidate {
  const copy = {} as Record<string, unknown>;
  for (const key of ALLOWED_KEYS) copy[key] = candidate[key];
  return copy as unknown as OrganicCandidate;
}

/** Renvoie les identifiants dans l'ordre organique. */
export function rankOrganic(candidates: readonly OrganicCandidate[], mode: SortMode): string[] {
  const clean = candidates.map(pickAllowed);

  const byRating = (a: OrganicCandidate, b: OrganicCandidate) =>
    weightedRating(b.ratingAverage, b.ratingCount) - weightedRating(a.ratingAverage, a.ratingCount);
  const byDistance = (a: OrganicCandidate, b: OrganicCandidate) =>
    (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY);
  const byRelevance = (a: OrganicCandidate, b: OrganicCandidate) => b.textScore - a.textScore;
  const tieBreak = (a: OrganicCandidate, b: OrganicCandidate) =>
    byRating(a, b) ||
    a.name.localeCompare(b.name, 'fr') ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

  const primary = mode === 'relevance' ? byRelevance : mode === 'distance' ? byDistance : () => 0;

  return clean.sort((a, b) => primary(a, b) || tieBreak(a, b)).map((c) => c.id);
}
