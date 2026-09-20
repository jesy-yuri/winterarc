import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import {
  createChallengeRemote,
  createPersonalGoalRemote,
  createRoomRemote,
  deleteChallengeRemote,
  deleteGoalRemote,
  deletePersonalGoalRemote,
  deleteRoomRemote,
  joinChallengeRemote,
  joinRoomRemote,
  leaveChallengeRemote,
  leaveRoomRemote,
  loadUserScope,
  recordUnlocksRemote,
  removeMemberRemote,
  saveReflectionRemote,
  saveWorkoutPlanRemote,
  sendAnnouncementRemote,
  setMemberRoleRemote,
  setPersonalGoalActiveRemote,
  toggleCheckInRemote,
  transferOwnershipRemote,
  updateChallengeRemote,
  updateGoalTitleRemote,
  updateMemberAvatarRemote,
  updatePersonalGoalRemote,
  updateRoomRemote,
  type RemoteScope,
} from '../lib/supabaseDb';
import {
  isAdmin,
  isOwner,
  todayKey,
  type ChallengeInput,
  type LocalStore,
  type PersonalGoalInput,
  type RoomSettingsInput,
} from '../lib/localStore';
import type { WorkoutSelection } from '../types';

const EMPTY_SCOPE: RemoteScope = {
  rooms: [], members: [], goals: [], checkIns: [], announcements: [],
  workoutPlans: [], personalGoals: [], challenges: [], challengeJoins: [],
  reflections: [], achievementUnlocks: [], systemAdminMemberIds: [],
};

/**
 * Remote arc — same handler interface as useLocalArc, backed by Supabase.
 * Progress is saved per Gmail account (members.user_id = auth.uid):
 * check-ins, streaks and leaderboard are shared across devices.
 * Active only when Supabase is configured and a user is signed in.
 */
