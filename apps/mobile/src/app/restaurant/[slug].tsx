/**
 * Fiche restaurant (phase 1) : identité, statut halal complet, horaires.
 * Photos, carte et prix, appel et itinéraire arrivent en phase 2.
 */
import { formatDateCH, isOpenAt, weekdayName, type TimeRange } from '@swisshalal/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { HalalStatusBlock } from '@/components/HalalStatus';
import { FictionalBanner } from '@/components/Labels';
import { useFormattingLocale } from '@/lib/i18n';
import { useRestaurant } from '@/lib/queries';
import { fontSize, spacing, useColors } from '@/theme';

const formatRanges = (ranges: TimeRange[]) =>
  ranges.map((r) => `${r.opens}–${r.closes}`).join(', ');

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useTranslations();
  const colors = useColors();
  const locale = useFormattingLocale();
  const { data: restaurant, isPending } = useRestaurant(slug);

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
  const cuisines = restaurant.cuisines.map((c) => t(`cuisine.${c}`)).join(', ');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: restaurant.name }} />
      {restaurant.isFictional && <FictionalBanner messageKey="common.fictionalData" />}

      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {restaurant.name}
        </Text>
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {cuisines} · {t('restaurant.priceRange', { range: String(restaurant.priceRange ?? '') })}
        </Text>
        <Text
          style={[styles.text, { color: open ? colors.open : colors.closed, fontWeight: '700' }]}
        >
          {open ? t('restaurant.openNow') : t('restaurant.closedNow')}
        </Text>
      </View>

      <HalalStatusBlock halal={restaurant.halal} verification={restaurant.verification} />

      <View style={styles.section}>
        <Text style={[styles.subtitle, { color: colors.text }]} accessibilityRole="header">
          {t('restaurant.address')}
        </Text>
        <Text style={[styles.text, { color: colors.text }]}>
          {restaurant.street}, {restaurant.postalCode} {restaurant.city}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.subtitle, { color: colors.text }]} accessibilityRole="header">
          {t('restaurant.hours')}
        </Text>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const ranges = restaurant.schedule.periods.filter((p) => p.isoWeekday === day);
          return (
            <View key={day} style={styles.hoursRow}>
              <Text style={[styles.text, { color: colors.text }]}>{weekdayName(day, locale)}</Text>
              <Text style={[styles.text, { color: colors.text }]}>
                {ranges.length ? formatRanges(ranges) : t('restaurant.closedAllDay')}
              </Text>
            </View>
          );
        })}
        {restaurant.schedule.specialDays.length > 0 && (
          <>
            <Text style={[styles.subtitle, { color: colors.text, marginTop: spacing.md }]}>
              {t('restaurant.specialHours')}
            </Text>
            {restaurant.schedule.specialDays.map((day) => (
              <View key={day.date} style={styles.hoursRow}>
                <Text style={[styles.text, { color: colors.text }]}>{formatDateCH(day.date)}</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                  {day.closed ? t('restaurant.closedAllDay') : formatRanges(day.ranges)}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.xs },
  title: { fontSize: fontSize.heading, fontWeight: '800' },
  subtitle: { fontSize: fontSize.title, fontWeight: '700' },
  text: { fontSize: fontSize.body, lineHeight: 22 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
