import { Pressable, StyleSheet, Text } from 'react-native';
import { fontSize, MIN_TOUCH_SIZE, spacing, useColors } from '@/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/** Bouton « pastille » qu'on active ou désactive (filtres). */
export function Chip({ label, selected, onPress, disabled = false }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_SIZE - 6,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.body, fontWeight: '600' },
});
