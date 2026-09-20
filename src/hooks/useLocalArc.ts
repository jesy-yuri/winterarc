import { useCallback, useMemo, useState } from 'react';
import {
  createChallenge,
  createPersonalGoal,
  createRoom,
  deleteChallenge,
  deleteGoal,
  deletePersonalGoal,
  deleteRoom,
  grantPlatformAdmin,
  isAdmin,
  isOwner,
  joinChallenge,
  joinRoom,
  leaveChallenge,
  leaveRoom,
  loadStore,
  recordUnlocks,
  removeRoomMember,
  revokePlatformAdmin,
  saveReflection,
  saveWorkoutPlan,
  sendAnnouncement,
  setMemberRole,
  setPersonalGoalActive,
  switchMember,
  todayKey,
  toggleCheckIn,
  transferOwnership,
  updateChallenge,
  updateGoalTitle,
  updateMemberAvatar,
  updatePersonalGoal,
  updateRoom,
  type ChallengeInput,
  type LocalStore,
  type PersonalGoalInput,
  type RoomSettingsInput,
} from '../lib/localStore';
import type { WorkoutSelection } from '../types';

export function useLocalArc() {
  const [store, setStore] = useState<LocalStore>(() => loadStore());
  const today = useMemo(() => todayKey(), []);

  const handleCreate = useCallback(
    (input: {
      title: string;
      nickname: string;
      description?: string;
      startDate: string;
      endDate: string;
      goals: { title: string; icon: string; targetCount?: number }[];
    }) => {
      const result = createRoom(store, input);
      setStore(result.store);
      return result;
    },
    [store],
  );

  const handleJoin = useCallback(
    (input: { inviteCode: string; nickname: string }) => {
      const result = joinRoom(store, input);
      setStore(result.store);
      return result;
    },
    [store],
  );

  const handleToggle = useCallback(
    (input: { roomId: string; memberId: string; goalId: string }) => {
      const next = toggleCheckIn(store, { ...input, date: today });
      setStore(next);
    },
    [store, today],
  );

  const handleToggleWorkout = useCallback(
    (input: { roomId: string; memberId: string; exerciseId: string }) => {
      const next = toggleCheckIn(store, {
        roomId: input.roomId,
        memberId: input.memberId,
        goalId: `workout:${input.exerciseId}`,
        date: today,
      });
      setStore(next);
    },
    [store, today],
  );

  const handleSaveWorkoutPlan = useCallback(
    (input: { roomId: string; memberId: string; selections: WorkoutSelection[] }) => {
      setStore(saveWorkoutPlan(store, input));
    },
    [store],
  );

  const handleSwitch = useCallback(
    (roomId: string, memberId: string) => {
      setStore(switchMember(store, roomId, memberId));
    },
    [store],
  );

  const handleAnnouncement = useCallback(
    (input: { roomId: string; authorMemberId: string; body: string }) => {
      const next = sendAnnouncement(store, input);
      setStore(next);
    },
    [store],
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
    (roomId: string, actorMemberId: string, input: RoomSettingsInput) => {
      setStore(updateRoom(store, roomId, actorMemberId, input));
    },
    [store],
  );

  const handleSetMemberRole = useCallback(
    (roomId: string, actorMemberId: string, targetMemberId: string, role: 'admin' | 'member') => {
      setStore(setMemberRole(store, roomId, actorMemberId, targetMemberId, role));
    },
    [store],
  );

  const handleTransferOwnership = useCallback(
    (roomId: string, actorMemberId: string, newOwnerMemberId: string) => {
      setStore(transferOwnership(store, roomId, actorMemberId, newOwnerMemberId));
    },
    [store],
  );

  const handleRemoveMember = useCallback(
    (roomId: string, actorMemberId: string, targetMemberId: string) => {
      setStore(removeRoomMember(store, roomId, actorMemberId, targetMemberId));
    },
    [store],
  );

  const handleLeaveRoom = useCallback(
    (roomId: string, memberId: string) => {
      setStore(leaveRoom(store, roomId, memberId));
    },
    [store],
  );

  const handleDeleteRoom = useCallback(
    (roomId: string, actorMemberId: string) => {
      setStore(deleteRoom(store, roomId, actorMemberId));
    },
    [store],
  );

  const handleGrantPlatformAdmin = useCallback(
    (granterMemberId: string, targetMemberId: string) => {
      setStore(grantPlatformAdmin(store, granterMemberId, targetMemberId));
    },
    [store],
  );

  const handleRevokePlatformAdmin = useCallback(
    (granterMemberId: string, targetMemberId: string) => {
      setStore(revokePlatformAdmin(store, granterMemberId, targetMemberId));
    },
    [store],
  );

  const handleDeleteGoal = useCallback(
    (goalId: string) => {
      setStore(deleteGoal(store, goalId));
    },
    [store],
  );

  const handleUpdateGoal = useCallback(
    (goalId: string, newTitle: string) => {
      setStore(updateGoalTitle(store, goalId, newTitle));
    },
    [store],
  );

  const handleUpdateAvatar = useCallback(
    (memberId: string, avatarUrl: string | null) => {
      setStore(updateMemberAvatar(store, memberId, avatarUrl));
    },
    [store],
  );

  const handleCreatePersonalGoal = useCallback(
    (memberId: string, input: PersonalGoalInput) => {
      setStore(createPersonalGoal(store, memberId, input));
    },
    [store],
  );

  const handleUpdatePersonalGoal = useCallback(
    (goalId: string, input: PersonalGoalInput) => {
      setStore(updatePersonalGoal(store, goalId, input));
    },
    [store],
  );

  const handleArchivePersonalGoal = useCallback(
    (goalId: string, isActive: boolean) => {
      setStore(setPersonalGoalActive(store, goalId, isActive));
    },
    [store],
  );

  const handleDeletePersonalGoal = useCallback(
    (goalId: string) => {
      setStore(deletePersonalGoal(store, goalId));
    },
    [store],
  );

  const handleCreateChallenge = useCallback(
    (input: { roomId: string; createdByMemberId: string } & ChallengeInput) => {
      setStore(createChallenge(store, input));
    },
    [store],
  );

  const handleUpdateChallenge = useCallback(
    (challengeId: string, input: ChallengeInput) => {
      setStore(updateChallenge(store, challengeId, input));
    },
    [store],
  );

  const handleDeleteChallenge = useCallback(
    (challengeId: string) => {
      setStore(deleteChallenge(store, challengeId));
    },
    [store],
  );

  const handleJoinChallenge = useCallback(
    (challengeId: string, memberId: string) => {
      setStore(joinChallenge(store, challengeId, memberId));
    },
    [store],
  );

  const handleLeaveChallenge = useCallback(
    (challengeId: string, memberId: string) => {
      setStore(leaveChallenge(store, challengeId, memberId));
    },
    [store],
  );

  const handleSaveReflection = useCallback(
    (input: { memberId: string; weekKey: string; wentWell: string; improve: string }) => {
      setStore(saveReflection(store, input));
    },
    [store],
  );

  const handleRecordUnlocks = useCallback(
    (memberId: string, achievementIds: string[]) => {
      setStore((prev) => recordUnlocks(prev, memberId, achievementIds));
    },
    [],
  );

  return {
    store,
    today,
    handleCreate,
    handleJoin,
    handleToggle,
    handleToggleWorkout,
    handleSaveWorkoutPlan,
    handleSwitch,
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
