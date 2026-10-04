/**
 * Écran principal, volontairement épuré :
 * - une carte plein écran (ou la liste, au choix) ;
 * - une barre de recherche avec un bouton Filtres ;
 * - un bouton « Liste / Carte » et un bouton « Me localiser ».
 * Toucher un point de la carte affiche un aperçu du restaurant ; toucher
 * l'aperçu ouvre la fiche.
 *
 * Intégrité : la liste affiche d'abord les résultats sponsorisés, étiquetés
 * « Sponsorisé », puis la liste organique, classée sans aucune donnée de paiement.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { countActiveFilters } from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { DemoBadge } from '@/components/Labels';
import { FOCUS_ZOOM, type MapFocus } from '@/components/map/mapConfig';
import { mapAvailable, RestaurantMap } from '@/components/map/RestaurantMap';
import { RestaurantListItem } from '@/components/RestaurantListItem';
import { SearchBar } from '@/components/SearchBar';
import { dataSource } from '@/lib/data';
import { useExploreResults, useSearch } from '@/lib/search';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

type Row = { kind: 'sponsored' | 'organic'; item: RestaurantCard };

export default function ExploreScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { query, setQuery, filters, position, locate, locationStatus } = useSearch();
  const { results, distances, matching, isPending, isError, refetch } = useExploreResults();
  const [mode, setMode] = useState<'map' | 'list'>(mapAvailable ? 'map' : 'list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);

  const openRestaurant = (slug: string) =>
    router.push({ pathname: '/restaurant/[slug]', params: { slug } });
  const selected = matching?.find((r) => r.id === selectedId) ?? null;
  const topOffset = insets.top + spacing.sm;
  const bottomOffset = insets.bottom + spacing.lg;
  const aboveButtons = bottomOffset + MIN_TOUCH_SIZE + spacing.md;
  // Hauteur occupée en haut par la barre de recherche (et le badge « Démo »).
  const overlayHeight = topOffset + MIN_TOUCH_SIZE + spacing.lg + (dataSource === 'demo' ? 32 : 0);

  async function handleLocate() {
    const found = await locate();
    if (found) setFocus({ center: found, zoom: FOCUS_ZOOM, key: Date.now() });
  }

  const rows: Row[] = results
    ? [
        ...results.sponsored.map((r) => ({ kind: 'sponsored' as const, item: r.item })),
        ...results.organic.map((r) => ({ kind: 'organic' as const, item: r.item })),
      ]
    : [];

  let content;
  if (isPending) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel={t('common.loading')} color={colors.primary} />
      </View>
    );
  } else if (isError || !results) {
    content = (
      <View style={styles.center}>
        <Text style={{ color: colors.text, fontSize: fontSize.body }}>{t('common.error')}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={refetch}
          style={[styles.pill, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.pillText, { color: colors.onPrimary }]}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  } else if (mode === 'map') {
    content = (
      <RestaurantMap
        restaurants={matching ?? []}
        selectedId={selectedId}
        onSelect={setSelectedId}
        userPosition={position}
        focus={focus}
        bottomInset={aboveButtons}
      />
    );
  } else {
    content = (
      <FlatList
        data={rows}
        keyExtractor={(row) => `${row.kind}-${row.item.id}`}
        contentContainerStyle={{
          paddingTop: overlayHeight,
          paddingBottom: aboveButtons + spacing.lg,
        }}
        ListHeaderComponent={
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {t('explore.count', { count: results.organic.length })}
          </Text>
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        renderItem={({ item: row }) => (
          <RestaurantListItem
            restaurant={row.item}
            sponsored={row.kind === 'sponsored'}
            distance={distances?.get(row.item.id)}
            onPress={() => openRestaurant(row.item.slug)}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>{t('explore.empty')}</Text>
        }
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {content}

      {/* Barre de recherche flottante */}
      <View style={[styles.top, { top: topOffset }]} pointerEvents="box-none">
        <SearchBar
          value={query}
          onChangeText={setQuery}
          activeFilters={countActiveFilters(filters)}
          onFiltersPress={() => router.push('/filters')}
        />
        <View style={styles.badges} pointerEvents="none">
          {dataSource === 'demo' && <DemoBadge />}
          {locationStatus === 'denied' && (
            <Text style={[styles.hint, { color: colors.text, backgroundColor: colors.background }]}>
              {t('explore.locationDenied')}
            </Text>
          )}
        </View>
      </View>

      {/* Aperçu du restaurant sélectionné sur la carte */}
      {mode === 'map' && selected && (
        <View style={[styles.peek, { bottom: aboveButtons }]}>
          <RestaurantListItem
            restaurant={selected}
            distance={distances?.get(selected.id)}
            onPress={() => openRestaurant(selected.slug)}
            style={[styles.card, { shadowColor: '#000' }]}
          />
        </View>
      )}

      {/* Boutons du bas : Liste/Carte au centre, « Me localiser » à droite */}
      <View style={[styles.bottom, { bottom: bottomOffset }]} pointerEvents="box-none">
        {mapAvailable && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSelectedId(null);
              setMode(mode === 'map' ? 'list' : 'map');
            }}
            style={[styles.pill, { backgroundColor: colors.text, shadowColor: '#000' }]}
          >
            <Ionicons
              name={mode === 'map' ? 'list' : 'map-outline'}
              size={18}
              color={colors.background}
            />
            <Text style={[styles.pillText, { color: colors.background }]}>
              {mode === 'map' ? t('explore.showList') : t('explore.showMap')}
            </Text>
          </Pressable>
        )}
        {mode === 'map' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('explore.locate')}
            onPress={handleLocate}
            style={[styles.round, { backgroundColor: colors.background, shadowColor: '#000' }]}
          >
            {locationStatus === 'locating' ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="locate" size={22} color={colors.primary} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const shadow = {
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  top: { position: 'absolute', left: spacing.lg, right: spacing.lg, gap: spacing.sm },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  hint: { fontSize: fontSize.small, borderRadius: 6, padding: spacing.sm, overflow: 'hidden' },
  peek: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  card: { borderRadius: 16, ...shadow },
  bottom: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    minHeight: MIN_TOUCH_SIZE + 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    ...shadow,
  },
  pillText: { fontSize: fontSize.body, fontWeight: '700' },
  round: {
    position: 'absolute',
    right: 0,
    width: MIN_TOUCH_SIZE + 4,
    height: MIN_TOUCH_SIZE + 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  count: { fontSize: fontSize.small, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  separator: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.lg },
  empty: { fontSize: fontSize.body, padding: spacing.xl, textAlign: 'center' },
});
