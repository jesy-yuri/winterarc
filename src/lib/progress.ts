import {
  getActivePersonalGoals,
  getEnabledWorkouts,
  personalGoalIdFromGoalId,
  type LocalStore,
} from './localStore';
import { WORKOUT_EXERCISES, workoutExerciseIdFromGoalId } from './workouts';

// ---------- Date utilities (local-day based, YYYY-MM-DD) ----------

export function parseDay(value: string): Date | null {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string | null {
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

export function formatLongDate(key: string): string {
  const d = parseDay(key);
  if (!d) return key;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDay(key: string): string {
  const d = parseDay(key);
  if (!d) return key;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/** Monday (YYYY-MM-DD) of the week containing the given day. Weeks start Monday. */
export function mondayOf(key: string): string | null {
  const d = parseDay(key);
  if (!d) return null;
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return toKey(d);
}

export function weekKeys(mondayKey: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const k = addDays(mondayKey, i);
    if (k) out.push(k);
  }
  return out;
}

export interface MonthCell {
  key: string;
  inMonth: boolean;
}

/** Fixed 6x7 Monday-start grid covering the given month. */
export function monthCells(year: number, monthIndex: number): MonthCell[] {
  const first = new Date(year, monthIndex, 1);
  const dow = (first.getDay() + 6) % 7;
  const cursor = new Date(year, monthIndex, 1 - dow);
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    cells.push({ key: toKey(cursor), inMonth: cursor.getMonth() === monthIndex });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

// ---------- Member activity ----------

/** Sorted unique active dates for a member (optionally within one room). */
export function memberActiveDates(
  store: LocalStore,
  memberId: string,
  roomId?: string,
): string[] {
  const set = new Set<string>();
  for (const c of store.checkIns) {
    if (c.memberId !== memberId) continue;
    if (roomId && c.roomId !== roomId) continue;
    set.add(c.date);
  }
  return [...set].sort();
}

export function longestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = parseDay(sorted[i - 1]);
    const cur = parseDay(sorted[i]);
    if (!prev || !cur) continue;
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (diff > 1) {
      run = 1;
    }
  }
  return best;
}

/** Consecutive active days ending exactly on anchorKey (0 when anchor is inactive). */
export function streakEndingOn(dates: string[], anchorKey: string): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = parseDay(anchorKey);
  if (!cursor) return 0;
  while (set.has(toKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ---------- Today's item set (single denominator for daily progress) ----------

export interface ActivityItem {
  key: string; // goalId used in CheckIn records
  title: string;
  kind: 'goal' | 'personal' | 'workout';
}

export function memberDayItems(
  store: LocalStore,
  roomId: string,
  memberId: string,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const g of store.goals.filter((g) => g.roomId === roomId)) {
    items.push({ key: g.id, title: g.title, kind: 'goal' });
  }
  for (const g of getActivePersonalGoals(store, memberId)) {
    items.push({ key: `personal:${g.id}`, title: g.title, kind: 'personal' });
  }
  for (const w of getEnabledWorkouts(store, roomId, memberId)) {
    items.push({ key: w.goalId, title: w.title, kind: 'workout' });
  }
  return items;
}

export interface DayCompletion {
  date: string;
  done: ActivityItem[];
  remaining: ActivityItem[];
  doneCount: number;
  total: number;
  pct: number;
}

export function dayCompletion(
  store: LocalStore,
  roomId: string,
  memberId: string,
  date: string,
): DayCompletion {
  const items = memberDayItems(store, roomId, memberId);
  const doneKeys = new Set(
    store.checkIns
      .filter((c) => c.roomId === roomId && c.memberId === memberId && c.date === date)
      .map((c) => c.goalId),
  );
  const done = items.filter((i) => doneKeys.has(i.key));
  const remaining = items.filter((i) => !doneKeys.has(i.key));
  const total = items.length;
  return {
    date,
    done,
    remaining,
    doneCount: done.length,
    total,
    pct: total === 0 ? 0 : Math.round((done.length / total) * 100),
  };
}

/** Resolve a stored check-in goalId to a human title (for history detail views). */
export function resolveCheckInTitle(
  store: LocalStore,
  roomId: string,
  goalId: string,
): string {
  const personalId = personalGoalIdFromGoalId(goalId);
  if (personalId) {
    const g = (store.personalGoals ?? []).find((p) => p.id === personalId);
    return g ? g.title : 'Removed personal goal';
  }
  const exerciseId = workoutExerciseIdFromGoalId(goalId);
  if (exerciseId) {
    const ex = WORKOUT_EXERCISES.find((e) => e.id === exerciseId);
    return ex ? ex.title : 'Workout';
  }
  const g = store.goals.find((x) => x.id === goalId && x.roomId === roomId);
  if (g) return g.title;
  return 'Removed goal';
}

// ---------- Weekly review ----------

export interface WeekDayBreakdown {
  date: string;
  label: string;
  done: number;
  total: number;
  pct: number;
}

export interface WeekReview {
  weekKey: string;
  days: WeekDayBreakdown[];
  totalDone: number;
  totalPossible: number;
  pct: number;
  activeDays: number;
  bestDay: WeekDayBreakdown | null;
  endStreak: number;
}

export function calcWeekReview(
  store: LocalStore,
  roomId: string,
  memberId: string,
  weekMondayKey: string,
): WeekReview {
  const keys = weekKeys(weekMondayKey);
  const days: WeekDayBreakdown[] = keys.map((date) => {
    const dc = dayCompletion(store, roomId, memberId, date);
    return { date, label: formatShortDay(date), done: dc.doneCount, total: dc.total, pct: dc.pct };
  });
  const totalDone = days.reduce((s, d) => s + d.done, 0);
  const totalPossible = days.reduce((s, d) => s + d.total, 0);
  const activeDays = days.filter((d) => d.done > 0).length;
  let bestDay: WeekDayBreakdown | null = null;
  for (const d of days) {
    if (!bestDay || d.pct > bestDay.pct) bestDay = d;
  }
  if (bestDay && bestDay.done === 0) bestDay = null;
  const sunday = keys[6];
  const endStreak = sunday ? streakEndingOn(memberActiveDates(store, memberId, roomId), sunday) : 0;
  return {
    weekKey: weekMondayKey,
    days,
    totalDone,
    totalPossible,
    pct: totalPossible === 0 ? 0 : Math.round((totalDone / totalPossible) * 100),
    activeDays,
    bestDay,
    endStreak,
  };
}

// ---------- Challenges ----------

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';

export function challengeStatus(
  challenge: { startDate: string; endDate: string },
  today: string,
): ChallengeStatus {
  if (today < challenge.startDate) return 'upcoming';
  if (today > challenge.endDate) return 'ended';
  return 'active';
}

export function challengeTotalDays(challenge: { startDate: string; endDate: string }): number {
  const n = diffDays(challenge.startDate, challenge.endDate);
  return n == null ? 0 : n + 1;
}

export function challengeDayNumber(
  challenge: { startDate: string; endDate: string },
  today: string,
): number | null {
  if (challengeStatus(challenge, today) !== 'active') return null;
  const n = diffDays(challenge.startDate, today);
  return n == null ? null : n + 1;
}

export function challengeDaysLeft(
  challenge: { startDate: string; endDate: string },
  today: string,
): number {
  if (today > challenge.endDate) return 0;
  const n = diffDays(today, challenge.endDate);
  return n == null ? 0 : n + 1;
}

/** Distinct active days of a member inside the challenge date range. */
export function memberChallengeDays(
  store: LocalStore,
  challenge: { startDate: string; endDate: string },
  memberId: string,
  roomId: string,
): number {
  const set = new Set<string>();
  for (const c of store.checkIns) {
    if (c.memberId !== memberId || c.roomId !== roomId) continue;
    if (c.date < challenge.startDate || c.date > challenge.endDate) continue;
    set.add(c.date);
  }
  return set.size;
}

// ---------- Achievements (pure evaluation; writes go through recordUnlocks) ----------

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your first check-in.',
  },
  {
    id: 'streak-7',
    title: 'One Week',
    description: 'Reach a 7-day streak.',
  },
  {
    id: 'streak-14',
    title: 'Two Weeks',
    description: 'Reach a 14-day streak.',
  },
  {
    id: 'active-30',
    title: '30 Days',
    description: 'Be active on 30 different days.',
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Check in on 7 consecutive days.',
  },
  {
    id: 'challenger',
    title: 'Challenger',
    description: 'Take part in a room challenge and stay active during it.',
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Be active on at least 10 of the last 14 days.',
  },
];

export function evaluateAchievements(
  store: LocalStore,
  roomId: string,
  memberId: string,
  today: string,
): string[] {
  const dates = memberActiveDates(store, memberId, roomId);
  const unlocked: string[] = [];
  if (dates.length >= 1) unlocked.push('first-step');

  // Current streak with the same "alive from yesterday" leniency as the dashboard.
  const set = new Set(dates);
  const cursor = parseDay(today);
  let streak = 0;
  if (cursor) {
    const c = new Date(cursor);
    if (!set.has(toKey(c))) c.setDate(c.getDate() - 1);
    while (set.has(toKey(c))) {
      streak += 1;
      c.setDate(c.getDate() - 1);
    }
  }
  if (streak >= 7) unlocked.push('streak-7');
  if (streak >= 14) unlocked.push('streak-14');
  if (dates.length >= 30) unlocked.push('active-30');
  if (longestStreak(dates) >= 7) unlocked.push('perfect-week');

  const fortnightAgo = addDays(today, -13);
  if (fortnightAgo) {
    const recent = dates.filter((d) => d >= fortnightAgo && d <= today).length;
    if (recent >= 10) unlocked.push('consistent');
  }

  const ended = (store.challenges ?? []).filter(
    (c) => c.roomId === roomId && c.endDate < today,
  );
  const doneChallenge = ended.some((c) => {
    const joined = (store.challengeJoins ?? []).some(
      (j) => j.challengeId === c.id && j.memberId === memberId,
    );
    if (!joined) return false;
    return memberChallengeDays(store, c, memberId, roomId) >= 1;
  });
  if (doneChallenge) unlocked.push('challenger');

  return unlocked;
}
