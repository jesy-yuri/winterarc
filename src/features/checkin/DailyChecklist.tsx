import type { CheckIn, Goal } from '../../types';

export function DailyChecklist({
  goals,
  todayCheckIns,
  onToggle,
}: {
  goals: Goal[];
  todayCheckIns: CheckIn[];
  onToggle: (goalId: string) => void;
}) {
  const doneSet = new Set(todayCheckIns.map((c) => c.goalId));
  if (goals.length === 0) return <p className="text-sm text-slate-400">Walang goals pa.</p>;

  return (
    <ul className="flex flex-col gap-2">
      {goals.map((goal) => {
        const done = doneSet.has(goal.id);
        return (
          <li key={goal.id}>
            <button
              type="button"
              onClick={() => onToggle(goal.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                done
                  ? 'border-sky-500/40 bg-sky-500/10 text-white'
                  : 'border-white/10 bg-slate-900 text-slate-200 hover:border-white/20'
              }`}
            >
              <span className="flex items-center gap-2">
                {goal.icon && (
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
                    {goal.icon}
                  </span>
                )}
                <span>{goal.title}</span>
                {typeof goal.targetCount === 'number' && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                    x{goal.targetCount}
                  </span>
                )}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                  done ? 'border-sky-400 bg-sky-500 text-white' : 'border-white/20'
                }`}
              >
                {done ? 'v' : ''}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
