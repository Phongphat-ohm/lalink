import { prisma } from "@/lib/database";
import { LeavePeriod } from "@prisma/client";
import { calculateLeaveDays, type WorkScheduleEntryInput } from "./calculator";
import { resolveEffectiveWorkSchedule } from "./work-schedule";

export interface LeaveCalculationInput {
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  startPeriod?: LeavePeriod;
  endPeriod?: LeavePeriod;
  /** Required when any period is HOURLY. */
  hours?: number;
}

export interface LeaveCalculationResult {
  totalDays: number;
  breakdown: {
    date: string;
    isHoliday: boolean;
    isWeekend: boolean;
    dayValue: number;
  }[];
  leaveTypeId: string;
  leaveTypeName: string;
  allowHourly: boolean;
  allowHalfDay: boolean;
  workScheduleApplied: boolean;
  workingHoursByDay: Record<number, number>;
  holidaysUsed: number;
}

/**
 * DB-backed leave day calculation. Fetches the employee's effective
 * work schedule, the company holidays for the requested year range and
 * validates the leave type policy (hourly / half-day) before running the
 * pure calculation engine.
 */
export async function calculateLeaveRequestDays(
  input: LeaveCalculationInput,
): Promise<LeaveCalculationResult> {
  const {
    companyId,
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    startPeriod = LeavePeriod.FULL_DAY,
    endPeriod = LeavePeriod.FULL_DAY,
    hours,
  } = input;

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: leaveTypeId, companyId, isActive: true },
  });

  if (!leaveType) {
    throw new Error("LeaveType not found or inactive");
  }

  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const [holidays, schedule] = await Promise.all([
    prisma.holiday.findMany({
      where: {
        companyId,
        year: { in: Array.from(
          { length: endYear - startYear + 1 },
          (_, i) => startYear + i,
        ) },
      },
    }),
    resolveEffectiveWorkSchedule(companyId, employeeId),
  ]);

  const scheduleEntries: WorkScheduleEntryInput[] = schedule.entries;
  const usesHourly =
    startPeriod === LeavePeriod.HOURLY || endPeriod === LeavePeriod.HOURLY;

  if (usesHourly && !leaveType.allowHourly) {
    throw new Error(`Leave type "${leaveType.name}" does not allow hourly leave`);
  }

  const usesHalfDay =
    startPeriod === LeavePeriod.HALF_DAY_AM ||
    startPeriod === LeavePeriod.HALF_DAY_PM ||
    endPeriod === LeavePeriod.HALF_DAY_AM ||
    endPeriod === LeavePeriod.HALF_DAY_PM;

  if (usesHalfDay && !leaveType.allowHalfDay) {
    throw new Error(`Leave type "${leaveType.name}" does not allow half-day leave`);
  }

  const calculation = calculateLeaveDays({
    startDate,
    endDate,
    startPeriod,
    endPeriod,
    holidays: holidays.map((h) => ({ date: h.date, name: h.name })),
    workSchedule: scheduleEntries.length > 0 ? scheduleEntries : undefined,
    hours,
  });

  return {
    totalDays: calculation.totalDays,
    breakdown: calculation.breakdown,
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    allowHourly: leaveType.allowHourly,
    allowHalfDay: leaveType.allowHalfDay,
    workScheduleApplied: scheduleEntries.length > 0,
    workingHoursByDay: schedule.workingHoursByDay,
    holidaysUsed: holidays.length,
  };
}