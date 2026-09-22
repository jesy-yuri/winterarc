import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'warm' | 'rose' | 'dark-warm';

const STORAGE_KEY = 'winterarc-theme';

const THEME_ORDER: Theme[] = ['dark', 'warm', 'rose', 'dark-warm'];

const THEME_COLORS: Record<Theme, string> = {
  dark: '#0b0d10',
  warm: '#faf6ef',
  rose: '#f9f1ef',
  'dark-warm': '#17120d',
};

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'warm' || value === 'rose' || value === 'dark-warm';
}

function readInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const fromDom = document.documentElement.dataset.theme;
    if (isTheme(fromDom)) return fromDom;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isTheme(saved)) return saved;
    } catch {
      // storage unavailable — fall through to default
    }
  }
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage unavailable — theme still applies for this session
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length];
      return next ?? 'dark';
    });
  }, []);

  return { theme, setTheme, toggle };
}
