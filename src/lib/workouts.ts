export interface WorkoutExercise {
  id: string;
  title: string;
  icon: string;
  defaultCount: number;
}

export const REP_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const WORKOUT_EXERCISES: WorkoutExercise[] = [
  { id: 'push-ups', title: 'Push Ups', icon: 'PUSH', defaultCount: 20 },
  { id: 'curl-ups', title: 'Curl Ups', icon: 'CURL', defaultCount: 20 },
  { id: 'jumping-jacks', title: 'Jumping Jacks', icon: 'JUMP', defaultCount: 30 },
  { id: 'squats', title: 'Squats', icon: 'SQUAT', defaultCount: 30 },
  { id: 'lunges', title: 'Lunges', icon: 'LUNGE', defaultCount: 20 },
  { id: 'burpees', title: 'Burpees', icon: 'BURP', defaultCount: 10 },
  { id: 'plank', title: 'Plank (secs)', icon: 'PLANK', defaultCount: 30 },
  { id: 'pull-ups', title: 'Pull Ups', icon: 'PULL', defaultCount: 10 },
];

export function workoutGoalId(exerciseId: string): string {
  return `workout:${exerciseId}`;
}

export function workoutExerciseIdFromGoalId(goalId: string): string | null {
  if (!goalId.startsWith('workout:')) return null;
  return goalId.slice('workout:'.length);
}

export function normalizeCount(v: number): number {
  if (!Number.isFinite(v)) return 10;
  if (v < 1) return 1;
  return Math.round(v);
}
