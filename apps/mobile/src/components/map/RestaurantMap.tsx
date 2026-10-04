/**
 * Carte des restaurants (iOS / Android).
 *
 * Dans Expo Go, le module natif de carte n'existe pas : on n'essaie même pas de
 * le charger, et l'écran passe en mode liste. Dans une development build ou
 * l'app publiée, la vraie carte MapLibre s'affiche.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { fontSize, spacing, useColors } from '@/theme';
import type { RestaurantMapProps } from './mapConfig';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** La carte peut-elle s'afficher sur cet appareil ? */
export const mapAvailable = !isExpoGo;

// Chargement conditionnel : `require` n'est exécuté que hors d'Expo Go.
const NativeMap = isExpoGo
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./NativeMap') as typeof import('./NativeMap')).NativeMap;

export function RestaurantMap(props: RestaurantMapProps) {
  const t = useTranslations();
  const colors = useColors();
  if (!NativeMap) {
    return (
      <View style={[styles.unavailable, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.textMuted, fontSize: fontSize.body, textAlign: 'center' }}>
          {t('explore.mapUnavailable')}
        </Text>
      </View>
    );
  }
  return <NativeMap {...props} />;
}

const styles = StyleSheet.create({
  unavailable: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
