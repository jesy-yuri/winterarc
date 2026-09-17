import type { CheckIn, Goal } from '../../types';

function parseDay(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CheckInHeatmap({
  checkIns,
  goals,
  startDate,
  endDate,
  memberId,
}: {
  checkIns: CheckIn[];
  goals: Goal[];
  startDate: string;
  endDate: string;
  memberId: string;
}) {
  const start = parseDay(startDate);
  const end = parseDay(endDate);

  if (!start || !end) {
    return <p className="text-xs text-slate-400">Heatmap unavailable.</p>;
  }

  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (totalDays <= 0) {
    return <p className="text-xs text-slate-400">Check arc dates.</p>;
  }
  if (totalDays > 400) {
    return <p className="text-xs text-slate-400">Arc range too large to display.</p>;
  }

  const totalGoals = goals.length;
  const mine = checkIns.filter((c) => c.memberId === memberId);
  const byDate = new Map<string, Set<string>>();
  for (const c of mine) {
    const set = byDate.get(c.date) ?? new Set<string>();
    set.add(c.goalId);
    byDate.set(c.date, set);
  }

  const days: { key: string; done: number }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < totalDays; i += 1) {
    const key = toKey(cursor);
    days.push({ key, done: byDate.get(key)?.size ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {days.map(({ key, done }) => {
          const color =
            totalGoals > 0 && done >= totalGoals
              ? 'bg-sky-400'
              : done > 0
                ? 'bg-sky-700'
                : 'bg-slate-800';
          return (
            <span
              key={key}
              title={`${key} - ${done}/${totalGoals} done`}
              className={`h-3.5 w-3.5 rounded-sm ${color}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-800" /> None
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-700" /> Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" /> Complete
        </span>
      </div>
    </div>
  );
}
