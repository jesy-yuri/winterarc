export type MemberRole = 'admin' | 'member';

export interface Room {
  id: string;
  inviteCode: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  adminMemberId: string;
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
