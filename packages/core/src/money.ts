/**
 * Montants en francs suisses.
 *
 * On stocke toujours les montants en CENTIMES (nombres entiers) : les nombres
 * à virgule de JavaScript font des erreurs d'arrondi (0.1 + 0.2 = 0.30000000000000004).
 */

/** Formate des centimes en CHF selon la langue (ex. « CHF 25.00 » en fr-CH). */
export function formatChf(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CHF' }).format(cents / 100);
}

export interface VatSettings {
  /** TVA désactivée par défaut tant que l'entreprise n'est pas assujettie. */
  enabled: boolean;
  /** Taux en points de base : 810 = 8,1 %. */
  rateBasisPoints: number;
}

/** Calcule la TVA (arrondie au centime) d'un montant hors taxes. */
export function vatAmountCents(netCents: number, vat: VatSettings): number {
  if (!vat.enabled) return 0;
  return Math.round((netCents * vat.rateBasisPoints) / 10_000);
}
