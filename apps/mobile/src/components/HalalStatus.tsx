/**
 * Affichage du statut halal.
 *
 * Ces composants n'écrivent AUCUNE phrase eux-mêmes : ils affichent ce que
 * renvoie `describeHalalStatus` (packages/core), qui garantit qu'on n'affiche
 * jamais « certifié » sans organisme, preuve et date valides.
 */
import {
  describeHalalStatus,
  type HalalLevel,
  type HalalProfile,
  type HalalVerification,
} from '@swisshalal/core';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTranslateLine } from '@/lib/i18n';
import { fontSize, spacing, useColors, type Palette } from '@/theme';

function levelColors(level: HalalLevel, colors: Palette) {
  switch (level) {
    case 'certified_by_body':
      return { backgroundColor: colors.certifiedBg, color: colors.certifiedText };
    case 'team_verified':
      return { backgroundColor: colors.verifiedBg, color: colors.verifiedText };
    case 'unverified':
      return { backgroundColor: colors.unverifiedBg, color: colors.unverifiedText };
  }
}

interface Props {
  halal: HalalProfile;
  verification: HalalVerification;
}

/** Petite étiquette pour la liste : niveau de vérification (avec l'organisme si certifié). */
export function HalalLevelBadge({ halal, verification }: Props) {
  const t = useTranslations();
  const colors = useColors();
  const status = describeHalalStatus(halal, verification);
  const { backgroundColor, color } = levelColors(status.level, colors);
  const label = t(`halal.badge.${status.level}`, {
    certifier: status.headline.params?.certifier ?? '',
  });
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

/** Bloc complet de la fiche restaurant. */
export function HalalStatusBlock({ halal, verification }: Props) {
  const t = useTranslations();
  const translate = useTranslateLine();
  const colors = useColors();
  const status = describeHalalStatus(halal, verification);
  const { backgroundColor, color } = levelColors(status.level, colors);

  return (
    <View
      style={[styles.block, { borderColor: colors.border, backgroundColor: colors.surface }]}
      accessible
      accessibilityLabel={[
        t('halal.title'),
        translate(status.headline),
        ...status.details.map(translate),
        status.verificationLine ? translate(status.verificationLine) : '',
        ...status.warnings.map((w) => t(`halal.warning.${w}`)),
        translate(status.disclaimer),
      ].join('. ')}
    >
      <Text style={[styles.blockTitle, { color: colors.text }]} accessibilityRole="header">
        {t('halal.title')}
      </Text>
      <View style={[styles.headline, { backgroundColor }]}>
        <Text style={[styles.headlineText, { color }]}>{translate(status.headline)}</Text>
      </View>

      {status.details.map((line) => (
        <Text key={line.key} style={[styles.detail, { color: colors.text }]}>
          • {translate(line)}
        </Text>
      ))}

      {status.verificationLine && (
        <Text style={[styles.detail, { color: colors.textMuted }]}>
          {translate(status.verificationLine)}
        </Text>
      )}

      {status.warnings.map((warning) => (
        <Text
          key={warning}
          style={[styles.warning, { color: colors.warningText, backgroundColor: colors.warningBg }]}
        >
          {t(`halal.warning.${warning}`)}
        </Text>
      ))}

      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        {translate(status.disclaimer)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  badgeText: { fontSize: fontSize.small, fontWeight: '600' },
  block: { borderWidth: 1, borderRadius: 12, padding: spacing.lg, gap: spacing.sm },
  blockTitle: { fontSize: fontSize.title, fontWeight: '700' },
  headline: { borderRadius: 8, padding: spacing.md },
  headlineText: { fontSize: fontSize.body, fontWeight: '700' },
  detail: { fontSize: fontSize.body, lineHeight: 22 },
  warning: { fontSize: fontSize.body, borderRadius: 8, padding: spacing.sm, fontWeight: '600' },
  disclaimer: { fontSize: fontSize.small, lineHeight: 18, marginTop: spacing.sm },
});
