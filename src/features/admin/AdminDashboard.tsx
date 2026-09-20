import { useState } from 'react';
import { BarChart3, Pencil, Trash2, Users } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/Section';
import type { MemberStat, RoomAnalytics } from '../../lib/localStore';

export function AdminDashboard({
  analytics,
  stats,
  onUpdateGoal,
  onDeleteGoal,
}: {
  analytics: RoomAnalytics;
  stats: MemberStat[];
  onUpdateGoal: (goalId: string, newTitle: string) => void;
  onDeleteGoal: (goalId: string) => void;
}) {
  const maxDay = Math.max(1, ...analytics.last7Days.map((d) => d.count));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface px-1 sm:px-2">
        <div className="px-1 py-3 text-center sm:px-2 sm:py-4">
          <p className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
            {analytics.totalMembers}
          </p>
          <p className="mt-0.5 text-xs text-muted sm:text-[13px]">Members</p>
        </div>
        <div className="px-1 py-3 text-center sm:px-2 sm:py-4">
          <p className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
            {analytics.totalCheckIns}
          </p>
          <p className="mt-0.5 text-xs text-muted sm:text-[13px]">Check-ins</p>
        </div>
        <div className="px-1 py-3 text-center sm:px-2 sm:py-4">
          <p className="text-xl font-semibold tracking-tight text-ink tabular-nums sm:text-2xl">
            {analytics.activeToday}
          </p>
          <p className="mt-0.5 text-xs text-muted sm:text-[13px]">Active today</p>
        </div>
      </div>

      <section aria-labelledby="admin-members">
        <SectionHeader
          title="Members"
          description="Progress per member. Tap the room's member list to view as someone else."
        />
        <div className="mt-4 -mx-0 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-[13px] sm:min-w-[560px]">
            <thead>
              <tr className="border-b border-line text-faint">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={14} aria-hidden="true" />
                    Member
                  </span>
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">Role</th>
                <th scope="col" className="px-4 py-2.5 font-medium">XP</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Streak</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Today</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.member.id} className="border-b border-line text-muted last:border-b-0">
                  <td className="px-4 py-2.5 text-ink">
                    <span className="flex items-center gap-2">
                      <Avatar nickname={s.member.nickname} avatarUrl={s.member.avatarUrl} size="xs" />
                      {s.member.nickname}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{s.member.role}</td>
                  <td className="px-4 py-2.5 tabular-nums">{s.xp}</td>
                  <td className="px-4 py-2.5 tabular-nums">{s.streak}</td>
                  <td className="px-4 py-2.5 tabular-nums">{s.todayCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="admin-goals">
        <SectionHeader
          title="Goals"
          description="Tap a goal name to rename it. Deleting a goal also removes its check-ins."
        />
        <ul className="mt-4 flex flex-col overflow-hidden rounded-xl border border-line">
          {analytics.goalStats.map((g, idx) => (
            <GoalRow
              key={g.goalId}
              bordered={idx > 0}
              goalId={g.goalId}
              title={g.targetCount ? `${g.title} · ${g.targetCount} reps` : g.title}
              totalCheckIns={g.totalCheckIns}
              uniqueMembers={g.uniqueMembers}
              onUpdateGoal={onUpdateGoal}
              onDeleteGoal={onDeleteGoal}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="admin-activity">
        <SectionHeader title="Activity" description="Check-ins over the last 7 days." />
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-end gap-1.5">
            {analytics.last7Days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-sm bg-accent/70"
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 56)}px` }}
                  title={`${d.date}: ${d.count}`}
                />
                <span className="text-[10px] text-faint tabular-nums">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-faint">
            <BarChart3 size={14} aria-hidden="true" />
            {analytics.totalCheckIns} total check-ins
          </p>
        </div>
      </section>

      {analytics.inactiveMembers.length > 0 && (
        <section aria-labelledby="admin-followup" className="rounded-xl border border-warning/25 bg-warning/[0.06] p-4">
          <h3 id="admin-followup" className="text-sm font-semibold text-warning">
            Needs follow-up
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {analytics.inactiveMembers.map((m) => m.nickname).join(', ')} — no check-ins
            in the last 3 days.
          </p>
        </section>
      )}
    </div>
  );
}

function GoalRow({
  bordered,
  goalId,
  title,
  totalCheckIns,
  uniqueMembers,
  onUpdateGoal,
  onDeleteGoal,
}: {
  bordered: boolean;
  goalId: string;
  title: string;
  totalCheckIns: number;
  uniqueMembers: number;
  onUpdateGoal: (goalId: string, newTitle: string) => void;
  onDeleteGoal: (goalId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState('');

  function save() {
    try {
      onUpdateGoal(goalId, draft);
      setEditing(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while updating.');
    }
  }

  function remove() {
    if (!window.confirm(`Delete goal "${title}" including its check-ins?`)) return;
    onDeleteGoal(goalId);
  }

  return (
    <li className={`bg-surface px-3 py-3 sm:px-4 ${bordered ? 'border-t border-line' : ''}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                setEditing(false);
                setDraft(title);
              }
            }}
            autoFocus
            aria-label="Goal title"
            className="min-w-0 flex-1 rounded-lg border border-accent/50 bg-surface px-2.5 py-1.5 text-sm text-ink focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setEditing(true);
            }}
            title="Tap to rename"
            className="min-w-0 flex-1 truncate text-left text-sm text-ink transition-colors hover:text-accent-strong"
          >
            {title}
          </button>
        )}
        <span className="flex shrink-0 items-center gap-2 text-xs text-faint tabular-nums">
          <span>
            {totalCheckIns} check-ins · {uniqueMembers} members
          </span>
          {editing ? (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={save}>
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setDraft(title);
                  setError('');
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(title);
                  setEditing(true);
                }}
                aria-label={`Rename ${title}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={remove}
                aria-label={`Delete ${title}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </span>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </li>
  );
}
