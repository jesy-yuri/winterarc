/**
 * Offline check-in queue — for users with no connection.
 *
 * When a tap fails due to network, we keep the optimistic UI and persist
 * the intent here. On `online` / app focus we flush via idempotent
 * insert/delete (never blind toggle, so we can't undo server truth).
 */

export interface PendingCheckIn {
  roomId: string;
  memberId: string;
  goalId: string;
  date: string; // YYYY-MM-DD (original tap date, preserved across days)
  desired: boolean; // true = should exist, false = should not exist
  createdAt: string; // ISO
}

const STORAGE_KEY = 'winterarc:pending-checkins:v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadPending(): PendingCheckIn[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingCheckIn[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p) =>
        p && typeof p.roomId === 'string' && typeof p.memberId === 'string' &&
        typeof p.goalId === 'string' && typeof p.date === 'string' && typeof p.desired === 'boolean',
    );
  } catch {
    return [];
  }
}

function savePending(items: PendingCheckIn[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full / private mode — queue just won't persist.
  }
}

function keyOf(p: Pick<PendingCheckIn, 'memberId' | 'goalId' | 'date'>): string {
  return `${p.memberId}|${p.goalId}|${p.date}`;
}

export function enqueuePending(entry: Omit<PendingCheckIn, 'createdAt'>): PendingCheckIn[] {
  const items = loadPending();
  const key = keyOf(entry);
  // Last-write-wins per (member, goal, date) so rapid toggles collapse.
  const filtered = items.filter((p) => keyOf(p) !== key);
  const next = [...filtered, { ...entry, createdAt: new Date().toISOString() }];
  savePending(next);
  return next;
}

export function removePending(predicate: (p: PendingCheckIn) => boolean): PendingCheckIn[] {
  const next = loadPending().filter((p) => !predicate(p));
  savePending(next);
  return next;
}

export function clearPending(): void {
  savePending([]);
}

export function isOfflineError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (err instanceof TypeError) return true; // fetch failed / network down
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err ?? '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('offline') ||
    msg.includes('load failed')
  );
}
