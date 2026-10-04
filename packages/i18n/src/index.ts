/**
 * Traductions partagées par l'app mobile (use-intl) et le web (next-intl).
 *
 * - Le français est la langue de RÉFÉRENCE : toutes les clés y existent.
 * - Les autres langues peuvent être incomplètes : chaque clé manquante
 *   retombe automatiquement sur le français (fusion dans `getMessages`).
 * - Les messages suivent le format ICU : {nom} pour une variable,
 *   {count, plural, one {…} other {…}} pour les pluriels, etc.
 */
import { LOCALES, type Locale } from '@swisshalal/core';
import ar from '../messages/ar.json';
import de from '../messages/de.json';
import en from '../messages/en.json';
import es from '../messages/es.json';
import fr from '../messages/fr.json';

export { LOCALES, type Locale };

export const DEFAULT_LOCALE: Locale = 'fr';

/**
 * Langues proposées dans l'app. Les autres langues sont prêtes techniquement
 * mais pas encore traduites : elles seront activées en phase 7.
 */
export const ENABLED_LOCALES: readonly Locale[] = ['fr'];

/** Arbre de messages : des chaînes, ou des objets qui contiennent d'autres messages. */
export interface Messages {
  [key: string]: string | Messages;
}

const CATALOGS: Record<Locale, Messages> = { fr, en, ar, es, de };

/** Nom de chaque langue dans sa propre langue (pour le sélecteur de langue). */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  de: 'Deutsch',
};

/** Langues qui s'écrivent de droite à gauche. */
const RTL_LOCALES: readonly Locale[] = ['ar'];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

export function textDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Choisit la langue de l'interface à partir des langues préférées de l'appareil
 * (ex. ["de-CH", "fr-CH"]). Repli sur le français.
 */
export function resolveLocale(
  preferred: readonly string[],
  available: readonly Locale[] = LOCALES,
): Locale {
  for (const tag of preferred) {
    const language = tag.toLowerCase().split(/[-_]/)[0] ?? '';
    if (isSupportedLocale(language) && available.includes(language)) return language;
  }
  return DEFAULT_LOCALE;
}

/**
 * Étiquette utilisée pour formater dates, nombres et prix (Intl).
 * On vise la Suisse quand c'est possible ; pour l'arabe, on garde les chiffres
 * occidentaux (0-9), plus lisibles pour les prix en CHF et les adresses suisses.
 */
export function formattingLocale(locale: Locale): string {
  switch (locale) {
    case 'fr':
      return 'fr-CH';
    case 'de':
      return 'de-CH';
    case 'en':
      return 'en-CH';
    case 'es':
      return 'es-CH';
    case 'ar':
      return 'ar-u-nu-latn';
  }
}

function isMessages(value: unknown): value is Messages {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fusion profonde : les valeurs de `override` remplacent celles de `base`. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] = isMessages(current) && isMessages(value) ? mergeMessages(current, value) : value;
  }
  return result;
}

/** Messages d'une langue, complétés par le français pour les clés manquantes. */
export function getMessages(locale: Locale): Messages {
  if (locale === DEFAULT_LOCALE) return CATALOGS.fr;
  return mergeMessages(CATALOGS.fr, CATALOGS[locale]);
}

/** Catalogue brut (sans repli), utile aux tests et aux outils de traduction. */
export function getRawCatalog(locale: Locale): Messages {
  return CATALOGS[locale];
}

/** Liste « à plat » des clés d'un catalogue : ["halal.level.unverified", …]. */
export function flattenKeys(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return isMessages(value) ? flattenKeys(value, path) : [path];
  });
}

/** Lit un message par sa clé à points (« halal.level.unverified »). */
export function lookup(messages: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split('.')) {
    if (!isMessages(node)) return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}
