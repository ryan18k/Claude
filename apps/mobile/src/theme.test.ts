import { describe, expect, it, vi } from 'vitest';

// theme.ts importe react-native (pour useColorScheme) : on le remplace par un faux
// module, car ce test ne vérifie que des couleurs.
vi.mock('react-native', () => ({ useColorScheme: () => 'light' }));

const { contrastRatio, palettes, TEXT_ON_BACKGROUND } = await import('./theme');

describe('accessibilité des couleurs (WCAG AA)', () => {
  it('calcule les contrastes de référence', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  for (const mode of ['light', 'dark'] as const) {
    it.each(TEXT_ON_BACKGROUND)(`${mode} : %s sur %s ≥ 4,5:1`, (fg, bg) => {
      const palette = palettes[mode];
      expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(4.5);
    });
  }
});
