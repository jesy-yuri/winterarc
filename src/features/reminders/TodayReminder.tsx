import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { DailyReminderCard } from './DailyReminderCard';
import { ReminderSettings } from './ReminderSettings';

/**
 * Shell around the Today tab content: reminder card on top, settings at the bottom.
 * One hook instance drives both so dismiss/toggle state never goes stale.
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

  const settings = r.prefs.enabled ? (
    <div className="mt-8">
      <ReminderSettings
        enabled={r.prefs.enabled}
        eveningTime={r.prefs.eveningTime}
        permission={r.permission}
        pushSupported={r.pushSupported}
        vapidConfigured={r.vapidConfigured}
        pushSubscribed={r.prefs.pushSubscribed}
        pushBusy={r.pushBusy}
        pushError={r.pushError}
        onToggleEnabled={(next) => (next ? r.enableReminder() : r.disableReminder())}
        onEveningTimeChange={r.setEveningTime}
        onEnableDeviceNotification={() => {
          void r.enableDeviceNotification().then((perm) => {
            if (perm === 'granted') toast.success('Device notifications enabled');
            else if (perm === 'denied') toast.error('Blocked. Allow notifications in your browser settings.');
          });
        }}
        onTestNotify={handleNotify}
        onEnableBackgroundPush={() => {
          void r.enableBackgroundPush().then((sub) => {
            if (sub) toast.success('Background push enabled. You will be notified even when the app is closed.');
          });
        }}
        onDisableBackgroundPush={() => {
          void r.disableBackgroundPush();
        }}
      />
    </div>
  ) : null;

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
      {settings}
    </>
  );
}
