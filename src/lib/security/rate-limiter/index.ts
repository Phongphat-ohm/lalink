import { InMemoryRateLimiterStore } from "./memory-store";
import type {
  CheckRateLimitResult,
  IRateLimiterStore,
  RateLimiterOptions,
  RecordFailedAttemptResult,
} from "./types";

export * from "./types";
export { InMemoryRateLimiterStore } from "./memory-store";
export { DatabaseRateLimiterStore } from "./database-store";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Default in-memory store. In production, pass a DB/Redis-backed store
 * to {@link createRateLimiter} and use the returned functions instead.
 */
const defaultStore = new InMemoryRateLimiterStore();

/**
 * Builds rate-limit helpers bound to a specific store.
 * Lets the application swap in-memory for a DB/Redis backend.
 */
export function createRateLimiter(store: IRateLimiterStore) {
  return {
    checkRateLimit(
      key: string,
      options: RateLimiterOptions = {},
    ): CheckRateLimitResult {
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

      if (entry.lockedUntil && entry.lockedUntil > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockedUntil: entry.lockedUntil,
          lockoutRemainingSeconds: Math.ceil(
            (entry.lockedUntil - now) / 1000,
          ),
        };
      }

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
    },

    recordFailedAttempt(
      key: string,
      options: RateLimiterOptions = {},
    ): RecordFailedAttemptResult {
      const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
      const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
      const lockoutDurationMs =
        options.lockoutDurationMs ?? DEFAULT_LOCKOUT_MS;
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
        entry = { ...entry, attempts: entry.attempts + 1, lastAttemptAt: now };
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
    },

    resetRateLimit(key: string): void {
      store.delete(key);
    },

    clearRateLimitStore(): void {
      store.clear();
    },
  };
}

/**
 * Checks if a key (e.g. `login:user@example.com` or `ip:127.0.0.1`) is
 * currently allowed to make a request.
 */
export function checkRateLimit(
  key: string,
  options: RateLimiterOptions = {},
): CheckRateLimitResult {
  return createRateLimiter(defaultStore).checkRateLimit(key, options);
}

/**
 * Records a failed attempt for a given key. Locks out if threshold exceeded.
 */
export function recordFailedAttempt(
  key: string,
  options: RateLimiterOptions = {},
): RecordFailedAttemptResult {
  return createRateLimiter(defaultStore).recordFailedAttempt(key, options);
}

/**
 * Resets the rate limit counter upon successful action (e.g. successful login).
 */
export function resetRateLimit(key: string): void {
  createRateLimiter(defaultStore).resetRateLimit(key);
}

/**
 * Clears the entire rate limit store (useful for testing).
 */
export function clearRateLimitStore(): void {
  createRateLimiter(defaultStore).clearRateLimitStore();
}