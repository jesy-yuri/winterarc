import { toast } from 'sonner';
import { SectionHeader } from '../../components/ui/Section';
import { useDailyReminder } from '../../hooks/useDailyReminder';
import { ProfilePictureEditor } from '../profile/ProfilePictureEditor';
import { ReminderSettings } from '../reminders/ReminderSettings';
import type { Member } from '../../types';

/**
 * Settings tab content: reminder preferences (always rendered, even when
 * the reminder is off) + profile. Frontend-only — prefs live in
 * localStorage, avatar goes through the existing onUpdateAvatar handler.
 */
export function RoomSettingsTab({
  today,
  remainingCount,
  total,
  remainingTitles,
  streak,
  memberId,
  member,
  onUpdateAvatar,
}: {
  today: string;
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  memberId?: string;
  member?: Member;
  onUpdateAvatar: (avatarUrl: string | null) => void;
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

  return (
    <div className="mt-6 flex flex-col gap-8 sm:mt-8 md:gap-10">
      <section aria-labelledby="settings-reminders">
        <SectionHeader
          eyebrow="Preferences"
          title="Reminders"
          description="Daily goal nudges and evening streak warnings on this device."
        />
        <div className="mt-4">
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
                else if (perm === 'denied')
                  toast.error('Blocked. Allow notifications in your browser settings.');
              });
            }}
            onTestNotify={handleNotify}
            onEnableBackgroundPush={() => {
              void r.enableBackgroundPush().then((sub) => {
                if (sub)
                  toast.success(
                    'Background push enabled. You will be notified even when the app is closed.',
                  );
              });
            }}
            onDisableBackgroundPush={() => {
              void r.disableBackgroundPush();
            }}
          />
        </div>
      </section>

      <section aria-labelledby="settings-profile">
        <SectionHeader
          eyebrow="Preferences"
          title="Profile"
          description="Your photo in this room. Shown on the leaderboard and chat."
        />
        <div className="mt-4">
          {member ? (
            <ProfilePictureEditor member={member} onSave={onUpdateAvatar} />
          ) : (
            <p className="text-sm text-muted">No member found on this device.</p>
          )}
        </div>
      </section>
    </div>
  );
}
