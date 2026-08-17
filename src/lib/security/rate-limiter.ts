interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  lockoutDurationMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Checks if a key (e.g. `login:user@example.com` or `ip:127.0.0.1`) is currently allowed to make a request.
 */
export function checkRateLimit(
  key: string,
  options: RateLimiterOptions = {},
): {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  lockoutRemainingSeconds: number;
} {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      lockedUntil: null,
      lockoutRemainingSeconds: 0,
    };
  }

  // Check if currently locked out
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: entry.lockedUntil,
      lockoutRemainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // Check if sliding window has expired
  if (now - entry.firstAttemptAt > windowMs) {
    store.delete(key);
    return {
      allowed: true,
      remainingAttempts: maxAttempts,
      lockedUntil: null,
      lockoutRemainingSeconds: 0,
    };
  }

  const remaining = Math.max(0, maxAttempts - entry.attempts);
  return {
    allowed: remaining > 0,
    remainingAttempts: remaining,
    lockedUntil: null,
    lockoutRemainingSeconds: 0,
  };
}

/**
 * Records a failed attempt for a given key. Locks out if threshold exceeded.
 */
export function recordFailedAttempt(
  key: string,
  options: RateLimiterOptions = {},
): {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
} {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const lockoutDurationMs = options.lockoutDurationMs ?? DEFAULT_LOCKOUT_MS;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now - entry.firstAttemptAt > windowMs) {
    entry = {
      attempts: 1,
      lockedUntil: null,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
  } else {
    entry.attempts += 1;
    entry.lastAttemptAt = now;
  }

  let isLocked = false;
  if (entry.attempts >= maxAttempts) {
    entry.lockedUntil = now + lockoutDurationMs;
    isLocked = true;
  }

  store.set(key, entry);

  const remaining = Math.max(0, maxAttempts - entry.attempts);
  return {
    isLocked,
    remainingAttempts: remaining,
    lockedUntil: entry.lockedUntil,
  };
}

/**
 * Resets the rate limit counter upon successful action (e.g. successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clears the entire rate limit store (useful for testing).
 */
export function clearRateLimitStore(): void {
  store.clear();
}
