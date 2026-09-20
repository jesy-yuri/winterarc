import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Clean a pasted env value: trim spaces + strip wrapping quotes. */
function clean(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readEnv(): { url: string; anonKey: string } | null {
  const url = clean(import.meta.env.VITE_SUPABASE_URL as string | undefined);
  const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);
  if (!url || !anonKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { url, anonKey };
}

export function getSupabase(): SupabaseClient | null {
  // Never throw: a bad env value degrades to local mode instead of
  // blanking the whole app (createClient throws on malformed URLs).
  const env = readEnv();
  if (!env) return null;
  if (!client) {
    try {
      client = createClient(env.url, env.anonKey);
    } catch {
      return null;
    }
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

/**
 * Pre-flight check with a human-readable verdict. Catches the usual
 * Vercel paste mistakes (quotes, spaces, truncated key) BEFORE we
 * redirect — otherwise Supabase answers with a raw JSON error page.
 */
export function describeConfigIssue(): string | null {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const url = clean(rawUrl);
  const key = clean(rawKey);
  if (!url || !key) {
    return 'Supabase keys are missing on this deployment. Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then Redeploy.';
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'VITE_SUPABASE_URL must start with https:// — fix it in Vercel env vars, then Redeploy.';
    }
  } catch {
    return 'VITE_SUPABASE_URL is not a valid URL — re-paste the Project URL from Supabase → Settings → API (no brackets, no quotes), then Redeploy.';
  }
  if (!/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
    return 'VITE_SUPABASE_ANON_KEY looks incomplete — re-paste the FULL anon key as one line (starts with eyJ, has 2 dots), then Redeploy.';
  }
  return null;
}

/** Google OAuth login. Redirects to Google, then back to the app. */
export async function signInWithGoogle(): Promise<void> {
  const issue = describeConfigIssue();
  if (issue) throw new Error(issue);
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured yet.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
