import type {
  AchievementUnlock,
  Announcement,
  Challenge,
  ChallengeJoin,
  CheckIn,
  Goal,
  Member,
  PersonalGoal,
  Reflection,
  Room,
  WorkoutPlan,
  WorkoutSelection,
} from '../types';
import { WORKOUT_EXERCISES, workoutGoalId } from './workouts';

const STORAGE_KEY = 'winterarc:local:v1';

export interface PlatformState {
  systemAdminMemberIds: string[];
}

export interface LocalStore {
  rooms: Room[];
  members: Member[];
  goals: Goal[];
  checkIns: CheckIn[];
  announcements: Announcement[];
  currentMemberByRoom: Record<string, string>;
  workoutPlans: WorkoutPlan[];
  personalGoals: PersonalGoal[];
  challenges: Challenge[];
  challengeJoins: ChallengeJoin[];
  reflections: Reflection[];
  achievementUnlocks: AchievementUnlock[];
  platform: PlatformState;
}

const emptyStore: LocalStore = {
  rooms: [],
  members: [],
  goals: [],
  checkIns: [],
  announcements: [],
  currentMemberByRoom: {},
  workoutPlans: [],
  personalGoals: [],
  challenges: [],
  challengeJoins: [],
  reflections: [],
  achievementUnlocks: [],
  platform: { systemAdminMemberIds: [] },
};

