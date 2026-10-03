import { BellRing, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Section';
import { StreakFlame } from '../streak/StreakFlame';

export function DailyReminderCard({
  remainingCount,
  total,
  remainingTitles,
  streak,
  streakBadgeLabel,
  checkedInToday,
  isEvening,
  title,
  body,
  onDismiss,
  onNotify,
  notifyLabel = 'Notify me now',
}: {
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  streakBadgeLabel: string | null;
  checkedInToday: boolean;
  isEvening: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
  onNotify: () => void;
  notifyLabel?: string;
}) {
  const preview = remainingTitles.slice(0, 4);

  return (
    <section
      aria-live="polite"
      aria-label="Today's goal reminder"
      className="rounded-2xl border border-accent/30 bg-accent/[0.08] p-4 shadow-card sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink"
          >
            <BellRing size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.18em] text-faint uppercase">
              {isEvening ? 'Evening reminder' : "Today's reminder"}
            </p>
            <h2 className="mt-0.5 text-[15px] font-bold break-words text-ink sm:text-base">
              {title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed break-words text-muted">{body}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss reminder for today"
          className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <StreakFlame checkedInToday={checkedInToday} size={11} streak={streak} />
          {streak}-day streak{streakBadgeLabel ? ` · ${streakBadgeLabel}` : ''}
        </Badge>
        <Badge tone="neutral">
          {remainingCount} of {total} goals left
        </Badge>
        {isEvening && streak > 0 && <Badge tone="warning">At risk — check in soon</Badge>}
      </div>

      {preview.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5">
          {preview.map((t) => (
            <li
              key={t}
              className="truncate rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink"
              title={t}
            >
              • {t}
            </li>
          ))}
          {remainingTitles.length > preview.length && (
            <li className="px-1 text-xs text-faint">
              +{remainingTitles.length - preview.length} more…
            </li>
          )}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onNotify}>
          <BellRing size={14} aria-hidden="true" />
          {notifyLabel}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDismiss}>
          Dismiss for today
        </Button>
      </div>
    </section>
  );
}
