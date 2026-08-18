import { getDefaultJobQueue } from "@/lib/jobs";
import { runCarryForwardAll } from "./carry-forward";

export const CARRY_FORWARD_JOB_TYPE = "leave:carry-forward";

export interface CarryForwardJobData {
  sourceYear: number;
  targetYear: number;
  companyId?: string;
}

/**
 * Registers the carry-forward job handler on the default job queue.
 *
 * The job is idempotent at the balance level (see runCarryForwardAll),
 * so re-running it after a partial failure is safe.
 */
export function registerCarryForwardJob(): void {
  const queue = getDefaultJobQueue();

  queue.register<CarryForwardJobData>(CARRY_FORWARD_JOB_TYPE, async (data) => {
    try {
      const summaries = await runCarryForwardAll({
        sourceYear: data.sourceYear,
        targetYear: data.targetYear,
        companyId: data.companyId,
      });

      const totals = summaries.reduce(
        (acc, s) => {
          acc.companies += 1;
          acc.employees += s.employeesProcessed;
          acc.carried += s.daysCarriedForward;
          acc.expired += s.daysExpired;
          return acc;
        },
        { companies: 0, employees: 0, carried: 0, expired: 0 },
      );

      console.info(
        `[CarryForward] completed: ${totals.companies} company(s), ` +
          `${totals.employees} employee(s), carried ${totals.carried} days, ` +
          `expired ${totals.expired} days.`,
      );

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[CarryForward] job failed:", message);
      return { success: false, error: message };
    }
  });
}

/**
 * Enqueues a carry-forward job. Returns the job id.
 */
export async function enqueueCarryForwardJob(
  data: CarryForwardJobData,
): Promise<string> {
  registerCarryForwardJob();
  return getDefaultJobQueue().enqueue(CARRY_FORWARD_JOB_TYPE, data);
}