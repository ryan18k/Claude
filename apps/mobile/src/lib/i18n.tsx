/**
 * Traductions dans l'app mobile.
 *
 * - La langue est choisie d'après les réglages du téléphone, parmi les langues
 *   activées (français seulement jusqu'à la phase 7).
 * - L'arabe s'affiche de droite à gauche. Avec React Native, changer le sens
 *   d'écriture ne prend effet qu'au prochain démarrage de l'app.
 */
import {
  ENABLED_LOCALES,
  formattingLocale,
  getMessages,
  isRtl,
  resolveLocale,
  type Locale,
} from '@swisshalal/i18n';
import type { TranslatableLine } from '@swisshalal/core';
import { getLocales } from 'expo-localization';
import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { IntlProvider, useLocale, useTranslations } from 'use-intl';

export function detectLocale(): Locale {
  return resolveLocale(
    getLocales().map((l) => l.languageTag),
    ENABLED_LOCALES,
  );
}

function applyTextDirection(locale: Locale): void {
  const rtl = isRtl(locale);
  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL !== rtl) I18nManager.forceRTL(rtl);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useMemo(detectLocale, []);
  useEffect(() => applyTextDirection(locale), [locale]);
  return (
    <IntlProvider
      locale={formattingLocale(locale)}
      messages={getMessages(locale)}
      timeZone="Europe/Zurich"
      // Une clé manquante affiche la clé elle-même : visible, mais sans planter l'app.
      getMessageFallback={({ key }) => key}
      onError={(error) => {
        if (__DEV__) console.warn(error.message);
      }}
    >
      {children}
    </IntlProvider>
  );
}

/** Traduit une « ligne traduisible » produite par packages/core (clé + paramètres). */
export function useTranslateLine() {
  const t = useTranslations();
  return (line: TranslatableLine) => t(line.key, line.params);
}

/** Étiquette de langue pour les formats de date, nombre et prix (ex. "fr-CH"). */
export function useFormattingLocale(): string {
  return useLocale();
}
