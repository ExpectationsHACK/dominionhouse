const DAY = 86_400_000;

export type Remaining = { days: number; hours: number; minutes: number; seconds: number };

/** Time left until `target`; all zeros once it has passed. */
export function remainingUntil(target: Date | string, now = Date.now()): Remaining {
  const ms = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
  };
}
