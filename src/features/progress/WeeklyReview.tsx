import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState, SectionHeader, Stat } from '../../components/ui/Section';
import { getReflection } from '../../lib/localStore';
import type { LocalStore } from '../../lib/localStore';
import {
  addDays,
  calcWeekReview,
  formatLongDate,
  mondayOf,
} from '../../lib/progress';

export function WeeklyReview({
  store,
  roomId,
  memberId,
  today,
  onSaveReflection,
}: {
  store: LocalStore;
  roomId: string;
  memberId: string;
  today: string;
  onSaveReflection: (input: {
    memberId: string;
    weekKey: string;
    wentWell: string;
    improve: string;
  }) => void;
}) {
  const thisMonday = mondayOf(today);
  const reviewMonday = thisMonday ? addDays(thisMonday, -7) : null;
  const review = reviewMonday ? calcWeekReview(store, roomId, memberId, reviewMonday) : null;
  const saved = reviewMonday ? getReflection(store, memberId, reviewMonday) : undefined;

  // All past reflections for this member, newest first — so saved notes stay visible
  // even after the week rolls over (previously they just "disappeared").
  const history = (store.reflections ?? [])
    .filter((r) => r.memberId === memberId)
    .sort((a, b) => (a.weekKey < b.weekKey ? 1 : a.weekKey > b.weekKey ? -1 : 0));
  const pastHistory = reviewMonday ? history.filter((r) => r.weekKey !== reviewMonday) : history;

  const weekLabel =
    review && review.days.length === 7
      ? `${formatLongDate(review.days[0].date)} – ${formatLongDate(review.days[6].date)}`
      : '';

  const focus = review ? nextWeekFocus(store, memberId, review.days.map((d) => d.date)) : [];

  return (
    <div>
      <SectionHeader
        eyebrow="Review"
        title="Weekly Review"
        description={weekLabel ? `Last week · ${weekLabel}` : 'Last week'}
      />

      {!review || (review.totalPossible === 0 && review.totalDone === 0) ? (
        <EmptyState
          icon={<CalendarRange size={20} aria-hidden="true" />}
          title="No weekly data yet"
          body="Complete a few daily check-ins to generate your first review."
        />
      ) : (
        <div className="mt-4 flex flex-col gap-5 sm:gap-6">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
                {review.totalDone}{' '}
                <span className="text-base font-normal text-muted">
                  / {review.totalPossible} tasks
                </span>
              </p>
              <p className="text-sm font-medium text-muted tabular-nums">{review.pct}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={review.pct} />
            </div>
            <p className="mt-2 text-[13px] text-muted">
              You completed {review.pct}% of your planned tasks this week.
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface px-1 sm:px-2">
            <Stat value={`${review.activeDays}/7`} label="Active days" />
            <Stat
              value={review.bestDay ? review.bestDay.label : '—'}
              label={
                review.bestDay
                  ? `Best day · ${review.bestDay.done}/${review.bestDay.total}`
                  : 'Best day'
              }
            />
            <Stat value={`${review.endStreak}`} label="Streak at week end" />
          </div>

          <ul className="flex flex-col overflow-hidden rounded-xl border border-line" aria-label="Daily breakdown">
            {review.days.map((d, idx) => (
              <li
                key={d.date}
                className={`flex items-center gap-2 bg-surface px-3 py-2.5 sm:gap-3 sm:px-4 ${idx > 0 ? 'border-t border-line' : ''}`}
              >
                <span className="w-16 shrink-0 truncate text-[13px] text-muted sm:w-20">{d.label}</span>
                <span className="flex-1">
                  <ProgressBar value={d.pct} size="sm" />
                </span>
                <span className="w-12 shrink-0 text-right text-[13px] text-muted tabular-nums">
                  {d.done}/{d.total}
                </span>
              </li>
            ))}
          </ul>

          {reviewMonday && (
            <ReflectionForm
              key={`${memberId}:${reviewMonday}`}
              memberId={memberId}
              weekKey={reviewMonday}
              initialWentWell={saved?.wentWell ?? ''}
              initialImprove={saved?.improve ?? ''}
              lastSavedAt={saved?.updatedAt}
              pastHistory={pastHistory}
              onSaveReflection={onSaveReflection}
            />
          )}

          <div>
            <h3 className="text-[15px] font-semibold text-ink">Next week focus</h3>
            {focus.length === 0 ? (
              <p className="mt-1 text-[13px] text-muted">
                Nothing lagging last week. Pick one habit to protect next week.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {focus.map((f) => (
                  <li key={f.title} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink">{f.title}</span>
                    <span className="shrink-0 text-[13px] text-faint tabular-nums">
                      {f.done}/7 days
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReflectionForm({
  memberId,
  weekKey,
  initialWentWell,
  initialImprove,
  lastSavedAt,
  pastHistory,
  onSaveReflection,
}: {
  memberId: string;
  weekKey: string;
  initialWentWell: string;
  initialImprove: string;
  lastSavedAt?: string;
  pastHistory: { id: string; weekKey: string; wentWell: string; improve: string }[];
  onSaveReflection: (input: {
    memberId: string;
    weekKey: string;
    wentWell: string;
    improve: string;
  }) => void;
}) {
  // Local state, initialized once per week+member via key remount above —
  // so typing is never clobbered and switching weeks gives a fresh form.
  const [wentWell, setWentWell] = useState(initialWentWell);
  const [improve, setImprove] = useState(initialImprove);
  const [savedTick, setSavedTick] = useState(false);
  const isEmpty = wentWell.trim() === '' && improve.trim() === '';

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="text-[15px] font-semibold text-ink">Reflection</h3>
      <p className="mt-0.5 text-[13px] text-muted">
        Optional. Two short answers about last week. Saved under this week — see past notes
        below.
      </p>
      {lastSavedAt && (
        <p className="mt-1 text-xs text-faint">
          Last saved: {new Date(lastSavedAt).toLocaleString()}
        </p>
      )}
      <label htmlFor="rw-well" className="mt-3 block text-[13px] font-medium text-muted">
        What went well?
      </label>
      <textarea
        id="rw-well"
        value={wentWell}
        onChange={(e) => {
          setWentWell(e.target.value);
          setSavedTick(false);
        }}
        rows={2}
        maxLength={500}
        className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
        placeholder="e.g. I checked in 6 out of 7 days."
      />
      <label htmlFor="rw-improve" className="mt-3 block text-[13px] font-medium text-muted">
        What do you want to improve next week?
      </label>
      <textarea
        id="rw-improve"
        value={improve}
        onChange={(e) => {
          setImprove(e.target.value);
          setSavedTick(false);
        }}
        rows={2}
        maxLength={500}
        className="mt-1.5 w-full resize-none rounded-lg border border-line bg-base px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-faint focus:border-accent/60 focus:outline-none"
        placeholder="e.g. Start a workout plan."
      />
      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isEmpty}
          onClick={() => {
            if (isEmpty) return;
            onSaveReflection({ memberId, weekKey, wentWell, improve });
            setSavedTick(true);
          }}
        >
          Save reflection
        </Button>
        {savedTick && <span className="text-[13px] text-muted">Saved ✓</span>}
      </div>

      {pastHistory.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-[13px] font-medium text-muted">
            Past reflections ({pastHistory.length})
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {pastHistory.map((r) => (
              <li key={r.id} className="rounded-lg bg-base px-3 py-2.5 text-sm">
                <p className="text-xs font-medium text-faint">Week of {formatLongDate(r.weekKey)}</p>
                {r.wentWell && <p className="mt-1 text-ink">✓ {r.wentWell}</p>}
                {r.improve && <p className="mt-0.5 text-muted">→ {r.improve}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function nextWeekFocus(
  store: LocalStore,
  memberId: string,
  weekDates: string[],
): { title: string; done: number }[] {
  const personal = (store.personalGoals ?? []).filter(
    (g) => g.memberId === memberId && g.isActive,
  );
  const rows = personal.map((g) => {
    const key = `personal:${g.id}`;
    const done = new Set(
      store.checkIns
        .filter((c) => c.memberId === memberId && c.goalId === key && weekDates.includes(c.date))
        .map((c) => c.date),
    ).size;
    return { title: g.title, done };
  });
  return rows.sort((a, b) => a.done - b.done).slice(0, 3);
}
