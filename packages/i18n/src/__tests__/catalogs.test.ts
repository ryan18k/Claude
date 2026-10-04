import {
  describeHalalStatus,
  HALAL_LEVELS,
  HALAL_SCOPES,
  MEAT_STATUSES,
  TRI_STATES,
  type HalalProfile,
  type HalalVerification,
} from '@swisshalal/core';
import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import {
  flattenKeys,
  formattingLocale,
  getMessages,
  getRawCatalog,
  isRtl,
  LOCALES,
  lookup,
  resolveLocale,
} from '../index';

const french = getRawCatalog('fr');
const frenchKeys = new Set(flattenKeys(french));

/** Noms des variables d'un message ICU, ex. « {date} » → ["date"]. */
function variableNames(message: string): string[] {
  return [...message.matchAll(/\{\s*([a-zA-Z_]+)\s*(?:,|\})/g)].map((m) => m[1]!).sort();
}

describe('catalogues de traduction', () => {
  it.each(LOCALES)('%s : chaque message est un ICU valide', (locale) => {
    const catalog = getRawCatalog(locale);
    for (const key of flattenKeys(catalog)) {
      const message = lookup(catalog, key)!;
      expect(() => new IntlMessageFormat(message, formattingLocale(locale)), key).not.toThrow();
    }
  });

  it.each(LOCALES.filter((l) => l !== 'fr'))(
    '%s : pas de clé inconnue du français, mêmes variables',
    (locale) => {
      const catalog = getRawCatalog(locale);
      for (const key of flattenKeys(catalog)) {
        expect(frenchKeys.has(key), `clé « ${key} » absente du français`).toBe(true);
        expect(variableNames(lookup(catalog, key)!), key).toEqual(
          variableNames(lookup(french, key)!),
        );
      }
    },
  );

  it('les langues incomplètes retombent sur le français', () => {
    for (const locale of LOCALES) {
      const merged = getMessages(locale);
      expect(new Set(flattenKeys(merged))).toEqual(frenchKeys);
    }
  });

  it('toutes les clés produites par le statut halal existent en français', () => {
    const verification: HalalVerification = {
      level: 'certified_by_body',
      method: 'certificate',
      verifiedAt: '2026-06-01',
      sourceDescription: 'Test',
      certifierName: 'Organisme Fictif',
      certificateExpiresAt: '2027-06-01',
      hasEvidence: true,
      nextReviewDueAt: null,
    };
    const keys = new Set<string>();
    for (const level of HALAL_LEVELS)
      for (const meat of MEAT_STATUSES)
        for (const scope of HALAL_SCOPES)
          for (const alcohol of TRI_STATES)
            for (const verifiedAt of [null, '2024-01-01', '2026-06-01']) {
              const profile: HalalProfile = {
                meat,
                meatCertifierName: 'Organisme Fictif',
                scope,
                alcoholServed: alcohol,
                porkServed: alcohol,
              };
              const d = describeHalalStatus(
                profile,
                { ...verification, level, verifiedAt },
                new Date('2026-10-04T10:00:00Z'),
              );
              for (const line of [d.headline, ...d.details, d.disclaimer, d.verificationLine]) {
                if (line) keys.add(line.key);
              }
              for (const warning of d.warnings) keys.add(`halal.warning.${warning}`);
            }
    for (const key of keys) expect(frenchKeys.has(key), key).toBe(true);
  });
});

describe('langue et sens d’écriture', () => {
  it('l’arabe s’affiche de droite à gauche, les autres de gauche à droite', () => {
    expect(isRtl('ar')).toBe(true);
    for (const l of ['fr', 'en', 'es', 'de'] as const) expect(isRtl(l)).toBe(false);
  });

  it('choisit la langue de l’appareil, sinon le français', () => {
    expect(resolveLocale(['de-CH', 'fr-CH'])).toBe('de');
    expect(resolveLocale(['it-CH', 'ar-MA'])).toBe('ar');
    expect(resolveLocale(['it-CH'])).toBe('fr');
    expect(resolveLocale([])).toBe('fr');
    // Seules les langues activées sont proposées.
    expect(resolveLocale(['de-CH'], ['fr'])).toBe('fr');
  });

  it('formate les messages avec des pluriels', () => {
    const message = lookup(getMessages('fr'), 'list.count')!;
    const format = (count: number) =>
      new IntlMessageFormat(message, formattingLocale('fr')).format({ count });
    expect(format(0)).toBe('Aucun restaurant');
    expect(format(1)).toBe('1 restaurant');
    expect(format(12)).toBe('12 restaurants');
  });
});
