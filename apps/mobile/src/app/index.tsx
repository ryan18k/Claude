/**
 * Écran d'accueil (phase 1) : liste des restaurants.
 * La carte, la géolocalisation et les filtres arrivent en phase 2.
 *
 * Intégrité : les résultats sponsorisés sont dans une section SÉPARÉE et
 * étiquetée ; la liste organique est classée sans aucune donnée de paiement.
 */
import {
  buildSearchResults,
  DEFAULT_MAX_SPONSORED,
  defaultSortMode,
  rankOrganic,
} from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { FictionalBanner } from '@/components/Labels';
import { RestaurantRow } from '@/components/RestaurantRow';
import { dataSource } from '@/lib/data';
import { useRestaurants, useSponsoredPlacements } from '@/lib/queries';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

export default function HomeScreen() {
  const t = useTranslations();
  const colors = useColors();
  const restaurants = useRestaurants();
  const placements = useSponsoredPlacements();

  const results = useMemo(() => {
    if (!restaurants.data) return null;
    // 1. Classement organique : uniquement des critères neutres.
    const order = rankOrganic(
      restaurants.data.map((r) => ({
        id: r.id,
        name: r.name,
        distanceMeters: null, // position de l'utilisateur : phase 2
        textScore: 0, // recherche texte : phase 2
        ratingAverage: r.ratingAverage,
        ratingCount: r.ratingCount,
      })),
      defaultSortMode(false, false),
    );
    const byId = new Map(restaurants.data.map((r) => [r.id, r]));
    const ranked = order.map((id) => byId.get(id)).filter((r): r is RestaurantCard => Boolean(r));
    // 2. Emplacements sponsorisés : liste séparée, limitée et étiquetée.
    return buildSearchResults(ranked, placements.data ?? [], {
      now: new Date(),
      kind: 'search',
      maxSponsored: DEFAULT_MAX_SPONSORED,
    });
  }, [restaurants.data, placements.data]);

  if (restaurants.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel={t('common.loading')} color={colors.primary} />
      </View>
    );
  }

  if (restaurants.isError || !results) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text, fontSize: fontSize.body }}>{t('common.error')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => restaurants.refetch()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={results.organic}
      keyExtractor={(result) => result.item.id}
      renderItem={({ item: result }) => <RestaurantRow restaurant={result.item} />}
      ListHeaderComponent={
        <View style={styles.header}>
          {dataSource === 'demo' && <FictionalBanner messageKey="common.demoMode" />}
          {results.sponsored.length > 0 && (
            <View style={[styles.sponsoredSection, { borderColor: colors.border }]}>
              <Text
                style={[styles.sectionTitle, styles.inset, { color: colors.text }]}
                accessibilityRole="header"
              >
                {t('common.sponsoredSection')}
              </Text>
              <Text style={[styles.explanation, { color: colors.textMuted }]}>
                {t('common.sponsoredExplanation')}
              </Text>
              {results.sponsored.map((result) => (
                <RestaurantRow
                  key={`sponsored-${result.item.id}`}
                  restaurant={result.item}
                  sponsored
                />
              ))}
            </View>
          )}
          <Text style={[styles.sectionTitle, { color: colors.text }]} accessibilityRole="header">
            {t('list.count', { count: results.organic.length })}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={{ color: colors.text, padding: spacing.lg }}>{t('list.empty')}</Text>
      }
      onRefresh={() => {
        void restaurants.refetch();
        void placements.refetch();
      }}
      refreshing={restaurants.isRefetching}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  button: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { padding: spacing.lg, gap: spacing.md },
  sponsoredSection: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    paddingTop: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '700', paddingHorizontal: spacing.xs },
  inset: { paddingHorizontal: spacing.lg },
  explanation: { fontSize: fontSize.small, paddingHorizontal: spacing.lg },
});
