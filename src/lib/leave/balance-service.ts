import { Prisma, PrismaClient } from "@prisma/client";
import { resolveLeaveYear } from "./leave-year";

type DbLike = Prisma.TransactionClient | PrismaClient;

/**
 * Computes the employee's tenure in months from joinedAt.
 */
function tenureMonths(joinedAt: Date | null, asOf: Date): number {
  if (!joinedAt) return 0;
  const diffMonths =
    (asOf.getFullYear() - joinedAt.getFullYear()) * 12 +
    (asOf.getMonth() - joinedAt.getMonth());
  return Math.max(0, diffMonths);
}

/**
 * Determines the allocated days for an employee + leave type + date.
 * Picks the matching LeavePolicy by tenure bracket, falling back to the
 * leave type's defaultDays.
 */
export async function resolveAllocatedDays(
  db: DbLike,
  input: {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    asOf: Date;
  },
): Promise<number> {
  const { companyId, employeeId, leaveTypeId, asOf } = input;

  const employee = await db.employee.findFirst({
    where: { id: employeeId, companyId },
    select: { joinedAt: true },
  });

  const tenure = tenureMonths(employee?.joinedAt ?? null, asOf);

  const [policy, leaveType] = await Promise.all([
    db.leavePolicy.findFirst({
      where: {
        companyId,
        leaveTypeId,
        minTenureMonths: { lte: tenure },
        OR: [
          { maxTenureMonths: null },
          { maxTenureMonths: { gte: tenure } },
        ],
      },
      orderBy: { minTenureMonths: "desc" },
    }),
    db.leaveType.findFirst({
      where: { id: leaveTypeId, companyId },
      select: { defaultDays: true },
    }),
  ]);

  if (policy) return Number(policy.allocatedDays);
  return Number(leaveType?.defaultDays ?? 0);
}

/**
 * Ensures a LeaveBalance row exists for (employee, leaveType, year).
 * Uses the resolved allocated days (tenure policy) when creating.
 * Returns the existing or newly-created balance.
 */
export async function ensureLeaveBalance(
  db: DbLike,
  input: {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    year: number;
    allocatedDays?: number;
  },
): Promise<{
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  carriedForwardDays: number;
}> {
  const { companyId, employeeId, leaveTypeId, year } = input;

  const existing = await db.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year },
    },
  });

  if (existing) {
    return {
      ...existing,
      allocatedDays: Number(existing.allocatedDays),
      usedDays: Number(existing.usedDays),
      pendingDays: Number(existing.pendingDays),
      remainingDays: Number(existing.remainingDays),
      carriedForwardDays: Number(existing.carriedForwardDays),
    };
  }

  const allocatedDays =
    input.allocatedDays ??
    (await resolveAllocatedDays(db, {
      companyId,
      employeeId,
      leaveTypeId,
      asOf: new Date(year, 0, 1),
    }));

  const created = await db.leaveBalance.create({
    data: {
      companyId,
      employeeId,
      leaveTypeId,
      year,
      allocatedDays: new Prisma.Decimal(allocatedDays),
      remainingDays: new Prisma.Decimal(allocatedDays),
    },
  });

  return {
    ...created,
    allocatedDays: Number(created.allocatedDays),
    usedDays: Number(created.usedDays),
    pendingDays: Number(created.pendingDays),
    remainingDays: Number(created.remainingDays),
    carriedForwardDays: Number(created.carriedForwardDays),
  };
}

export interface BalanceSummary {
  id: string;
  year: number;
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  carriedForwardDays: number;
  remainingDays: number;
}

/**
 * Reads a balance row for the employee/type and resolves the effective
 * leave year for the given date (falls back to calendar year).
 */
export async function getBalanceForDate(
  db: DbLike,
  input: {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    date: Date;
  },
): Promise<BalanceSummary | null> {
  const leaveYear = await resolveLeaveYear(input.companyId, input.date);
  const balance = await db.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: input.employeeId,
        leaveTypeId: input.leaveTypeId,
        year: leaveYear.year,
      },
    },
  });

  if (!balance) return null;

  return {
    id: balance.id,
    year: balance.year,
    leaveTypeId: balance.leaveTypeId,
    allocatedDays: Number(balance.allocatedDays),
    usedDays: Number(balance.usedDays),
    pendingDays: Number(balance.pendingDays),
    carriedForwardDays: Number(balance.carriedForwardDays),
    remainingDays: Number(balance.remainingDays),
  };
}

export { resolveLeaveYear };