import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export * from './demo';
export * from './restaurant-cards';
export * from './sponsored';
export type { SupabaseClient };

export interface SupabaseConfig {
  /** URL du projet (publique). */
  url: string;
  /** Clé « anon » (publique par conception : la sécurité repose sur la RLS). */
  anonKey: string;
}

/**
 * Crée le client Supabase.
 * ⚠️ Ne JAMAIS passer ici la clé « service_role » : elle donne tous les droits
 * et ne doit exister que côté serveur (Edge Functions).
 */
export function createSupabaseClient(
  config: SupabaseConfig,
  options: Parameters<typeof createClient>[2] = {},
): SupabaseClient {
  if (!config.url || !config.anonKey) {
    throw new Error('Configuration Supabase manquante (URL ou clé anon).');
  }
  return createClient(config.url, config.anonKey, options);
}
