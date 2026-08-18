import { prisma } from "@/lib/database";
import type { IAsyncRateLimiterStore, RateLimitEntry } from "./types";

/**
 * PostgreSQL-backed rate-limit store.
 *
 * Persists attempts across restarts and instances. Use in production
 * where the in-memory store is not acceptable.
 */
export class DatabaseRateLimiterStore implements IAsyncRateLimiterStore {
  async get(key: string): Promise<RateLimitEntry | undefined> {
    const row = await prisma.rateLimitEntry.findUnique({ where: { key } });
    if (!row) return undefined;
    return {
      attempts: row.attempts,
      lockedUntil: row.lockedUntil ? row.lockedUntil.getTime() : null,
      firstAttemptAt: row.firstAttemptAt.getTime(),
      lastAttemptAt: row.lastAttemptAt.getTime(),
    };
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      create: {
        key,
        attempts: entry.attempts,
        lockedUntil: entry.lockedUntil
          ? new Date(entry.lockedUntil)
          : null,
        firstAttemptAt: new Date(entry.firstAttemptAt),
        lastAttemptAt: new Date(entry.lastAttemptAt),
      },
      update: {
        attempts: entry.attempts,
        lockedUntil: entry.lockedUntil
          ? new Date(entry.lockedUntil)
          : null,
        lastAttemptAt: new Date(entry.lastAttemptAt),
      },
    });
  }

  async delete(key: string): Promise<void> {
    await prisma.rateLimitEntry.deleteMany({ where: { key } });
  }

  async clear(): Promise<void> {
    await prisma.rateLimitEntry.deleteMany({});
  }
}