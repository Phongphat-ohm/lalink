/**
 * Shared types for the rate limiter subsystem.
 */

export interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
  firstAttemptAt: number;
  lastAttemptAt: number;
}

export interface RateLimiterOptions {
  maxAttempts?: number;
  windowMs?: number;
  lockoutDurationMs?: number;
}

export interface CheckRateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
  lockoutRemainingSeconds: number;
}

export interface RecordFailedAttemptResult {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: number | null;
}

/**
 * Synchronous storage contract for rate-limit entries.
 */
export interface IRateLimiterStore {
  get(key: string): RateLimitEntry | undefined;
  set(key: string, entry: RateLimitEntry): void;
  delete(key: string): void;
  clear(): void;
}

/**
 * Async storage contract for rate-limit entries (DB / Redis backends).
 */
export interface IAsyncRateLimiterStore {
  get(key: string): Promise<RateLimitEntry | undefined>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}