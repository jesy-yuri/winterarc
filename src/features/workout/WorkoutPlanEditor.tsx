import { useState } from 'react';
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">My Workout Plan</h3>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(selections);
                setEditing(false);
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-400"
            >
              Save ({enabledCount})
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:border-white/25"
          >
            Customize
          </button>
        )}
      </div>

      {editing ? (
        <ul className="flex flex-col gap-2">
          {WORKOUT_EXERCISES.map((ex) => {
            const sel = draft.find((s) => s.exerciseId === ex.id);
            const included = sel?.included ?? false;
            const count = sel?.targetCount ?? ex.defaultCount;
            return (
              <li
                key={ex.id}
                className={`rounded-lg border px-3 py-2 transition ${
                  included ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleIncluded(ex.id)}
                      className="h-4 w-4 accent-sky-500"
                    />
                    <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
                      {ex.icon}
                    </span>
                    <span>{ex.title}</span>
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(ex.id, Number(e.target.value))}
                    disabled={!included}
                    className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                  >
                    {REP_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        x{n}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      ) : enabledWorkouts.length === 0 ? (
        <p className="text-xs text-slate-400">
          Wala ka pang workout na napili. Pindutin ang Customize para isali ang Push Ups,
          Curl Ups, Jumping Jacks, etc. at mamili ng count (10-100).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {enabledWorkouts.map((w) => {
            const done = doneSet.has(w.goalId);
            return (
              <li key={w.exerciseId}>
                <button
                  type="button"
                  onClick={() => onToggleWorkout(w.exerciseId)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    done
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
                      : 'border-white/10 bg-slate-900 text-slate-200 hover:border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300">
                      {w.icon}
                    </span>
                    <span>{w.title}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                      x{w.targetCount}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                      done ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-white/20'
                    }`}
                  >
                    {done ? 'v' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
