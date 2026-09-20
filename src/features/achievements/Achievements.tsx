import { useEffect } from 'react';
import {
  Award,
  CalendarDays,
  Flag,
  Flame,
  Footprints,
  Medal,
  TrendingUp,
} from 'lucide-react';
import { Badge, EmptyState, SectionHeader } from '../../components/ui/Section';
import { ACHIEVEMENTS, evaluateAchievements } from '../../lib/progress';
import type { LocalStore } from '../../lib/localStore';

const ICONS: Record<string, typeof Footprints> = {
  'first-step': Footprints,
  'streak-7': Flame,
  'streak-14': Award,
  'active-30': CalendarDays,
  'perfect-week': Medal,
  challenger: Flag,
  consistent: TrendingUp,
};

function formatUnlockDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Achievements({
  store,
  roomId,
  memberId,
  today,
  onUnlock,
}: {
  store: LocalStore;
  roomId: string;
  memberId: string;
  today: string;
  onUnlock: (achievementIds: string[]) => void;
}) {
  const evaluated = evaluateAchievements(store, roomId, memberId, today);
  const unlockMap = new Map(
    (store.achievementUnlocks ?? [])
      .filter((u) => u.memberId === memberId)
      .map((u) => [u.achievementId, u.unlockedAt]),
  );

  // Persist newly earned achievements. recordUnlocks only adds missing
  // records, so refreshes and double-invokes can never create duplicates.
  useEffect(() => {
    const fresh = evaluated.filter((id) => !unlockMap.has(id));
    if (fresh.length > 0) onUnlock(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, roomId, today, store.checkIns, store.challenges, store.challengeJoins]);

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockMap.has(a.id)).length;

  return (
    <div>
      <SectionHeader
        eyebrow="Progress"
        title="Achievements"
        description={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked. Earned from real activity.`}
      />
      {ACHIEVEMENTS.length === 0 ? (
        <EmptyState
          icon={<Medal size={20} aria-hidden="true" />}
          title="No achievements yet"
          body="Achievements will appear here once defined."
        />
      ) : (
        <ul className="mt-4 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
          {ACHIEVEMENTS.map((a, idx) => {
            const unlockedAt = unlockMap.get(a.id);
            const Icon = ICONS[a.id] ?? Medal;
            return (
              <li
                key={a.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx > 0 ? 'border-t border-line' : ''} ${
                  unlockedAt ? '' : 'opacity-60'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                    unlockedAt
                      ? 'border-accent/30 bg-accent/[0.10] text-accent-strong'
                      : 'border-line bg-raised text-faint'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold tracking-widest text-faint uppercase">
                    {a.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{a.description}</span>
                </span>
                {unlockedAt ? (
                  <Badge tone="success">Unlocked · {formatUnlockDate(unlockedAt)}</Badge>
                ) : (
                  <Badge tone="neutral">Locked</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
