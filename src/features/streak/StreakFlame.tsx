import { Flame } from 'lucide-react';

/**
 * Streak flame with a checked-in state.
 * - Real fire emoji (colored) once checked in today.
 * - Grey outline flame when not checked in yet.
 * Color/emoji is never the only signal — surrounding labels include the state.
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
  if (checkedInToday) {
    return (
      <span
        role="img"
        aria-label={`Streak ${streak} days, checked in today`}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        🔥
      </span>
    );
  }
  return <Flame size={size} aria-hidden="true" className="text-faint" />;
}
