import { ProgressBar } from '../../components/ui/ProgressBar';

function parseDay(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffDays(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

export function ArcProgress({ startDate, endDate }: { startDate: string; endDate: string }) {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!start || !end) {
    return <p className="text-[13px] text-muted">Season progress unavailable.</p>;
  }

  const totalDays = diffDays(start, end) + 1;
  if (totalDays <= 0) {
    return <p className="text-[13px] text-muted">Check arc dates.</p>;
  }

  if (now < start) {
    const daysUntil = diffDays(now, start);
    return (
      <p className="text-sm text-muted">
        {daysUntil <= 1 ? 'Starts in 1 day' : `Starts in ${daysUntil} days`}
      </p>
    );
  }

  if (now > end) {
    return (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-lg font-semibold text-ink">Season complete</p>
          <p className="text-sm font-medium text-muted">100%</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={100} />
        </div>
      </div>
    );
  }

  const dayNumber = diffDays(start, now) + 1;
  const remaining = totalDays - dayNumber;
  const percent = Math.round((dayNumber / totalDays) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-semibold text-ink">
          Day {dayNumber} <span className="text-sm font-normal text-muted">of {totalDays}</span>
        </p>
        <p className="text-sm font-medium text-muted">{percent}%</p>
      </div>
      <div className="mt-3">
        <ProgressBar value={percent} />
      </div>
      <p className="mt-2 text-[13px] text-faint">
        {percent}% complete · {remaining === 0 ? 'Last day' : `${remaining} ${remaining === 1 ? 'day' : 'days'} remaining`}
      </p>
    </div>
  );
}
