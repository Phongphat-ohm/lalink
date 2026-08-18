import type { IRateLimiterStore, RateLimitEntry } from "./types";

/**
 * In-memory rate-limit store backed by a `Map`.
 *
 * Resets on server restart and is not shared across instances. This is
 * the default backend; swap for a DB/Redis store in production.
 */
export class InMemoryRateLimiterStore implements IRateLimiterStore {
  private readonly store = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}