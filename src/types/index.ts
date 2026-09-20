export type MemberRole = 'owner' | 'admin' | 'member';

export type PlatformRole = 'system_admin' | 'user';

export interface Room {
  id: string;
  inviteCode: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  ownerMemberId: string;
}

export interface Member {
  id: string;
  roomId: string;
  nickname: string;
  role: MemberRole;
  joinedAt: string;
  /** Custom profile picture (uploaded data URL or image URL). Empty = default letter avatar. */
  avatarUrl?: string;
}

export interface Goal {
  id: string;
  roomId: string;
  title: string;
  icon: string;
  /** Optional rep count for workout-type goals, e.g. 10-100. */
  targetCount?: number;
}

export interface WorkoutSelection {
  exerciseId: string;
  included: boolean;
  targetCount: number;
}

export interface WorkoutPlan {
  id: string;
  roomId: string;
  memberId: string;
  selections: WorkoutSelection[];
  updatedAt: string;
}

export interface PersonalGoal {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  icon?: string;
  targetCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Challenge {
  id: string;
  roomId: string;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  createdByMemberId: string;
  createdAt: string;
}

export interface ChallengeJoin {
  id: string;
  challengeId: string;
  memberId: string;
  joinedAt: string;
}

export interface Reflection {
  id: string;
  memberId: string;
  weekKey: string; // Monday YYYY-MM-DD of the reviewed week
  wentWell: string;
  improve: string;
  updatedAt: string;
}

export interface AchievementUnlock {
  id: string;
  memberId: string;
  achievementId: string;
  unlockedAt: string; // ISO timestamp
}

export interface CheckIn {
  id: string;
  roomId: string;
  memberId: string;
  goalId: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Announcement {
  id: string;
  roomId: string;
  authorMemberId: string;
  body: string;
  createdAt: string;
}
