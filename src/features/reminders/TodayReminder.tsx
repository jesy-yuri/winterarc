import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { DailyReminderCard } from './DailyReminderCard';

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
  children: ReactNode;
}) {
  const r = useDailyReminder({ today, remainingCount, total, remainingTitles, streak, memberId });

  function handleNotify() {
    if (r.permission !== 'granted') {
      void r.enableDeviceNotification().then((perm) => {
        if (perm === 'granted') {
          const ok = r.notifyNow();
          if (ok) toast.success('Reminder sent to your device');
        } else if (perm === 'denied') {
          toast.error('Notifications are blocked. Allow them in your browser settings.');
        }
      });
      return;
    }
    const ok = r.notifyNow();
    if (ok) toast.success('Reminder sent to your device');
    else toast.error('Could not send the notification. Try again.');
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
            onNotify={handleNotify}
            notifyLabel={r.permission === 'granted' ? 'Notify me now' : 'Enable popup'}
          />
        </div>
      )}
      {children}
    </>
  );
}
