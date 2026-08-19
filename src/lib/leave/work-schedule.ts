import { prisma } from "@/lib/database";
import {
  Shift,
  ShiftEntry,
  WorkSchedule,
  WorkScheduleEntry,
  WorkScheduleScope,
} from "@prisma/client";
import type { WorkScheduleEntryInput } from "./calculator";

export interface ResolvedWorkSchedule {
  schedule: WorkSchedule | null;
  /** The shift that supplied the effective entries (when applicable). */
  shift: Shift | null;
  entries: WorkScheduleEntryInput[];
  /** The working hours per day-of-week derived from schedule time slots. */
  workingHoursByDay: Record<number, number>;
}

/**
 * Resolves the effective work schedule for an employee using the
 * most-specific-first precedence:
 *   EMPLOYEE shift > EMPLOYEE schedule > DEPARTMENT > BRANCH > COMPANY
 *
 * Returns the first active match found at any scope. When no active
 * schedule or shift exists, returns a null schedule (caller falls back to
 * the default Sat/Sun weekend behaviour).
 */
export async function resolveEffectiveWorkSchedule(
  companyId: string,
  employeeId: string,
): Promise<ResolvedWorkSchedule> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    select: { branchId: true, departmentId: true, shiftId: true },
  });

  if (!employee) {
    return { schedule: null, shift: null, entries: [], workingHoursByDay: {} };
  }

  // 1. Employee-level shift takes highest precedence.
  if (employee.shiftId) {
    const shift = await findActiveShiftById(companyId, employee.shiftId);
    if (shift) {
      return normalizeShift(shift);
    }
  }

  // 2. Work schedules scoped EMPLOYEE > DEPARTMENT > BRANCH > COMPANY.
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
    include: {
      entries: { orderBy: { dayOfWeek: "asc" } },
      shift: { include: { entries: { orderBy: { dayOfWeek: "asc" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const scope of scopes) {
    const target = candidates[scope];
    if (!target) continue;

    const match = schedules.find(
      (s) => s.scope === scope && scopeTargetMatches(s, scope, target),
    );
    if (match) {
      // A schedule bound to a shift uses the shift's time slots.
      if (match.shift && match.shift.isActive) {
        return normalizeShift(match.shift);
      }
      return normalizeSchedule(match);
    }
  }

  return { schedule: null, shift: null, entries: [], workingHoursByDay: {} };
}

async function findActiveShiftById(
  companyId: string,
  shiftId: string,
): Promise<(Shift & { entries: ShiftEntry[] }) | null> {
  return prisma.shift.findFirst({
    where: { id: shiftId, companyId, isActive: true },
    include: { entries: { orderBy: { dayOfWeek: "asc" } } },
  });
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

function toEntryInput(
  dayOfWeek: number,
  startTime: string | null,
  endTime: string | null,
  isWorkingDay: boolean,
): WorkScheduleEntryInput {
  return { dayOfWeek, startTime, endTime, isWorkingDay };
}

function computeWorkingHoursByDay(
  entries: WorkScheduleEntryInput[],
): Record<number, number> {
  const workingHoursByDay: Record<number, number> = {};
  for (const e of entries) {
    if (!e.isWorkingDay || !e.startTime || !e.endTime) {
      workingHoursByDay[e.dayOfWeek] = 0;
      continue;
    }
    const [sh, sm] = e.startTime.split(":").map(Number);
    const [eh, em] = e.endTime.split(":").map(Number);
    let minutes = eh * 60 + em - (sh * 60 + sm);
    // Overnight shift (end before start) wraps to the next day.
    if (minutes < 0) minutes += 24 * 60;
    workingHoursByDay[e.dayOfWeek] = minutes > 0 ? minutes / 60 : 0;
  }
  return workingHoursByDay;
}

function normalizeShift(shift: Shift & { entries: ShiftEntry[] }): ResolvedWorkSchedule {
  const entries: WorkScheduleEntryInput[] = shift.entries.map((e) =>
    toEntryInput(e.dayOfWeek, e.startTime, e.endTime, e.isWorkingDay),
  );
  return {
    schedule: null,
    shift,
    entries,
    workingHoursByDay: computeWorkingHoursByDay(entries),
  };
}

function normalizeSchedule(schedule: WorkSchedule & {
  entries: WorkScheduleEntry[];
}): ResolvedWorkSchedule {
  const entries: WorkScheduleEntryInput[] = schedule.entries.map((e) =>
    toEntryInput(e.dayOfWeek, e.startTime, e.endTime, e.isWorkingDay),
  );
  return {
    schedule,
    shift: null,
    entries,
    workingHoursByDay: computeWorkingHoursByDay(entries),
  };
}

export type { WorkScheduleScope };