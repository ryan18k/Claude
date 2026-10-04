import { formatDistance, isOpenAt } from '@swisshalal/core';
import type { RestaurantCard } from '@swisshalal/supabase';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslations } from 'use-intl';
import { useFormattingLocale } from '@/lib/i18n';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';
import { HalalBadge } from './Halal';
import { SponsoredLabel } from './Labels';

interface Props {
  restaurant: RestaurantCard;
  distance?: number;
  sponsored?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Restaurant en 3 lignes : nom (+ distance), cuisine · prix, badge halal + ouvert/fermé.
 * Utilisé dans la liste et dans la carte d'aperçu au-dessus de la carte.
 */
export function RestaurantListItem({
  restaurant,
  distance,
  sponsored = false,
  onPress,
  style,
}: Props) {
  const t = useTranslations();
  const colors = useColors();
  const locale = useFormattingLocale();
  const open = isOpenAt(restaurant.schedule);
  const cuisines = restaurant.cuisines.map((slug) => t(`cuisine.${slug}`)).join(', ');
  const price = t('restaurant.priceRange', { range: String(restaurant.priceRange ?? '') });
  const distanceText = distance !== undefined ? formatDistance(distance, locale) : null;
  const openText = open ? t('restaurant.openNow') : t('restaurant.closedNow');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        sponsored ? t('common.sponsored') : null,
        restaurant.name,
        cuisines,
        distanceText,
        openText,
      ]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: pressed ? colors.surface : colors.background },
        style,
      ]}
    >
      {sponsored && <SponsoredLabel />}
      <View style={styles.line}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        {distanceText && (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{distanceText}</Text>
        )}
      </View>
      <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
        {cuisines} · {price}
      </Text>
      <View style={styles.line}>
        <HalalBadge halal={restaurant.halal} verification={restaurant.verification} />
        <Text style={[styles.meta, styles.status, { color: open ? colors.open : colors.closed }]}>
          {openText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: MIN_TOUCH_SIZE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { fontSize: fontSize.title, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: fontSize.small },
  status: { fontWeight: '700' },
});
