import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Auth state. The signed-in Gmail account owns the session; remote
 * progress resolves via (room_id, user.id) — no member impersonation UI.
 * Also surfaces OAuth return-errors (?error=) as readable text.
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [authError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error_description') ?? params.get('error');
    if (err) {
      window.history.replaceState({}, '', window.location.pathname);
      return decodeURIComponent(err.replace(/\+/g, ' '));
    }
    return null;
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading, isConfigured: isSupabaseConfigured(), authError };
}
