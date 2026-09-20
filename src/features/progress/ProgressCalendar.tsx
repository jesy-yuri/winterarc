import { useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, SectionHeader } from '../../components/ui/Section';
import {
  dayCompletion,
  formatLongDate,
  formatMonthYear,
  monthCells,
} from '../../lib/progress';
import type { LocalStore } from '../../lib/localStore';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ProgressCalendar({
  store,
  roomId,
  memberId,
  today,
}: {
  store: LocalStore;
  roomId: string;
  memberId: string;
  today: string;
}) {
  const todayDate = new Date(`${today}T00:00:00`);
  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selected, setSelected] = useState(today);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const cells = monthCells(year, month);
  const detail = dayCompletion(store, roomId, memberId, selected);
  const hasItems = memberDayItemCount(store, roomId, memberId) > 0;

  return (
    <div>
      <SectionHeader
        eyebrow="Progress"
        title="Calendar"
        description="Your daily activity. Tap a day to see details."
      />

      {!hasItems ? (
        <EmptyState
          icon={<CalendarDays size={20} aria-hidden="true" />}
          title="No calendar data yet"
          body="Add a room goal, personal goal, or workout, then check in to start filling your calendar."
        />
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[15px] font-medium text-ink">{formatMonthYear(year, month)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setYear(todayDate.getFullYear());
                  setMonth(todayDate.getMonth());
                  setSelected(today);
                }}
                className="mr-1 rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="Previous month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="Next month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1" role="grid" aria-label="Progress calendar">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="py-1 text-center text-xs font-medium text-faint">
                {d}
              </span>
            ))}
            {cells.map(({ key, inMonth }) => {
              if (!inMonth) return <span key={key} />;
              if (key > today) {
                const n = new Date(`${key}T00:00:00`).getDate();
                return (
                  <span
                    key={key}
                    className="flex min-h-[44px] items-center justify-center rounded-lg text-sm text-faint/50"
                  >
                    {n}
                  </span>
                );
              }
              const dc = dayCompletion(store, roomId, memberId, key);
              const n = new Date(`${key}T00:00:00`).getDate();
              const isToday = key === today;
              const isSelected = key === selected;
              const state =
                dc.total === 0 || dc.doneCount === 0
                  ? 'No activity'
                  : dc.doneCount >= dc.total
                    ? 'Complete'
                    : 'Partial';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  aria-label={`${formatLongDate(key)}: ${state}, ${dc.doneCount} of ${dc.total}`}
                  aria-pressed={isSelected}
                  className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg border text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60 ${
                    isSelected
                      ? 'border-accent/60 bg-accent/[0.10] text-ink'
                      : dc.total > 0 && dc.doneCount >= dc.total
                        ? 'border-accent/25 bg-accent/[0.07] text-ink hover:border-accent/50'
                        : dc.doneCount > 0
                          ? 'border-line bg-surface text-ink hover:border-accent/40'
                          : 'border-transparent text-muted hover:border-line hover:text-ink'
                  } ${isToday ? 'ring-1 ring-accent' : ''}`}
                >
                  <span className={isToday ? 'font-semibold' : ''}>{n}</span>
                  {dc.total > 0 && dc.doneCount >= dc.total ? (
                    <Check size={11} strokeWidth={3} aria-hidden="true" className="text-accent" />
                  ) : dc.doneCount > 0 ? (
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                  ) : (
                    <span aria-hidden="true" className="h-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day detail */}
          <div className="mt-4 rounded-xl border border-line bg-surface p-4" aria-live="polite">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-medium text-ink">{formatLongDate(selected)}</p>
              <p className="text-sm font-medium text-muted tabular-nums">
                {detail.doneCount}/{detail.total} · {detail.pct}%
              </p>
            </div>
            <div className="mt-2.5">
              <ProgressBar value={detail.pct} size="sm" />
            </div>
            {detail.total === 0 ? (
              <p className="mt-2.5 text-[13px] text-muted">No tracked items.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-1.5">
                {detail.done.map((i) => (
                  <p key={i.key} className="flex items-center gap-2 text-[13px] text-muted">
                    <Check size={14} strokeWidth={3} aria-hidden="true" className="shrink-0 text-success" />
                    {i.title}
                  </p>
                ))}
                {detail.remaining.map((i) => (
                  <p key={i.key} className="flex items-center gap-2 text-[13px] text-faint">
                    <Circle size={13} aria-hidden="true" className="shrink-0" />
                    {i.title}
                  </p>
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-faint">
            Completion uses your current goal list as reference.
          </p>
        </>
      )}
    </div>
  );
}

function memberDayItemCount(store: LocalStore, roomId: string, memberId: string): number {
  const goals = store.goals.filter((g) => g.roomId === roomId).length;
  const personal = (store.personalGoals ?? []).filter(
    (g) => g.memberId === memberId && g.isActive,
  ).length;
  const plans = (store.workoutPlans ?? []).find(
    (p) => p.roomId === roomId && p.memberId === memberId,
  );
  const workouts = (plans?.selections ?? []).filter((s) => s.included).length;
  return goals + personal + workouts;
}
