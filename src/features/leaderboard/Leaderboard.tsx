import { Avatar } from '../../components/ui/Avatar';
import { getStreakBadge, type MemberStat } from '../../lib/localStore';

function rankLabel(index: number): string {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `${index + 1}.`;
}

function rowStyle(index: number): string {
  if (index === 0) return 'border-yellow-400/40 bg-yellow-500/10';
  if (index === 1) return 'border-slate-300/30 bg-slate-300/5';
  if (index === 2) return 'border-orange-400/30 bg-orange-500/5';
  return 'border-white/10 bg-slate-900';
}

function badgeStyle(tier: string): string {
  if (tier === 'legendary') return 'border-yellow-400/50 text-yellow-300 bg-yellow-500/10';
  if (tier === 'epic') return 'border-violet-400/40 text-violet-300 bg-violet-500/10';
  if (tier === 'rare') return 'border-sky-400/40 text-sky-300 bg-sky-500/10';
  if (tier === 'uncommon') return 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10';
  return 'border-white/15 text-slate-300 bg-white/5';
}
export function Leaderboard({ stats }: { stats: MemberStat[] }) {
  if (stats.length === 0) return <p className="text-sm text-slate-400">Walang members pa.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {stats.map((s, i) => (
        <li
          key={s.member.id}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${rowStyle(i)}`}
        >
          <span className="flex items-center gap-2">
            <span className="w-8 text-slate-400">{rankLabel(i)}</span>
            <Avatar nickname={s.member.nickname} avatarUrl={s.member.avatarUrl} size="sm" />
            <span className="font-medium text-white">{s.member.nickname}</span>
            {(() => {
              const badge = getStreakBadge(s.streak);
              if (!badge) return null;
              return (
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium tracking-wide ${badgeStyle(badge.tier)}`}
                >
                  {badge.label}
                </span>
              );
            })()}
          </span>
          <span className="text-xs text-slate-400">
            {s.xp} XP - {s.todayCount} today - {s.streak} streak
          </span>
        </li>
      ))}
    </ol>
  );
}
