import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { fontSize, spacing, useColors } from '@/theme';

/**
 * Étiquette « Sponsorisé » : OBLIGATOIRE sur tout contenu payant (LCD : la
 * publicité doit être clairement identifiable). Ne jamais afficher un résultat
 * sponsorisé sans elle.
 */
export function SponsoredLabel() {
  const t = useTranslations();
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: colors.sponsoredBg }]}>
      <Text style={[styles.text, { color: colors.sponsoredText }]}>{t('common.sponsored')}</Text>
    </View>
  );
}

/** Petite pastille signalant les données fictives du mode démonstration. */
export function DemoBadge() {
  const t = useTranslations();
  const colors = useColors();
  return (
    <View style={[styles.pill, { backgroundColor: colors.unverifiedBg }]}>
      <Text style={[styles.text, { color: colors.unverifiedText }]}>{t('common.demo')}</Text>
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
  text: { fontSize: fontSize.small, fontWeight: '700' },
});
