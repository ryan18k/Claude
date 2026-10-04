/**
 * Filtres (fenêtre modale). On modifie un « brouillon » ; rien n'est appliqué
 * tant qu'on n'a pas appuyé sur « Voir N restaurants ».
 */
import {
  DISTANCE_OPTIONS,
  EMPTY_FILTERS,
  formatDistance,
  type SearchFilters,
} from '@swisshalal/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { Chip } from '@/components/Chip';
import { useFormattingLocale } from '@/lib/i18n';
import { useRestaurants } from '@/lib/queries';
import { useExploreResults, useSearch } from '@/lib/search';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

type HalalToggle = 'certifiedMeatOnly' | 'noAlcohol' | 'fullyHalalOnly' | 'verifiedOnly';
const HALAL_TOGGLES: Array<[HalalToggle, string]> = [
  ['certifiedMeatOnly', 'filters.certifiedMeat'],
  ['noAlcohol', 'filters.noAlcohol'],
  ['fullyHalalOnly', 'filters.fullyHalal'],
  ['verifiedOnly', 'filters.verifiedOnly'],
];

export default function FiltersScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useFormattingLocale();
  const { filters, setFilters, position, locate, locationStatus } = useSearch();
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const { results } = useExploreResults({ filters: draft });
  const restaurants = useRestaurants();

  // Types de cuisine réellement présents dans les données, dans l'ordre alphabétique traduit.
  const cuisines = [...new Set((restaurants.data ?? []).flatMap((r) => r.cuisines))].sort((a, b) =>
    t(`cuisine.${a}`).localeCompare(t(`cuisine.${b}`), locale),
  );
  const update = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));

  async function chooseDistance(meters: number | undefined) {
    if (meters !== undefined && !position) {
      // Le filtre de distance a besoin de la position : on la demande seulement maintenant.
      const found = await locate();
      if (!found) return;
    }
    update({ maxDistanceMeters: meters });
  }

  const count = results?.organic.length ?? 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t('filters.distance')}>
          <View style={styles.chips}>
            <Chip
              label={t('filters.anyDistance')}
              selected={draft.maxDistanceMeters === undefined}
              onPress={() => chooseDistance(undefined)}
            />
            {DISTANCE_OPTIONS.map((meters) => (
              <Chip
                key={meters}
                label={formatDistance(meters, locale)}
                selected={draft.maxDistanceMeters === meters}
                onPress={() => chooseDistance(meters)}
              />
            ))}
          </View>
          {(locationStatus === 'denied' || locationStatus === 'error') && (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('filters.needsLocation')}
            </Text>
          )}
        </Section>

        <Section title={t('filters.price')}>
          <View style={styles.chips}>
            <Chip
              label={t('filters.anyPrice')}
              selected={draft.maxPriceRange === undefined}
              onPress={() => update({ maxPriceRange: undefined })}
            />
            <Chip
              label={t('filters.cheap')}
              selected={draft.maxPriceRange === 1}
              onPress={() => update({ maxPriceRange: 1 })}
            />
            <Chip
              label={t('filters.medium')}
              selected={draft.maxPriceRange === 2}
              onPress={() => update({ maxPriceRange: 2 })}
            />
          </View>
        </Section>

        <Section title={t('filters.cuisine')}>
          <View style={styles.chips}>
            {cuisines.map((slug) => {
              const selected = draft.cuisines.includes(slug);
              return (
                <Chip
                  key={slug}
                  label={t(`cuisine.${slug}`)}
                  selected={selected}
                  onPress={() =>
                    update({
                      cuisines: selected
                        ? draft.cuisines.filter((c) => c !== slug)
                        : [...draft.cuisines, slug],
                    })
                  }
                />
              );
            })}
          </View>
        </Section>

        <Section title={t('filters.halal')}>
          <View style={styles.chips}>
            {HALAL_TOGGLES.map(([key, label]) => (
              <Chip
                key={key}
                label={t(label)}
                selected={draft[key]}
                onPress={() => update({ [key]: !draft[key] })}
              />
            ))}
          </View>
        </Section>

        <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('filters.openNow')}</Text>
          <Switch
            value={draft.openNow}
            onValueChange={(openNow) => update({ openNow })}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel={t('filters.openNow')}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setDraft(EMPTY_FILTERS)}
          style={styles.reset}
        >
          <Text style={[styles.resetText, { color: colors.text }]}>{t('filters.reset')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setFilters(draft);
            router.back();
          }}
          style={[styles.apply, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.applyText, { color: colors.onPrimary }]}>
            {t('filters.show', { count })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { fontSize: fontSize.small },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reset: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center', paddingHorizontal: spacing.md },
  resetText: { fontSize: fontSize.body, fontWeight: '600', textDecorationLine: 'underline' },
  apply: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE + 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { fontSize: fontSize.body, fontWeight: '700' },
});
