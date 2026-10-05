/**
 * Daily reminder prefs + device Notification helpers (Layer 1: foreground).
 *
 * Storage: localStorage['winterarc:reminders:v1']
 * No backend needed — works for both local + Supabase modes.
 *
 * Layer 2 (true background push, even when app is closed) needs VAPID +
 * `push_subscriptions` table + Edge Function. Helpers for that live at the
 * bottom of this file; they gracefully no-op when VAPID key is missing.
 */

export interface ReminderPrefs {
  /** Master switch for the in-app card + device notification. */
  enabled: boolean;
  /** Evening streak-at-risk time, "HH:MM" 24h local. Default "20:00". */
  eveningTime: string;
  /** YYYY-MM-DD when the card was last dismissed / auto-hidden (day complete). */
  lastShownDate: string | null;
  /** YYYY-MM-DD when a device Notification was last fired. */
  lastNotifiedDate: string | null;
  /** Whether user subscribed to background push (Layer 2). */
  pushSubscribed: boolean;
}

const STORAGE_KEY = 'winterarc:reminders:v1';

export const DEFAULT_EVENING_TIME = '20:00';

export const defaultPrefs: ReminderPrefs = {
  enabled: true,
  eveningTime: DEFAULT_EVENING_TIME,
  lastShownDate: null,
  lastNotifiedDate: null,
  pushSubscribed: false,
};

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPrefs };
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      enabled: parsed.enabled ?? true,
      eveningTime:
        typeof parsed.eveningTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.eveningTime)
          ? parsed.eveningTime
          : DEFAULT_EVENING_TIME,
      lastShownDate: typeof parsed.lastShownDate === 'string' ? parsed.lastShownDate : null,
      lastNotifiedDate:
        typeof parsed.lastNotifiedDate === 'string' ? parsed.lastNotifiedDate : null,
      pushSubscribed: parsed.pushSubscribed === true,
    };
  } catch {
    return { ...defaultPrefs };
  }
}

export function saveReminderPrefs(prefs: ReminderPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage full / private mode — reminder just won't persist.
  }
}

/** "20:00" -> minutes since midnight. NaN-safe (falls back to 20*60). */
export function eveningMinutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return 20 * 60;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const min = Math.min(59, Math.max(0, Number(m[2])));
  return h * 60 + min;
}

/** True when local time is at/after the evening streak-at-risk time. */
export function isEveningNow(eveningTime: string, now = new Date()): boolean {
  return now.getHours() * 60 + now.getMinutes() >= eveningMinutes(eveningTime);
}

export interface ReminderCopy {
  title: string;
  body: string;
}

/**
 * Build the reminder copy.
 * - Morning/app-open: today's remaining goals.
 * - Evening + streak alive: streak-at-risk warning.
 * - Grace (1-2 missed days): "Continue streak" warning with days left.
 */
export function buildReminderCopy(args: {
  remainingCount: number;
  total: number;
  remainingTitles: string[];
  streak: number;
  isEvening: boolean;
  streakStatus?: 'active' | 'at-risk' | 'critical' | 'broken';
  daysLeft?: number;
}): ReminderCopy {
  const { remainingCount, total, remainingTitles, streak, isEvening } = args;
  const streakStatus = args.streakStatus ?? 'active';
  const daysLeft = args.daysLeft ?? 0;
  const preview =
    remainingTitles.length > 0
      ? remainingTitles.slice(0, 3).join(', ') +
        (remainingTitles.length > 3 ? ` +${remainingTitles.length - 3} more` : '')
      : '';

  // Grace warnings take priority — user missed 1-2 days, streak frozen but alive.
  if (streak > 0 && (streakStatus === 'at-risk' || streakStatus === 'critical')) {
    const lastChance = streakStatus === 'critical';
    return {
      title: lastChance
        ? `Last chance! Your ${streak}-day streak resets today`
        : `Continue your ${streak}-day streak — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
      body:
        remainingCount > 0
          ? `You missed a day but your streak is still alive${preview ? `: ${preview}` : ''}. Check in today to reach ${streak + 1} days.`
          : `Check in today to keep your ${streak}-day streak alive and reach ${streak + 1} days.`,
    };
  }

  if (isEvening && streak > 0) {
    return {
      title: `Your ${streak}-day streak is at risk`,
      body:
        remainingCount > 0
          ? `You still have ${remainingCount} of ${total} goals left today${preview ? `: ${preview}` : ''}. Check in to keep your streak alive.`
          : `Day complete. Come back tomorrow to reach ${streak + 1} days.`,
    };
  }
  return {
    title:
      remainingCount > 0
        ? `Today's goals: ${remainingCount} of ${total} remaining`
        : `Day complete`,
    body:
      remainingCount > 0
        ? `Remaining: ${preview || `${remainingCount} goals`}. Select a goal to check in.${streak > 0 ? ` Your ${streak}-day streak is on the line.` : ''}`
        : `Everything is done for today.${streak > 0 ? ` ${streak}-day streak — well done.` : ''}`,
  };
}

// ---------- Foreground device Notification (Notification API) ----------

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function notificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return notificationPermission();
  }
}

/** Foreground device popup. Only fires when tab is open + permission granted. */
export function sendDeviceNotification(copy: ReminderCopy, tag = 'winterarc-daily'): boolean {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;
    const n = new Notification(copy.title, {
      body: copy.body,
      tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        /* noop */
      }
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

// ---------- Layer 2: background push (needs VAPID key) ----------

export function vapidPublicKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined ?? '').trim();
}

/** Base64URL -> Uint8Array for pushManager.subscribe(). */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeBackgroundPush(): Promise<PushSubscription | null> {
  try {
    const key = vapidPublicKey();
    if (!key) return null;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
  } catch {
    return null;
  }
}

export async function unsubscribeBackgroundPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return true;
    return await existing.unsubscribe();
  } catch {
    return false;
  }
}
