/**
 * Vocabulaire du domaine : les valeurs possibles des champs importants.
 *
 * Chaque liste est déclarée `as const` : TypeScript en déduit un type précis
 * (par ex. 'served' | 'not_served' | 'unknown') au lieu d'un simple `string`.
 * Ces valeurs sont identiques aux types ENUM de la base de données
 * (voir supabase/migrations) : si tu en modifies une, modifie l'autre.
 */

/** Niveau de vérification des informations halal d'un restaurant. */
export const HALAL_LEVELS = ['unverified', 'team_verified', 'certified_by_body'] as const;
export type HalalLevel = (typeof HALAL_LEVELS)[number];

/** Statut de la viande servie. */
export const MEAT_STATUSES = [
  'certified', // viande certifiée par un organisme (nom de l'organisme obligatoire)
  'supplier_declared', // le fournisseur déclare la viande halal, sans certificat
  'unknown',
  'no_meat', // restaurant sans viande (végétarien, poisson uniquement…)
] as const;
export type MeatStatus = (typeof MEAT_STATUSES)[number];

/** Périmètre halal de l'établissement. */
export const HALAL_SCOPES = ['fully_halal', 'halal_options', 'unknown'] as const;
export type HalalScope = (typeof HALAL_SCOPES)[number];

/** Réponse à trois états : oui / non / on ne sait pas. */
export const TRI_STATES = ['yes', 'no', 'unknown'] as const;
export type TriState = (typeof TRI_STATES)[number];

/** Méthode utilisée par l'équipe pour vérifier les informations. */
export const VERIFICATION_METHODS = [
  'on_site_visit',
  'phone_call',
  'documents',
  'certificate',
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

/** Gamme de prix : 1 = bon marché … 4 = haut de gamme. */
export const PRICE_RANGES = [1, 2, 3, 4] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

/** Langues de l'interface. Le français est la langue de référence. */
export const LOCALES = ['fr', 'en', 'ar', 'es', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export interface LatLng {
  lat: number;
  lng: number;
}

/** Informations halal publiées (modifiables uniquement par un admin). */
export interface HalalProfile {
  meat: MeatStatus;
  /** Organisme qui certifie la viande ; obligatoire pour afficher « certifiée ». */
  meatCertifierName: string | null;
  /** Nom court de cet organisme, pour les badges (facultatif). */
  meatCertifierShortName?: string | null;
  scope: HalalScope;
  alcoholServed: TriState;
  porkServed: TriState;
}

/** Dernière vérification enregistrée par l'équipe (sans la preuve, qui reste privée). */
export interface HalalVerification {
  level: HalalLevel;
  method: VerificationMethod | null;
  /** Date de la vérification, format ISO « AAAA-MM-JJ ». */
  verifiedAt: string | null;
  /** Description publique de la source (ex. « Visite sur place »). */
  sourceDescription: string | null;
  /** Organisme qui certifie l'établissement (niveau certified_by_body). */
  certifierName: string | null;
  /** Nom court de cet organisme, pour les badges (facultatif). */
  certifierShortName?: string | null;
  /** Fin de validité du certificat, format ISO « AAAA-MM-JJ ». */
  certificateExpiresAt: string | null;
  /** Une preuve (photo, document) est stockée dans le bucket privé. */
  hasEvidence: boolean;
  /** Date limite de la prochaine revérification (au plus tard 1 an après). */
  nextReviewDueAt: string | null;
}
