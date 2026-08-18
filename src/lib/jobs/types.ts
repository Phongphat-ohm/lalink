/**
 * A unit of work processed by a {@link JobQueue}.
 */
export interface Job<TData = unknown> {
  id: string;
  type: string;
  data: TData;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  error?: string;
}

export interface JobResult {
  success: boolean;
  error?: string;
}

export type JobHandler<TData = unknown> = (
  data: TData,
) => Promise<JobResult | void>;

/**
 * Abstract background job queue.
 *
 * Concrete implementations (InMemory, Redis/BullMQ) can be swapped in
 * without changing callers.
 */
export interface JobQueue {
  /**
   * Enqueues a job for asynchronous processing.
   */
  enqueue<TData = unknown>(
    type: string,
    data: TData,
    options?: { maxAttempts?: number },
  ): Promise<string>;

  /**
   * Registers a handler for a given job type.
   */
  register<TData = unknown>(type: string, handler: JobHandler<TData>): void;

  /**
   * Returns the number of pending jobs.
   */
  size(): Promise<number>;

  /**
   * Stops the worker loop (idempotent).
   */
  shutdown(): Promise<void>;
}