import type { ButtonHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export function IconButton({
  label,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 active:bg-ink/[0.08] ${className}`}
      {...rest}
    />
  );
}

/**
 * Shared interactive row for goals and workout check-ins.
 * Large touch target, visible check state, optional meta + reward labels.
 */
export function CheckRow({
  checked,
  title,
  meta,
  reward,
  onToggle,
  tone = 'accent',
  pending = false,
}: {
  checked: boolean;
  title: string;
  meta?: string;
  reward?: string;
  onToggle: () => void;
  tone?: 'accent' | 'success';
  pending?: boolean;
}) {
  const doneBorder = tone === 'success' ? 'border-success/30 bg-success/[0.10]' : 'border-accent/30 bg-accent/[0.08]';
  const doneDot = tone === 'success' ? 'border-success bg-success text-[#fffdf8]' : 'border-accent bg-accent text-[#fffdf8]';
  return (
    <button
      type="button"
      onClick={() => {
        // Ignore extra taps while the previous one is still syncing.
        if (!pending) onToggle();
      }}
      aria-pressed={checked}
      aria-disabled={pending}
      className={`flex min-h-[54px] w-full items-center gap-2.5 rounded-xl border px-3 py-3 text-left shadow-[0_1px_2px_rgb(68_56_44/0.05)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 sm:gap-3 sm:px-4 ${
        checked ? doneBorder : 'border-line bg-surface hover:border-accent/40'
      } ${pending ? 'opacity-70' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
          checked ? doneDot : 'border-faint/60'
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink sm:text-[15px]">{title}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-muted">{meta}</span>}
      </span>
      {reward && (
        <span className="hidden shrink-0 text-xs font-medium text-faint min-[380px]:block">{reward}</span>
      )}
    </button>
  );
}
