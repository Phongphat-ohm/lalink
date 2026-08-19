import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveEffectiveWorkSchedule } from "@/lib/leave/work-schedule";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { prisma } from "@/lib/database";
import { LeavePeriod, WorkScheduleScope } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  mockEmployeeFindFirst: vi.fn(),
  mockShiftFindFirst: vi.fn(),
  mockWorkScheduleFindMany: vi.fn(),
}));

const { mockEmployeeFindFirst, mockShiftFindFirst, mockWorkScheduleFindMany } =
  mocks;

vi.mock("@/lib/database", () => ({
  prisma: {
    employee: { findFirst: mocks.mockEmployeeFindFirst },
    shift: { findFirst: mocks.mockShiftFindFirst },
    workSchedule: { findMany: mocks.mockWorkScheduleFindMany },
  },
}));

const COMPANY_ID = "company_1";
const EMPLOYEE_ID = "emp_1";

const weekEntries = [
  { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
  { dayOfWeek: 1, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
  { dayOfWeek: 2, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
  { dayOfWeek: 3, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
  { dayOfWeek: 4, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
  { dayOfWeek: 5, startTime: "08:30", endTime: "17:30", isWorkingDay: true },
  { dayOfWeek: 6, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
];

const nightShiftEntries = [
  { dayOfWeek: 0, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
  { dayOfWeek: 1, startTime: "20:00", endTime: "04:00", isWorkingDay: true },
  { dayOfWeek: 2, startTime: "20:00", endTime: "04:00", isWorkingDay: true },
  { dayOfWeek: 3, startTime: "20:00", endTime: "04:00", isWorkingDay: true },
  { dayOfWeek: 4, startTime: "20:00", endTime: "04:00", isWorkingDay: true },
  { dayOfWeek: 5, startTime: "20:00", endTime: "04:00", isWorkingDay: true },
  { dayOfWeek: 6, startTime: "00:00", endTime: "00:00", isWorkingDay: false },
];

describe("Phase 4: Work Schedule + Shift", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("1. Shift resolution precedence", () => {
    it("should return the employee's assigned shift entries first (most specific)", async () => {
      mockEmployeeFindFirst.mockResolvedValue({
        branchId: null,
        departmentId: null,
        shiftId: "shift_night",
      });
      mockShiftFindFirst.mockResolvedValue({
        id: "shift_night",
        name: "กะดึก 20:00-04:00",
        isActive: true,
        entries: nightShiftEntries,
      });

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.shift).toMatchObject({ id: "shift_night" });
      expect(result.entries).toHaveLength(7);
      expect(result.entries.find((e) => e.dayOfWeek === 1)).toMatchObject({
        startTime: "20:00",
        endTime: "04:00",
      });
      expect(result.workingHoursByDay[1]).toBe(8);
      expect(result.schedule).toBeNull();
      expect(mockWorkScheduleFindMany).not.toHaveBeenCalled();
    });

    it("should fall through to the EMPLOYEE-scope schedule when the employee has no shift", async () => {
      mockEmployeeFindFirst.mockResolvedValue({
        branchId: "branch_1",
        departmentId: "dept_1",
        shiftId: null,
      });
      mockWorkScheduleFindMany.mockResolvedValue([
        {
          id: "ws_emp",
          scope: WorkScheduleScope.EMPLOYEE,
          employeeId: EMPLOYEE_ID,
          departmentId: null,
          branchId: null,
          isActive: true,
          shiftId: null,
          shift: null,
          createdAt: new Date("2026-01-01"),
          entries: weekEntries,
        },
      ]);

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.schedule).toMatchObject({ id: "ws_emp" });
      expect(result.shift).toBeNull();
      expect(result.workingHoursByDay[1]).toBe(9);
    });

    it("should use the shift bound to a schedule when the schedule has one", async () => {
      mockEmployeeFindFirst.mockResolvedValue({
        branchId: "branch_1",
        departmentId: "dept_1",
        shiftId: null,
      });
      mockWorkScheduleFindMany.mockResolvedValue([
        {
          id: "ws_dept",
          scope: WorkScheduleScope.DEPARTMENT,
          departmentId: "dept_1",
          employeeId: null,
          branchId: null,
          isActive: true,
          shiftId: "shift_night",
          shift: {
            id: "shift_night",
            name: "กะดึก 20:00-04:00",
            isActive: true,
            entries: nightShiftEntries,
          },
          createdAt: new Date("2026-01-01"),
          entries: [],
        },
      ]);

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.schedule).toBeNull();
      expect(result.shift).toMatchObject({ id: "shift_night" });
      expect(result.workingHoursByDay[1]).toBe(8);
    });

    it("should resolve BRANCH scope when no employee/department schedule exists", async () => {
      mockEmployeeFindFirst.mockResolvedValue({
        branchId: "branch_1",
        departmentId: "dept_1",
        shiftId: null,
      });
      mockWorkScheduleFindMany.mockResolvedValue([
        {
          id: "ws_company",
          scope: WorkScheduleScope.COMPANY,
          departmentId: null,
          employeeId: null,
          branchId: null,
          isActive: true,
          shiftId: null,
          shift: null,
          createdAt: new Date("2026-01-01"),
          entries: weekEntries,
        },
      ]);

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.schedule).toMatchObject({ id: "ws_company" });
      expect(result.entries).toHaveLength(7);
    });

    it("should ignore an inactive employee shift and fall back to schedules", async () => {
      mockEmployeeFindFirst.mockResolvedValue({
        branchId: null,
        departmentId: null,
        shiftId: "shift_off",
      });
      mockShiftFindFirst.mockResolvedValue(null); // inactive / not found
      mockWorkScheduleFindMany.mockResolvedValue([
        {
          id: "ws_company",
          scope: WorkScheduleScope.COMPANY,
          departmentId: null,
          employeeId: null,
          branchId: null,
          isActive: true,
          shiftId: null,
          shift: null,
          createdAt: new Date("2026-01-01"),
          entries: weekEntries,
        },
      ]);

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.shift).toBeNull();
      expect(result.schedule).toMatchObject({ id: "ws_company" });
    });

    it("should return an empty result when the employee does not exist", async () => {
      mockEmployeeFindFirst.mockResolvedValue(null);

      const result = await resolveEffectiveWorkSchedule(COMPANY_ID, EMPLOYEE_ID);

      expect(result.schedule).toBeNull();
      expect(result.shift).toBeNull();
      expect(result.entries).toEqual([]);
    });
  });

  describe("2. Shift-based leave calculation", () => {
    it("should convert hourly leave using shift working hours (8h night shift)", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17", // Monday
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 4,
        workSchedule: nightShiftEntries,
      });

      // 4 hours / 8 working hours = 0.5 days
      expect(result.totalDays).toBe(0.5);
    });

    it("should treat a shift's off days as non-working days", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-16", // Sunday (off in night shift)
        endDate: "2026-08-17", // Monday (working)
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        workSchedule: nightShiftEntries,
      });

      expect(result.totalDays).toBe(1.0);
    });

    it("should compute a 9-hour schedule correctly for hourly leave", () => {
      const result = calculateLeaveDays({
        startDate: "2026-08-17", // Monday
        endDate: "2026-08-17",
        startPeriod: LeavePeriod.HOURLY,
        endPeriod: LeavePeriod.HOURLY,
        hours: 3,
        workSchedule: weekEntries,
      });

      // 3 hours / 9 working hours = 0.33 days
      expect(result.totalDays).toBeCloseTo(0.33, 2);
    });
  });
});