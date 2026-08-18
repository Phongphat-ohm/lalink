import { LeavePeriod } from "@prisma/client";

export interface HolidayItem {
  date: Date | string;
  name: string;
}

/**
 * A single working-day entry for a work schedule.
 * `dayOfWeek` uses JS Date.getDay() convention (0=Sun ... 6=Sat).
 */
export interface WorkScheduleEntryInput {
  dayOfWeek: number;
  startTime?: string | null;
  endTime?: string | null;
  isWorkingDay: boolean;
}

export interface LeaveCalculationOptions {
  startDate: Date | string;
  endDate: Date | string;
  startPeriod?: LeavePeriod;
  endPeriod?: LeavePeriod;
  holidays?: HolidayItem[];
  excludeWeekends?: boolean;
  /** Optional per-day work schedule. When provided, weekend exclusion
   *  is driven by the schedule instead of the hardcoded Sat/Sun. */
  workSchedule?: WorkScheduleEntryInput[];
  /** Required when any period is HOURLY — number of requested hours. */
  hours?: number;
  /** Fallback working hours per day when the schedule has no time slots. */
  defaultWorkingHoursPerDay?: number;
}

/**
 * Calculates net leave days taking into account weekends, company
 * holidays, half-day periods, hourly leave and optional work schedules.
 */
export function calculateLeaveDays(options: LeaveCalculationOptions): {
  totalDays: number;
  breakdown: {
    date: string;
    isHoliday: boolean;
    isWeekend: boolean;
    dayValue: number;
  }[];
} {
  const start = new Date(options.startDate);
  const end = new Date(options.endDate);
  const startPeriod = options.startPeriod || LeavePeriod.FULL_DAY;
  const endPeriod = options.endPeriod || LeavePeriod.FULL_DAY;
  const excludeWeekends = options.excludeWeekends !== false; // Default: exclude Saturday and Sunday
  const schedule = options.workSchedule;
  const defaultWorkingHours = options.defaultWorkingHoursPerDay ?? 8;

  // Format holidays for fast lookup: YYYY-MM-DD
  const holidaySet = new Set(
    (options.holidays || []).map((h) => {
      const d = typeof h.date === "string" ? new Date(h.date) : h.date;
      return d.toISOString().slice(0, 10);
    }),
  );

  if (start > end) {
    return { totalDays: 0, breakdown: [] };
  }

  /**
   * Determine whether a given day is a weekend / non-working day.
   * Uses the work schedule when provided, otherwise hardcoded Sat/Sun.
   */
  const isNonWorkingDay = (dayOfWeek: number): boolean => {
    if (schedule && schedule.length > 0) {
      const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek);
      // Default to a working day if the schedule omits this day-of-week.
      if (!entry) return false;
      return !entry.isWorkingDay;
    }
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  /**
   * Resolves the configured working hours for a day-of-week.
   * Returns null when the schedule provides no time slots for that day.
   */
  const workingHoursForDay = (dayOfWeek: number): number | null => {
    if (!schedule || schedule.length === 0) return null;
    const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!entry || !entry.isWorkingDay) return null;
    if (!entry.startTime || !entry.endTime) return null;

    const [startHour, startMinute] = entry.startTime.split(":").map(Number);
    const [endHour, endMinute] = entry.endTime.split(":").map(Number);
    const diffHours =
      (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
    return diffHours > 0 ? diffHours : null;
  };

  /**
   * Converts a period into day-units for a specific day.
   * HOURLY leave divides the requested hours by the day's working hours
   * (from schedule) or falls back to the default working hours.
   */
  const periodToValue = (
    period: LeavePeriod,
    dayOfWeek: number,
  ): number => {
    switch (period) {
      case LeavePeriod.HALF_DAY_AM:
      case LeavePeriod.HALF_DAY_PM:
        return 0.5;
      case LeavePeriod.HOURLY: {
        const hours = options.hours ?? 0;
        const workingHours =
          workingHoursForDay(dayOfWeek) ?? defaultWorkingHours;
        return hours > 0 ? hours / workingHours : 0;
      }
      default:
        return 1.0;
    }
  };

  const breakdown: {
    date: string;
    isHoliday: boolean;
    isWeekend: boolean;
    dayValue: number;
  }[] = [];
  let totalDays = 0;

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const dayOfWeek = current.getDay();
    const isWeekend = excludeWeekends && isNonWorkingDay(dayOfWeek);
    const isHoliday = holidaySet.has(dateStr);

    let dayValue = 0;

    if (isWeekend || isHoliday) {
      dayValue = 0;
    } else {
      const isSingleDay =
        start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);

      if (isSingleDay) {
        dayValue = periodToValue(startPeriod, dayOfWeek);
      } else {
        const isFirstDay = dateStr === start.toISOString().slice(0, 10);
        const isLastDay = dateStr === end.toISOString().slice(0, 10);

        if (isFirstDay) {
          dayValue = periodToValue(startPeriod, dayOfWeek);
        } else if (isLastDay) {
          dayValue = periodToValue(endPeriod, dayOfWeek);
        } else {
          dayValue = 1.0;
        }
      }
    }

    totalDays += dayValue;
    breakdown.push({
      date: dateStr,
      isHoliday,
      isWeekend,
      dayValue,
    });

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return {
    totalDays: Number(totalDays.toFixed(2)),
    breakdown,
  };
}