/** A member PIN is 4 to 6 digits. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;

/** After a wrong PIN: the new attempt count and, at the limit, when the lock ends. */
export function afterFailedAttempt(attempts: number, now: Date) {
  const next = attempts + 1;
  if (next >= MAX_PIN_ATTEMPTS) {
    return { failed_attempts: 0, locked_until: new Date(now.getTime() + PIN_LOCK_MINUTES * 60_000).toISOString() };
  }
  return { failed_attempts: next, locked_until: null };
}

export function isLocked(lockedUntil: string | null, now: Date): boolean {
  return !!lockedUntil && new Date(lockedUntil).getTime() > now.getTime();
}
