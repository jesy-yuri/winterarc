/**
 * Streak grace model — single source of truth.
 *
 * Rule (per user request):
 * - 3-day window: today + 2 days back.
 * - Miss 1 day -> "at-risk" warning, streak frozen (not reset).
 * - Miss 2 days -> "critical" / last chance, streak still frozen.
 * - Miss 3 days (no check-in within 3 days) -> "broken", streak resets to 0.
 * - Re-check-in after 1-2 misses -> frozen + 1 (missed days don't add, don't break).
 */

export const STREAK_GRACE_DAYS = 3;

export type StreakStatus = 'active' | 'at-risk' | 'critical' | 'broken';

export interface StreakState {
  streak: number;
  /** 0 = active today, 1 = last active yesterday, etc. Number.MAX_SAFE_INTEGER when never active. */
  daysSinceActive: number;
  /** Days left before reset. 3 when active today, 2/1 during grace, 0 when broken. */
  daysLeft: number;
  status: StreakStatus;
  lastActiveDate: string | null;
}

function parseDay(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(key: string, n: number): string | null {
  const d = parseDay(key);
  if (!d) return null;
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function diffDays(aKey: string, bKey: string): number | null {
  const a = parseDay(aKey);
  const b = parseDay(bKey);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Frozen run with grace: walk backwards from anchor, counting active days.
 * Gaps of 1-2 missed days are tolerated (don't add, don't break).
 * A gap of 3+ missed days breaks the run.
 */
function frozenRunEndingOn(set: Set<string>, anchorKey: string): number {
  const sorted = [...set].filter((d) => d <= anchorKey).sort();
  if (sorted.length === 0) return 0;
  let run = 0;
  let prev: string | null = null;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const cur = sorted[i];
    if (prev === null) {
      // prev must start at anchor; if anchor itself is missing there's no run.
      if (cur !== anchorKey) return 0;
      run = 1;
    } else {
      const gap = diffDays(cur, prev);
      if (gap == null || gap <= 0) continue;
      if (gap >= STREAK_GRACE_DAYS + 1) break; // 3+ missed days -> break
      run += 1;
    }
    prev = cur;
  }
  return run;
}

export function getStreakState(dates: string[], today: string): StreakState {
  const set = new Set(
    dates.filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today),
  );
  if (set.size === 0) {
    return { streak: 0, daysSinceActive: Number.MAX_SAFE_INTEGER, daysLeft: 0, status: 'broken', lastActiveDate: null };
  }
  // Last active date on or before today.
  let lastActive: string | null = null;
  for (const d of set) {
    if (lastActive === null || d > lastActive) lastActive = d;
  }
  if (!lastActive) {
    return { streak: 0, daysSinceActive: Number.MAX_SAFE_INTEGER, daysLeft: 0, status: 'broken', lastActiveDate: null };
  }
  const gap = diffDays(lastActive, today);
  if (gap == null) {
    return { streak: 0, daysSinceActive: Number.MAX_SAFE_INTEGER, daysLeft: 0, status: 'broken', lastActiveDate: null };
  }
  if (gap >= STREAK_GRACE_DAYS) {
    return { streak: 0, daysSinceActive: gap, daysLeft: 0, status: 'broken', lastActiveDate: lastActive };
  }
  const streak = frozenRunEndingOn(set, lastActive);
  const daysLeft = STREAK_GRACE_DAYS - gap;
  const status: StreakStatus = gap === 0 ? 'active' : gap === 1 ? 'at-risk' : 'critical';
  return { streak, daysSinceActive: gap, daysLeft, status, lastActiveDate: lastActive };
}

/** Backwards-compatible number-only helper. */
export function calcStreakValue(dates: string[], today: string): number {
  return getStreakState(dates, today).streak;
}

/** Valid catch-up dates: today, yesterday, 2 days ago (within the 3-day window). */
export function getCatchUpDates(today: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < STREAK_GRACE_DAYS; i += 1) {
    const k = addDays(today, -i);
    if (k) out.push(k);
  }
  return out;
}

/** True when `date` is today or up to 2 days ago (never future). */
export function isCatchUpDateValid(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (date > today) return false;
  const gap = diffDays(date, today);
  return gap != null && gap >= 0 && gap < STREAK_GRACE_DAYS;
}
