import type { Announcement, CheckIn, Goal, Member, Room, WorkoutPlan, WorkoutSelection } from '../types';
import { WORKOUT_EXERCISES, workoutGoalId } from './workouts';

const STORAGE_KEY = 'winterarc:local:v1';

export interface LocalStore {
  rooms: Room[];
  members: Member[];
  goals: Goal[];
  checkIns: CheckIn[];
  announcements: Announcement[];
  currentMemberByRoom: Record<string, string>;
  workoutPlans: WorkoutPlan[];
}

const emptyStore: LocalStore = {
  rooms: [],
  members: [],
  goals: [],
  checkIns: [],
  announcements: [],
  currentMemberByRoom: {},
  workoutPlans: [],
};

function migrate(parsed: Partial<LocalStore>): LocalStore {
  const rooms = (parsed.rooms ?? []) as Room[];
  const members = (parsed.members ?? []) as Member[];
  const goals = (parsed.goals ?? []) as Goal[];
  const checkIns = (parsed.checkIns ?? []) as CheckIn[];
  const announcements = (parsed.announcements ?? []) as Announcement[];
  const currentMemberByRoom = (parsed.currentMemberByRoom ?? {}) as Record<string, string>;
  const workoutPlans = (parsed.workoutPlans ?? []) as WorkoutPlan[];

  // Old rooms have no adminMemberId. Assign first member of each room as admin.
  const fixedRooms = rooms.map((room) => {
    if (room.adminMemberId) return room;
    const roomMembers = members
      .filter((m) => m.roomId === room.id)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    return { ...room, adminMemberId: roomMembers[0]?.id ?? '' };
  });

  const fixedMembers = members.map((m) => {
    const base = m.role ? m : (() => {
      const room = fixedRooms.find((r) => r.id === m.roomId);
      return { ...m, role: room?.adminMemberId === m.id ? 'admin' : 'member' } as Member;
    })();
    return {
      ...base,
      ...(typeof base.avatarUrl === 'string' && base.avatarUrl.trim()
        ? { avatarUrl: base.avatarUrl.trim() }
        : {}),
    };
  });

  const fixedGoals = goals.map((g) => ({
    ...g,
    icon: typeof g.icon === 'string' ? g.icon : '',
    ...(typeof g.targetCount === 'number' && Number.isFinite(g.targetCount)
      ? { targetCount: Math.round(g.targetCount) }
      : {}),
  }));

  // Drop workoutPlans that point to missing rooms/members.
  const roomIds = new Set(fixedRooms.map((r) => r.id));
  const memberIds = new Set(fixedMembers.map((m) => m.id));
  const fixedPlans = workoutPlans.filter(
    (p) => roomIds.has(p.roomId) && memberIds.has(p.memberId) && Array.isArray(p.selections),
  );

  return {
    rooms: fixedRooms,
    members: fixedMembers,
    goals: fixedGoals,
    checkIns,
    announcements,
    currentMemberByRoom,
    workoutPlans: fixedPlans,
  };
}

export function loadStore(): LocalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw) as LocalStore;
    return migrate(parsed);
  } catch {
    return emptyStore;
  }
}

