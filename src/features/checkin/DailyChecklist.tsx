import { ListChecks } from 'lucide-react';
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
  onToggle: (goalId: string) => void;
}) {
  const doneSet = new Set(todayCheckIns.map((c) => c.goalId));
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
            checked={doneSet.has(goal.id)}
            title={goal.title}
            meta={typeof goal.targetCount === 'number' ? `Target: ${goal.targetCount} reps` : undefined}
            reward="+10 XP"
            onToggle={() => onToggle(goal.id)}
          />
        </li>
      ))}
    </ul>
  );
}
