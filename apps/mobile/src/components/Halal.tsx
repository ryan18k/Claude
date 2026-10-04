/**
 * Affichage du statut halal, en version épurée.
 *
 * Ces composants n'inventent aucune phrase : ils affichent ce que renvoie
 * `describeHalalStatus` (packages/core), qui garantit qu'on n'écrit jamais
 * « certifié » sans organisme, preuve et date valides.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  describeHalalStatus,
  type HalalLevel,
  type HalalProfile,
  type HalalVerification,
  type TranslatableLine,
} from '@swisshalal/core';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTranslateLine } from '@/lib/i18n';
import { fontSize, spacing, useColors, type Palette } from '@/theme';

interface Props {
  halal: HalalProfile;
  verification: HalalVerification;
}

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

const LEVEL_ICON: Record<HalalLevel, ComponentProps<typeof Ionicons>['name']> = {
  certified_by_body: 'shield-checkmark',
  team_verified: 'checkmark-circle',
  unverified: 'help-circle',
};

/** Badge court pour la liste et la carte : « Certifié · <organisme> », « Vérifié », « Non vérifié ». */
export function HalalBadge({ halal, verification }: Props) {
  const t = useTranslations();
  const colors = useColors();
  const status = describeHalalStatus(halal, verification);
  const { backgroundColor, color } = levelColors(status.level, colors);
  const certifier = verification.certifierShortName || verification.certifierName || '';
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Ionicons name={LEVEL_ICON[status.level]} size={14} color={color} />
      <Text style={[styles.badgeText, { color }]} numberOfLines={1}>
        {t(`halal.badge.${status.level}`, { certifier })}
      </Text>
    </View>
  );
}

type Tone = 'good' | 'bad' | 'neutral';

/** Icône d'une ligne de détail, déduite de sa clé (ex. 'halal.alcohol.no' → bon). */
function toneOf(line: TranslatableLine): Tone {
  const value = line.key.split('.').pop();
  if (line.key.startsWith('halal.alcohol.') || line.key.startsWith('halal.pork.')) {
    return value === 'no' ? 'good' : value === 'yes' ? 'bad' : 'neutral';
  }
  if (line.key === 'halal.meat.certified' || line.key === 'halal.scope.fully_halal') return 'good';
  if (line.key === 'halal.scope.halal_options') return 'bad';
  return 'neutral';
}

const TONE_ICON: Record<Tone, ComponentProps<typeof Ionicons>['name']> = {
  good: 'checkmark',
  bad: 'close',
  neutral: 'remove',
};

/** Bloc de la fiche restaurant : niveau, 4 lignes courtes, date/source et avertissement. */
export function HalalDetails({ halal, verification }: Props) {
  const t = useTranslations();
  const translate = useTranslateLine();
  const colors = useColors();
  const status = describeHalalStatus(halal, verification);
  const { backgroundColor, color } = levelColors(status.level, colors);
  const toneColor: Record<Tone, string> = {
    good: colors.open,
    bad: colors.closed,
    neutral: colors.textMuted,
  };

  return (
    <View style={styles.block}>
      <View style={[styles.headline, { backgroundColor }]}>
        <Ionicons name={LEVEL_ICON[status.level]} size={20} color={color} />
        <Text style={[styles.headlineText, { color }]}>{translate(status.headline)}</Text>
      </View>

      {status.details.map((line) => {
        const tone = toneOf(line);
        return (
          <View key={line.key} style={styles.row}>
            <Ionicons name={TONE_ICON[tone]} size={18} color={toneColor[tone]} />
            <Text style={[styles.rowText, { color: colors.text }]}>{translate(line)}</Text>
          </View>
        );
      })}

      {status.warnings.map((warning) => (
        <Text key={warning} style={[styles.small, { color: colors.warningText }]}>
          {t(`halal.warning.${warning}`)}
        </Text>
      ))}
      {status.verificationLine && (
        <Text style={[styles.small, { color: colors.textMuted }]}>
          {translate(status.verificationLine)}
        </Text>
      )}
      <Text style={[styles.small, { color: colors.textMuted }]}>
        {translate(status.disclaimer)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: '100%',
  },
  badgeText: { fontSize: fontSize.small, fontWeight: '600', flexShrink: 1 },
  block: { gap: spacing.sm },
  headline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 10,
    padding: spacing.md,
  },
  headlineText: { fontSize: fontSize.body, fontWeight: '700', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { fontSize: fontSize.body, flexShrink: 1 },
  small: { fontSize: fontSize.small, lineHeight: 18 },
});