export function saveStore(store: LocalStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isAdmin(store: LocalStore, roomId: string, memberId: string | undefined): boolean {
  if (!memberId) return false;
  const member = store.members.find((m) => m.id === memberId && m.roomId === roomId);
  return member?.role === 'admin';
}

export interface GoalInput {
  title: string;
  icon: string;
  targetCount?: number;
}

export function createRoom(
  store: LocalStore,
  input: {
    title: string;
    nickname: string;
    startDate: string;
    endDate: string;
    goals: GoalInput[];
  },
): { store: LocalStore; room: Room; member: Member } {
  const memberId = generateId();
  const room: Room = {
    id: generateId(),
    inviteCode: makeInviteCode(),
    title: input.title.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date().toISOString(),
    adminMemberId: memberId,
  };
  const member: Member = {
    id: memberId,
    roomId: room.id,
    nickname: input.nickname.trim(),
    role: 'admin',
    joinedAt: new Date().toISOString(),
  };
  const goals: Goal[] = input.goals
    .map((g) => ({
      title: g.title.trim(),
      icon: g.icon.trim().toUpperCase().slice(0, 8),
      targetCount:
        typeof g.targetCount === 'number' && Number.isFinite(g.targetCount)
          ? Math.round(g.targetCount)
          : undefined,
    }))
    .filter((g) => Boolean(g.title))
    .map((g) => ({
      id: generateId(),
      roomId: room.id,
      title: g.title,
      icon: g.icon,
      ...(g.targetCount ? { targetCount: g.targetCount } : {}),
    }));

  const next: LocalStore = {
    rooms: [...store.rooms, room],
    members: [...store.members, member],
    goals: [...store.goals, ...goals],
    checkIns: store.checkIns,
    announcements: store.announcements,
    currentMemberByRoom: { ...store.currentMemberByRoom, [room.id]: member.id },
    workoutPlans: store.workoutPlans ?? [],
  };
  saveStore(next);
  return { store: next, room, member };
}

export function joinRoom(
  store: LocalStore,
  input: { inviteCode: string; nickname: string },
): { store: LocalStore; room: Room; member: Member } {
  const code = input.inviteCode.trim().toUpperCase();
  const room = store.rooms.find((r) => r.inviteCode.toUpperCase() === code);
  if (!room) throw new Error('Hindi mahanap ang room code na yan.');

  const nickname = input.nickname.trim();
  if (!nickname) throw new Error('Lagay ka ng nickname.');

  const existing = store.members.find(
    (m) =>
      m.roomId === room.id && m.nickname.toLowerCase() === nickname.toLowerCase(),
  );
  if (existing) {
    const next: LocalStore = {
      ...store,
      currentMemberByRoom: { ...store.currentMemberByRoom, [room.id]: existing.id },
    };
    saveStore(next);
    return { store: next, room, member: existing };
  }

  const member: Member = {
    id: generateId(),
    roomId: room.id,
    nickname,
    role: 'member',
    joinedAt: new Date().toISOString(),
  };
  const next: LocalStore = {
    ...store,
    members: [...store.members, member],
    currentMemberByRoom: { ...store.currentMemberByRoom, [room.id]: member.id },
  };
  saveStore(next);
  return { store: next, room, member };
}

export function toggleCheckIn(
  store: LocalStore,
  input: { roomId: string; memberId: string; goalId: string; date: string },
): LocalStore {
  const found = store.checkIns.find(
    (c) =>
      c.memberId === input.memberId &&
      c.goalId === input.goalId &&
      c.date === input.date,
  );
  let checkIns: CheckIn[];
  if (found) {
    checkIns = store.checkIns.filter((c) => c.id !== found.id);
  } else {
    const entry: CheckIn = {
      id: generateId(),
      roomId: input.roomId,
      memberId: input.memberId,
      goalId: input.goalId,
      date: input.date,
      createdAt: new Date().toISOString(),
    };
    checkIns = [...store.checkIns, entry];
  }
  const next: LocalStore = { ...store, checkIns };
  saveStore(next);
  return next;
}

export function switchMember(
  store: LocalStore,
  roomId: string,
  memberId: string,
): LocalStore {
  const next: LocalStore = {
    ...store,
    currentMemberByRoom: { ...store.currentMemberByRoom, [roomId]: memberId },
  };
  saveStore(next);
  return next;
}

export function sendAnnouncement(
  store: LocalStore,
  input: { roomId: string; authorMemberId: string; body: string },
): LocalStore {
  if (!isAdmin(store, input.roomId, input.authorMemberId)) {
    throw new Error('Admin lang ang pwede mag send ng message.');
  }
  const body = input.body.trim();
  if (!body) throw new Error('Walang laman ang message.');
  if (body.length > 500) throw new Error('Hanggang 500 characters lang ang message.');
  const entry: Announcement = {
    id: generateId(),
    roomId: input.roomId,
    authorMemberId: input.authorMemberId,
    body,
    createdAt: new Date().toISOString(),
  };
  const next: LocalStore = {
    ...store,
    announcements: [entry, ...store.announcements],
  };
  saveStore(next);
  return next;
}

export function deleteGoal(store: LocalStore, goalId: string): LocalStore {
  const next: LocalStore = {
    ...store,
    goals: store.goals.filter((g) => g.id !== goalId),
    checkIns: store.checkIns.filter((c) => c.goalId !== goalId),
  };
  saveStore(next);
  return next;
}

export function updateGoalTitle(
  store: LocalStore,
  goalId: string,
  newTitle: string,
): LocalStore {
  const title = newTitle.trim();
  if (!title) throw new Error('Walang laman ang goal title.');
  const next: LocalStore = {
    ...store,
    goals: store.goals.map((g) => (g.id === goalId ? { ...g, title } : g)),
  };
  saveStore(next);
  return next;
}

export function updateMemberAvatar(
  store: LocalStore,
  memberId: string,
  avatarUrl: string | null,
): LocalStore {
  const member = store.members.find((m) => m.id === memberId);
  if (!member) throw new Error('Hindi mahanap ang member.');
  const url = (avatarUrl ?? '').trim();
  if (url && url.length > 300_000) {
    throw new Error('Masyadong malaki ang image. Subukan ang mas maliit.');
  }
  const next: LocalStore = {
    ...store,
    members: store.members.map((m) =>
      m.id === memberId ? { ...m, ...(url ? { avatarUrl: url } : { avatarUrl: undefined }) } : m,
    ),
  };
  saveStore(next);
  return next;
}

// ---- Personal workout plan (per member, per room) ----

export function getWorkoutSelections(
  store: LocalStore,
  roomId: string,
  memberId: string,
): WorkoutSelection[] {
  const plan = (store.workoutPlans ?? []).find(
    (p) => p.roomId === roomId && p.memberId === memberId,
  );
  const saved = new Map((plan?.selections ?? []).map((s) => [s.exerciseId, s]));
  return WORKOUT_EXERCISES.map((ex) => {
    const s = saved.get(ex.id);
    return {
      exerciseId: ex.id,
      included: s?.included ?? false,
      targetCount:
        typeof s?.targetCount === 'number' && Number.isFinite(s.targetCount)
          ? Math.round(s.targetCount)
          : ex.defaultCount,
    };
  });
}

export function getEnabledWorkouts(
  store: LocalStore,
  roomId: string,
  memberId: string,
): { exerciseId: string; title: string; icon: string; targetCount: number; goalId: string }[] {
  const selections = getWorkoutSelections(store, roomId, memberId).filter((s) => s.included);
  return selections.map((s) => {
    const ex = WORKOUT_EXERCISES.find((e) => e.id === s.exerciseId);
    return {
      exerciseId: s.exerciseId,
      title: ex?.title ?? s.exerciseId,
      icon: ex?.icon ?? 'WORK',
      targetCount: s.targetCount,
      goalId: workoutGoalId(s.exerciseId),
    };
  });
}

export function saveWorkoutPlan(
  store: LocalStore,
  input: { roomId: string; memberId: string; selections: WorkoutSelection[] },
): LocalStore {
  const cleaned: WorkoutSelection[] = WORKOUT_EXERCISES.map((ex) => {
    const found = input.selections.find((s) => s.exerciseId === ex.id);
    return {
      exerciseId: ex.id,
      included: Boolean(found?.included),
      targetCount:
        typeof found?.targetCount === 'number' && Number.isFinite(found.targetCount)
          ? Math.max(1, Math.round(found.targetCount))
          : ex.defaultCount,
    };
  });
  const existing = (store.workoutPlans ?? []).find(
    (p) => p.roomId === input.roomId && p.memberId === input.memberId,
  );
  let workoutPlans: WorkoutPlan[];
  if (existing) {
    workoutPlans = (store.workoutPlans ?? []).map((p) =>
      p.id === existing.id
        ? { ...p, selections: cleaned, updatedAt: new Date().toISOString() }
        : p,
    );
  } else {
    const entry: WorkoutPlan = {
      id: generateId(),
      roomId: input.roomId,
      memberId: input.memberId,
      selections: cleaned,
      updatedAt: new Date().toISOString(),
    };
    workoutPlans = [...(store.workoutPlans ?? []), entry];
  }
  const next: LocalStore = { ...store, workoutPlans };
  saveStore(next);
  return next;
}

export interface MemberStat {
  member: Member;
  xp: number;
  totalCheckIns: number;
  todayCount: number;
  streak: number;
}

export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  // If no check-in today, start counting from yesterday (still alive streak)
  if (!set.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface StreakBadge {
  label: string;
  tier: string;
}

export function getStreakBadge(streak: number): StreakBadge | null {
  if (streak >= 30) return { label: 'Arc Beast', tier: 'legendary' };
  if (streak >= 21) return { label: 'Habit Locked', tier: 'epic' };
  if (streak >= 14) return { label: 'On a Roll', tier: 'rare' };
  if (streak >= 7) return { label: 'Committed', tier: 'uncommon' };
  if (streak >= 3) return { label: 'Getting Started', tier: 'common' };
  return null;
}

export function getMemberStats(
  store: LocalStore,
  roomId: string,
  date: string,
): MemberStat[] {
  const members = store.members.filter((m) => m.roomId === roomId);
  return members
    .map((member) => {
      const all = store.checkIns.filter(
        (c) => c.roomId === roomId && c.memberId === member.id,
      );
      const today = all.filter((c) => c.date === date);
      const uniqueDates = [...new Set(all.map((c) => c.date))];
      return {
        member,
        xp: all.length * 10,
        totalCheckIns: all.length,
        todayCount: today.length,
        streak: calcStreak(uniqueDates),
      };
    })
    .sort((a, b) => b.xp - a.xp || b.streak - a.streak);
}

export interface GoalStat {
  goalId: string;
  title: string;
  totalCheckIns: number;
  uniqueMembers: number;
  targetCount?: number;
}

export interface DayStat {
  date: string;
  count: number;
}

export interface RoomAnalytics {
  totalMembers: number;
  totalCheckIns: number;
  activeToday: number;
  goalStats: GoalStat[];
  last7Days: DayStat[];
  inactiveMembers: Member[];
}

export function getLast7Keys(base = new Date()): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    keys.push(todayKey(d));
  }
  return keys;
}

