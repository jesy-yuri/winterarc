import { useEffect, useRef, useState } from 'react';
import { Check, Heart, Moon, Sun, Sunset } from 'lucide-react';
import { useTheme, type Theme } from '../../hooks/useTheme';

const OPTIONS: { id: Theme; title: string; hint: string; icon: typeof Moon }[] = [
  { id: 'dark', title: 'Dark', hint: 'Cool night', icon: Moon },
  { id: 'warm', title: 'Warm light', hint: 'Soft cream', icon: Sun },
  { id: 'rose', title: 'Rosé', hint: 'Soft blush', icon: Heart },
  { id: 'dark-warm', title: 'Warm dark', hint: 'Cozy night', icon: Sunset },
];

/** Header theme switcher — inline in the top bar, remembers the choice. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={rootRef} className="relative flex flex-col items-end gap-2">
      {open && (
        <div
          role="menu"
          aria-label="Choose theme"
          className="absolute top-full right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_30px_rgb(0_0_0/0.25)]"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = opt.id === theme;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-150 ${
                  selected ? 'bg-accent/[0.10]' : 'hover:bg-raised'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    selected ? 'border-accent/40 text-accent-strong' : 'border-line text-muted'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{opt.title}</span>
                  <span className="block text-xs text-faint">{opt.hint}</span>
                </span>
                {selected && (
                  <Check size={16} aria-hidden="true" className="shrink-0 text-accent-strong" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Choose theme, current is ${current.title}`}
        title={`Theme: ${current.title}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors duration-200 hover:border-accent/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 sm:h-10 sm:w-10"
      >
        <CurrentIcon size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
