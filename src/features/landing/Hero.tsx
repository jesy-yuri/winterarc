import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { GoogleMark } from '../../components/ui/AuthButton';
import { Button } from '../../components/ui/Button';
import { useSupabaseUser } from '../../hooks/useSupabaseUser';
import { signInWithGoogle } from '../../lib/supabase';

export function Hero() {
  const { user, loading, isConfigured } = useSupabaseUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <header className="pt-10 pb-4 sm:pt-16 lg:pt-24">
      <p className="inline-block -rotate-2 bg-ink px-3 py-1.5 font-display text-sm tracking-[0.14em] text-base uppercase">
        No password — just show up
      </p>
      <p className="mt-5 flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
        <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
        Winter Arc
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[0.95] text-ink uppercase sm:text-6xl lg:text-7xl">
        Discipline is better <span className="text-accent-strong">together.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
        Build better habits. Stay consistent with your friends — check in every
        day, grow your streak, and finish the season together.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          className="w-full uppercase tracking-wider sm:w-auto"
          onClick={() => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Join a Room
        </Button>
        <Link to="/join" className="w-full sm:w-auto">
          <Button type="button" variant="secondary" className="w-full uppercase tracking-wider sm:w-auto">
            Enter a Room Code
          </Button>
        </Link>
      </div>

      {isConfigured && !loading && (
        <div className="mt-6">
          {user ? (
            <p className="inline-flex items-center gap-1.5 text-[13px] text-muted">
              <Check size={15} strokeWidth={3} aria-hidden="true" className="text-success" />
              Signed in as {user.email ?? 'your Google account'}
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={login}
                disabled={busy}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 disabled:opacity-60 sm:w-auto"
              >
                <GoogleMark />
                {busy ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <p className="mt-2 text-xs text-faint">
                Sign in first so your crew syncs across devices.
              </p>
              {error && (
                <p role="alert" className="mt-1 text-xs text-danger">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
