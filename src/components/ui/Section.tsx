import type { ReactNode } from 'react';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="flex items-center gap-2 text-xs font-bold tracking-[0.22em] text-faint uppercase">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
            {eyebrow}
          </p>
        )}
        <h2 className={`font-semibold break-words text-ink sm:text-lg ${eyebrow ? 'mt-1 text-[17px]' : 'text-[17px]'}`}>{title}</h2>
        {description && <p className="mt-1 max-w-xl text-sm break-words text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-line ${className}`} />;
}

const BADGE_TONES: Record<string, string> = {
  accent: 'border-accent/25 bg-accent/[0.10] text-accent-strong',
  success: 'border-success/25 bg-success/[0.12] text-success',
  warning: 'border-warning/30 bg-warning/[0.12] text-warning',
  danger: 'border-danger/25 bg-danger/[0.10] text-danger',
  neutral: 'border-line bg-raised text-muted',
};

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium tracking-wide ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-raised text-faint">
        {icon}
      </span>
      <p className="mt-3 text-[15px] font-medium text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({
  icon,
  value,
  label,
}: {
  icon?: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 py-1 text-center">
      {icon && <span className="text-faint">{icon}</span>}
      <p className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">{value}</p>
      <p className="text-xs break-words text-muted sm:text-[13px]">{label}</p>
    </div>
  );
}
