import { prisma } from "@/lib/database";
import { LeaveTransactionType, Prisma } from "@prisma/client";
import { ensureLeaveBalance, resolveAllocatedDays } from "./balance-service";

export interface CarryForwardCompanyInput {
  companyId: string;
  /** Source leave year (the year being closed). */
  sourceYear: number;
  /** Target leave year (the year receiving carried-forward days). */
  targetYear: number;
  /** Override the run timestamp (for tests). */
  runAt?: Date;
}

export interface CarryForwardSummary {
  companyId: string;
  sourceYear: number;
  targetYear: number;
  employeesProcessed: number;
  balancesCarried: number;
  daysCarriedForward: number;
  daysExpired: number;
  skippedExisting: number;
}

/**
 * Runs the annual carry-forward for one company.
 *
 * For each employee/leaveType balance in the source year:
 *   - If the leave type allows carry-forward, move min(remaining,
 *     maxCarryForwardDays) into the target-year balance and record a
 *     CARRY_FORWARD ledger transaction.
 *   - Any leftover (remaining beyond the cap, or a non-carry-forward type)
 *     is expired and recorded as an EXPIRATION transaction.
 *
 * Idempotency: skips any source balance whose target-year balance already
 * received carried-forward days (tracked via carriedForwardDays).
 */
export async function runCarryForwardForCompany(
  input: CarryForwardCompanyInput,
): Promise<CarryForwardSummary> {
  const { companyId, sourceYear, targetYear } = input;
  const runAt = input.runAt ?? new Date();

  return prisma.$transaction(async (tx) => {
    const sourceBalances = await tx.leaveBalance.findMany({
      where: {
        companyId,
        year: sourceYear,
      },
      include: {
        leaveType: { select: { allowCarryForward: true, maxCarryForwardDays: true } },
        employee: { select: { joinedAt: true, status: true } },
      },
      orderBy: { employeeId: "asc" },
    });

    const summary: CarryForwardSummary = {
      companyId,
      sourceYear,
      targetYear,
      employeesProcessed: 0,
      balancesCarried: 0,
      daysCarriedForward: 0,
      daysExpired: 0,
      skippedExisting: 0,
    };

    const processedEmployees = new Set<string>();

    for (const source of sourceBalances) {
      const remaining = Number(source.remainingDays);
      if (remaining <= 0) continue;

      // Skip non-active employees (resigned/terminated balances are not carried).
      if (source.employee.status !== "ACTIVE") continue;

      // Idempotency guard: target balance already has carry-forward days.
      const targetBalance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: source.employeeId,
            leaveTypeId: source.leaveTypeId,
            year: targetYear,
          },
        },
      });
      if (targetBalance && Number(targetBalance.carriedForwardDays) > 0) {
        summary.skippedExisting += 1;
        continue;
      }

      // Compute carryable amount (capped by leave type policy).
      // A null or zero cap means unlimited carry-forward.
      const { allowCarryForward, maxCarryForwardDays } = source.leaveType;
      const cap =
        maxCarryForwardDays != null && Number(maxCarryForwardDays) > 0
          ? Number(maxCarryForwardDays)
          : remaining;
      const carryable = allowCarryForward ? Math.min(remaining, cap) : 0;
      const expired = remaining - carryable;

      processedEmployees.add(source.employeeId);

      if (carryable > 0) {
        // Allocate target-year balance (new or existing).
        const target = await ensureLeaveBalance(tx, {
          companyId,
          employeeId: source.employeeId,
          leaveTypeId: source.leaveTypeId,
          year: targetYear,
          allocatedDays: await resolveAllocatedDays(tx, {
            companyId,
            employeeId: source.employeeId,
            leaveTypeId: source.leaveTypeId,
            asOf: runAt,
          }),
        });

        await tx.leaveBalance.update({
          where: { id: target.id },
          data: {
            carriedForwardDays: new Prisma.Decimal(
              Number(target.carriedForwardDays) + carryable,
            ),
            remainingDays: new Prisma.Decimal(
              Number(target.remainingDays) + carryable,
            ),
          },
        });

        await tx.leaveTransaction.create({
          data: {
            companyId,
            employeeId: source.employeeId,
            leaveTypeId: source.leaveTypeId,
            type: LeaveTransactionType.CARRY_FORWARD,
            days: new Prisma.Decimal(carryable),
            balanceBefore: new Prisma.Decimal(Number(target.remainingDays)),
            balanceAfter: new Prisma.Decimal(
              Number(target.remainingDays) + carryable,
            ),
            reason: `สะสมวันลาคงเหลือจากปี ${sourceYear} ไปยังปี ${targetYear}`,
            createdBy: "SYSTEM",
          },
        });

        summary.balancesCarried += 1;
        summary.daysCarriedForward += carryable;
      }

      if (expired > 0) {
        await tx.leaveTransaction.create({
          data: {
            companyId,
            employeeId: source.employeeId,
            leaveTypeId: source.leaveTypeId,
            type: LeaveTransactionType.EXPIRATION,
            days: new Prisma.Decimal(expired),
            balanceBefore: new Prisma.Decimal(remaining),
            balanceAfter: new Prisma.Decimal(carryable),
            reason: `วันลาคงเหลือปี ${sourceYear} หมดอายุ`,
            createdBy: "SYSTEM",
          },
        });

        summary.daysExpired += expired;
      }

      // Zero out the source balance: the entire remaining is either carried
      // forward or expired.
      await tx.leaveBalance.update({
        where: { id: source.id },
        data: { remainingDays: new Prisma.Decimal(0) },
      });
    }

    summary.employeesProcessed = processedEmployees.size;
    return summary;
  });
}

export interface CarryForwardAllInput {
  sourceYear: number;
  targetYear: number;
  /** Restrict to a single company (used by admin trigger). */
  companyId?: string;
}

/**
 * Runs carry-forward for all companies (or a single company) in one
 * transaction per company. Returns per-company summaries.
 */
export async function runCarryForwardAll(
  input: CarryForwardAllInput,
): Promise<CarryForwardSummary[]> {
  const companies = await prisma.company.findMany({
    where: {
      status: "ACTIVE",
      ...(input.companyId ? { id: input.companyId } : {}),
    },
    select: { id: true },
  });

  const summaries: CarryForwardSummary[] = [];
  for (const company of companies) {
    const summary = await runCarryForwardForCompany({
      companyId: company.id,
      sourceYear: input.sourceYear,
      targetYear: input.targetYear,
    });
    summaries.push(summary);
  }
  return summaries;
}