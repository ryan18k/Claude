/**
 * Avis : validation des données saisies par l'utilisateur.
 *
 * Les protections contre les faux avis (âge du compte, limites par jour,
 * détection des rafales) sont imposées par la base de données, car un
 * client modifié pourrait contourner une vérification faite dans l'app.
 * Ici, on valide seulement la forme, pour afficher des erreurs claires.
 */
import { z } from 'zod';

/** Confirmations précises qu'un client peut apporter avec son avis. */
export const REVIEW_CLAIMS = [
  'certified_meat_confirmed',
  'no_alcohol_confirmed',
  'alcohol_seen',
  'fully_halal_confirmed',
  'pork_seen',
] as const;
export type ReviewClaim = (typeof REVIEW_CLAIMS)[number];

export const REVIEW_BODY_MAX_LENGTH = 2000;

export const reviewInputSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().max(REVIEW_BODY_MAX_LENGTH).default(''),
    claims: z.array(z.enum(REVIEW_CLAIMS)).max(REVIEW_CLAIMS.length).default([]),
  })
  .refine(
    (input) =>
      !(input.claims.includes('no_alcohol_confirmed') && input.claims.includes('alcohol_seen')),
    {
      message: 'Une confirmation « pas d’alcool » ne peut pas aller avec « alcool vu ».',
      path: ['claims'],
    },
  );

export type ReviewInput = z.infer<typeof reviewInputSchema>;

export const REPORT_REASONS = [
  'spam',
  'fake_review',
  'offensive',
  'defamatory',
  'illegal',
  'incorrect_information',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
