import { Flame } from 'lucide-react';
import type { StreakStatus } from '../../lib/streak';

/**
 * Streak flame with checked-in + grace states.
 * - Real fire emoji (colored) once checked in today.
 * - Orange flame when at-risk (1 day missed, Continue streak).
 * - Red pulsing flame on last chance (2 days missed).
 * - Grey outline flame otherwise.
 * Color/emoji is never the only signal — surrounding labels include the state.
 */
export function StreakFlame({
  checkedInToday,
  size = 17,
  streak = 0,
  status = 'active',
}: {
  checkedInToday: boolean;
  size?: number;
  streak?: number;
  status?: StreakStatus;
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
  if (streak > 0 && (status === 'at-risk' || status === 'critical')) {
    const critical = status === 'critical';
    return (
      <span role="img" aria-label={`Streak ${streak} days, ${critical ? 'last chance to continue' : 'continue streak'}`}>
        <Flame
          size={size}
          aria-hidden="true"
          className={critical ? 'animate-pulse text-danger' : 'text-warning'}
        />
      </span>
    );
  }
  return <Flame size={size} aria-hidden="true" className="text-faint" />;
}
