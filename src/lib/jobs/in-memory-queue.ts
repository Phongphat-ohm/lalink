import { randomUUID } from "crypto";
import type { Job, JobHandler, JobQueue, JobResult } from "./types";

interface InMemoryJob extends Job {
  _handler?: JobHandler;
}

/**
 * In-memory job queue implementation.
 *
 * Processes jobs sequentially on a poll interval. Suitable for
 * single-instance deployments; swap for a Redis-backed queue
 * (Redis/BullMQ) in multi-instance production.
 */
export class InMemoryJobQueue implements JobQueue {
  private queue: InMemoryJob[] = [];
  private handlers = new Map<string, JobHandler>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private processing = false;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 500) {
    this.pollIntervalMs = pollIntervalMs;
    this.start();
  }

  async enqueue<TData = unknown>(
    type: string,
    data: TData,
    options: { maxAttempts?: number } = {},
  ): Promise<string> {
    const job: InMemoryJob = {
      id: randomUUID(),
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      createdAt: Date.now(),
      _handler: this.handlers.get(type),
    };
    this.queue.push(job);
    return job.id;
  }

  register<TData = unknown>(type: string, handler: JobHandler<TData>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  async size(): Promise<number> {
    return this.queue.length;
  }

  async shutdown(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.processNext();
    }, this.pollIntervalMs);
    // Unref so the interval does not keep the process alive in tests.
    this.timer.unref?.();
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    this.processing = true;
    try {
      const job = this.queue.shift();
      if (!job) return;

      const handler = job._handler ?? this.handlers.get(job.type);
      if (!handler) {
        // No handler registered — treat as a no-op to avoid poisoning the queue.
        return;
      }

      job.attempts += 1;
      try {
        const result = await (handler(job.data) as Promise<JobResult | void>);
        if (result && !result.success) {
          throw new Error(result.error || "Job failed");
        }
      } catch (err) {
        job.error = err instanceof Error ? err.message : "Unknown job error";
        if (job.attempts < job.maxAttempts) {
          // Re-enqueue at the back for retry.
          this.queue.push(job);
        } else {
          console.warn(`[JobQueue] Job ${job.type} failed permanently:`, job.error);
        }
      }
    } finally {
      this.processing = false;
    }
  }
}