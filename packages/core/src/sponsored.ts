/**
 * Résultats SPONSORISÉS, toujours séparés des résultats organiques.
 *
 * Règles d'intégrité appliquées ici :
 * - les résultats ont la forme { sponsored, organic } : deux listes distinctes ;
 * - la liste organique est rendue EXACTEMENT telle qu'elle a été classée
 *   (un restaurant sponsorisé y garde sa place naturelle, ni plus ni moins) ;
 * - chaque élément sponsorisé porte l'étiquette 'sponsored', imposée par le type ;
 * - un emplacement sponsorisé n'apparaît que si le restaurant correspond aux
 *   filtres de l'utilisateur (il doit faire partie des résultats organiques) ;
 * - le nombre d'emplacements est limité.
 */

export type PlacementKind = 'search' | 'home';

export interface SponsoredPlacement {
  restaurantId: string;
  kind: PlacementKind;
  /** Instants ISO (ex. "2026-10-01T00:00:00Z"). */
  startsAt: string;
  endsAt: string;
  /** Ordre d'affichage entre emplacements (1 = premier). */
  position: number;
}

export interface SponsoredResult<T> {
  kind: 'sponsored';
  /** Étiquette obligatoire, à afficher (« Sponsorisé »). */
  label: 'sponsored';
  item: T;
}

export interface OrganicResult<T> {
  kind: 'organic';
  /** Rang organique, à partir de 1. */
  rank: number;
  item: T;
}

export interface SearchResults<T> {
  sponsored: SponsoredResult<T>[];
  organic: OrganicResult<T>[];
}

/** Nombre maximal de résultats sponsorisés par défaut (configurable par l'admin). */
export const DEFAULT_MAX_SPONSORED = 2;

export function isPlacementActive(placement: SponsoredPlacement, now: Date): boolean {
  const t = now.getTime();
  return Date.parse(placement.startsAt) <= t && t < Date.parse(placement.endsAt);
}

/**
 * Assemble les résultats.
 * @param organicRanked  restaurants déjà filtrés et classés par `rankOrganic`
 */
export function buildSearchResults<T extends { id: string }>(
  organicRanked: readonly T[],
  placements: readonly SponsoredPlacement[],
  options: { now: Date; kind?: PlacementKind; maxSponsored?: number },
): SearchResults<T> {
  const kind = options.kind ?? 'search';
  const max = Math.max(0, options.maxSponsored ?? DEFAULT_MAX_SPONSORED);
  const byId = new Map(organicRanked.map((item) => [item.id, item]));

  const seen = new Set<string>();
  const sponsored: SponsoredResult<T>[] = [];
  const active = placements
    .filter((p) => p.kind === kind && isPlacementActive(p, options.now))
    .sort((a, b) => a.position - b.position);

  for (const placement of active) {
    if (sponsored.length >= max) break;
    const item = byId.get(placement.restaurantId);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    sponsored.push({ kind: 'sponsored', label: 'sponsored', item });
  }

  const organic: OrganicResult<T>[] = organicRanked.map((item, index) => ({
    kind: 'organic',
    rank: index + 1,
    item,
  }));

  return { sponsored, organic };
}
