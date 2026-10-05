import type { ReactNode } from 'react';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { DailyReminderCard } from './DailyReminderCard';
import type { StreakStatus } from '../../lib/streak';

/**
 * Shell around the Today tab content: reminder card on top, page content below.
 * Reminder settings now live in the Settings tab (RoomSettingsTab) so they
 * stay reachable even when the reminder is turned off. One hook instance
 * drives the card here; the Settings tab runs its own instance (different
 * tab = never on screen at the same time, synced via localStorage).
 */
export function TodayReminder({
  today,
  remainingCount,
  total,
  remainingTitles,
  streak,
  streakBadgeLabel,
  checkedInToday,
  memberId,
  streakStatus = 'active',
  daysLeft = 0,
  children,
}: {
  today: string;
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  streakBadgeLabel: string | null;
  checkedInToday: boolean;
  memberId?: string;
  streakStatus?: StreakStatus;
  daysLeft?: number;
  children: ReactNode;
}) {
  const r = useDailyReminder({ today, remainingCount, total, remainingTitles, streak, streakStatus, daysLeft, memberId });

  function handleContinueStreak() {
    document.getElementById('daily-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // No member selected — render the tab content untouched.
  if (!memberId) return <>{children}</>;

  return (
    <>
      {r.showCard && (
        <div className="mt-6">
          <DailyReminderCard
            remainingCount={remainingCount}
            total={total}
            remainingTitles={remainingTitles}
            streak={streak}
            streakBadgeLabel={streakBadgeLabel}
            checkedInToday={checkedInToday}
            isEvening={r.isEvening}
            title={r.copy.title}
            body={r.copy.body}
            onDismiss={r.dismissToday}
            streakStatus={streakStatus}
            daysLeft={daysLeft}
            onContinueStreak={handleContinueStreak}
          />
        </div>
      )}
      {children}
    </>
  );
}
