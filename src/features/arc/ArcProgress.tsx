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
    return <p className="mt-2 text-xs text-slate-400">Arc progress unavailable.</p>;
  }

  const totalDays = diffDays(start, end) + 1;
  if (totalDays <= 0) {
    return <p className="mt-2 text-xs text-slate-400">Check arc dates.</p>;
  }

  if (now < start) {
    const daysUntil = diffDays(now, start);
    return (
      <p className="mt-2 text-xs text-slate-400">
        {daysUntil <= 1 ? 'Starts in 1 day' : `Starts in ${daysUntil} days`}
      </p>
    );
  }

  if (now > end) {
    return (
      <div className="mt-2 w-64 max-w-full">
        <p className="mb-1 text-xs text-slate-400">Arc complete</p>
        <ProgressBar value={100} />
      </div>
    );
  }

  const dayNumber = diffDays(start, now) + 1;
  const percent = Math.round((dayNumber / totalDays) * 100);
  return (
    <div className="mt-2 w-64 max-w-full">
      <p className="mb-1 text-xs text-slate-400">
        Day {dayNumber} of {totalDays} — {percent}% complete
      </p>
      <ProgressBar value={percent} />
    </div>
  );
}
