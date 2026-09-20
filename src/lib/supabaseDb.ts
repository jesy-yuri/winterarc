import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AchievementUnlock,
  Announcement,
  Challenge,
  ChallengeJoin,
  CheckIn,
  Goal,
  Member,
  MemberRole,
  PersonalGoal,
  Reflection,
  Room,
  WorkoutPlan,
} from '../types';
import { makeInviteCode } from './localStore';

/* Row shapes (snake_case, as stored in Postgres). */

interface RoomRow {
  id: string;
  invite_code: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
  owner_member_id: string | null;
}

interface MemberRow {
  id: string;
  room_id: string;
  user_id: string | null;
  nickname: string;
  role: string;
  avatar_url: string | null;
  joined_at: string;
}

interface GoalRow {
  id: string;
  room_id: string;
  title: string;
  icon: string;
  target_count: number | null;
}

interface CheckInRow {
  id: string;
  room_id: string;
  member_id: string;
  goal_id: string;
  date: string;
  created_at: string;
}

interface AnnouncementRow {
  id: string;
  room_id: string;
  author_member_id: string;
  body: string;
  created_at: string;
}

interface WorkoutPlanRow {
  id: string;
  room_id: string;
  member_id: string;
  selections: { exerciseId: string; included: boolean; targetCount: number }[];
  updated_at: string;
}

interface PersonalGoalRow {
  id: string;
  member_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  target_count: number | null;
  is_active: boolean;
  created_at: string;
}

interface ChallengeRow {
  id: string;
  room_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  created_by_member_id: string;
  created_at: string;
}

interface ChallengeJoinRow {
  id: string;
  challenge_id: string;
  member_id: string;
  joined_at: string;
}

interface ReflectionRow {
  id: string;
  member_id: string;
  week_key: string;
  went_well: string;
  improve: string;
  updated_at: string;
}

interface UnlockRow {
  id: string;
  member_id: string;
  achievement_id: string;
  unlocked_at: string;
}

/* Row → app type mapping. */

function toRoom(r: RoomRow): Room {
  return {
    id: r.id,
    inviteCode: r.invite_code,
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    startDate: r.start_date,
    endDate: r.end_date,
    createdAt: r.created_at,
    ownerMemberId: r.owner_member_id ?? '',
  };
}

function toMember(m: MemberRow): Member {
  const role: MemberRole = m.role === 'owner' || m.role === 'admin' ? m.role : 'member';
  return {
    id: m.id,
    roomId: m.room_id,
    nickname: m.nickname,
    role,
    joinedAt: m.joined_at,
    ...(m.avatar_url ? { avatarUrl: m.avatar_url } : {}),
    ...(m.user_id ? { userId: m.user_id } : {}),
  };
}

function toGoal(g: GoalRow): Goal {
  return {
    id: g.id,
    roomId: g.room_id,
    title: g.title,
    icon: g.icon,
    ...(typeof g.target_count === 'number' ? { targetCount: g.target_count } : {}),
  };
}

function toCheckIn(c: CheckInRow): CheckIn {
  return {
    id: c.id,
    roomId: c.room_id,
    memberId: c.member_id,
    goalId: c.goal_id,
    date: c.date,
    createdAt: c.created_at,
  };
}

function toAnnouncement(a: AnnouncementRow): Announcement {
  return { id: a.id, roomId: a.room_id, authorMemberId: a.author_member_id, body: a.body, createdAt: a.created_at };
}

function toWorkoutPlan(p: WorkoutPlanRow): WorkoutPlan {
  return { id: p.id, roomId: p.room_id, memberId: p.member_id, selections: p.selections ?? [], updatedAt: p.updated_at };
}

function toPersonalGoal(g: PersonalGoalRow): PersonalGoal {
  return {
    id: g.id,
    memberId: g.member_id,
    title: g.title,
    ...(g.description ? { description: g.description } : {}),
    ...(g.icon ? { icon: g.icon } : {}),
    ...(typeof g.target_count === 'number' ? { targetCount: g.target_count } : {}),
    isActive: g.is_active,
    createdAt: g.created_at,
  };
}

