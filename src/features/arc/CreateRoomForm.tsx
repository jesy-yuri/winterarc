import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { REP_OPTIONS, WORKOUT_EXERCISES } from '../../lib/workouts';

interface GoalDraft {
  title: string;
  icon: string;
  targetCount?: number;
}

const DEFAULT_GOALS: GoalDraft[] = [
  { title: 'Gym', icon: 'GYM' },
  { title: 'Push Ups', icon: 'PUSH', targetCount: 20 },
  { title: 'Aral', icon: 'READ' },
  { title: 'Tulog 7hrs', icon: 'SLEEP' },
  { title: 'No junk food', icon: 'DIET' },
];

const ICON_OPTIONS = [
  'GYM',
  'READ',
  'SLEEP',
  'RUN',
  'DIET',
  'FOCUS',
  'SAVE',
  'WATER',
  'STUDY',
  'WORK',
  'CODE',
  'PRAY',
];

function normalizeIcon(v: string): string {
  return v.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function CreateRoomForm({
  onSubmit,
}: {
  onSubmit: (input: {
    title: string;
    nickname: string;
    startDate: string;
    endDate: string;
    goals: GoalDraft[];
  }) => void;
}) {
  const [title, setTitle] = useState('Barkada Winter Arc');
  const [nickname, setNickname] = useState('');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-01-01');
  const [goals, setGoals] = useState<GoalDraft[]>(DEFAULT_GOALS);
  const [newGoal, setNewGoal] = useState('');
  const [newIcon, setNewIcon] = useState('FOCUS');
  const [quickCounts, setQuickCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  function addGoal() {
    const v = newGoal.trim();
    if (!v) return;
    const icon = normalizeIcon(newIcon) || 'FOCUS';
    setGoals((g) => [...g, { title: v, icon }]);
    setNewGoal('');
  }

  function addWorkoutGoal(exerciseId: string) {
    const ex = WORKOUT_EXERCISES.find((e) => e.id === exerciseId);
    if (!ex) return;
    const count = quickCounts[exerciseId] ?? ex.defaultCount;
    setGoals((g) => [...g, { title: ex.title, icon: ex.icon, targetCount: count }]);
  }

  function removeGoal(index: number) {
    setGoals((g) => g.filter((_, i) => i !== index));
  }

  function setGoalCount(index: number, value: string) {
    setGoals((g) =>
      g.map((goal, i) =>
        i === index
          ? value === ''
            ? { title: goal.title, icon: goal.icon }
            : { ...goal, targetCount: Number(value) }
          : goal,
      ),
    );
  }

  function setGoalIcon(index: number, icon: string) {
    const normalized = normalizeIcon(icon);
    if (!normalized) return;
    setGoals((g) => g.map((goal, i) => (i === index ? { ...goal, icon: normalized } : goal)));
  }

  function submit() {
    if (!title.trim() || !nickname.trim()) {
      setError('Kailangan ng room title at nickname.');
      return;
    }
    if (goals.length === 0) {
      setError('Magdagdag ng kahit isang goal.');
      return;
    }
    setError('');
    onSubmit({ title, nickname, startDate, endDate, goals });
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Room title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Barkada Winter Arc"
      />
      <Input
        label="Nickname mo"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="e.g. Mark"
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-300">Goals</p>
        <ul className="flex flex-col gap-2">
          {goals.map((g, i) => (
            <li
              key={`${g.title}-${i}`}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
                    {g.icon}
                  </span>
                  <span>{g.title}</span>
                  {typeof g.targetCount === 'number' && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                      x{g.targetCount}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  className="text-xs text-slate-400 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGoalIcon(i, option)}
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide transition ${
                      g.icon === option
                        ? 'border-sky-400 bg-sky-500 text-white'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Reps:</span>
                <select
                  value={g.targetCount ? String(g.targetCount) : ''}
                  onChange={(e) => setGoalCount(i, e.target.value)}
                  className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                >
                  <option value="">No count</option>
                  {REP_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      x{n}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="mb-1 text-xs font-medium text-emerald-300">
            Quick add workout (mamili ng count 10-100)
          </p>
          <ul className="flex flex-col gap-1.5">
            {WORKOUT_EXERCISES.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-200">
                  {ex.title} <span className="text-slate-500">({ex.icon})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <select
                    value={quickCounts[ex.id] ?? ex.defaultCount}
                    onChange={(e) =>
                      setQuickCounts((q) => ({ ...q, [ex.id]: Number(e.target.value) }))
                    }
                    className="rounded-md border border-white/10 bg-slate-900 px-1.5 py-1 text-xs text-white"
                  >
                    {REP_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        x{n}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => addWorkoutGoal(ex.id)}
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25"
                  >
                    Add
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Dagdag goal..."
            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          <Button type="button" variant="ghost" onClick={addGoal}>
            Add
          </Button>
        </div>
        <div className="mt-2">
          <p className="mb-1 text-xs text-slate-400">Icon para sa bagong goal</p>
          <div className="flex flex-wrap gap-1">
            {ICON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setNewIcon(option)}
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide transition ${
                  newIcon === option
                    ? 'border-sky-400 bg-sky-500 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <input
            value={newIcon}
            onChange={(e) => setNewIcon(normalizeIcon(e.target.value))}
            placeholder="O mag-type ng sarili, e.g. BOX"
            maxLength={8}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="button" onClick={submit}>
        Create room
      </Button>
    </div>
  );
}
