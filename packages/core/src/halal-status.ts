/**
 * Statut halal affiché aux utilisateurs.
 *
 * C'est ici que s'applique la règle légale la plus sensible du projet :
 * on n'affiche JAMAIS « certifié » sans organisme, preuve et date valides.
 * Toute l'interface (mobile et web) doit passer par `describeHalalStatus`
 * au lieu de construire ses propres phrases.
 *
 * La fonction ne renvoie pas de texte mais des CLÉS de traduction
 * (ex. 'halal.level.team_verified') et leurs paramètres : la traduction
 * se fait ensuite dans la langue de l'utilisateur (voir packages/i18n).
 */
import { addDays, formatDateCH, isoDateInZone } from './dates';
import type { HalalLevel, HalalProfile, HalalVerification } from './domain';

/** Délai maximal entre deux vérifications (exigence : au moins une fois par an). */
export const MAX_DAYS_BETWEEN_REVIEWS = 365;
/** On prévient l'admin 30 jours avant l'échéance. */
export const REVIEW_REMINDER_DAYS = 30;

export type ReviewState = 'current' | 'due_soon' | 'overdue' | 'never_verified';

/** Date limite de revérification : la plus proche entre celle saisie et 1 an après la vérification. */
export function reviewDueDate(verification: HalalVerification): string | null {
  if (!verification.verifiedAt) return null;
  const maxDue = addDays(verification.verifiedAt, MAX_DAYS_BETWEEN_REVIEWS);
  const due = verification.nextReviewDueAt;
  return due && due < maxDue ? due : maxDue;
}

export function reviewState(verification: HalalVerification, today: string): ReviewState {
  const due = reviewDueDate(verification);
  if (!due) return 'never_verified';
  if (today > due) return 'overdue';
  if (today >= addDays(due, -REVIEW_REMINDER_DAYS)) return 'due_soon';
  return 'current';
}

/** Le certificat de l'établissement est-il complet et encore valable aujourd'hui ? */
export function hasValidCertificate(verification: HalalVerification, today: string): boolean {
  return Boolean(
    verification.certifierName?.trim() &&
    verification.hasEvidence &&
    verification.verifiedAt &&
    verification.certificateExpiresAt &&
    verification.certificateExpiresAt >= today,
  );
}

/**
 * Niveau EFFECTIF, recalculé à partir des données et de la date du jour.
 * Il ne peut que descendre par rapport au niveau enregistré, jamais monter :
 * - certificat incomplet ou expiré → au mieux « vérifié par l'équipe » ;
 * - revérification en retard → « non vérifié ».
 */
export function effectiveHalalLevel(verification: HalalVerification, today: string): HalalLevel {
  if (verification.level === 'unverified') return 'unverified';
  if (!verification.verifiedAt || !verification.method) return 'unverified';
  if (reviewState(verification, today) === 'overdue') return 'unverified';
  if (verification.level === 'certified_by_body' && hasValidCertificate(verification, today)) {
    return 'certified_by_body';
  }
  return 'team_verified';
}

export interface TranslatableLine {
  key: string;
  params?: Record<string, string>;
}

export type HalalWarning = 'certificate_expired' | 'review_overdue' | 'certificate_incomplete';

export interface HalalStatusDescription {
  level: HalalLevel;
  headline: TranslatableLine;
  /** Détails : viande, périmètre, alcool, porc. */
  details: TranslatableLine[];
  /** « Informations vérifiées le JJ.MM.AAAA, source : … » quand c'est le cas. */
  verificationLine: TranslatableLine | null;
  warnings: HalalWarning[];
  /** Avertissement sur les limites de la vérification : toujours affiché. */
  disclaimer: TranslatableLine;
}

/** Peut-on employer le mot « certifiée » pour la viande ? */
export function canClaimCertifiedMeat(
  profile: HalalProfile,
  verification: HalalVerification,
  today: string,
): boolean {
  return (
    profile.meat === 'certified' &&
    Boolean(profile.meatCertifierName?.trim()) &&
    effectiveHalalLevel(verification, today) !== 'unverified'
  );
}

export function describeHalalStatus(
  profile: HalalProfile,
  verification: HalalVerification,
  now: Date = new Date(),
): HalalStatusDescription {
  const today = isoDateInZone(now);
  const level = effectiveHalalLevel(verification, today);
  const warnings: HalalWarning[] = [];

  if (verification.level === 'certified_by_body' && level !== 'certified_by_body') {
    const expired =
      verification.certificateExpiresAt !== null && verification.certificateExpiresAt < today;
    warnings.push(expired ? 'certificate_expired' : 'certificate_incomplete');
  }
  if (verification.level !== 'unverified' && reviewState(verification, today) === 'overdue') {
    warnings.push('review_overdue');
  }

  // --- Titre -----------------------------------------------------------------
  const headline: TranslatableLine =
    level === 'certified_by_body'
      ? {
          key: 'halal.level.certified_by_body',
          params: {
            certifier: verification.certifierName!.trim(),
            expiresOn: formatDateCH(verification.certificateExpiresAt!),
          },
        }
      : { key: `halal.level.${level}` };

  // --- Détails ---------------------------------------------------------------
  const details: TranslatableLine[] = [];
  if (profile.meat === 'certified') {
    details.push(
      canClaimCertifiedMeat(profile, verification, today)
        ? { key: 'halal.meat.certified', params: { certifier: profile.meatCertifierName!.trim() } }
        : // La viande est déclarée certifiée mais ce n'est pas vérifié : on le dit.
          { key: 'halal.meat.certified_unverified' },
    );
  } else {
    details.push({ key: `halal.meat.${profile.meat}` });
  }
  details.push({ key: `halal.scope.${profile.scope}` });
  details.push({ key: `halal.alcohol.${profile.alcoholServed}` });
  details.push({ key: `halal.pork.${profile.porkServed}` });

  // --- Ligne de vérification -------------------------------------------------
  const verificationLine: TranslatableLine | null =
    verification.verifiedAt && level !== 'unverified'
      ? {
          key: 'halal.verifiedOn',
          params: {
            date: formatDateCH(verification.verifiedAt),
            source: verification.sourceDescription?.trim() || '—',
          },
        }
      : verification.verifiedAt
        ? { key: 'halal.lastVerifiedOn', params: { date: formatDateCH(verification.verifiedAt) } }
        : null;

  return {
    level,
    headline,
    details,
    verificationLine,
    warnings,
    disclaimer: { key: 'halal.disclaimer' },
  };
}