function toChallenge(c: ChallengeRow): Challenge {
  return {
    id: c.id,
    roomId: c.room_id,
    title: c.title,
    description: c.description,
    startDate: c.start_date,
    endDate: c.end_date,
    createdByMemberId: c.created_by_member_id,
    createdAt: c.created_at,
  };
}

function toChallengeJoin(j: ChallengeJoinRow): ChallengeJoin {
  return { id: j.id, challengeId: j.challenge_id, memberId: j.member_id, joinedAt: j.joined_at };
}

function toReflection(r: ReflectionRow): Reflection {
  return { id: r.id, memberId: r.member_id, weekKey: r.week_key, wentWell: r.went_well, improve: r.improve, updatedAt: r.updated_at };
}

function toUnlock(u: UnlockRow): AchievementUnlock {
  return { id: u.id, memberId: u.member_id, achievementId: u.achievement_id, unlockedAt: u.unlocked_at };
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  if (res.data == null) throw new Error(`${what} not found.`);
  return res.data;
}

/* Scope load — everything the signed-in user can see. */

export interface RemoteScope {
  rooms: Room[];
  members: Member[];
  goals: Goal[];
  checkIns: CheckIn[];
  announcements: Announcement[];
  workoutPlans: WorkoutPlan[];
  personalGoals: PersonalGoal[];
  challenges: Challenge[];
  challengeJoins: ChallengeJoin[];
  reflections: Reflection[];
  achievementUnlocks: AchievementUnlock[];
  systemAdminMemberIds: string[];
}

