import { useCallback, useMemo, useState } from 'react';
import {
  createRoom,
  deleteGoal,
  isAdmin,
  joinRoom,
  loadStore,
  saveWorkoutPlan,
  sendAnnouncement,
  switchMember,
  todayKey,
  toggleCheckIn,
  updateGoalTitle,
  updateMemberAvatar,
  type LocalStore,
} from '../lib/localStore';
import type { WorkoutSelection } from '../types';

export function useLocalArc() {
  const [store, setStore] = useState<LocalStore>(() => loadStore());
  const today = useMemo(() => todayKey(), []);

  const handleCreate = useCallback(
    (input: {
      title: string;
      nickname: string;
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
    handleDeleteGoal,
    handleUpdateGoal,
    handleUpdateAvatar,
  };
}
