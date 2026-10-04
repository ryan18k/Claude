import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  activeFilters: number;
  onFiltersPress: () => void;
}

/** Barre de recherche flottante + bouton Filtres (avec le nombre de filtres actifs). */
export function SearchBar({ value, onChangeText, activeFilters, onFiltersPress }: Props) {
  const t = useTranslations();
  const colors = useColors();
  return (
    <View style={[styles.bar, { backgroundColor: colors.background, shadowColor: '#000' }]}>
      <Ionicons name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('search.placeholder')}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={t('search.placeholder')}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel={t('search.clear')}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </Pressable>
      )}
      <Pressable
        onPress={onFiltersPress}
        accessibilityRole="button"
        accessibilityLabel={
          activeFilters > 0
            ? `${t('search.filters')}, ${t('search.activeFilters', { count: activeFilters })}`
            : t('search.filters')
        }
        style={[styles.filterButton, { borderLeftColor: colors.border }]}
      >
        <Ionicons name="options-outline" size={22} color={colors.text} />
        {activeFilters > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{activeFilters}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_SIZE + 6,
    borderRadius: 999,
    paddingLeft: spacing.lg,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  input: { flex: 1, fontSize: fontSize.body, paddingVertical: spacing.sm },
  filterButton: {
    minWidth: MIN_TOUCH_SIZE + 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
