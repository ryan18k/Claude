import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { fontSize, spacing, useColors } from '@/theme';

/**
 * Étiquette « Sponsorisé » : OBLIGATOIRE sur tout contenu payant (LCD, publicité
 * clairement identifiable). Ne jamais afficher un résultat sponsorisé sans elle.
 */
export function SponsoredLabel() {
  const t = useTranslations();
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: colors.sponsoredBg }]}>
      <Text style={[styles.pillText, { color: colors.sponsoredText }]}>
        {t('common.sponsored')}
      </Text>
    </View>
  );
}

/** Bandeau signalant des données fictives (démonstration ou données de test). */
export function FictionalBanner({
  messageKey,
}: {
  messageKey: 'common.demoMode' | 'common.fictionalData';
}) {
  const t = useTranslations();
  const colors = useColors();
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.unverifiedBg }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.bannerText, { color: colors.unverifiedText }]}>{t(messageKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillText: { fontSize: fontSize.small, fontWeight: '700' },
  banner: { padding: spacing.md, borderRadius: 8 },
  bannerText: { fontSize: fontSize.small, fontWeight: '600' },
});
