import { prisma } from "@/lib/database";
import { WorkSchedule, WorkScheduleEntry, WorkScheduleScope } from "@prisma/client";
import type { WorkScheduleEntryInput } from "./calculator";

export interface ResolvedWorkSchedule {
  schedule: WorkSchedule | null;
  entries: WorkScheduleEntryInput[];
  /** The working hours per day-of-week derived from schedule time slots. */
  workingHoursByDay: Record<number, number>;
}

/**
 * Resolves the effective work schedule for an employee using the
 * most-specific-first precedence:
 *   EMPLOYEE > DEPARTMENT > BRANCH > COMPANY
 *
 * Returns the first active schedule found at any scope. When no active
 * schedule exists, returns a null schedule (caller falls back to the
 * default Sat/Sun weekend behaviour).
 */
export async function resolveEffectiveWorkSchedule(
  companyId: string,
  employeeId: string,
): Promise<ResolvedWorkSchedule> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    select: { branchId: true, departmentId: true },
  });

  if (!employee) {
    return { schedule: null, entries: [], workingHoursByDay: {} };
  }

  const candidates: Record<WorkScheduleScope, string | null> = {
    [WorkScheduleScope.EMPLOYEE]: employeeId,
    [WorkScheduleScope.DEPARTMENT]: employee.departmentId,
    [WorkScheduleScope.BRANCH]: employee.branchId,
    [WorkScheduleScope.COMPANY]: companyId,
  };

  const scopes: WorkScheduleScope[] = [
    WorkScheduleScope.EMPLOYEE,
    WorkScheduleScope.DEPARTMENT,
    WorkScheduleScope.BRANCH,
    WorkScheduleScope.COMPANY,
  ];

  const schedules = await prisma.workSchedule.findMany({
    where: {
      companyId,
      isActive: true,
      scope: { in: scopes },
    },
    include: { entries: { orderBy: { dayOfWeek: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  for (const scope of scopes) {
    const target = candidates[scope];
    if (!target) continue;

    const match = schedules.find(
      (s) => s.scope === scope && scopeTargetMatches(s, scope, target),
    );
    if (match) {
      return normalizeSchedule(match);
    }
  }

  return { schedule: null, entries: [], workingHoursByDay: {} };
}

function scopeTargetMatches(
  schedule: WorkSchedule,
  scope: WorkScheduleScope,
  target: string,
): boolean {
  switch (scope) {
    case WorkScheduleScope.EMPLOYEE:
      return schedule.employeeId === target;
    case WorkScheduleScope.DEPARTMENT:
      return schedule.departmentId === target;
    case WorkScheduleScope.BRANCH:
      return schedule.branchId === target;
    default:
      return true; // COMPANY scope always matches
  }
}

function normalizeSchedule(schedule: WorkSchedule & {
  entries: WorkScheduleEntry[];
}): ResolvedWorkSchedule {
  const entries: WorkScheduleEntryInput[] = schedule.entries.map((e) => ({
    dayOfWeek: e.dayOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
    isWorkingDay: e.isWorkingDay,
  }));

  const workingHoursByDay: Record<number, number> = {};
  for (const e of schedule.entries) {
    if (!e.isWorkingDay || !e.startTime || !e.endTime) {
      workingHoursByDay[e.dayOfWeek] = 0;
      continue;
    }
    const [sh, sm] = e.startTime.split(":").map(Number);
    const [eh, em] = e.endTime.split(":").map(Number);
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
    workingHoursByDay[e.dayOfWeek] = hours > 0 ? hours : 0;
  }

  return { schedule, entries, workingHoursByDay };
}

export type { WorkScheduleScope };