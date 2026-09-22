import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { CheckRow } from '../../components/ui/Controls';
import { EmptyState } from '../../components/ui/Section';
import type { CheckIn, Goal } from '../../types';

export function DailyChecklist({
  goals,
  todayCheckIns,
  onToggle,
}: {
  goals: Goal[];
  todayCheckIns: CheckIn[];
  onToggle: (goalId: string) => void | Promise<unknown>;
}) {
  // Optimistic overrides: instant checkmark on tap, before the network responds.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  // In-flight taps — extra taps on the same row are ignored while syncing.
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const doneSet = new Set(todayCheckIns.map((c) => c.goalId));

  // Reconcile during render (React-endorsed adjust-during-render pattern):
  // drop overrides once server truth catches up or the goal is gone, so a
  // change from another device can never get stuck behind a stale override.
  const [prevSync, setPrevSync] = useState({ checkIns: todayCheckIns, goals });
  if (prevSync.checkIns !== todayCheckIns || prevSync.goals !== goals) {
    setPrevSync({ checkIns: todayCheckIns, goals });
    const serverDone = new Set(todayCheckIns.map((c) => c.goalId));
    const ids = new Set(goals.map((g) => g.id));
    setOptimistic((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [goalId, value] of Object.entries(prev)) {
        if (!ids.has(goalId) || serverDone.has(goalId) === value) {
          delete next[goalId];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  async function handleTap(goalId: string) {
    if (pending.has(goalId)) return;
    const current = optimistic[goalId] ?? doneSet.has(goalId);
    const next = !current;
    setOptimistic((prev) => ({ ...prev, [goalId]: next }));
    setPending((prev) => new Set(prev).add(goalId));
    try {
      await onToggle(goalId);
    } catch {
      // Roll back to the pre-tap state so the UI never lies.
      setOptimistic((prev) => ({ ...prev, [goalId]: current }));
      toast.error('Check-in failed. Reverted.');
    } finally {
      setPending((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(goalId);
        return nextSet;
      });
    }
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks size={20} aria-hidden="true" />}
        title="No goals yet"
        body="This room hasn't added today's goals. Ask your admin to add some."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {goals.map((goal) => (
        <li key={goal.id}>
          <CheckRow
            checked={optimistic[goal.id] ?? doneSet.has(goal.id)}
            title={goal.title}
            meta={typeof goal.targetCount === 'number' ? `Target: ${goal.targetCount} reps` : undefined}
            reward="+10 XP"
            pending={pending.has(goal.id)}
            onToggle={() => {
              void handleTap(goal.id);
            }}
          />
        </li>
      ))}
    </ul>
  );
}
