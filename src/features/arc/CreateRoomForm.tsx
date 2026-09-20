import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { InlineSelect } from '../../components/ui/Select';
import { Divider, SectionHeader } from '../../components/ui/Section';
import { REP_OPTIONS, WORKOUT_EXERCISES } from '../../lib/workouts';

interface GoalDraft {
  title: string;
  icon: string;
  targetCount?: number;
}

const DEFAULT_GOALS: GoalDraft[] = [
  { title: 'Gym', icon: 'GYM' },
  { title: 'Push Ups', icon: 'PUSH', targetCount: 20 },
  { title: 'Study', icon: 'READ' },
  { title: 'Sleep 7hrs', icon: 'SLEEP' },
  { title: 'No junk food', icon: 'DIET' },
];

/** Auto-pick an icon so the user doesn't have to think about it. */
function guessIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('gym') || t.includes('workout')) return 'GYM';
  if (t.includes('push')) return 'PUSH';
  if (t.includes('curl') || t.includes('sit up')) return 'CURL';
  if (t.includes('jack')) return 'JUMP';
  if (t.includes('squat')) return 'SQUAT';
  if (t.includes('lunge')) return 'LUNGE';
  if (t.includes('burpee')) return 'BURP';
  if (t.includes('plank')) return 'PLANK';
  if (t.includes('pull')) return 'PULL';
  if (t.includes('run') || t.includes('walk') || t.includes('jog')) return 'RUN';
  if (t.includes('study') || t.includes('read') || t.includes('school')) return 'READ';
  if (t.includes('sleep')) return 'SLEEP';
  if (t.includes('diet') || t.includes('junk') || t.includes('eat')) return 'DIET';
  if (t.includes('water') || t.includes('drink')) return 'WATER';
  if (t.includes('code')) return 'CODE';
  if (t.includes('pray')) return 'PRAY';
  if (t.includes('work')) return 'WORK';
  return 'FOCUS';
}

export function CreateRoomForm({
  onSubmit,
}: {
  onSubmit: (input: {
    title: string;
    nickname: string;
    description?: string;
    startDate: string;
    endDate: string;
    goals: GoalDraft[];
  }) => void;
}) {
  const [title, setTitle] = useState('Crew Winter Arc');
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2027-01-01');
  const [goals, setGoals] = useState<GoalDraft[]>(DEFAULT_GOALS);
  const [newGoal, setNewGoal] = useState('');
  const [newCount, setNewCount] = useState('');
  const [error, setError] = useState('');

  const addedTitles = new Set(goals.map((g) => g.title.toLowerCase()));
  const suggestions = WORKOUT_EXERCISES.filter((ex) => !addedTitles.has(ex.title.toLowerCase()));

  function addGoal(titleValue: string, countValue?: number) {
    const v = titleValue.trim();
    if (!v) return;
    if (addedTitles.has(v.toLowerCase())) return;
    setGoals((g) => [...g, { title: v, icon: guessIcon(v), ...(countValue ? { targetCount: countValue } : {}) }]);
  }

  function handleAddCustom() {
    addGoal(newGoal, newCount ? Number(newCount) : undefined);
    setNewGoal('');
    setNewCount('');
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

  function submit() {
    if (!title.trim() || !nickname.trim()) {
      setError('Room title and nickname are required.');
      return;
    }
    if (goals.length === 0) {
      setError('Add at least one goal.');
      return;
    }
    setError('');
    onSubmit({ title, nickname, description, startDate, endDate, goals });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Room details */}
      <section aria-labelledby="room-details">
        <SectionHeader
          title="Room details"
          description="Basic info about your Winter Arc season."
        />
        <div className="mt-4 flex flex-col gap-4">
          <Input
            label="Room name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Crew Winter Arc"
          />
          <div>
            <label htmlFor="room-description" className="block text-[13px] font-medium text-muted">
              Description <span className="font-normal text-faint">(optional)</span>
            </label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="e.g. For our study group this season."
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
          </div>
          <Input
            label="Your name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Jessie"
            hint="You are the admin of this room."
          />
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* Daily goals — single, unified flow */}
      <section aria-labelledby="daily-goals">
        <SectionHeader
          title="Daily goals"
          description="What will you do every day? Each check-in is +10 XP."
        />

        {goals.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
            No goals yet. Add one below or tap a suggestion.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {goals.map((g, i) => (
              <li
                key={`${g.title}-${i}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
                  {g.title}
                </p>
                <InlineSelect
                  label={`Reps for ${g.title}`}
                  value={g.targetCount ? String(g.targetCount) : ''}
                  onChange={(e) => setGoalCount(i, e.target.value)}
                >
                  <option value="">No reps</option>
                  {REP_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} reps
                    </option>
                  ))}
                </InlineSelect>
                <button
                  type="button"
                  onClick={() => removeGoal(i)}
                  aria-label={`Remove ${g.title}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-danger"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* One add bar: name + optional reps + Add */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCustom();
            }}
            placeholder="Add a goal... e.g. Read 20 mins"
            aria-label="New goal title"
            className="min-w-0 flex-1 rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
          />
          <div className="flex gap-2">
            <InlineSelect
              label="Reps for new goal"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
              className="py-2.5"
            >
              <option value="">No reps</option>
              {REP_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} reps
                </option>
              ))}
            </InlineSelect>
            <Button type="button" variant="secondary" onClick={handleAddCustom} className="flex-1 sm:flex-none">
              <Plus size={16} aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>

        {/* Suggestions: one-tap add, replaces the old "Quick add workout" section */}
        {suggestions.length > 0 && (
          <div className="mt-4">
            <p className="text-[13px] font-medium text-muted">
              Need ideas? Tap to add:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addGoal(ex.title, ex.defaultCount)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-base px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-success/40 hover:text-ink"
                >
                  <Plus size={13} aria-hidden="true" className="text-success" />
                  {ex.title} · {ex.defaultCount}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="button" onClick={submit} className="w-full">
        Create Room
      </Button>
    </div>
  );
}
