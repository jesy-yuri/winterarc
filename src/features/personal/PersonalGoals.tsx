import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CheckRow } from '../../components/ui/Controls';
import { InlineSelect } from '../../components/ui/Select';
import { EmptyState, SectionHeader } from '../../components/ui/Section';
import { REP_OPTIONS } from '../../lib/workouts';
import type { PersonalGoal } from '../../types';
import type { PersonalGoalInput } from '../../lib/localStore';

interface Draft {
  title: string;
  description: string;
  targetCount: string;
}

const EMPTY_DRAFT: Draft = { title: '', description: '', targetCount: '' };

function toInput(d: Draft): PersonalGoalInput {
  return {
    title: d.title,
    description: d.description,
    targetCount: d.targetCount === '' ? undefined : Number(d.targetCount),
  };
}

export function PersonalGoals({
  goals,
  todayDoneKeys,
  onToggle,
  onCreate,
  onUpdate,
  onArchive,
  onDelete,
}: {
  goals: PersonalGoal[];
  todayDoneKeys: Set<string>;
  onToggle: (checkInKey: string) => void;
  onCreate: (input: PersonalGoalInput) => void;
  onUpdate: (goalId: string, input: PersonalGoalInput) => void;
  onArchive: (goalId: string, isActive: boolean) => void;
  onDelete: (goalId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);

  const active = goals.filter((g) => g.isActive);
  const archived = goals.filter((g) => !g.isActive);

  function submitCreate() {
    try {
      onCreate(toInput(draft));
      setDraft(EMPTY_DRAFT);
      setAdding(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while creating.');
    }
  }

  function startEdit(g: PersonalGoal) {
    setEditingId(g.id);
    setEditDraft({
      title: g.title,
      description: g.description ?? '',
      targetCount: typeof g.targetCount === 'number' ? String(g.targetCount) : '',
    });
    setError('');
  }

  function submitEdit(id: string) {
    try {
      onUpdate(id, toInput(editDraft));
      setEditingId(null);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while updating.');
    }
  }

  return (
    <div>
      <SectionHeader
        eyebrow="Personal"
        title="Personal Goals"
        description="Your own goals. They count toward today's progress, streak, and XP."
        action={
          adding ? undefined : (
            <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(true)} className="w-full sm:w-auto">
              <Plus size={15} aria-hidden="true" />
              New goal
            </Button>
          )
        }
      />

      <div className="mt-4 flex flex-col gap-2.5">
        {adding && (
          <div className="rounded-xl border border-accent/30 bg-accent/[0.05] p-4">
            <label htmlFor="pg-title" className="block text-[13px] font-medium text-muted">
              Goal name
            </label>
            <input
              id="pg-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Practice coding"
              maxLength={80}
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
            <label htmlFor="pg-desc" className="mt-3 block text-[13px] font-medium text-muted">
              Description <span className="font-normal text-faint">(optional)</span>
            </label>
            <input
              id="pg-desc"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="e.g. 1 hour after dinner"
              maxLength={200}
              className="mt-1.5 w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[13px] text-muted">Daily reps</span>
              <InlineSelect
                label="Daily reps"
                value={draft.targetCount}
                onChange={(e) => setDraft({ ...draft, targetCount: e.target.value })}
              >
                <option value="">No reps</option>
                {REP_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} reps
                  </option>
                ))}
              </InlineSelect>
            </div>
            {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button type="button" size="sm" onClick={submitCreate} className="w-full sm:w-auto">
                Create goal
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAdding(false);
                  setDraft(EMPTY_DRAFT);
                  setError('');
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {active.length === 0 && !adding && (
          <EmptyState
            icon={<Target size={20} aria-hidden="true" />}
            title="No personal goals yet"
            body="Create your first goal to start tracking your progress."
            action={
              <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(true)}>
                <Plus size={15} aria-hidden="true" />
                Create a goal
              </Button>
            }
          />
        )}

        {active.map((g) =>
          editingId === g.id ? (
            <div key={g.id} className="rounded-xl border border-line bg-surface p-4">
              <label htmlFor={`pge-${g.id}`} className="block text-[13px] font-medium text-muted">
                Goal name
              </label>
              <input
                id={`pge-${g.id}`}
                value={editDraft.title}
                onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                maxLength={80}
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-accent/60 focus:outline-none"
              />
              <label htmlFor={`pged-${g.id}`} className="mt-3 block text-[13px] font-medium text-muted">
                Description <span className="font-normal text-faint">(optional)</span>
              </label>
              <input
                id={`pged-${g.id}`}
                value={editDraft.description}
                onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                maxLength={200}
                className="mt-1.5 w-full rounded-lg border border-line bg-base px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-accent/60 focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[13px] text-muted">Daily reps</span>
                <InlineSelect
                  label="Daily reps"
                  value={editDraft.targetCount}
                  onChange={(e) => setEditDraft({ ...editDraft, targetCount: e.target.value })}
                >
                  <option value="">No reps</option>
                  {REP_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n} reps
                    </option>
                  ))}
                </InlineSelect>
              </div>
              {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button type="button" size="sm" onClick={() => submitEdit(g.id)} className="w-full sm:w-auto">
                  Save
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              key={g.id}
              className="flex items-start gap-1.5"
            >
              <div className="min-w-0 flex-1">
                <CheckRow
                  checked={todayDoneKeys.has(`personal:${g.id}`)}
                  title={g.title}
                  meta={
                    [
                      g.description,
                      typeof g.targetCount === 'number' ? `Target: ${g.targetCount} reps` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || undefined
                  }
                  reward="+10 XP"
                  onToggle={() => onToggle(`personal:${g.id}`)}
                />
              </div>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => startEdit(g)}
                  aria-label={`Edit ${g.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onArchive(g.id, false)}
                  aria-label={`Archive ${g.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
                >
                  <Archive size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ),
        )}

        {archived.length > 0 && (
          <details className="mt-1">
            <summary className="cursor-pointer text-sm text-muted">
              Archived ({archived.length})
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {archived.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-2.5"
                >
                  <span className="min-w-0 truncate text-sm text-muted">{g.title}</span>
                  <span className="flex shrink-0">
                    <button
                      type="button"
                      onClick={() => onArchive(g.id, true)}
                      aria-label={`Restore ${g.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
                    >
                      <ArchiveRestore size={15} aria-hidden="true" />
                    </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${g.title}" including its check-ins?`)) {
                            onDelete(g.id);
                          }
                        }}
                      aria-label={`Delete ${g.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
