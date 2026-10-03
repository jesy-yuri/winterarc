import { useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { NotificationPermissionState } from '../../lib/reminders';

export function ReminderSettings({
  enabled,
  eveningTime,
  permission,
  pushSupported,
  vapidConfigured,
  pushSubscribed,
  pushBusy,
  pushError,
  onToggleEnabled,
  onEveningTimeChange,
  onEnableDeviceNotification,
  onTestNotify,
  onEnableBackgroundPush,
  onDisableBackgroundPush,
}: {
  enabled: boolean;
  eveningTime: string;
  permission: NotificationPermissionState;
  pushSupported: boolean;
  vapidConfigured: boolean;
  pushSubscribed: boolean;
  pushBusy: boolean;
  pushError: string | null;
  onToggleEnabled: (next: boolean) => void;
  onEveningTimeChange: (time: string) => void;
  onEnableDeviceNotification: () => void;
  onTestNotify: () => void;
  onEnableBackgroundPush: () => void;
  onDisableBackgroundPush: () => void;
}) {
  const [timeDraft, setTimeDraft] = useState(eveningTime);

  return (
    <details className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
        <Clock size={15} aria-hidden="true" className="text-faint" />
        Reminder settings
        <span className="ml-auto text-xs font-normal text-faint">
          {enabled ? 'On' : 'Off'} · {eveningTime}
        </span>
      </summary>

      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-ink">
          <span className="font-medium">Daily goal reminder</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(e.target.checked)}
            className="h-5 w-5 accent-[var(--color-accent)]"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-ink">Evening streak warning</span>
          <span className="flex items-center gap-2">
            <input
              type="time"
              value={timeDraft}
              onChange={(e) => {
                setTimeDraft(e.target.value);
                if (/^\d{2}:\d{2}$/.test(e.target.value)) onEveningTimeChange(e.target.value);
              }}
              className="rounded-lg border border-line bg-base px-2 py-1.5 text-[13px] text-ink"
            />
          </span>
        </label>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-[13px] text-muted">
            Device popup:{' '}
            <strong className="text-ink">
              {permission === 'granted'
                ? 'allowed'
                : permission === 'denied'
                  ? 'blocked (i-Allow sa browser settings)'
                  : permission === 'unsupported'
                    ? 'not supported'
                    : 'not asked yet'}
            </strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {permission !== 'granted' ? (
              <Button type="button" size="sm" variant="secondary" onClick={onEnableDeviceNotification}>
                <Bell size={14} aria-hidden="true" />
                Enable device popup
              </Button>
            ) : (
              <Button type="button" size="sm" variant="secondary" onClick={onTestNotify}>
                <Bell size={14} aria-hidden="true" />
                Test popup
              </Button>
            )}
            {!enabled && (
              <span className="inline-flex items-center gap-1 text-xs text-faint">
                <BellOff size={13} aria-hidden="true" /> Naka-off ang reminder
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <p className="text-[13px] text-muted">
            Background push (kahit close ang app):{' '}
            <strong className="text-ink">
              {!pushSupported
                ? 'not supported sa browser na to'
                : pushSubscribed
                  ? 'on'
                  : vapidConfigured
                    ? 'off'
                    : 'need VAPID key (Step 1)'}
            </strong>
          </p>
          {pushSupported && (
            <div className="flex flex-wrap gap-2">
              {pushSubscribed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pushBusy}
                  onClick={onDisableBackgroundPush}
                >
                  Turn off background push
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pushBusy || !vapidConfigured}
                  onClick={onEnableBackgroundPush}
                  title={vapidConfigured ? 'Subscribe' : 'Generate VAPID key muna (Step 1)'}
                >
                  {pushBusy ? 'Subscribing…' : 'Enable background push'}
                </Button>
              )}
            </div>
          )}
          {pushError && <p className="text-xs text-danger">{pushError}</p>}
          {!vapidConfigured && (
            <p className="text-xs text-faint">
              Run <code className="rounded bg-raised px-1">npx web-push generate-vapid-keys</code>{' '}
              tapos lagay sa <code className="rounded bg-raised px-1">.env.local</code> bilang{' '}
              <code className="rounded bg-raised px-1">VITE_VAPID_PUBLIC_KEY</code>.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
