import { describe, expect, it } from 'vitest';
import type { HalalProfile, HalalVerification, MeatStatus } from '../domain';
import { HALAL_LEVELS, MEAT_STATUSES } from '../domain';
import {
  describeHalalStatus,
  effectiveHalalLevel,
  reviewState,
  type HalalStatusDescription,
} from '../halal-status';
import {
  CERTIFIED_MEAT_NO_ALCOHOL,
  CERTIFIED_VALID,
  UNVERIFIED,
  VERIFIED_RECENTLY,
} from './fixtures';

const NOW = new Date('2026-10-04T10:00:00Z');
const TODAY = '2026-10-04';

describe('effectiveHalalLevel', () => {
  it('garde le niveau certifié si le certificat est complet et valable', () => {
    expect(effectiveHalalLevel(CERTIFIED_VALID, TODAY)).toBe('certified_by_body');
  });

  it('descend à « vérifié par l’équipe » si le certificat a expiré', () => {
    const expired = { ...CERTIFIED_VALID, certificateExpiresAt: '2026-09-30' };
    expect(effectiveHalalLevel(expired, TODAY)).toBe('team_verified');
  });

  it('descend à « vérifié par l’équipe » s’il manque la preuve ou l’organisme', () => {
    expect(effectiveHalalLevel({ ...CERTIFIED_VALID, hasEvidence: false }, TODAY)).toBe(
      'team_verified',
    );
    expect(effectiveHalalLevel({ ...CERTIFIED_VALID, certifierName: '  ' }, TODAY)).toBe(
      'team_verified',
    );
  });

  it('descend à « non vérifié » si la revérification annuelle est en retard', () => {
    const old = { ...VERIFIED_RECENTLY, verifiedAt: '2025-09-01' };
    expect(reviewState(old, TODAY)).toBe('overdue');
    expect(effectiveHalalLevel(old, TODAY)).toBe('unverified');
  });

  it('signale une revérification proche (30 jours avant)', () => {
    const soon = { ...VERIFIED_RECENTLY, verifiedAt: '2025-10-20' };
    expect(reviewState(soon, TODAY)).toBe('due_soon');
  });

  it('une échéance saisie au-delà d’un an est ramenée à un an', () => {
    const tooLate = {
      ...VERIFIED_RECENTLY,
      verifiedAt: '2025-09-01',
      nextReviewDueAt: '2027-01-01',
    };
    expect(reviewState(tooLate, TODAY)).toBe('overdue');
  });

  it('« vérifié » sans date ni méthode reste « non vérifié »', () => {
    expect(effectiveHalalLevel({ ...VERIFIED_RECENTLY, verifiedAt: null }, TODAY)).toBe(
      'unverified',
    );
    expect(effectiveHalalLevel({ ...VERIFIED_RECENTLY, method: null }, TODAY)).toBe('unverified');
  });
});

describe('describeHalalStatus', () => {
  it('certifié : titre avec organisme et date d’expiration au format suisse', () => {
    const d = describeHalalStatus(CERTIFIED_MEAT_NO_ALCOHOL, CERTIFIED_VALID, NOW);
    expect(d.level).toBe('certified_by_body');
    expect(d.headline).toEqual({
      key: 'halal.level.certified_by_body',
      params: { certifier: 'Organisme Fictif de Certification', expiresOn: '14.05.2027' },
    });
    expect(d.verificationLine).toEqual({
      key: 'halal.verifiedOn',
      params: { date: '15.05.2026', source: 'Certificat présenté par le restaurant' },
    });
  });

  it('viande déclarée certifiée mais non vérifiée : on le dit explicitement', () => {
    const d = describeHalalStatus(CERTIFIED_MEAT_NO_ALCOHOL, UNVERIFIED, NOW);
    expect(d.details[0]).toEqual({ key: 'halal.meat.certified_unverified' });
    expect(d.verificationLine).toBeNull();
  });

  it('certificat expiré : avertissement et pas de titre « certifié »', () => {
    const expired = { ...CERTIFIED_VALID, certificateExpiresAt: '2026-09-30' };
    const d = describeHalalStatus(CERTIFIED_MEAT_NO_ALCOHOL, expired, NOW);
    expect(d.headline.key).toBe('halal.level.team_verified');
    expect(d.warnings).toContain('certificate_expired');
  });

  it('revérification en retard : on affiche la date de la dernière vérification', () => {
    const old = { ...VERIFIED_RECENTLY, verifiedAt: '2025-09-01' };
    const d = describeHalalStatus(CERTIFIED_MEAT_NO_ALCOHOL, old, NOW);
    expect(d.level).toBe('unverified');
    expect(d.warnings).toContain('review_overdue');
    expect(d.verificationLine).toEqual({
      key: 'halal.lastVerifiedOn',
      params: { date: '01.09.2025' },
    });
  });

  it('l’avertissement sur les limites de la vérification est toujours présent', () => {
    for (const verification of [CERTIFIED_VALID, VERIFIED_RECENTLY, UNVERIFIED]) {
      expect(describeHalalStatus(CERTIFIED_MEAT_NO_ALCOHOL, verification, NOW).disclaimer).toEqual({
        key: 'halal.disclaimer',
      });
    }
  });
});

/**
 * RÈGLE D'INTÉGRITÉ : jamais « certifié » sans source.
 * On génère toutes les combinaisons possibles (niveau, viande, organisme,
 * preuve, dates…) et on vérifie qu'aucune ne produit le mot « certifié »
 * sans organisme nommé et sans vérification valable.
 */
describe('intégrité : jamais « certifié » sans source', () => {
  const certifierOptions = [null, '', 'Organisme Fictif'];
  const expiryOptions = [null, '2026-01-01', '2027-12-31'];
  const verifiedAtOptions = [null, '2024-01-01', '2026-06-01'];
  const methodOptions = [null, 'certificate'] as const;

  const combos: Array<{ profile: HalalProfile; verification: HalalVerification }> = [];
  for (const level of HALAL_LEVELS)
    for (const meat of MEAT_STATUSES as readonly MeatStatus[])
      for (const meatCertifier of certifierOptions)
        for (const certifier of certifierOptions)
          for (const hasEvidence of [false, true])
            for (const expiry of expiryOptions)
              for (const verifiedAt of verifiedAtOptions)
                for (const method of methodOptions)
                  combos.push({
                    profile: {
                      ...CERTIFIED_MEAT_NO_ALCOHOL,
                      meat,
                      meatCertifierName: meatCertifier,
                    },
                    verification: {
                      level,
                      method,
                      verifiedAt,
                      sourceDescription: null,
                      certifierName: certifier,
                      certificateExpiresAt: expiry,
                      hasEvidence,
                      nextReviewDueAt: null,
                    },
                  });

  const certifiedKeys = (d: HalalStatusDescription) =>
    [d.headline, ...d.details].filter(
      (line) => line.key === 'halal.level.certified_by_body' || line.key === 'halal.meat.certified',
    );

  it(`vérifie ${combos.length} combinaisons`, () => {
    expect(combos.length).toBeGreaterThan(1000);
    for (const { profile, verification } of combos) {
      const d = describeHalalStatus(profile, verification, NOW);
      for (const line of certifiedKeys(d)) {
        // Un organisme est toujours nommé…
        expect(line.params?.certifier?.trim()).toBeTruthy();
        // … et l'information n'est jamais « non vérifiée ».
        expect(d.level).not.toBe('unverified');
        if (line.key === 'halal.level.certified_by_body') {
          expect(verification.hasEvidence).toBe(true);
          expect(verification.certificateExpiresAt! >= TODAY).toBe(true);
        }
      }
    }
  });
});
