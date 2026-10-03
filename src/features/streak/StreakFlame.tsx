import { Flame } from 'lucide-react';

/**
 * Streak flame with a checked-in state.
 * - Grey (muted) when the member has no check-ins today yet.
 * - Fire (warning) once checked in today.
 * Color is never the only signal — the label includes the state for screen readers.
 */
export function StreakFlame({
  checkedInToday,
  size = 17,
  streak = 0,
}: {
  checkedInToday: boolean;
  size?: number;
  streak?: number;
}) {
  return (
    <Flame
      size={size}
      aria-hidden="true"
      aria-label={
        checkedInToday
          ? `Streak ${streak} days, checked in today`
          : `Streak ${streak} days, not checked in yet`
      }
      className={checkedInToday ? 'text-warning' : 'text-faint'}
    />
  );
}