function migrate(parsed: Partial<LocalStore>): LocalStore {
  type LegacyRoom = Omit<Room, 'ownerMemberId'> & {
    ownerMemberId?: string;
    adminMemberId?: string;
  };
  const rooms = (parsed.rooms ?? []) as LegacyRoom[];
  const members = (parsed.members ?? []) as Member[];
  const goals = (parsed.goals ?? []) as Goal[];
  const checkIns = (parsed.checkIns ?? []) as CheckIn[];
  const announcements = (parsed.announcements ?? []) as Announcement[];
  const currentMemberByRoom = (parsed.currentMemberByRoom ?? {}) as Record<string, string>;
  const workoutPlans = (parsed.workoutPlans ?? []) as WorkoutPlan[];
  const personalGoals = (parsed.personalGoals ?? []) as PersonalGoal[];
  const challenges = (parsed.challenges ?? []) as Challenge[];
  const challengeJoins = (parsed.challengeJoins ?? []) as ChallengeJoin[];
  const reflections = (parsed.reflections ?? []) as Reflection[];
  const achievementUnlocks = (parsed.achievementUnlocks ?? []) as AchievementUnlock[];

  // Old rooms have no ownerMemberId (previously adminMemberId).
  // The creator/first member becomes the room owner.
  const fixedRooms: Room[] = rooms.map((room) => {
    const ownerMemberId =
      room.ownerMemberId ??
      room.adminMemberId ??
      members
        .filter((m) => m.roomId === room.id)
        .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0]?.id ??
      '';
    const { adminMemberId: _legacy, ...rest } = room;
    void _legacy;
    return { ...rest, ownerMemberId };
  });

  const fixedMembers = members.map((m) => {
    const room = fixedRooms.find((r) => r.id === m.roomId);
    let role = m.role;
    if (!role) {
      role = room?.ownerMemberId === m.id ? 'owner' : 'member';
    } else if (role === 'admin' && room?.ownerMemberId === m.id) {
      // The room creator was stored as admin before the owner role existed.
      role = 'owner';
    }
    const base: Member = { ...m, role };
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

  // Drop personal data that points to missing members/rooms/challenges.
  const challengeIds = new Set(challenges.filter((c) => roomIds.has(c.roomId)).map((c) => c.id));
  const fixedChallenges = challenges.filter((c) => roomIds.has(c.roomId));
  const seenUnlocks = new Set<string>();
  const fixedUnlocks = achievementUnlocks.filter((u) => {
    if (!memberIds.has(u.memberId)) return false;
    const key = `${u.memberId}:${u.achievementId}`;
    if (seenUnlocks.has(key)) return false;
    seenUnlocks.add(key);
    return true;
  });

  return {
    rooms: fixedRooms,
    members: fixedMembers,
    goals: fixedGoals,
    checkIns,
    announcements,
    currentMemberByRoom,
    workoutPlans: fixedPlans,
    personalGoals: personalGoals.filter((g) => memberIds.has(g.memberId)),
    challenges: fixedChallenges,
    challengeJoins: challengeJoins.filter(
      (j) => challengeIds.has(j.challengeId) && memberIds.has(j.memberId),
    ),
    reflections: reflections.filter((r) => memberIds.has(r.memberId)),
    achievementUnlocks: fixedUnlocks,
    platform: {
      systemAdminMemberIds: seedSystemAdmins(
        parsed.platform?.systemAdminMemberIds,
        fixedMembers,
      ),
    },
  };
}

// Seed: the oldest member on this device becomes the initial system admin.
// Determined from stored data — never hard-coded to an email or user ID.
function seedSystemAdmins(stored: string[] | undefined, members: Member[]): string[] {
  const memberIds = new Set(members.map((m) => m.id));
  const kept = (stored ?? []).filter((id) => memberIds.has(id));
  if (kept.length > 0) return kept;
  const oldest = [...members].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
  return oldest ? [oldest.id] : [];
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
  return member?.role === 'admin' || member?.role === 'owner';
}

export function isOwner(store: LocalStore, roomId: string, memberId: string | undefined): boolean {
  if (!memberId) return false;
  const room = store.rooms.find((r) => r.id === roomId);
  if (room && room.ownerMemberId === memberId) return true;
  const member = store.members.find((m) => m.id === memberId && m.roomId === roomId);
  return member?.role === 'owner';
}

/** Owner-only actions: members, roles, room settings, ownership, deletion. */
export function canManageMembers(
  store: LocalStore,
  roomId: string,
  memberId: string | undefined,
): boolean {
  return isOwner(store, roomId, memberId);
}

export function isPlatformAdmin(store: LocalStore, memberId: string | undefined): boolean {
  if (!memberId) return false;
  return (store.platform?.systemAdminMemberIds ?? []).includes(memberId);
}

export function getPlatformRole(
  store: LocalStore,
  memberId: string | undefined,
): 'system_admin' | 'user' {
  return isPlatformAdmin(store, memberId) ? 'system_admin' : 'user';
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
    description?: string;
    startDate: string;
    endDate: string;
    goals: GoalInput[];
  },
): { store: LocalStore; room: Room; member: Member } {
  const memberId = generateId();
  const description = (input.description ?? '').trim().slice(0, 200);
  const room: Room = {
    id: generateId(),
    inviteCode: makeInviteCode(),
    title: input.title.trim(),
    ...(description ? { description } : {}),
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date().toISOString(),
    ownerMemberId: memberId,
  };
  const member: Member = {
    id: memberId,
    roomId: room.id,
    nickname: input.nickname.trim(),
    role: 'owner',
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
    personalGoals: store.personalGoals ?? [],
    challenges: store.challenges ?? [],
    challengeJoins: store.challengeJoins ?? [],
    reflections: store.reflections ?? [],
    achievementUnlocks: store.achievementUnlocks ?? [],
    // Bootstrap: the very first member on a fresh device becomes system admin.
    platform:
      (store.platform?.systemAdminMemberIds ?? []).length > 0
        ? (store.platform ?? { systemAdminMemberIds: [] })
        : { systemAdminMemberIds: [memberId] },
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
  if (!room) throw new Error('Room code not found.');

  const nickname = input.nickname.trim();
  if (!nickname) throw new Error('Please enter a nickname.');

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

export function sendAnnouncement(
  store: LocalStore,
  input: { roomId: string; authorMemberId: string; body: string },
): LocalStore {
  if (!isAdmin(store, input.roomId, input.authorMemberId)) {
    throw new Error('Only admins can send messages.');
  }
  const body = input.body.trim();
  if (!body) throw new Error('Message cannot be empty.');
  if (body.length > 500) throw new Error('Message must be 500 characters or less.');
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
  if (!title) throw new Error('Goal title cannot be empty.');
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
  if (!member) throw new Error('Member not found.');
  const url = (avatarUrl ?? '').trim();
  if (url && url.length > 300_000) {
    throw new Error('Image is too large. Try a smaller one.');
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

// ---- Virtual check-in IDs for personal goals ----
// Personal goal completions reuse the CheckIn table with a `personal:<id>`
// goalId, mirroring the `workout:<id>` pattern. toggleCheckIn stays the
// single source of truth, so duplicates are impossible.

export function personalGoalId(id: string): string {
  return `personal:${id}`;
}

export function personalGoalIdFromGoalId(goalId: string): string | null {
  if (!goalId.startsWith('personal:')) return null;
  return goalId.slice('personal:'.length);
}

// ---- Personal goals ----

export interface PersonalGoalInput {
  title: string;
  description?: string;
  icon?: string;
  targetCount?: number;
}

function cleanPersonalGoalInput(input: PersonalGoalInput): {
  title: string;
  description?: string;
  icon?: string;
  targetCount?: number;
} {
  const title = input.title.trim();
  if (!title) throw new Error('Please name your goal.');
  if (title.length > 80) throw new Error('Goal title must be 80 characters or less.');
  const description = (input.description ?? '').trim();
  if (description.length > 200) throw new Error('Description must be 200 characters or less.');
  const out: { title: string; description?: string; icon?: string; targetCount?: number } = {
    title,
  };
  if (description) out.description = description;
  const icon = (input.icon ?? '').trim().toUpperCase().slice(0, 8);
  if (icon) out.icon = icon;
  if (typeof input.targetCount === 'number' && Number.isFinite(input.targetCount)) {
    out.targetCount = Math.max(1, Math.round(input.targetCount));
  }
  return out;
}

export function getActivePersonalGoals(store: LocalStore, memberId: string): PersonalGoal[] {
  return (store.personalGoals ?? [])
    .filter((g) => g.memberId === memberId && g.isActive)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function createPersonalGoal(
  store: LocalStore,
  memberId: string,
  input: PersonalGoalInput,
): LocalStore {
  if (!store.members.some((m) => m.id === memberId)) {
    throw new Error('Member not found.');
  }
  const entry: PersonalGoal = {
    id: generateId(),
    memberId,
    ...cleanPersonalGoalInput(input),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  const next: LocalStore = {
    ...store,
    personalGoals: [...(store.personalGoals ?? []), entry],
  };
  saveStore(next);
  return next;
}

export function updatePersonalGoal(
  store: LocalStore,
  goalId: string,
  input: PersonalGoalInput,
): LocalStore {
  if (!(store.personalGoals ?? []).some((g) => g.id === goalId)) {
    throw new Error('Goal not found.');
  }
  const next: LocalStore = {
    ...store,
    personalGoals: (store.personalGoals ?? []).map((g) =>
      g.id === goalId ? { ...g, ...cleanPersonalGoalInput(input) } : g,
    ),
  };
  saveStore(next);
  return next;
}

export function setPersonalGoalActive(
  store: LocalStore,
  goalId: string,
  isActive: boolean,
): LocalStore {
  const next: LocalStore = {
    ...store,
    personalGoals: (store.personalGoals ?? []).map((g) =>
      g.id === goalId ? { ...g, isActive } : g,
    ),
  };
  saveStore(next);
  return next;
}

export function deletePersonalGoal(store: LocalStore, goalId: string): LocalStore {
  const next: LocalStore = {
    ...store,
    personalGoals: (store.personalGoals ?? []).filter((g) => g.id !== goalId),
    checkIns: store.checkIns.filter((c) => c.goalId !== personalGoalId(goalId)),
  };
  saveStore(next);
  return next;
}

// ---- Room challenges ----

export interface ChallengeInput {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

function cleanChallengeInput(input: ChallengeInput): ChallengeInput {
  const title = input.title.trim();
  if (!title) throw new Error('Please name your challenge.');
  if (title.length > 80) throw new Error('Challenge title must be 80 characters or less.');
  const description = input.description.trim().slice(0, 300);
  if (!input.startDate || !input.endDate) throw new Error('Start and end dates are required.');
  if (input.endDate < input.startDate) {
    throw new Error('End date must be after the start date.');
  }
  return { title, description, startDate: input.startDate, endDate: input.endDate };
}

export function createChallenge(
  store: LocalStore,
  input: { roomId: string; createdByMemberId: string } & ChallengeInput,
): LocalStore {
  if (!isAdmin(store, input.roomId, input.createdByMemberId)) {
    throw new Error('Only admins can create challenges.');
  }
  const entry: Challenge = {
    id: generateId(),
    roomId: input.roomId,
    ...cleanChallengeInput(input),
    createdByMemberId: input.createdByMemberId,
    createdAt: new Date().toISOString(),
  };
  const next: LocalStore = {
    ...store,
    challenges: [...(store.challenges ?? []), entry],
  };
  saveStore(next);
  return next;
}

export function updateChallenge(
  store: LocalStore,
  challengeId: string,
  input: ChallengeInput,
): LocalStore {
  if (!(store.challenges ?? []).some((c) => c.id === challengeId)) {
    throw new Error('Challenge not found.');
  }
  const next: LocalStore = {
    ...store,
    challenges: (store.challenges ?? []).map((c) =>
      c.id === challengeId ? { ...c, ...cleanChallengeInput(input) } : c,
    ),
  };
  saveStore(next);
  return next;
}

export function deleteChallenge(store: LocalStore, challengeId: string): LocalStore {
  const next: LocalStore = {
    ...store,
    challenges: (store.challenges ?? []).filter((c) => c.id !== challengeId),
    challengeJoins: (store.challengeJoins ?? []).filter((j) => j.challengeId !== challengeId),
  };
  saveStore(next);
  return next;
}

export function joinChallenge(
  store: LocalStore,
  challengeId: string,
  memberId: string,
): LocalStore {
  const challenge = (store.challenges ?? []).find((c) => c.id === challengeId);
  if (!challenge) throw new Error('Challenge not found.');
  const member = store.members.find((m) => m.id === memberId);
  if (!member || member.roomId !== challenge.roomId) {
    throw new Error('You must be a room member to join.');
  }
  // Idempotent: joining twice returns the store unchanged.
  if ((store.challengeJoins ?? []).some((j) => j.challengeId === challengeId && j.memberId === memberId)) {
    return store;
  }
  const entry: ChallengeJoin = {
    id: generateId(),
    challengeId,
    memberId,
    joinedAt: new Date().toISOString(),
  };
  const next: LocalStore = {
    ...store,
    challengeJoins: [...(store.challengeJoins ?? []), entry],
  };
  saveStore(next);
  return next;
}

export function leaveChallenge(
  store: LocalStore,
  challengeId: string,
  memberId: string,
): LocalStore {
  const next: LocalStore = {
    ...store,
    challengeJoins: (store.challengeJoins ?? []).filter(
      (j) => !(j.challengeId === challengeId && j.memberId === memberId),
    ),
  };
  saveStore(next);
  return next;
}

// ---- Weekly reflections (one per member per week, upsert) ----

export function getReflection(
  store: LocalStore,
  memberId: string,
  weekKey: string,
): Reflection | undefined {
  return (store.reflections ?? []).find((r) => r.memberId === memberId && r.weekKey === weekKey);
}

export function saveReflection(
  store: LocalStore,
  input: { memberId: string; weekKey: string; wentWell: string; improve: string },
): LocalStore {
  const wentWell = input.wentWell.trim().slice(0, 500);
  const improve = input.improve.trim().slice(0, 500);
  const existing = getReflection(store, input.memberId, input.weekKey);
  let reflections: Reflection[];
  if (existing) {
    reflections = (store.reflections ?? []).map((r) =>
      r.id === existing.id ? { ...r, wentWell, improve, updatedAt: new Date().toISOString() } : r,
    );
  } else {
    reflections = [
      ...(store.reflections ?? []),
      {
        id: generateId(),
        memberId: input.memberId,
        weekKey: input.weekKey,
        wentWell,
        improve,
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  const next: LocalStore = { ...store, reflections };
  saveStore(next);
  return next;
}

// ---- Achievements (idempotent: only missing unlocks are added) ----

export function recordUnlocks(
  store: LocalStore,
  memberId: string,
  achievementIds: string[],
): LocalStore {
  const existing = new Set(
    (store.achievementUnlocks ?? []).filter((u) => u.memberId === memberId).map((u) => u.achievementId),
  );
  const fresh = achievementIds.filter((id) => !existing.has(id));
  if (fresh.length === 0) return store;
  const now = new Date().toISOString();
  const next: LocalStore = {
    ...store,
    achievementUnlocks: [
      ...(store.achievementUnlocks ?? []),
      ...fresh.map((achievementId) => ({
        id: generateId(),
        memberId,
        achievementId,
        unlockedAt: now,
      })),
    ],
  };
  saveStore(next);
  return next;
}

// ---- Room management (owner-only, enforced here — not just in the UI) ----

function requireRoomOwner(store: LocalStore, roomId: string, actorMemberId: string): Room {
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found.');
  if (!isOwner(store, roomId, actorMemberId)) {
    throw new Error('Only the room owner can do this.');
  }
  return room;
}

export interface RoomSettingsInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export function updateRoom(
  store: LocalStore,
  roomId: string,
  actorMemberId: string,
  input: RoomSettingsInput,
): LocalStore {
  requireRoomOwner(store, roomId, actorMemberId);
  const title = input.title.trim();
  if (!title) throw new Error('Room title is required.');
  if (!input.startDate || !input.endDate) throw new Error('Start and end dates are required.');
  if (input.endDate < input.startDate) {
    throw new Error('End date must be after the start date.');
  }
  const description = (input.description ?? '').trim().slice(0, 200);
  const next: LocalStore = {
    ...store,
    rooms: store.rooms.map((r) =>
      r.id === roomId
        ? { ...r, title, description: description ? description : undefined, startDate: input.startDate, endDate: input.endDate }
        : r,
    ),
  };
  saveStore(next);
  return next;
}

/** Promote member to admin or demote admin to member. Owner only. */
export function setMemberRole(
  store: LocalStore,
  roomId: string,
  actorMemberId: string,
  targetMemberId: string,
  role: 'admin' | 'member',
): LocalStore {
  const room = requireRoomOwner(store, roomId, actorMemberId);
  if (targetMemberId === room.ownerMemberId) {
    throw new Error('Cannot change the owner role. Transfer ownership first.');
  }
  const target = store.members.find((m) => m.id === targetMemberId && m.roomId === roomId);
  if (!target) throw new Error('Member not found.');
  const next: LocalStore = {
    ...store,
    members: store.members.map((m) => (m.id === targetMemberId ? { ...m, role } : m)),
  };
  saveStore(next);
  return next;
}

export function transferOwnership(
  store: LocalStore,
  roomId: string,
  actorMemberId: string,
  newOwnerMemberId: string,
): LocalStore {
  const room = requireRoomOwner(store, roomId, actorMemberId);
  if (newOwnerMemberId === room.ownerMemberId) return store;
  const target = store.members.find((m) => m.id === newOwnerMemberId && m.roomId === roomId);
  if (!target) throw new Error('Member not found.');
  const next: LocalStore = {
    ...store,
    rooms: store.rooms.map((r) =>
      r.id === roomId ? { ...r, ownerMemberId: newOwnerMemberId } : r,
    ),
    members: store.members.map((m) => {
      if (m.id === newOwnerMemberId) return { ...m, role: 'owner' as const };
      if (m.id === room.ownerMemberId) return { ...m, role: 'admin' as const };
      return m;
    }),
  };
  saveStore(next);
  return next;
}

/** Remove every row that belongs to a member inside a room. */
function stripRoomMember(store: LocalStore, roomId: string, memberId: string): LocalStore {
  const personalIds = new Set(
    (store.personalGoals ?? []).filter((g) => g.memberId === memberId).map((g) => g.id),
  );
  const current = store.currentMemberByRoom[roomId];
  const remaining = store.members.filter((m) => m.roomId === roomId && m.id !== memberId);
  const nextCurrent = { ...store.currentMemberByRoom };
  if (current === memberId) {
    if (remaining.length > 0) nextCurrent[roomId] = remaining[0].id;
    else delete nextCurrent[roomId];
  }
  return {
    ...store,
    members: store.members.filter((m) => m.id !== memberId),
    checkIns: store.checkIns.filter(
      (c) =>
        !(c.memberId === memberId && c.roomId === roomId) &&
        !(c.memberId === memberId && personalIds.has(personalGoalIdFromGoalId(c.goalId) ?? '')),
    ),
    workoutPlans: (store.workoutPlans ?? []).filter(
      (p) => !(p.memberId === memberId && p.roomId === roomId),
    ),
    personalGoals: (store.personalGoals ?? []).filter((g) => g.memberId !== memberId),
    challengeJoins: (store.challengeJoins ?? []).filter((j) => j.memberId !== memberId),
    reflections: (store.reflections ?? []).filter((r) => r.memberId !== memberId),
    achievementUnlocks: (store.achievementUnlocks ?? []).filter((u) => u.memberId !== memberId),
    platform: {
      systemAdminMemberIds: (store.platform?.systemAdminMemberIds ?? []).filter(
        (id) => id !== memberId,
      ),
    },
    currentMemberByRoom: nextCurrent,
  };
}

/** Owner removes another member. The owner cannot remove themselves here. */
export function removeRoomMember(
  store: LocalStore,
  roomId: string,
  actorMemberId: string,
  targetMemberId: string,
): LocalStore {
  const room = requireRoomOwner(store, roomId, actorMemberId);
  if (targetMemberId === room.ownerMemberId) {
    throw new Error('Cannot remove the owner. Transfer ownership first.');
  }
  if (!store.members.some((m) => m.id === targetMemberId && m.roomId === roomId)) {
    throw new Error('Member not found.');
  }
  const next = stripRoomMember(store, roomId, targetMemberId);
  saveStore(next);
  return next;
}

/** A member (or admin) leaves freely. An owner with members left must transfer first. */
export function leaveRoom(store: LocalStore, roomId: string, memberId: string): LocalStore {
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found.');
  if (!store.members.some((m) => m.id === memberId && m.roomId === roomId)) {
    throw new Error('You are not a member of this room.');
  }
  if (room.ownerMemberId === memberId) {
    const others = store.members.filter((m) => m.roomId === roomId && m.id !== memberId);
    if (others.length > 0) {
      throw new Error('You are the owner. Transfer ownership before leaving.');
    }
    return deleteRoom(store, roomId, memberId);
  }
  const next = stripRoomMember(store, roomId, memberId);
  saveStore(next);
  return next;
}

export function deleteRoom(store: LocalStore, roomId: string, actorMemberId: string): LocalStore {
  const room = store.rooms.find((r) => r.id === roomId);
  if (!room) throw new Error('Room not found.');
  const allowed =
    isOwner(store, roomId, actorMemberId) || isPlatformAdmin(store, actorMemberId);
  if (!allowed) {
    throw new Error('Only the room owner or a system admin can delete the room.');
  }
  const challengeIds = new Set(
    (store.challenges ?? []).filter((c) => c.roomId === roomId).map((c) => c.id),
  );
  const removedMemberIds = new Set(
    store.members.filter((m) => m.roomId === roomId).map((m) => m.id),
  );
  const nextCurrent = { ...store.currentMemberByRoom };
  delete nextCurrent[roomId];
  const next: LocalStore = {
    ...store,
    rooms: store.rooms.filter((r) => r.id !== roomId),
    members: store.members.filter((m) => m.roomId !== roomId),
    goals: store.goals.filter((g) => g.roomId !== roomId),
    checkIns: store.checkIns.filter((c) => c.roomId !== roomId),
    announcements: store.announcements.filter((a) => a.roomId !== roomId),
    workoutPlans: (store.workoutPlans ?? []).filter((p) => p.roomId !== roomId),
    challenges: (store.challenges ?? []).filter((c) => c.roomId !== roomId),
    challengeJoins: (store.challengeJoins ?? []).filter((j) => !challengeIds.has(j.challengeId)),
    personalGoals: (store.personalGoals ?? []).filter((g) => !removedMemberIds.has(g.memberId)),
    reflections: (store.reflections ?? []).filter((r) => !removedMemberIds.has(r.memberId)),
    achievementUnlocks: (store.achievementUnlocks ?? []).filter(
      (u) => !removedMemberIds.has(u.memberId),
    ),
    platform: {
      systemAdminMemberIds: (store.platform?.systemAdminMemberIds ?? []).filter(
        (id) => !removedMemberIds.has(id),
      ),
    },
    currentMemberByRoom: nextCurrent,
  };
  saveStore(next);
  return next;
}

// ---- Platform administration (device-local; real multi-device enforcement needs a backend) ----

export function grantPlatformAdmin(
  store: LocalStore,
  granterMemberId: string,
  targetMemberId: string,
): LocalStore {
  if (!isPlatformAdmin(store, granterMemberId)) {
    throw new Error('Only a system admin can grant platform admin.');
  }
  if (!store.members.some((m) => m.id === targetMemberId)) {
    throw new Error('Member not found.');
  }
  const ids = store.platform?.systemAdminMemberIds ?? [];
  if (ids.includes(targetMemberId)) return store;
  const next: LocalStore = {
    ...store,
    platform: { systemAdminMemberIds: [...ids, targetMemberId] },
  };
  saveStore(next);
  return next;
}

export function revokePlatformAdmin(
  store: LocalStore,
  granterMemberId: string,
  targetMemberId: string,
): LocalStore {
  if (!isPlatformAdmin(store, granterMemberId)) {
    throw new Error('Only a system admin can revoke platform admin.');
  }
  const ids = store.platform?.systemAdminMemberIds ?? [];
  if (ids.length <= 1 && ids.includes(targetMemberId)) {
    throw new Error('Cannot remove the last system admin.');
  }
  const next: LocalStore = {
    ...store,
    platform: { systemAdminMemberIds: ids.filter((id) => id !== targetMemberId) },
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
