import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { removePushSubscription, savePushSubscription } from '../lib/pushSubscriptions';
import {
  buildReminderCopy,
  isEveningNow,
  loadReminderPrefs,
  notificationPermission,
  requestNotificationPermission,
  saveReminderPrefs,
  sendDeviceNotification,
  subscribeBackgroundPush,
  unsubscribeBackgroundPush,
  vapidPublicKey,
  type NotificationPermissionState,
  type ReminderPrefs,
} from '../lib/reminders';

interface UseDailyReminderInput {
  /** YYYY-MM-DD */
  today: string;
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  /** Current member id — used to save push subscription to Supabase. */
  memberId?: string;
}

export function useDailyReminder({
  today,
  remainingCount,
  total,
  remainingTitles,
  streak,
  memberId,
}: UseDailyReminderInput) {
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => loadReminderPrefs());
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    notificationPermission(),
  );
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  // Re-check "evening" every minute so the card upgrades to streak-at-risk
  // copy without needing a reload. Cheap interval, cleaned up on unmount.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const isEvening = isEveningNow(prefs.eveningTime, new Date(nowMs));

  const hasRemaining = remainingCount > 0 && total > 0;
  const dismissedToday = prefs.lastShownDate === today;

  // App-open + evening rule: show card when enabled, may kulang pa, hindi pa dismissed today.
  const showCard = prefs.enabled && hasRemaining && !dismissedToday;

  const copy = useMemo(
    () =>
      buildReminderCopy({
        remainingCount,
        total,
        remainingTitles,
        streak,
        isEvening,
      }),
    [remainingCount, total, remainingTitles, streak, isEvening],
  );

  // Evening device notification (foreground): fire once per day when tab is open,
  // past evening time, may kulang pa, and permission granted.
  // setState is deferred via timeout so we don't cascade-render inside the effect.
  useEffect(() => {
    if (!prefs.enabled || !hasRemaining || !isEvening) return;
    if (prefs.lastNotifiedDate === today) return;
    if (notificationPermission() !== 'granted') return;
    const ok = sendDeviceNotification(copy);
    if (!ok) return;
    const id = window.setTimeout(() => {
      setPrefs((p) => {
        if (p.lastNotifiedDate === today) return p;
        const next = { ...p, lastNotifiedDate: today };
        saveReminderPrefs(next);
        return next;
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [prefs.enabled, prefs.lastNotifiedDate, hasRemaining, isEvening, today, copy]);

  // If day is complete, mark shown so card never nags on a done day.
  useEffect(() => {
    if (hasRemaining || prefs.lastShownDate === today) return;
    const id = window.setTimeout(() => {
      setPrefs((p) => {
        if (p.lastShownDate === today) return p;
        const next = { ...p, lastShownDate: today };
        saveReminderPrefs(next);
        return next;
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [hasRemaining, prefs.lastShownDate, today]);

  const update = useCallback((patch: Partial<ReminderPrefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      saveReminderPrefs(next);
      return next;
    });
  }, []);

  const dismissToday = useCallback(() => {
    update({ lastShownDate: today });
  }, [today, update]);

  const snoozeToEvening = useCallback(() => {
    // Hide for now but re-show at evening: clear dismissed flag only if not evening yet.
    // Simplest correct: keep dismissed, evening effect re-arms via lastShownDate reset at evening time.
    // For v1: just dismiss — evening notification still fires via device Notification path.
    update({ lastShownDate: today });
  }, [today, update]);

  const enableReminder = useCallback(() => update({ enabled: true }), [update]);
  const disableReminder = useCallback(() => update({ enabled: false }), [update]);

  const setEveningTime = useCallback(
    (eveningTime: string) => update({ eveningTime }),
    [update],
  );

  const enableDeviceNotification = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const notifyNow = useCallback(() => {
    if (notificationPermission() !== 'granted') return false;
    const ok = sendDeviceNotification(copy);
    if (ok) update({ lastNotifiedDate: today });
    return ok;
  }, [copy, today, update]);

  // --- Layer 2: background push (needs VITE_VAPID_PUBLIC_KEY; see .env.example) ---
  const pushSupported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  const vapidConfigured = vapidPublicKey().length > 0;

  const enableBackgroundPush = useCallback(async () => {
    setPushBusy(true);
    setPushError(null);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setPushError('Kailangan i-Allow ang notifications sa browser.');
        return null;
      }
      const sub = await subscribeBackgroundPush();
      if (!sub) {
        setPushError(
          vapidConfigured
            ? 'Hindi maka-subscribe sa push. Try ulit.'
            : 'Kulang pa ng VAPID key (Step 1). Foreground reminder muna gumagana.',
        );
        return null;
      }
      const endpoint = sub.endpoint;
      const result = memberId
        ? await savePushSubscription(getSupabase(), memberId, sub)
        : 'local-only';
      if (result === 'failed') {
        setPushError('Na-subscribe sa browser pero hindi na-save sa server. Try ulit.');
        return null;
      }
      update({ pushSubscribed: true });
      if (result === 'local-only') {
        setPushError(
          'Naka-subscribe sa browser, pero walang server connection (local mode o hindi pa na-Run ang migration). Background push gagana pag naka-Supabase + migration na.',
        );
      }
      void endpoint;
      return sub;
    } finally {
      setPushBusy(false);
    }
  }, [update, vapidConfigured, memberId]);

  const disableBackgroundPush = useCallback(async () => {
    setPushBusy(true);
    try {
      let endpoint: string | undefined;
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          endpoint = existing?.endpoint;
        }
      } catch {
        /* ignore */
      }
      await unsubscribeBackgroundPush();
      await removePushSubscription(getSupabase(), endpoint);
      update({ pushSubscribed: false });
    } finally {
      setPushBusy(false);
    }
  }, [update]);

  return {
    prefs,
    showCard,
    isEvening,
    hasRemaining,
    dismissedToday,
    copy,
    permission,
    pushSupported,
    vapidConfigured,
    pushBusy,
    pushError,
    dismissToday,
    snoozeToEvening,
    enableReminder,
    disableReminder,
    setEveningTime,
    enableDeviceNotification,
    notifyNow,
    enableBackgroundPush,
    disableBackgroundPush,
  };
}
