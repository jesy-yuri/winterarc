import { useState } from 'react';
import { History } from 'lucide-react';
import { toast } from 'sonner';
import { CheckRow } from '../../components/ui/Controls';
import { getCatchUpDates } from '../../lib/streak';
import type { CheckIn, Goal } from '../../types';

function formatOption(date: string, today: string): string {
  if (date === today) return `Today (${date})`;
  const d = new Date(`${date}T00:00:00`);
  const label = Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (date === getCatchUpDates(today)[1]) return `Yesterday — ${label}`;
  return `2 days ago — ${label}`;
}

export function CatchUpCheckIn({
  today,
  goals,
  memberCheckIns,
  onToggle,
}: {
  today: string;
  goals: Goal[];
  /** All check-ins of this member in this room (any date). */
  memberCheckIns: CheckIn[];
  onToggle: (goalId: string, date: string) => void | Promise<unknown>;
}) {
  const dates = getCatchUpDates(today);
  const [selectedDate, setSelectedDate] = useState(() => dates[1] ?? dates[0] ?? today);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  if (goals.length === 0) return null;

  const doneSet = new Set(
    memberCheckIns.filter((c) => c.date === selectedDate).map((c) => c.goalId),
  );
  const doneCount = goals.filter((g) => doneSet.has(g.id)).length;

  async function handleTap(goalId: string) {
    const key = `${selectedDate}|${goalId}`;
    if (pending.has(key)) return;
    setPending((prev) => new Set(prev).add(key));
    try {
      const result = (await onToggle(goalId, selectedDate)) as { queued?: boolean } | void;
      if (result && typeof result === 'object' && result.queued === true) {
        toast.success("Saved offline — will sync when you're back online.");
      } else {
        toast.success(selectedDate === today ? 'Checked in.' : 'Late check-in saved.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Late check-in failed.');
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <section aria-labelledby="catchup-checkin" className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
          <History size={16} />
        </span>
        <div className="min-w-0">
          <h3 id="catchup-checkin" className="text-[15px] font-bold text-ink">
            Late check-in
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            Forgot to check in but you did it? Catch up within 3 days to keep your streak alive.
          </p>
        </div>
      </div>

      <label className="mt-3 block text-xs font-semibold tracking-wide text-faint uppercase" htmlFor="catchup-date">
        Date
      </label>
      <select
        id="catchup-date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-base px-2.5 py-2 text-sm text-ink"
      >
        {dates.map((d) => (
          <option key={d} value={d}>
            {formatOption(d, today)}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-xs text-faint">
        {doneCount}/{goals.length} checked in for this date
      </p>

      <ul className="mt-3 flex flex-col gap-2.5">
        {goals.map((goal) => (
          <li key={goal.id}>
            <CheckRow
              checked={doneSet.has(goal.id)}
              title={goal.title}
              meta={typeof goal.targetCount === 'number' ? `Target: ${goal.targetCount} reps` : undefined}
              reward="+10 XP"
              pending={pending.has(`${selectedDate}|${goal.id}`)}
              onToggle={() => {
                void handleTap(goal.id);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