export async function loadUserScope(db: SupabaseClient, userId: string): Promise<RemoteScope> {
  const empty: RemoteScope = {
    rooms: [], members: [], goals: [], checkIns: [], announcements: [],
    workoutPlans: [], personalGoals: [], challenges: [], challengeJoins: [],
    reflections: [], achievementUnlocks: [], systemAdminMemberIds: [],
  };

  const myMemberships = must(
    await db.from('members').select('room_id').eq('user_id', userId),
    'Memberships',
  ) as { room_id: string }[];
  const roomIds = [...new Set(myMemberships.map((m) => m.room_id))];
  if (roomIds.length === 0) {
    const admins = must(await db.from('platform_admins').select('user_id'), 'Admins') as { user_id: string }[];
    void admins;
    return empty;
  }

  const [roomsRes, membersRes, goalsRes, checkInsRes, announcementsRes, plansRes, challengesRes, adminsRes] =
    await Promise.all([
      db.from('rooms').select('*').in('id', roomIds),
      db.from('members').select('*').in('room_id', roomIds),
      db.from('goals').select('*').in('room_id', roomIds),
      db.from('check_ins').select('*').in('room_id', roomIds),
      db.from('announcements').select('*').in('room_id', roomIds).order('created_at', { ascending: false }),
      db.from('workout_plans').select('*').in('room_id', roomIds),
      db.from('challenges').select('*').in('room_id', roomIds),
      db.from('platform_admins').select('user_id'),
    ]);
  const rooms = (must(roomsRes, 'Rooms') as RoomRow[]).map(toRoom);
  const members = (must(membersRes, 'Members') as MemberRow[]).map(toMember);
  const memberIds = members.map((m) => m.id);
  const challengeIds = (must(challengesRes, 'Challenges') as ChallengeRow[]).map((c) => c.id);

  const [personalRes, joinsRes, reflectionsRes, unlocksRes] = await Promise.all([
    memberIds.length > 0
      ? db.from('personal_goals').select('*').in('member_id', memberIds)
      : Promise.resolve({ data: [], error: null }),
    challengeIds.length > 0
      ? db.from('challenge_joins').select('*').in('challenge_id', challengeIds)
      : Promise.resolve({ data: [], error: null }),
    memberIds.length > 0
      ? db.from('reflections').select('*').in('member_id', memberIds)
      : Promise.resolve({ data: [], error: null }),
    memberIds.length > 0
      ? db.from('achievement_unlocks').select('*').in('member_id', memberIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const adminUserIds = new Set(
    ((must(adminsRes, 'Admins') as { user_id: string }[]) ?? []).map((a) => a.user_id),
  );

  return {
    rooms,
    members,
    goals: (must(goalsRes, 'Goals') as GoalRow[]).map(toGoal),
    checkIns: (must(checkInsRes, 'Check-ins') as CheckInRow[]).map(toCheckIn),
    announcements: (must(announcementsRes, 'Announcements') as AnnouncementRow[]).map(toAnnouncement),
    workoutPlans: (must(plansRes, 'Workout plans') as WorkoutPlanRow[]).map(toWorkoutPlan),
    personalGoals: (must(personalRes, 'Personal goals') as PersonalGoalRow[]).map(toPersonalGoal),
    challenges: (must(challengesRes, 'Challenges') as ChallengeRow[]).map(toChallenge),
    challengeJoins: (must(joinsRes, 'Challenge joins') as ChallengeJoinRow[]).map(toChallengeJoin),
    reflections: (must(reflectionsRes, 'Reflections') as ReflectionRow[]).map(toReflection),
    achievementUnlocks: (must(unlocksRes, 'Unlocks') as UnlockRow[]).map(toUnlock),
    systemAdminMemberIds: members.filter((m) => m.userId && adminUserIds.has(m.userId)).map((m) => m.id),
  };
}

/* Rooms + members. */

export async function createRoomRemote(
  db: SupabaseClient,
  userId: string,
  input: {
    title: string;
    nickname: string;
    description?: string;
    startDate: string;
    endDate: string;
    goals: { title: string; icon: string; targetCount?: number }[];
  },
): Promise<{ room: Room; member: Member }> {
  const title = input.title.trim();
  const nickname = input.nickname.trim();
  if (!title) throw new Error('Room title is required.');
  if (!nickname) throw new Error('Please enter a nickname.');
  const goals = input.goals
    .map((g) => ({
      title: g.title.trim(),
      icon: g.icon.trim().toUpperCase().slice(0, 8),
      ...(typeof g.targetCount === 'number' && Number.isFinite(g.targetCount)
        ? { targetCount: Math.round(g.targetCount) }
        : {}),
    }))
    .filter((g) => g.title);
  if (goals.length === 0) throw new Error('Add at least one goal.');

  const roomRow = must(
    await db
      .from('rooms')
      .insert({
        invite_code: makeInviteCode(),
        title,
        description: (input.description ?? '').trim().slice(0, 200) || null,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .select('*')
      .single(),
    'Room',
  ) as RoomRow;

  const memberRow = must(
    await db
      .from('members')
      .insert({ room_id: roomRow.id, user_id: userId, nickname, role: 'owner' })
      .select('*')
      .single(),
    'Member',
  ) as MemberRow;

  const ownerCheck = await db.from('rooms').update({ owner_member_id: memberRow.id }).eq('id', roomRow.id);
  if (ownerCheck.error) throw new Error(ownerCheck.error.message);

  if (goals.length > 0) {
    const gRes = await db.from('goals').insert(
      goals.map((g) => ({
        room_id: roomRow.id,
        title: g.title,
        icon: g.icon,
        target_count: g.targetCount ?? null,
      })),
    );
    if (gRes.error) throw new Error(gRes.error.message);
  }

  const room = toRoom({ ...roomRow, owner_member_id: memberRow.id });
  return { room, member: toMember(memberRow) };
}

export async function joinRoomRemote(
  db: SupabaseClient,
  input: { inviteCode: string; nickname: string },
): Promise<{ room: Room; member: Member }> {
  const code = input.inviteCode.trim().toUpperCase();
  if (!code) throw new Error('Room code is required.');
  const rpc = await db.rpc('join_room', { p_code: code, p_nickname: input.nickname });
  if (rpc.error) throw new Error(rpc.error.message);
  const member = toMember(rpc.data as MemberRow);
  const roomRow = must(
    await db.from('rooms').select('*').eq('id', member.roomId).single(),
    'Room',
  ) as RoomRow;
  return { room: toRoom(roomRow), member };
}

/* Check-ins. */

export async function toggleCheckInRemote(
  db: SupabaseClient,
  input: { roomId: string; memberId: string; goalId: string; date: string },
): Promise<void> {
  const lookup = await db
    .from('check_ins')
    .select('id')
    .eq('member_id', input.memberId)
    .eq('goal_id', input.goalId)
    .eq('date', input.date)
    .maybeSingle();
  if (lookup.error) throw new Error(lookup.error.message);
  if (lookup.data) {
    const del = await db.from('check_ins').delete().eq('id', (lookup.data as { id: string }).id);
    if (del.error) throw new Error(del.error.message);
  } else {
    const ins = await db.from('check_ins').insert({
      room_id: input.roomId,
      member_id: input.memberId,
      goal_id: input.goalId,
      date: input.date,
    });
    if (ins.error) throw new Error(ins.error.message);
  }
}

/* Announcements. */

export async function sendAnnouncementRemote(
  db: SupabaseClient,
  input: { roomId: string; authorMemberId: string; body: string },
): Promise<void> {
  const body = input.body.trim();
  if (!body) throw new Error('Message cannot be empty.');
  if (body.length > 500) throw new Error('Message must be 500 characters or less.');
  const ins = await db.from('announcements').insert({
    room_id: input.roomId,
    author_member_id: input.authorMemberId,
    body,
  });
  if (ins.error) throw new Error(ins.error.message);
}

/* Room + members management (caller checks owner/admin from loaded state; RLS enforces). */

export async function updateRoomRemote(
  db: SupabaseClient,
  roomId: string,
  input: { title: string; description?: string; startDate: string; endDate: string },
): Promise<void> {
  const res = await db
    .from('rooms')
    .update({
      title: input.title.trim(),
      description: (input.description ?? '').trim().slice(0, 200) || null,
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .eq('id', roomId);
  if (res.error) throw new Error(res.error.message);
}

export async function setMemberRoleRemote(
  db: SupabaseClient,
  targetMemberId: string,
  role: 'admin' | 'member',
): Promise<void> {
  const res = await db.from('members').update({ role }).eq('id', targetMemberId);
  if (res.error) throw new Error(res.error.message);
}

export async function transferOwnershipRemote(
  db: SupabaseClient,
  roomId: string,
  currentOwnerId: string,
  newOwnerMemberId: string,
): Promise<void> {
  const r1 = await db.from('members').update({ role: 'admin' }).eq('id', currentOwnerId);
  if (r1.error) throw new Error(r1.error.message);
  const r2 = await db.from('members').update({ role: 'owner' }).eq('id', newOwnerMemberId);
  if (r2.error) throw new Error(r2.error.message);
  const r3 = await db.from('rooms').update({ owner_member_id: newOwnerMemberId }).eq('id', roomId);
  if (r3.error) throw new Error(r3.error.message);
}

export async function removeMemberRemote(db: SupabaseClient, targetMemberId: string): Promise<void> {
  const res = await db.from('members').delete().eq('id', targetMemberId);
  if (res.error) throw new Error(res.error.message);
}

export async function leaveRoomRemote(db: SupabaseClient, memberId: string): Promise<void> {
  await removeMemberRemote(db, memberId);
}

export async function deleteRoomRemote(db: SupabaseClient, roomId: string): Promise<void> {
  const res = await db.from('rooms').delete().eq('id', roomId);
  if (res.error) throw new Error(res.error.message);
}

export async function updateGoalTitleRemote(db: SupabaseClient, goalId: string, title: string): Promise<void> {
  const res = await db.from('goals').update({ title: title.trim() }).eq('id', goalId);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteGoalRemote(db: SupabaseClient, goalId: string): Promise<void> {
  const res = await db.from('goals').delete().eq('id', goalId);
  if (res.error) throw new Error(res.error.message);
}

export async function updateMemberAvatarRemote(
  db: SupabaseClient,
  memberId: string,
  avatarUrl: string | null,
): Promise<void> {
  const res = await db.from('members').update({ avatar_url: avatarUrl }).eq('id', memberId);
  if (res.error) throw new Error(res.error.message);
}

/* Workout plans (upsert per room+member). */

export async function saveWorkoutPlanRemote(
  db: SupabaseClient,
  input: { roomId: string; memberId: string; selections: { exerciseId: string; included: boolean; targetCount: number }[] },
): Promise<void> {
  const res = await db.from('workout_plans').upsert(
    { room_id: input.roomId, member_id: input.memberId, selections: input.selections },
    { onConflict: 'room_id,member_id' },
  );
  if (res.error) throw new Error(res.error.message);
}

/* Personal goals. */

export async function createPersonalGoalRemote(
  db: SupabaseClient,
  memberId: string,
  input: { title: string; description?: string; icon?: string; targetCount?: number },
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new Error('Goal title is required.');
  const res = await db.from('personal_goals').insert({
    member_id: memberId,
    title,
    description: (input.description ?? '').trim() || null,
    icon: input.icon?.trim() || null,
    target_count: input.targetCount ?? null,
  });
  if (res.error) throw new Error(res.error.message);
}

export async function updatePersonalGoalRemote(
  db: SupabaseClient,
  goalId: string,
  input: { title: string; description?: string; icon?: string; targetCount?: number },
): Promise<void> {
  const res = await db.from('personal_goals').update({
    title: input.title.trim(),
    description: (input.description ?? '').trim() || null,
    icon: input.icon?.trim() || null,
    target_count: input.targetCount ?? null,
  }).eq('id', goalId);
  if (res.error) throw new Error(res.error.message);
}

export async function setPersonalGoalActiveRemote(db: SupabaseClient, goalId: string, isActive: boolean): Promise<void> {
  const res = await db.from('personal_goals').update({ is_active: isActive }).eq('id', goalId);
  if (res.error) throw new Error(res.error.message);
}

export async function deletePersonalGoalRemote(db: SupabaseClient, goalId: string): Promise<void> {
  const res = await db.from('personal_goals').delete().eq('id', goalId);
  if (res.error) throw new Error(res.error.message);
}

/* Challenges. */

export async function createChallengeRemote(
  db: SupabaseClient,
  input: { roomId: string; createdByMemberId: string; title: string; description: string; startDate: string; endDate: string },
): Promise<void> {
  const res = await db.from('challenges').insert({
    room_id: input.roomId,
    created_by_member_id: input.createdByMemberId,
    title: input.title.trim(),
    description: input.description.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
  });
  if (res.error) throw new Error(res.error.message);
}

export async function updateChallengeRemote(
  db: SupabaseClient,
  challengeId: string,
  input: { title: string; description: string; startDate: string; endDate: string },
): Promise<void> {
  const res = await db.from('challenges').update({
    title: input.title.trim(),
    description: input.description.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
  }).eq('id', challengeId);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteChallengeRemote(db: SupabaseClient, challengeId: string): Promise<void> {
  const res = await db.from('challenges').delete().eq('id', challengeId);
  if (res.error) throw new Error(res.error.message);
}

export async function joinChallengeRemote(db: SupabaseClient, challengeId: string, memberId: string): Promise<void> {
  const res = await db.from('challenge_joins').upsert(
    { challenge_id: challengeId, member_id: memberId },
    { onConflict: 'challenge_id,member_id' },
  );
  if (res.error) throw new Error(res.error.message);
}

export async function leaveChallengeRemote(db: SupabaseClient, challengeId: string, memberId: string): Promise<void> {
  const res = await db.from('challenge_joins').delete().eq('challenge_id', challengeId).eq('member_id', memberId);
  if (res.error) throw new Error(res.error.message);
}

/* Reflections + achievement unlocks. */

export async function saveReflectionRemote(
  db: SupabaseClient,
  input: { memberId: string; weekKey: string; wentWell: string; improve: string },
): Promise<void> {
  const res = await db.from('reflections').upsert(
    { member_id: input.memberId, week_key: input.weekKey, went_well: input.wentWell, improve: input.improve },
    { onConflict: 'member_id,week_key' },
  );
  if (res.error) throw new Error(res.error.message);
}

export async function recordUnlocksRemote(db: SupabaseClient, memberId: string, achievementIds: string[]): Promise<void> {
  if (achievementIds.length === 0) return;
  const res = await db.from('achievement_unlocks').upsert(
    achievementIds.map((achievementId) => ({ member_id: memberId, achievement_id: achievementId })),
    { onConflict: 'member_id,achievement_id', ignoreDuplicates: true },
  );
  if (res.error) throw new Error(res.error.message);
}
