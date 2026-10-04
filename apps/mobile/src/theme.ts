/**
 * Couleurs, espacements et tailles de l'app (« design tokens »).
 *
 * Accessibilité : chaque couple texte/fond utilisé ensuite est vérifié par un
 * test (theme.test.ts) avec un contraste minimal de 4,5:1 (norme WCAG AA).
 * Le statut halal n'est jamais indiqué par la couleur seule : il y a toujours
 * un texte.
 */
import { useColorScheme } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  certifiedBg: string;
  certifiedText: string;
  verifiedBg: string;
  verifiedText: string;
  unverifiedBg: string;
  unverifiedText: string;
  sponsoredBg: string;
  sponsoredText: string;
  warningBg: string;
  warningText: string;
  open: string;
  closed: string;
}

export const palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#FFFFFF',
    surface: '#F3F6F4',
    text: '#14211B',
    textMuted: '#4A5A52',
    border: '#D0D9D4',
    primary: '#0B6E4F',
    onPrimary: '#FFFFFF',
    certifiedBg: '#0B6E4F',
    certifiedText: '#FFFFFF',
    verifiedBg: '#DCEFE6',
    verifiedText: '#0B4F39',
    unverifiedBg: '#FFF4D6',
    unverifiedText: '#6B4E00',
    sponsoredBg: '#EDE7F6',
    sponsoredText: '#4527A0',
    warningBg: '#FFF1E8',
    warningText: '#8A3B00',
    open: '#0B6E4F',
    closed: '#9B1C1C',
  },
  dark: {
    background: '#0F1714',
    surface: '#18231E',
    text: '#EAF2EE',
    textMuted: '#A9BBB2',
    border: '#2A3A33',
    primary: '#5CD6A6',
    onPrimary: '#0F1714',
    certifiedBg: '#5CD6A6',
    certifiedText: '#0F1714',
    verifiedBg: '#1E3A2F',
    verifiedText: '#BDEBD7',
    unverifiedBg: '#3A3014',
    unverifiedText: '#F5D88A',
    sponsoredBg: '#2E2445',
    sponsoredText: '#D1C4F5',
    warningBg: '#3A2414',
    warningText: '#FFC9A8',
    open: '#7FE0B8',
    closed: '#FF9B9B',
  },
};

/** Couples (texte, fond) réellement utilisés : vérifiés par les tests de contraste. */
export const TEXT_ON_BACKGROUND: ReadonlyArray<[keyof Palette, keyof Palette]> = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textMuted', 'background'],
  ['textMuted', 'surface'],
  ['primary', 'background'],
  ['onPrimary', 'primary'],
  ['certifiedText', 'certifiedBg'],
  ['verifiedText', 'verifiedBg'],
  ['unverifiedText', 'unverifiedBg'],
  ['sponsoredText', 'sponsoredBg'],
  ['warningText', 'warningBg'],
  ['open', 'background'],
  ['open', 'surface'],
  ['closed', 'background'],
  ['closed', 'surface'],
];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const fontSize = { small: 13, body: 16, title: 19, heading: 26 } as const;
/** Taille minimale d'une zone tactile (recommandation Apple : 44 points). */
export const MIN_TOUCH_SIZE = 44;

export function useColors(): Palette {
  return palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

// --- Calcul du contraste (formule WCAG 2.x) -----------------------------------
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}
