/**
 * Mise en page racine : fournisseurs globaux (données, traductions, zones
 * sûres de l'écran) et navigation en pile (liste → fiche).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { I18nProvider } from '@/lib/i18n';
import { useColors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1 } },
});

function ThemedStack() {
  const t = useTranslations();
  const colors = useColors();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: t('app.name') }} />
        <Stack.Screen
          name="restaurant/[slug]"
          options={{ title: '', headerBackTitle: t('common.back') }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ThemedStack />
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
