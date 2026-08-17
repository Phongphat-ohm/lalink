import { LeavePeriod } from "@prisma/client";

export interface HolidayItem {
  date: Date | string;
  name: string;
}

export interface LeaveCalculationOptions {
  startDate: Date | string;
  endDate: Date | string;
  startPeriod?: LeavePeriod;
  endPeriod?: LeavePeriod;
  holidays?: HolidayItem[];
  excludeWeekends?: boolean;
}

/**
 * Calculates net leave days taking into account weekends, company holidays, and half-day periods.
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
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidaySet.has(dateStr);

    let dayValue = 0;

    if ((excludeWeekends && isWeekend) || isHoliday) {
      dayValue = 0;
    } else {
      const isSingleDay =
        start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);

      if (isSingleDay) {
        if (
          startPeriod === LeavePeriod.HALF_DAY_AM ||
          startPeriod === LeavePeriod.HALF_DAY_PM
        ) {
          dayValue = 0.5;
        } else {
          dayValue = 1.0;
        }
      } else {
        const isFirstDay = dateStr === start.toISOString().slice(0, 10);
        const isLastDay = dateStr === end.toISOString().slice(0, 10);

        if (
          isFirstDay &&
          (startPeriod === LeavePeriod.HALF_DAY_AM ||
            startPeriod === LeavePeriod.HALF_DAY_PM)
        ) {
          dayValue = 0.5;
        } else if (
          isLastDay &&
          (endPeriod === LeavePeriod.HALF_DAY_AM ||
            endPeriod === LeavePeriod.HALF_DAY_PM)
        ) {
          dayValue = 0.5;
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
