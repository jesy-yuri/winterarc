import { toast } from 'sonner';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { DailyReminderCard } from './DailyReminderCard';
import { ReminderSettings } from './ReminderSettings';

export function TodayReminder({
  today,
  remainingCount,
  total,
  remainingTitles,
  streak,
  streakBadgeLabel,
  checkedInToday,
  memberId,
}: {
  today: string;
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  streakBadgeLabel: string | null;
  checkedInToday: boolean;
  memberId?: string;
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

  if (!r.showCard && r.prefs.enabled) {
    // Still show settings (collapsible) even when card is dismissed/day complete.
    return (
      <div className="mb-4">
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
    );
  }

  if (!r.showCard) return null;

  return (
    <div className="mb-4 flex flex-col gap-3">
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
          void r.enableDeviceNotification();
        }}
        onTestNotify={handleNotify}
        onEnableBackgroundPush={() => {
          void r.enableBackgroundPush();
        }}
        onDisableBackgroundPush={() => {
          void r.disableBackgroundPush();
        }}
      />
    </div>
  );
}
