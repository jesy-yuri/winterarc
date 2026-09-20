import { Crown, Flame, Trophy } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, EmptyState } from '../../components/ui/Section';
import { getStreakBadge, type MemberStat } from '../../lib/localStore';

function rankLabel(index: number): string {
  return `${index + 1}`.padStart(2, '0');
}

// Calm podium palette: gold reserved for the champion, neutrals for 2nd/3rd.
// Rank is carried by bar height + number + crown — no extra labels needed.
const PODIUM_STYLE: Record<
  number,
  {
    bar: string;
    rankText: string;
    avatarRing: string;
    avatarSize: 'md' | 'lg';
    barHeight: string;
  }
> = {
  1: {
    bar: 'border-warning/40 bg-warning/[0.14]',
    rankText: 'text-warning',
    avatarRing: 'ring-warning',
    avatarSize: 'lg',
    barHeight: 'h-24 sm:h-28',
  },
  2: {
    bar: 'border-line bg-raised',
    rankText: 'text-muted',
    avatarRing: 'ring-line',
    avatarSize: 'md',
    barHeight: 'h-16 sm:h-20',
  },
  3: {
    bar: 'border-line bg-raised',
    rankText: 'text-muted',
    avatarRing: 'ring-line',
    avatarSize: 'md',
    barHeight: 'h-12 sm:h-16',
  },
};

function PodiumCard({
  stat,
  rank,
  isMe,
}: {
  stat: MemberStat;
  rank: 1 | 2 | 3;
  isMe: boolean;
}) {
  const style = PODIUM_STYLE[rank];
  const isChampion = rank === 1;
  return (
    <div
      className={`flex w-full min-w-0 max-w-[160px] flex-1 flex-col items-center ${
        isChampion ? 'sm:-mt-6' : ''
      }`}
    >
      {/* Crown space is reserved so 2nd/3rd stay aligned and UI doesn't jump */}
      <span className="flex h-6 items-center" aria-hidden="true">
        {isChampion && <Crown size={22} className="text-warning" />}
      </span>

      <div className={`rounded-full ring-2 ring-offset-2 ring-offset-surface ${style.avatarRing}`}>
        <Avatar nickname={stat.member.nickname} avatarUrl={stat.member.avatarUrl} size={style.avatarSize} />
      </div>

      <p
        className={`mt-2 w-full truncate text-center text-sm font-semibold ${
          isChampion ? 'text-ink sm:text-[15px]' : 'text-ink'
        }`}
        title={stat.member.nickname}
      >
        {stat.member.nickname}
        {isMe && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
      </p>

      <p className="mt-2 text-sm font-bold text-ink tabular-nums">
        {stat.xp} <span className="text-xs font-normal text-faint">XP</span>
      </p>
      <p className="mt-1 inline-flex items-center gap-1 text-xs text-faint tabular-nums">
        <Flame size={12} aria-hidden="true" />
        {stat.streak} day streak
      </p>

      <div
        aria-hidden="true"
        className={`mt-4 flex w-full items-start justify-center rounded-t-xl border border-b-0 pt-2 ${style.bar} ${style.barHeight}`}
      >
        <span className={`font-display text-3xl tabular-nums sm:text-4xl ${style.rankText}`}>
          {rank}
        </span>
      </div>
    </div>
  );
}

export function Leaderboard({
  stats,
  currentMemberId,
}: {
  stats: MemberStat[];
  currentMemberId?: string;
}) {
  if (stats.length === 0) {
    return (
      <EmptyState
        icon={<Trophy size={20} aria-hidden="true" />}
        title="No members yet"
        body="Members who join this room will appear here, ranked by XP."
      />
    );
  }
  const top3 = stats.slice(0, 3);
  const rest = stats.slice(top3.length);
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  return (
    <div className="flex flex-col gap-4">
      {/* Top 3 pyramid: visual order is 2 - 1 - 3, tallest in the middle */}
      <section
        aria-label="Top 3 members"
        className="rounded-2xl border border-line bg-surface px-4 pt-6 pb-0 sm:px-6"
      >
        <div className="flex items-end justify-center gap-3 sm:gap-5">
          {second && (
            <PodiumCard stat={second} rank={2} isMe={second.member.id === currentMemberId} />
          )}
          {first && (
            <PodiumCard stat={first} rank={1} isMe={first.member.id === currentMemberId} />
          )}
          {third && (
            <PodiumCard stat={third} rank={3} isMe={third.member.id === currentMemberId} />
          )}
        </div>
        {/* Baseline so the pyramid sits on a clear "stage" */}
        <div aria-hidden="true" className="-mx-4 border-t-2 border-line sm:-mx-6" />
        {/* Screen-reader order is 1, 2, 3 so rank is never confusing */}
        <ol className="sr-only">
          {top3.map((s, i) => (
            <li key={s.member.id}>
              Rank {i + 1}: {s.member.nickname}, {s.xp} XP, {s.streak} day streak
            </li>
          ))}
        </ol>
      </section>

      {rest.length > 0 && (
        <section aria-label="Remaining members">
          <p className="px-1 text-xs font-semibold tracking-widest text-faint uppercase">
            Everyone else
          </p>
          <ol className="mt-2 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
            {rest.map((s, i) => {
              const rank = i + top3.length;
              const isMe = s.member.id === currentMemberId;
              const badge = getStreakBadge(s.streak);
              return (
                <li
                  key={s.member.id}
                  className={`flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5 ${
                    i > 0 ? 'border-t border-line' : ''
                  } ${isMe ? 'bg-accent/[0.07]' : ''}`}
                >
                  <span className="w-6 shrink-0 text-sm font-medium text-faint tabular-nums sm:w-7">
                    {rankLabel(rank)}
                  </span>
                  <Avatar nickname={s.member.nickname} avatarUrl={s.member.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink sm:text-[15px]">
                      {s.member.nickname}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-faint">
                      {s.todayCount} today · {s.streak} day streak
                    </span>
                  </span>
                  {badge && (
                    <span className="hidden shrink-0 sm:inline-flex">
                      <Badge tone="neutral">{badge.label}</Badge>
                    </span>
                  )}
                  <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                    {s.xp} <span className="text-xs font-normal text-faint">XP</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
