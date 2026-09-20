import { useState } from 'react';
import { Dumbbell, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CheckRow } from '../../components/ui/Controls';
import { InlineSelect } from '../../components/ui/Select';
import { EmptyState, SectionHeader } from '../../components/ui/Section';
import { REP_OPTIONS, WORKOUT_EXERCISES } from '../../lib/workouts';
import type { CheckIn, WorkoutSelection } from '../../types';

interface EnabledWorkout {
  exerciseId: string;
  title: string;
  icon: string;
  targetCount: number;
  goalId: string;
}

export function WorkoutPlanEditor({
  selections,
  enabledWorkouts,
  todayCheckIns,
  onSave,
  onToggleWorkout,
}: {
  selections: WorkoutSelection[];
  enabledWorkouts: EnabledWorkout[];
  todayCheckIns: CheckIn[];
  onSave: (selections: WorkoutSelection[]) => void;
  onToggleWorkout: (exerciseId: string) => void;
}) {
  const [draft, setDraft] = useState<WorkoutSelection[]>(selections);
  const [editing, setEditing] = useState(false);

  function startEditing() {
    setDraft(selections);
    setEditing(true);
  }

  const doneSet = new Set(todayCheckIns.map((c) => c.goalId));

  function toggleIncluded(exerciseId: string) {
    setDraft((d) =>
      d.map((s) => (s.exerciseId === exerciseId ? { ...s, included: !s.included } : s)),
    );
  }

  function setCount(exerciseId: string, count: number) {
    setDraft((d) =>
      d.map((s) => (s.exerciseId === exerciseId ? { ...s, targetCount: count } : s)),
    );
  }

  function save() {
    onSave(draft);
    setEditing(false);
  }

  const enabledCount = draft.filter((s) => s.included).length;

  return (
    <div>
      <SectionHeader
        eyebrow="Workout"
        title="Today's Workout"
        description={
          editing
            ? 'Choose your exercises and reps, then save.'
            : 'Your personal plan. Each exercise earns +10 XP.'
        }
        action={
          editing ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(selections);
                  setEditing(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} className="w-full sm:w-auto">
                Save{enabledCount > 0 ? ` (${enabledCount})` : ''}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={startEditing} className="w-full sm:w-auto">
              <Pencil size={15} aria-hidden="true" />
              Customize
            </Button>
          )
        }
      />

      <div className="mt-4">
        {editing ? (
          <ul className="flex flex-col gap-2.5">
            {WORKOUT_EXERCISES.map((ex) => {
              const sel = draft.find((s) => s.exerciseId === ex.id);
              const included = sel?.included ?? false;
              const count = sel?.targetCount ?? ex.defaultCount;
              return (
                <li
                  key={ex.id}
                  className={`flex min-h-[54px] flex-col gap-2 rounded-xl border px-3 py-3 transition-colors duration-200 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-3 sm:px-4 ${
                    included ? 'border-accent/30 bg-accent/[0.07]' : 'border-line bg-surface'
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleIncluded(ex.id)}
                      className="h-[18px] w-[18px] shrink-0 accent-accent"
                    />
                    <span className="truncate text-sm text-ink sm:text-[15px]">{ex.title}</span>
                  </label>
                  <InlineSelect
                    label={`${ex.title} reps`}
                    value={count}
                    onChange={(e) => setCount(ex.id, Number(e.target.value))}
                    disabled={!included}
                  >
                    {REP_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n} reps
                      </option>
                    ))}
                  </InlineSelect>
                </li>
              );
            })}
          </ul>
        ) : enabledWorkouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={20} aria-hidden="true" />}
            title="No workout selected"
            body="Pick exercises like Push Ups or Jumping Jacks and set your reps from 10 to 100."
            action={
              <Button type="button" variant="secondary" size="sm" onClick={startEditing}>
                Choose exercises
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {enabledWorkouts.map((w) => (
              <li key={w.exerciseId}>
                <CheckRow
                  checked={doneSet.has(w.goalId)}
                  title={w.title}
                  meta={`${w.targetCount} reps`}
                  reward="+10 XP"
                  tone="success"
                  onToggle={() => onToggleWorkout(w.exerciseId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
