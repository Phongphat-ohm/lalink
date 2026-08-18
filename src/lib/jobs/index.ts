export * from "./types";
export { InMemoryJobQueue } from "./in-memory-queue";

import { InMemoryJobQueue } from "./in-memory-queue";
import type { JobQueue } from "./types";

/**
 * Default application job queue.
 *
 * In Phase 1 this is the in-memory implementation. A Redis/BullMQ
 * implementation can replace it in production by swapping this factory.
 */
let defaultQueue: JobQueue | null = null;

export function getDefaultJobQueue(): JobQueue {
  if (!defaultQueue) {
    defaultQueue = new InMemoryJobQueue();
  }
  return defaultQueue;
}

export function setDefaultJobQueue(queue: JobQueue | null): void {
  defaultQueue = queue;
}