import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

interface PushKeys {
  p256dh: string;
  auth: string;
}

function extractKeys(sub: PushSubscription): (PushKeys & { endpoint: string }) | null {
  try {
    const json = sub.toJSON() as { endpoint?: string; keys?: PushKeys };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
    return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
  } catch {
    return null;
  }
}

/**
 * Save a browser push subscription to Supabase `push_subscriptions`.
 * Returns 'saved' | 'local-only' (no Supabase / table missing) | 'failed'.
 *
 * - local-only: browser subscription exists, but no server can send yet.
 *   This happens when running local mode or before Step 3 migration is Run.
 */
export async function savePushSubscription(
  db: SupabaseClient | null,
  memberId: string,
  sub: PushSubscription,
): Promise<'saved' | 'local-only' | 'failed'> {
  const keys = extractKeys(sub);
  if (!keys) return 'failed';
  const client = db ?? getSupabase();
  if (!client || !memberId) return 'local-only';
  try {
    const { error } = await client.from('push_subscriptions').upsert(
      { member_id: memberId, endpoint: keys.endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'member_id,endpoint' },
    );
    if (error) {
      // Table missing (before migration) -> treat as local-only, not fatal.
      if (error.code === '42P01' || /push_subscriptions/i.test(error.message)) return 'local-only';
      return 'failed';
    }
    return 'saved';
  } catch {
    return 'failed';
  }
}

/** Remove subscription(s) for this endpoint. Best-effort, never throws. */
export async function removePushSubscription(
  db: SupabaseClient | null,
  endpoint?: string,
): Promise<void> {
  try {
    const client = db ?? getSupabase();
    if (!client) return;
    if (endpoint) {
      await client.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
  } catch {
    /* noop */
  }
}
