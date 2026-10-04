import { isOpenAt } from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';
import { HalalLevelBadge } from './HalalStatus';
import { SponsoredLabel } from './Labels';

interface Props {
  restaurant: RestaurantCard;
  sponsored?: boolean;
}

/** Une ligne de la liste. Toute la ligne est un bouton qui ouvre la fiche. */
export function RestaurantRow({ restaurant, sponsored = false }: Props) {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const open = isOpenAt(restaurant.schedule);
  const cuisines = restaurant.cuisines.map((slug) => t(`cuisine.${slug}`)).join(', ');
  const price = t('restaurant.priceRange', { range: String(restaurant.priceRange ?? '') });
  const quickFacts = [
    restaurant.halal.scope === 'fully_halal' ? t('halal.short.fullyHalal') : null,
    restaurant.halal.alcoholServed === 'no' ? t('halal.short.noAlcohol') : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/restaurant/[slug]', params: { slug: restaurant.slug } })
      }
      accessibilityRole="button"
      accessibilityLabel={[
        sponsored ? t('common.sponsored') : null,
        restaurant.name,
        restaurant.city,
        cuisines,
        open ? t('restaurant.openNow') : t('restaurant.closedNow'),
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surface : colors.background,
        },
      ]}
    >
      {sponsored && <SponsoredLabel />}
      <Text style={[styles.name, { color: colors.text }]}>{restaurant.name}</Text>
      <Text style={[styles.meta, { color: colors.textMuted }]}>
        {restaurant.city} · {cuisines} · {price}
      </Text>
      <View style={styles.line}>
        <HalalLevelBadge halal={restaurant.halal} verification={restaurant.verification} />
        {quickFacts.length > 0 && (
          <Text style={[styles.meta, { color: colors.text }]}>{quickFacts.join(' · ')}</Text>
        )}
      </View>
      <Text style={[styles.status, { color: open ? colors.open : colors.closed }]}>
        {open ? t('restaurant.openNow') : t('restaurant.closedNow')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  name: { fontSize: fontSize.title, fontWeight: '700' },
  meta: { fontSize: fontSize.small },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  status: { fontSize: fontSize.small, fontWeight: '700' },
});
