/**
 * Mise en page racine : fournisseurs globaux (données, traductions, recherche,
 * zones sûres de l'écran) et navigation : carte → fiche, et filtres en fenêtre modale.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { I18nProvider } from '@/lib/i18n';
import { SearchProvider } from '@/lib/search';
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
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: t('app.name') }} />
        <Stack.Screen
          name="filters"
          options={{ presentation: 'modal', title: t('filters.title') }}
        />
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
          <SearchProvider>
            <ThemedStack />
          </SearchProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
