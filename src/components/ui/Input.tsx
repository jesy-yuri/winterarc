import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ label, id, hint, error, className = '', ...rest }: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="block">
      <span className="block text-[13px] font-medium text-muted">{label}</span>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`mt-1.5 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-[0_1px_2px_rgb(68_56_44/0.05)] transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none ${
          error ? 'border-danger/60' : 'border-line'
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <span id={`${inputId}-hint`} className="mt-1 block text-xs text-faint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${inputId}-error`} className="mt-1 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
