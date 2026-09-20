import type { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outline' | 'interactive';

const VARIANTS: Record<CardVariant, string> = {
  // Standard card — 1px border + layered sm shadow.
  default: 'border border-line bg-surface shadow-card',
  // Prominent content — deeper shadow, no border.
  elevated: 'border border-transparent bg-surface shadow-card-lg',
  // Subtle container — border only, no elevation.
  outline: 'border border-line bg-surface',
  // Clickable card — lifts + deepens shadow on hover, accent border on focus.
  interactive:
    'border border-line bg-surface shadow-card motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-accent/40 motion-safe:hover:shadow-card-hover',
};

export function Card({
  title,
  subtitle,
  action,
  children,
  variant = 'default',
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl p-5 transition-[box-shadow,border-color,transform] duration-200 focus-within:border-accent/50 sm:p-6 lg:p-6 ${VARIANTS[variant]} ${className}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight break-words text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] leading-relaxed break-words text-muted">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="min-w-0 text-sm text-muted">{children}</div>
    </section>
  );
}
