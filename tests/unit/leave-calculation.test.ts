import { describe, it, expect } from "vitest";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { LeavePeriod } from "@prisma/client";

describe("Phase 2: Leave Calculation Engine", () => {
  describe("1. Work Schedule Integration", () => {
    it("should treat days marked as non-working by the schedule as zero-value", () => {
      // Friday to Monday with a schedule that works Sun-Thu (Fri/Sat off)
      const schedule = [
        { dayOfWeek: 0, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
        { dayOfWeek: 1, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
        { dayOfWeek: 2, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
        { dayOfWeek: 3, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
        { dayOfWeek: 4, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
        { dayOfWeek: 5, startTime: "08:30", endTime: "17:30", isWorkingDay: false },
        { dayOfWeek: 6, startTime: "08:30", endTime: "17:30", isWorkingDay: false },
      ];

      const result = calculateLeaveDays({
        startDate: "2026-08-14", // Friday (off)
        endDate: "2026-08-17", // Monday (working)
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        workSchedule: schedule,
      });

      // Only Sunday and Monday count (Fri/Sat off)
      expect(result.totalDays).toBe(2.0);
    });

    it("should include Saturday as a working day when the schedule says so", () => {
      const schedule = [
        { dayOfWeek: 0, startTime: "08:00", endTime: "17:00", isWorkingDay: false },
        { dayOfWeek: 6, startTime: "08:00", endTime: "12:00", isWorkingDay: true },
      ];

      // Saturday only
      const result = calculateLeaveDays({
        startDate: "2026-08-15",
        endDate: "2026-08-15",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        workSchedule: schedule,
      });

      expect(result.totalDays).toBe(1.0);
    });

    it("should fall back to Sat/Sun exclusion when no schedule is provided", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-15", // Saturday
        endDate: "2026-08-16", // Sunday
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
      });

      expect(result.totalDays).toBe(0.0);
    });
  });

  describe("2. Hourly Leave Calculation", () => {
    it("should convert hourly leave to days using default 8-hour working day", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 4,
      });

      expect(result.totalDays).toBe(0.5);
    });

    it("should convert hourly leave using schedule working hours when provided", () => {
      // 09:00-18:00 = 9 working hours/day -> 3 hours = 0.3333 days
      const schedule = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
      ];

      const result = calculateLeaveDays({
        startDate: "2026-08-17", // Monday
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 3,
        workSchedule: schedule,
      });

      expect(result.totalDays).toBeCloseTo(0.33, 2);
    });

    it("should use the default working hours when the schedule omits the day", () => {
      const schedule = [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
      ];

      // Tuesday is missing from the schedule -> falls back to default 8h
      const result = calculateLeaveDays({
        startDate: "2026-08-18", // Tuesday
        endDate: "2026-08-18",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 2,
        workSchedule: schedule,
      });

      expect(result.totalDays).toBe(0.25);
    });

    it("should return zero for zero hours", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 0,
      });

      expect(result.totalDays).toBe(0.0);
    });
  });

  describe("3. Backward Compatibility", () => {
    it("should still compute standard full-day weekday leave", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-19",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
      });

      expect(result.totalDays).toBe(3.0);
    });

    it("should still exclude Saturday/Sunday by default", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-21",
        endDate: "2026-08-24",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
      });

      expect(result.totalDays).toBe(2.0);
    });

    it("should still deduct holidays", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-18",
        holidays: [{ date: "2026-08-17", name: "Special Company Holiday" }],
      });

      expect(result.totalDays).toBe(1.0);
    });

    it("should still handle half-day AM/PM", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HALF_DAY_AM,
        endPeriod: LeavePeriod.HALF_DAY_AM,
      });

      expect(result.totalDays).toBe(0.5);
    });
  });

  describe("4. Schema Validation for Hourly Leave", () => {
    it("should accept a valid hourly leave request", async () => {
      const { createLeaveRequestSchema } = await import(
        "@/features/leave/schemas"
      );

      const result = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 2,
        reason: "ไปธุระ",
      });

      expect(result.success).toBe(true);
    });

    it("should reject hourly leave spanning multiple days", async () => {
      const { createLeaveRequestSchema } = await import(
        "@/features/leave/schemas"
      );

      const result = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-17",
        endDate: "2026-08-18",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.FULL_DAY,
        hours: 2,
        reason: "ไปธุระ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.endDate).toBeDefined();
      }
    });

    it("should reject hourly leave without hours", async () => {
      const { createLeaveRequestSchema } = await import(
        "@/features/leave/schemas"
      );

      const result = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 0,
        reason: "ไปธุระ",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.hours).toBeDefined();
      }
    });

    it("should still accept non-hourly requests without hours", async () => {
      const { createLeaveRequestSchema } = await import(
        "@/features/leave/schemas"
      );

      const result = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-17",
        endDate: "2026-08-18",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        reason: "ลาพักร้อน",
      });

      expect(result.success).toBe(true);
    });
  });
});