export function getRoomAnalytics(store: LocalStore, roomId: string): RoomAnalytics {
  const members = store.members.filter((m) => m.roomId === roomId);
  const goals = store.goals.filter((g) => g.roomId === roomId);
  const checkIns = store.checkIns.filter((c) => c.roomId === roomId);
  const today = todayKey();

  const goalStats: GoalStat[] = goals.map((goal) => {
    const rows = checkIns.filter((c) => c.goalId === goal.id);
    return {
      goalId: goal.id,
      title: goal.title,
      totalCheckIns: rows.length,
      uniqueMembers: new Set(rows.map((r) => r.memberId)).size,
      ...(typeof goal.targetCount === 'number' ? { targetCount: goal.targetCount } : {}),
    };
  });

  const last7Days: DayStat[] = getLast7Keys().map((date) => ({
    date,
    count: checkIns.filter((c) => c.date === date).length,
  }));

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = todayKey(threeDaysAgo);
  const inactiveMembers = members.filter((m) => {
    const dates = checkIns.filter((c) => c.memberId === m.id).map((c) => c.date);
    if (dates.length === 0) return true;
    const latest = dates.sort().at(-1) ?? '';
    return latest < cutoff;
  });

  return {
    totalMembers: members.length,
    totalCheckIns: checkIns.length,
    activeToday: new Set(checkIns.filter((c) => c.date === today).map((c) => c.memberId)).size,
    goalStats,
    last7Days,
    inactiveMembers,
  };
}
