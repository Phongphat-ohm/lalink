import { describe, it, expect } from "vitest";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { createLeaveRequestSchema } from "@/features/leave/schemas";
import { LeavePeriod } from "@prisma/client";

describe("Phase 6: Employee LIFF System & Leave Workflow", () => {
  describe("1. Leave Calculation Engine", () => {
    it("should calculate standard full-day leave across weekdays correctly", () => {
      // Monday 2026-08-17 to Wednesday 2026-08-19 (3 days)
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-19",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
      });

      expect(result.totalDays).toBe(3.0);
      expect(result.breakdown.length).toBe(3);
    });

    it("should automatically exclude Saturday and Sunday from leave days", () => {
      // Friday 2026-08-21 to Monday 2026-08-24 (4 calendar days, 2 business days)
      const result = calculateLeaveDays({
        startDate: "2026-08-21",
        endDate: "2026-08-24",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        excludeWeekends: true,
      });

      expect(result.totalDays).toBe(2.0);
      expect(result.breakdown.find((b) => b.isWeekend)?.dayValue).toBe(0);
    });

    it("should deduct company holidays from total leave days", () => {
      // Monday 2026-08-17 to Tuesday 2026-08-18, with Monday being a holiday
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-18",
        holidays: [{ date: "2026-08-17", name: "Special Company Holiday" }],
      });

      expect(result.totalDays).toBe(1.0);
    });

    it("should handle half-day morning/afternoon leave calculations", () => {
      // Single day half-day leave
      const result = calculateLeaveDays({
        startDate: "2026-08-17",
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HALF_DAY_AM,
        endPeriod: LeavePeriod.HALF_DAY_AM,
      });

      expect(result.totalDays).toBe(0.5);
    });
  });

  describe("2. Schema Validation", () => {
    it("should accept valid leave request inputs", () => {
      const valid = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-20",
        endDate: "2026-08-21",
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        reason: "ไปทำธุระส่วนตัว",
      });

      expect(valid.success).toBe(true);
    });

    it("should reject when start date is after end date", () => {
      const invalid = createLeaveRequestSchema.safeParse({
        leaveTypeId: "lt_123",
        startDate: "2026-08-25",
        endDate: "2026-08-20", // End date before start date
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        reason: "Test",
      });

      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.flatten().fieldErrors.endDate).toBeDefined();
      }
    });
  });

  describe("3. Overlapping & Balance Logic Simulation", () => {
    it("should detect overlapping dates properly", () => {
      const existingStart = new Date("2026-08-20");
      const existingEnd = new Date("2026-08-22");

      const newStart = new Date("2026-08-21");
      const newEnd = new Date("2026-08-23");

      const isOverlapping = existingStart <= newEnd && existingEnd >= newStart;
      expect(isOverlapping).toBe(true);
    });

    it("should maintain ledger consistency during leave creation and cancellation", () => {
      let allocatedDays = 6.0;
      let usedDays = 0.0;
      let pendingDays = 0.0;
      let remainingDays = 6.0;

      // 1. Submit 2 days leave
      const requestDays = 2.0;
      pendingDays += requestDays;
      remainingDays -= requestDays;

      expect(pendingDays).toBe(2.0);
      expect(remainingDays).toBe(4.0);

      // 2. Cancel leave request -> restore balance
      pendingDays -= requestDays;
      remainingDays += requestDays;

      expect(pendingDays).toBe(0.0);
      expect(remainingDays).toBe(6.0);
    });
  });
});
