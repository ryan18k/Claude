import type { SupabaseClient } from '@supabase/supabase-js';
import type { SponsoredPlacement } from '@swisshalal/core';
import { z } from 'zod';

const placementRowSchema = z.object({
  restaurant_id: z.string().uuid(),
  kind: z.enum(['search', 'home']),
  starts_at: z.string(),
  ends_at: z.string(),
  position: z.number().int(),
});

/** Emplacements sponsorisés actifs (la RLS ne renvoie que les actifs à un visiteur). */
export async function fetchActiveSponsoredPlacements(
  client: SupabaseClient,
): Promise<SponsoredPlacement[]> {
  const { data, error } = await client
    .from('sponsored_placements')
    .select('restaurant_id, kind, starts_at, ends_at, position');
  if (error) throw new Error(`Lecture des emplacements sponsorisés impossible : ${error.message}`);
  return (data ?? []).map((raw) => {
    const row = placementRowSchema.parse(raw);
    return {
      restaurantId: row.restaurant_id,
      kind: row.kind,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      position: row.position,
    };
  });
}
