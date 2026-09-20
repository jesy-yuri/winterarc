import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

/** Borderless inline select used inside list rows (e.g. rep counts). */
export function InlineSelect({
  label,
  children,
  className = '',
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <span className="relative inline-flex">
      <select
        aria-label={label}
        className={`appearance-none rounded-lg border border-line bg-surface py-1.5 pr-8 pl-2.5 text-[13px] text-ink transition-colors focus:border-accent/60 focus:outline-none disabled:opacity-40 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-faint"
      />
    </span>
  );
}
