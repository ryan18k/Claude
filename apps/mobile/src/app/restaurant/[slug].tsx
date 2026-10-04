/**
 * Fiche restaurant, version épurée :
 * nom, une ligne d'infos, deux boutons (Itinéraire, Appeler), le statut halal,
 * les horaires du jour (dépliables) et l'adresse.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  distanceMeters,
  formatDistance,
  isOpenAt,
  weekdayName,
  zonedParts,
  type TimeRange,
} from '@swisshalal/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { HalalDetails } from '@/components/Halal';
import { callPhone, openDirections } from '@/lib/directions';
import { useFormattingLocale } from '@/lib/i18n';
import { useRestaurant } from '@/lib/queries';
import { useSearch } from '@/lib/search';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

const formatRanges = (ranges: TimeRange[]) =>
  ranges.map((r) => `${r.opens}–${r.closes}`).join(', ');

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useTranslations();
  const colors = useColors();
  const locale = useFormattingLocale();
  const { position } = useSearch();
  const { data: restaurant, isPending } = useRestaurant(slug);
  const [showAllHours, setShowAllHours] = useState(false);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel={t('common.loading')} color={colors.primary} />
      </View>
    );
  }
  if (!restaurant) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>{t('restaurant.notFound')}</Text>
      </View>
    );
  }

  const open = isOpenAt(restaurant.schedule);
  const today = zonedParts(new Date()).isoWeekday;
  const rangesFor = (day: number) =>
    restaurant.schedule.periods.filter((p) => p.isoWeekday === day);
  const infoLine = [
    restaurant.cuisines.map((c) => t(`cuisine.${c}`)).join(', '),
    t('restaurant.priceRange', { range: String(restaurant.priceRange ?? '') }),
    position ? formatDistance(distanceMeters(position, restaurant.location), locale) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: '' }} />

      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {restaurant.name}
        </Text>
        <Text style={[styles.text, { color: colors.textMuted }]}>{infoLine}</Text>
        <Text style={[styles.text, styles.bold, { color: open ? colors.open : colors.closed }]}>
          {open ? t('restaurant.openNow') : t('restaurant.closedNow')}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon="navigate"
          label={t('restaurant.directions')}
          onPress={() => openDirections(restaurant.location, restaurant.name)}
          primary
        />
        {restaurant.phone && (
          <ActionButton
            icon="call"
            label={t('restaurant.call')}
            onPress={() => callPhone(restaurant.phone!)}
          />
        )}
      </View>

      <Divider />
      <HalalDetails halal={restaurant.halal} verification={restaurant.verification} />
      <Divider />

      <View style={styles.section}>
        <View style={styles.hoursRow}>
          <Text style={[styles.text, styles.bold, { color: colors.text }]}>
            {t('restaurant.today')}
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            {rangesFor(today).length
              ? formatRanges(rangesFor(today))
              : t('restaurant.closedAllDay')}
          </Text>
        </View>
        {showAllHours &&
          [1, 2, 3, 4, 5, 6, 7].map((day) => (
            <View key={day} style={styles.hoursRow}>
              <Text style={[styles.text, { color: colors.textMuted }]}>
                {weekdayName(day, locale)}
              </Text>
              <Text style={[styles.text, { color: colors.textMuted }]}>
                {rangesFor(day).length
                  ? formatRanges(rangesFor(day))
                  : t('restaurant.closedAllDay')}
              </Text>
            </View>
          ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAllHours(!showAllHours)}
          style={styles.link}
        >
          <Text style={[styles.text, styles.underline, { color: colors.text }]}>
            {showAllHours ? t('restaurant.hideHours') : t('restaurant.allHours')}
          </Text>
        </Pressable>
      </View>

      <Divider />
      <Pressable
        accessibilityRole="button"
        onPress={() => openDirections(restaurant.location, restaurant.name)}
        style={styles.addressRow}
      >
        <Ionicons name="location-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.text, { color: colors.text }]}>
          {restaurant.street}, {restaurant.postalCode} {restaurant.city}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const colors = useColors();
  const foreground = primary ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.action,
        primary
          ? { backgroundColor: colors.primary }
          : { borderColor: colors.border, borderWidth: 1 },
      ]}
    >
      <Ionicons name={icon} size={18} color={foreground} />
      <Text style={[styles.text, styles.bold, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.xs },
  title: { fontSize: fontSize.heading, fontWeight: '800' },
  text: { fontSize: fontSize.body, lineHeight: 22 },
  bold: { fontWeight: '700' },
  underline: { textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  link: { minHeight: MIN_TOUCH_SIZE, justifyContent: 'center', alignSelf: 'flex-start' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE,
  },
});