export function useSupabaseArc(user: User | null) {
  const active = getSupabase() !== null && user !== null;
  const [scope, setScope] = useState<RemoteScope>(EMPTY_SCOPE);
  const [ready, setReady] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const today = useMemo(() => todayKey(), []);

  // Reset on account change during render (React-endorsed adjust-during-render
  // pattern) so no effect needs synchronous setState.
  if ((user?.id ?? null) !== loadedUserId) {
    setLoadedUserId(user?.id ?? null);
    setScope(EMPTY_SCOPE);
    setReady(false);
  }

  const refresh = useCallback(async () => {
    const db = getSupabase();
    if (!db || !user) return;
    const next = await loadUserScope(db, user.id);
    setScope(next);
    setReady(true);
  }, [user]);

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const db = getSupabase();
        if (!db) return;
        const next = await loadUserScope(db, user.id);
        if (!cancelled) {
          setScope(next);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, user]);

  /** LocalStore-shaped view so all existing selectors (stats, gates) work unchanged. */
  const store: LocalStore = useMemo(() => {
    const currentMemberByRoom: Record<string, string> = {};
    if (user) {
      for (const m of scope.members) {
        if (m.userId === user.id && !currentMemberByRoom[m.roomId]) {
          currentMemberByRoom[m.roomId] = m.id;
        }
      }
    }
    return {
      rooms: scope.rooms,
      members: scope.members,
      goals: scope.goals,
      checkIns: scope.checkIns,
      announcements: scope.announcements,
      currentMemberByRoom,
      workoutPlans: scope.workoutPlans,
      personalGoals: scope.personalGoals,
      challenges: scope.challenges,
      challengeJoins: scope.challengeJoins,
      reflections: scope.reflections,
      achievementUnlocks: scope.achievementUnlocks,
      platform: { systemAdminMemberIds: scope.systemAdminMemberIds },
    };
  }, [scope, user]);

  const requireDb = useCallback(() => {
    const db = getSupabase();
    if (!db || !user) throw new Error('Sign in to sync with your crew.');
    return { db, userId: user.id };
  }, [user]);

  const handleCreate = useCallback(
    async (input: {
      title: string;
      nickname: string;
      description?: string;
      startDate: string;
      endDate: string;
      goals: { title: string; icon: string; targetCount?: number }[];
    }) => {
      const { db, userId } = requireDb();
      const result = await createRoomRemote(db, userId, input);
      await refresh();
      return result;
    },
    [refresh, requireDb],
  );

  const handleJoin = useCallback(
    async (input: { inviteCode: string; nickname: string }) => {
      const { db } = requireDb();
      const result = await joinRoomRemote(db, input);
      await refresh();
      return result;
    },
    [refresh, requireDb],
  );

  const handleToggle = useCallback(
    async (input: { roomId: string; memberId: string; goalId: string }) => {
      const { db } = requireDb();
      await toggleCheckInRemote(db, { ...input, date: today });
      await refresh();
    },
    [refresh, requireDb, today],
  );

  const handleToggleWorkout = useCallback(
    async (input: { roomId: string; memberId: string; exerciseId: string }) => {
      const { db } = requireDb();
      await toggleCheckInRemote(db, {
        roomId: input.roomId,
        memberId: input.memberId,
        goalId: `workout:${input.exerciseId}`,
        date: today,
      });
      await refresh();
    },
    [refresh, requireDb, today],
  );

  const handleSaveWorkoutPlan = useCallback(
    async (input: { roomId: string; memberId: string; selections: WorkoutSelection[] }) => {
      const { db } = requireDb();
      await saveWorkoutPlanRemote(db, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleAnnouncement = useCallback(
    async (input: { roomId: string; authorMemberId: string; body: string }) => {
      if (!isAdmin(store, input.roomId, input.authorMemberId)) {
        throw new Error('Only admins can send messages.');
      }
      const { db } = requireDb();
      await sendAnnouncementRemote(db, input);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const checkIsAdmin = useCallback(
    (roomId: string, memberId: string | undefined) => isAdmin(store, roomId, memberId),
    [store],
  );

  const checkIsOwner = useCallback(
    (roomId: string, memberId: string | undefined) => isOwner(store, roomId, memberId),
    [store],
  );

  const handleUpdateRoom = useCallback(
    async (roomId: string, actorMemberId: string, input: RoomSettingsInput) => {
      if (!isOwner(store, roomId, actorMemberId)) throw new Error('Only the owner can do this.');
      const { db } = requireDb();
      await updateRoomRemote(db, roomId, input);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleSetMemberRole = useCallback(
    async (roomId: string, actorMemberId: string, targetMemberId: string, role: 'admin' | 'member') => {
      if (!isOwner(store, roomId, actorMemberId)) throw new Error('Only the owner can do this.');
      const { db } = requireDb();
      await setMemberRoleRemote(db, targetMemberId, role);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleTransferOwnership = useCallback(
    async (roomId: string, actorMemberId: string, newOwnerMemberId: string) => {
      if (!isOwner(store, roomId, actorMemberId)) throw new Error('Only the owner can do this.');
      const { db } = requireDb();
      await transferOwnershipRemote(db, roomId, actorMemberId, newOwnerMemberId);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleRemoveMember = useCallback(
    async (roomId: string, actorMemberId: string, targetMemberId: string) => {
      if (!isOwner(store, roomId, actorMemberId)) throw new Error('Only the owner can do this.');
      if (actorMemberId === targetMemberId) throw new Error('You cannot remove yourself. Leave instead.');
      const { db } = requireDb();
      await removeMemberRemote(db, targetMemberId);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleLeaveRoom = useCallback(
    async (roomId: string, memberId: string) => {
      const room = store.rooms.find((r) => r.id === roomId);
      const members = store.members.filter((m) => m.roomId === roomId);
      if (room?.ownerMemberId === memberId && members.length > 1) {
        throw new Error('Transfer ownership first — an owner cannot leave while others remain.');
      }
      const { db } = requireDb();
      await leaveRoomRemote(db, memberId);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleDeleteRoom = useCallback(
    async (roomId: string, actorMemberId: string) => {
      if (!isOwner(store, roomId, actorMemberId)) throw new Error('Only the owner can do this.');
      const { db } = requireDb();
      await deleteRoomRemote(db, roomId);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleGrantPlatformAdmin = useCallback(
    async (_granterMemberId: string, targetMemberId: string) => {
      const { db } = requireDb();
      const target = store.members.find((m) => m.id === targetMemberId);
      if (!target?.userId) throw new Error('That member has no linked account yet.');
      const res = await db.from('platform_admins').upsert({ user_id: target.userId }, { onConflict: 'user_id' });
      if (res.error) throw new Error(res.error.message);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleRevokePlatformAdmin = useCallback(
    async (_granterMemberId: string, targetMemberId: string) => {
      const { db } = requireDb();
      const target = store.members.find((m) => m.id === targetMemberId);
      if (!target?.userId) throw new Error('That member has no linked account yet.');
      const res = await db.from('platform_admins').delete().eq('user_id', target.userId);
      if (res.error) throw new Error(res.error.message);
      await refresh();
    },
    [refresh, requireDb, store],
  );

  const handleDeleteGoal = useCallback(
    async (goalId: string) => {
      const { db } = requireDb();
      await deleteGoalRemote(db, goalId);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleUpdateGoal = useCallback(
    async (goalId: string, newTitle: string) => {
      const { db } = requireDb();
      await updateGoalTitleRemote(db, goalId, newTitle);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleUpdateAvatar = useCallback(
    async (memberId: string, avatarUrl: string | null) => {
      const { db } = requireDb();
      await updateMemberAvatarRemote(db, memberId, avatarUrl);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleCreatePersonalGoal = useCallback(
    async (memberId: string, input: PersonalGoalInput) => {
      const { db } = requireDb();
      await createPersonalGoalRemote(db, memberId, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleUpdatePersonalGoal = useCallback(
    async (goalId: string, input: PersonalGoalInput) => {
      const { db } = requireDb();
      await updatePersonalGoalRemote(db, goalId, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleArchivePersonalGoal = useCallback(
    async (goalId: string, isActive: boolean) => {
      const { db } = requireDb();
      await setPersonalGoalActiveRemote(db, goalId, isActive);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleDeletePersonalGoal = useCallback(
    async (goalId: string) => {
      const { db } = requireDb();
      await deletePersonalGoalRemote(db, goalId);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleCreateChallenge = useCallback(
    async (input: { roomId: string; createdByMemberId: string } & ChallengeInput) => {
      const { db } = requireDb();
      await createChallengeRemote(db, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleUpdateChallenge = useCallback(
    async (challengeId: string, input: ChallengeInput) => {
      const { db } = requireDb();
      await updateChallengeRemote(db, challengeId, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleDeleteChallenge = useCallback(
    async (challengeId: string) => {
      const { db } = requireDb();
      await deleteChallengeRemote(db, challengeId);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleJoinChallenge = useCallback(
    async (challengeId: string, memberId: string) => {
      const { db } = requireDb();
      await joinChallengeRemote(db, challengeId, memberId);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleLeaveChallenge = useCallback(
    async (challengeId: string, memberId: string) => {
      const { db } = requireDb();
      await leaveChallengeRemote(db, challengeId, memberId);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleSaveReflection = useCallback(
    async (input: { memberId: string; weekKey: string; wentWell: string; improve: string }) => {
      const { db } = requireDb();
      await saveReflectionRemote(db, input);
      await refresh();
    },
    [refresh, requireDb],
  );

  const handleRecordUnlocks = useCallback(
    async (memberId: string, achievementIds: string[]) => {
      const { db } = requireDb();
      await recordUnlocksRemote(db, memberId, achievementIds);
      await refresh();
    },
    [refresh, requireDb],
  );

  return {
    active,
    ready,
    store,
    today,
    handleCreate,
    handleJoin,
    handleToggle,
    handleToggleWorkout,
    handleSaveWorkoutPlan,
    handleAnnouncement,
    checkIsAdmin,
    checkIsOwner,
    handleUpdateRoom,
    handleSetMemberRole,
    handleTransferOwnership,
    handleRemoveMember,
    handleLeaveRoom,
    handleDeleteRoom,
    handleGrantPlatformAdmin,
    handleRevokePlatformAdmin,
    handleDeleteGoal,
    handleUpdateGoal,
    handleUpdateAvatar,
    handleCreatePersonalGoal,
    handleUpdatePersonalGoal,
    handleArchivePersonalGoal,
    handleDeletePersonalGoal,
    handleCreateChallenge,
    handleUpdateChallenge,
    handleDeleteChallenge,
    handleJoinChallenge,
    handleLeaveChallenge,
    handleSaveReflection,
    handleRecordUnlocks,
  };
}
