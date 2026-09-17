import { useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
          <p className="text-lg font-bold text-white">{analytics.totalMembers}</p>
          <p className="text-xs text-slate-400">Members</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
          <p className="text-lg font-bold text-white">{analytics.totalCheckIns}</p>
          <p className="text-xs text-slate-400">Check-ins</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
          <p className="text-lg font-bold text-white">{analytics.activeToday}</p>
          <p className="text-xs text-slate-400">Active today</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-300">Progress per member</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="py-1 pr-2">Nickname</th>
                <th className="py-1 pr-2">Role</th>
                <th className="py-1 pr-2">XP</th>
                <th className="py-1 pr-2">Streak</th>
                <th className="py-1">Today</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.member.id} className="border-t border-white/5 text-slate-200">
                  <td className="py-1.5 pr-2 text-white">
                    <span className="flex items-center gap-1.5">
                      <Avatar nickname={s.member.nickname} avatarUrl={s.member.avatarUrl} size="xs" />
                      {s.member.nickname}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2">{s.member.role}</td>
                  <td className="py-1.5 pr-2">{s.xp}</td>
                  <td className="py-1.5 pr-2">{s.streak}</td>
                  <td className="py-1.5">{s.todayCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-300">Per goal</p>
        <ul className="flex flex-col gap-1 text-xs text-slate-300">
          {analytics.goalStats.map((g) => (
            <GoalRow
              key={g.goalId}
              goalId={g.goalId}
              title={g.targetCount ? `${g.title} x${g.targetCount}` : g.title}
              totalCheckIns={g.totalCheckIns}
              uniqueMembers={g.uniqueMembers}
              onUpdateGoal={onUpdateGoal}
              onDeleteGoal={onDeleteGoal}
            />
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-slate-300">Last 7 days</p>
        <div className="flex items-end gap-1">
          {analytics.last7Days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded bg-sky-500/70"
                style={{ height: `${Math.max(4, (d.count / maxDay) * 48)}px` }}
                title={`${d.date}: ${d.count}`}
              />
              <span className="text-[10px] text-slate-500">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {analytics.inactiveMembers.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-300">Need follow-up</p>
          <p className="text-xs text-slate-400">
            {analytics.inactiveMembers.map((m) => m.nickname).join(', ')} - walang
            check-in sa last 3 days.
          </p>
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goalId,
  title,
  totalCheckIns,
  uniqueMembers,
  onUpdateGoal,
  onDeleteGoal,
}: {
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
      setError(e instanceof Error ? e.message : 'May error sa pag update.');
    }
  }

  function remove() {
    if (!window.confirm(`Delete goal "${title}" pati check-ins nito?`)) return;
    onDeleteGoal(goalId);
  }

  return (
    <li className="border-b border-white/5 py-1">
      <div className="flex items-center justify-between gap-2">
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
            className="w-full rounded-md border border-sky-500/40 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(title);
              setEditing(true);
            }}
            title="Click para i-edit"
            className="text-left hover:text-white hover:underline"
          >
            {title}
          </button>
        )}
        <span className="flex shrink-0 items-center gap-2">
          <span>
            {totalCheckIns} check-ins - {uniqueMembers} members
          </span>
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                className="text-sky-400 hover:text-sky-300"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(title);
                  setError('');
                }}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={remove}
              className="text-slate-400 hover:text-red-400"
            >
              Delete
            </button>
          )}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </li>
  );
}
