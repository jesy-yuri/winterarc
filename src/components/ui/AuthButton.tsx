import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';
import { signInWithGoogle, signOutUser } from '../../lib/supabase';

export function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.2-2 3.8-4.9 3.8-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.6-2.8c-1 .7-2.4 1.2-4.3 1.2-3.1 0-5.8-2.1-6.8-5l-3.7 2.9C3.4 21.5 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.5c-.2-.7-.4-1.5-.4-2.5s.1-1.8.4-2.5L1.4 6.6C.5 8.4 0 10.1 0 12s.5 3.6 1.4 5.4l3.8-2.9z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.5 1.4 6.6l3.8 2.9c1-2.9 3.7-4.8 6.8-4.8z"
      />
    </svg>
  );
}

/**
 * Global Google auth control — visible on every page.
 * Renders nothing until Supabase env vars are set, so local-only
 * mode stays clean. Member ↔ account linking lands in Phase 2.
 */
export function AuthButton() {
  const { user, loading, isConfigured } = useSupabaseUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isConfigured) return null;

  async function login() {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await signOutUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed.');
    } finally {
      setBusy(false);
    }
  }

  const label = user?.email ?? user?.user_metadata?.name ?? 'Account';

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5 sm:top-6 sm:right-6">
      {loading ? (
        <span className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] text-faint">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-faint" />
          Checking session…
        </span>
      ) : user ? (
        <span className="inline-flex h-10 max-w-[220px] items-center gap-2 rounded-full border border-line bg-surface pr-1.5 pl-3.5 shadow-[0_2px_10px_rgb(0_0_0/0.18)]">
          <span className="min-w-0 truncate text-[13px] font-medium text-ink" title={label}>
            {label}
          </span>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 disabled:opacity-50"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={login}
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-ink shadow-[0_2px_10px_rgb(0_0_0/0.18)] transition-colors duration-200 hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 disabled:opacity-60"
        >
          <GoogleMark />
          {busy ? 'Redirecting…' : 'Sign in with Google'}
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-[220px] text-right text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
