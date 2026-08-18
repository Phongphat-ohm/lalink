import { prisma } from "@/lib/database";
import type { LeaveYear } from "@prisma/client";

/**
 * The resolved leave-year context for a given date.
 */
export interface ResolvedLeaveYear {
  /** LeaveYear id when a custom (fiscal) year is configured, null otherwise. */
  leaveYearId: string | null;
  /** Balance year key (LeaveBalance.year). */
  year: number;
  startDate: Date;
  endDate: Date;
  name: string;
}

/**
 * Resolves the effective leave year for a company on a given date.
 *
 * When the company has configured custom leave years, the active LeaveYear
 * whose [startDate, endDate] window contains the date wins. Otherwise it
 * falls back to the calendar year (Jan 1 - Dec 31).
 */
export async function resolveLeaveYear(
  companyId: string,
  date: Date,
): Promise<ResolvedLeaveYear> {
  const leaveYear = await prisma.leaveYear.findFirst({
    where: {
      companyId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { startDate: "desc" },
  });

  if (leaveYear) {
    return {
      leaveYearId: leaveYear.id,
      year: leaveYear.year,
      startDate: leaveYear.startDate,
      endDate: leaveYear.endDate,
      name: leaveYear.name,
    };
  }

  const year = date.getFullYear();
  return {
    leaveYearId: null,
    year,
    startDate: new Date(year, 0, 1),
    endDate: new Date(year, 11, 31),
    name: `Calendar ${year}`,
  };
}

/**
 * Lists all leave years configured for a company (most recent first).
 */
export async function listLeaveYears(companyId: string): Promise<LeaveYear[]> {
  return prisma.leaveYear.findMany({
    where: { companyId },
    orderBy: { startDate: "desc" },
  });
}

export interface CreateLeaveYearInput {
  companyId: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}

/**
 * Creates a new leave year after validating the window is well-formed and
 * does not collide with the (companyId, year) unique key.
 */
export async function createLeaveYear(
  input: CreateLeaveYearInput,
): Promise<LeaveYear> {
  if (input.startDate > input.endDate) {
    throw new Error("วันที่เริ่มต้นของปีลาต้องมาก่อนวันที่สิ้นสุด");
  }

  return prisma.leaveYear.create({
    data: {
      companyId: input.companyId,
      name: input.name,
      year: input.year,
      startDate: input.startDate,
      endDate: input.endDate,
      isActive: input.isActive ?? true,
    },
  });
}

export interface UpdateLeaveYearInput {
  id: string;
  companyId: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

/**
 * Updates an existing leave year (scoped to the company to prevent IDOR).
 */
export async function updateLeaveYear(
  input: UpdateLeaveYearInput,
): Promise<LeaveYear | null> {
  return prisma.leaveYear.updateMany({
    where: { id: input.id, companyId: input.companyId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  }).then((result) =>
    result.count > 0
      ? prisma.leaveYear.findUnique({ where: { id: input.id } })
      : null,
  );
}

/**
 * Deletes a leave year (scoped to the company).
 */
export async function deleteLeaveYear(
  companyId: string,
  leaveYearId: string,
): Promise<boolean> {
  const result = await prisma.leaveYear.deleteMany({
    where: { id: leaveYearId, companyId },
  });
  return result.count > 0;
}

/**
 * Activates a leave year and deactivates all others for the company.
 * Returns the updated (now active) leave year.
 */
export async function activateLeaveYear(
  companyId: string,
  leaveYearId: string,
): Promise<LeaveYear | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.leaveYear.findFirst({
      where: { id: leaveYearId, companyId },
    });
    if (!existing) return null;

    await tx.leaveYear.updateMany({
      where: { companyId, isActive: true },
      data: { isActive: false },
    });

    return tx.leaveYear.update({
      where: { id: leaveYearId },
      data: { isActive: true },
    });
  });
}