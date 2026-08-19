import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveLeaveYear } from "@/lib/leave/leave-year";
import {
  resolveAllocatedDays,
  ensureLeaveBalance,
  getBalanceForDate,
} from "@/lib/leave/balance-service";
import { runCarryForwardForCompany } from "@/lib/leave/carry-forward";
import { prisma } from "@/lib/database";
import { LeaveTransactionType, EmployeeStatus } from "@prisma/client";

const mocks = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

const {
  mockFindFirst,
  mockFindUnique,
  mockFindMany,
  mockCreate,
  mockUpdate,
  mockUpdateMany,
  mockDeleteMany,
  mockTransaction,
} = mocks;

vi.mock("@/lib/database", () => ({
  prisma: {
    leaveYear: {
      findFirst: mocks.mockFindFirst,
      findMany: mocks.mockFindMany,
      create: mocks.mockCreate,
      updateMany: mocks.mockUpdateMany,
      deleteMany: mocks.mockDeleteMany,
    },
    employee: { findFirst: mocks.mockFindFirst },
    leavePolicy: { findFirst: mocks.mockFindFirst },
    leaveType: { findFirst: mocks.mockFindFirst },
    leaveBalance: {
      findUnique: mocks.mockFindUnique,
      findMany: mocks.mockFindMany,
      create: mocks.mockCreate,
      update: mocks.mockUpdate,
    },
    leaveTransaction: { create: mocks.mockCreate },
    company: { findMany: mocks.mockFindMany },
    $transaction: mocks.mockTransaction,
  },
}));

describe("Phase 3: Leave Year + Balance + Carry Forward", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        leaveYear: { findFirst: mockFindFirst },
        employee: { findFirst: mockFindFirst },
        leavePolicy: { findFirst: mockFindFirst },
        leaveType: { findFirst: mockFindFirst },
        leaveBalance: {
          findUnique: mockFindUnique,
          findMany: mockFindMany,
          create: mockCreate,
          update: mockUpdate,
        },
        leaveTransaction: { create: mockCreate },
      }),
    );
  });

  describe("1. resolveLeaveYear", () => {
    it("should use the active custom leave year whose window contains the date", async () => {
      mockFindFirst.mockResolvedValue({
        id: "ly-1",
        companyId: "c1",
        name: "FY 2026",
        year: 2026,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2027-03-31"),
        isActive: true,
      });

      const result = await resolveLeaveYear("c1", new Date("2026-08-15"));

      expect(result.leaveYearId).toBe("ly-1");
      expect(result.year).toBe(2026);
      expect(result.startDate.toISOString().slice(0, 10)).toBe("2026-04-01");
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ companyId: "c1", isActive: true }),
        }),
      );
    });

    it("should fall back to the calendar year when no custom year matches", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await resolveLeaveYear("c1", new Date("2026-08-15"));

      expect(result.leaveYearId).toBeNull();
      expect(result.year).toBe(2026);
      expect(result.startDate.getFullYear()).toBe(2026);
      expect(result.startDate.getMonth()).toBe(0);
      expect(result.startDate.getDate()).toBe(1);
      expect(result.endDate.getMonth()).toBe(11);
      expect(result.endDate.getDate()).toBe(31);
    });

    it("should pick the latest matching year when windows overlap", async () => {
      mockFindFirst.mockResolvedValue({
        id: "ly-2",
        companyId: "c1",
        name: "FY 2027",
        year: 2027,
        startDate: new Date("2026-10-01"),
        endDate: new Date("2027-09-30"),
        isActive: true,
      });

      const result = await resolveLeaveYear("c1", new Date("2026-11-01"));
      expect(result.year).toBe(2027);
    });
  });

  describe("2. Balance Allocation (Tenure Policy)", () => {
    const baseInput = {
      companyId: "c1",
      employeeId: "e1",
      leaveTypeId: "lt1",
      asOf: new Date("2026-08-01"),
    };

    it("should pick the tenure bracket containing the employee's tenure", async () => {
      mockFindFirst
        .mockResolvedValueOnce({ joinedAt: new Date("2024-01-01") }) // employee
        .mockResolvedValueOnce({ allocatedDays: "12.00" }); // policy

      const days = await resolveAllocatedDays(prisma, {
        ...baseInput,
        asOf: new Date("2026-08-01"),
      });

      expect(days).toBe(12);
      expect(mockFindFirst).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            companyId: "c1",
            leaveTypeId: "lt1",
            minTenureMonths: { lte: 31 },
          }),
        }),
      );
    });

    it("should fall back to the leave type defaultDays when no policy matches", async () => {
      mockFindFirst
        .mockResolvedValueOnce({ joinedAt: new Date("2024-01-01") })
        .mockResolvedValueOnce(null) // no policy
        .mockResolvedValueOnce({ defaultDays: "10.00" }); // leaveType

      const days = await resolveAllocatedDays(prisma, baseInput);
      expect(days).toBe(10);
    });

    it("should treat missing joinedAt as zero tenure", async () => {
      mockFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ allocatedDays: "5.00" });

      const days = await resolveAllocatedDays(prisma, baseInput);
      expect(days).toBe(5);
    });
  });

  describe("3. ensureLeaveBalance", () => {
    it("should return the existing balance when present", async () => {
      mockFindUnique.mockResolvedValue({
        id: "b1",
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: "10.00",
        usedDays: "0.00",
        pendingDays: "0.00",
        remainingDays: "10.00",
        carriedForwardDays: "0.00",
      });

      const balance = await ensureLeaveBalance(prisma, {
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
      });

      expect(balance.remainingDays).toBe(10);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should create a new balance with the resolved allocated days", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockFindFirst
        .mockResolvedValueOnce({ joinedAt: new Date("2024-01-01") })
        .mockResolvedValueOnce({ allocatedDays: "8.00" });
      mockCreate.mockResolvedValue({
        id: "b2",
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: "8.00",
        usedDays: "0.00",
        pendingDays: "0.00",
        remainingDays: "8.00",
        carriedForwardDays: "0.00",
      });

      const balance = await ensureLeaveBalance(prisma, {
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
      });

      expect(balance.allocatedDays).toBe(8);
      expect(balance.remainingDays).toBe(8);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ year: 2026 }),
        }),
      );
    });

    it("should honor an explicit allocatedDays override", async () => {
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        id: "b3",
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: "15.00",
        usedDays: "0.00",
        pendingDays: "0.00",
        remainingDays: "15.00",
        carriedForwardDays: "0.00",
      });

      const balance = await ensureLeaveBalance(prisma, {
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: 15,
      });

      expect(balance.allocatedDays).toBe(15);
      expect(mockFindFirst).not.toHaveBeenCalled();
    });
  });

  describe("4. Carry Forward Engine", () => {
    const sourceBalance = {
      id: "sb1",
      companyId: "c1",
      employeeId: "e1",
      leaveTypeId: "lt1",
      year: 2025,
      allocatedDays: "10.00",
      usedDays: "4.00",
      pendingDays: "0.00",
      remainingDays: "6.00",
      carriedForwardDays: "0.00",
      leaveType: {
        allowCarryForward: true,
        maxCarryForwardDays: "10.00",
      },
      employee: { joinedAt: new Date("2020-01-01"), status: EmployeeStatus.ACTIVE },
    };

    it("should carry forward the full remaining when within the cap", async () => {
      mockFindMany.mockResolvedValue([sourceBalance]);
      // source lookup for target balance
      mockFindUnique.mockResolvedValueOnce(null);
      // ensureLeaveBalance -> target create
      mockCreate
        .mockResolvedValueOnce({
          id: "tb1",
          companyId: "c1",
          employeeId: "e1",
          leaveTypeId: "lt1",
          year: 2026,
          allocatedDays: "10.00",
          usedDays: "0.00",
          pendingDays: "0.00",
          remainingDays: "10.00",
          carriedForwardDays: "0.00",
        })
        .mockResolvedValueOnce({ id: "tx1" })
        .mockResolvedValueOnce({ id: "tx2" });

      mockUpdate.mockResolvedValue({});

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(6);
      expect(summary.daysExpired).toBe(0);
      expect(summary.balancesCarried).toBe(1);
      expect(summary.employeesProcessed).toBe(1);

      // Target balance updated with carriedForwardDays
      const updateCall = mockUpdate.mock.calls.find(
        (c) => c[0]?.where?.id === "tb1",
      );
      expect(updateCall).toBeDefined();
    });

    it("should cap carry-forward and expire the excess", async () => {
      const capped = {
        ...sourceBalance,
        remainingDays: "15.00",
        leaveType: {
          allowCarryForward: true,
          maxCarryForwardDays: "10.00",
        },
      };
      mockFindMany.mockResolvedValue([capped]);
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate
        .mockResolvedValueOnce({
          id: "tb2",
          companyId: "c1",
          employeeId: "e1",
          leaveTypeId: "lt1",
          year: 2026,
          allocatedDays: "10.00",
          usedDays: "0.00",
          pendingDays: "0.00",
          remainingDays: "10.00",
          carriedForwardDays: "0.00",
        })
        .mockResolvedValueOnce({ id: "tx3" })
        .mockResolvedValueOnce({ id: "tx4" });
      mockUpdate.mockResolvedValue({});

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(10);
      expect(summary.daysExpired).toBe(5);

      const txCreates = mockCreate.mock.calls.map((c) => c[0]?.data);
      const expiration = txCreates.find(
        (d) => d?.type === LeaveTransactionType.EXPIRATION,
      );
      expect(expiration).toBeDefined();
      expect(Number(expiration.days)).toBe(5);
    });

    it("should treat a null cap as unlimited carry-forward", async () => {
      const uncapped = {
        ...sourceBalance,
        remainingDays: "15.00",
        leaveType: {
          allowCarryForward: true,
          maxCarryForwardDays: null,
        },
      };
      mockFindMany.mockResolvedValue([uncapped]);
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate
        .mockResolvedValueOnce({
          id: "tb-null",
          companyId: "c1",
          employeeId: "e1",
          leaveTypeId: "lt1",
          year: 2026,
          allocatedDays: "10.00",
          usedDays: "0.00",
          pendingDays: "0.00",
          remainingDays: "10.00",
          carriedForwardDays: "0.00",
        })
        .mockResolvedValueOnce({ id: "tx-n1" });
      mockUpdate.mockResolvedValue({});

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(15);
      expect(summary.daysExpired).toBe(0);
    });

    it("should treat a zero cap as unlimited carry-forward", async () => {
      const zeroCapped = {
        ...sourceBalance,
        remainingDays: "15.00",
        leaveType: {
          allowCarryForward: true,
          maxCarryForwardDays: "0.00",
        },
      };
      mockFindMany.mockResolvedValue([zeroCapped]);
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate
        .mockResolvedValueOnce({
          id: "tb-zero",
          companyId: "c1",
          employeeId: "e1",
          leaveTypeId: "lt1",
          year: 2026,
          allocatedDays: "10.00",
          usedDays: "0.00",
          pendingDays: "0.00",
          remainingDays: "10.00",
          carriedForwardDays: "0.00",
        })
        .mockResolvedValueOnce({ id: "tx-z1" });
      mockUpdate.mockResolvedValue({});

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(15);
      expect(summary.daysExpired).toBe(0);
    });

    it("should not carry forward when the leave type disallows it", async () => {
      const noCarry = {
        ...sourceBalance,
        leaveType: {
          allowCarryForward: false,
          maxCarryForwardDays: null,
        },
      };
      mockFindMany.mockResolvedValue([noCarry]);
      mockFindUnique.mockResolvedValueOnce(null);
      mockCreate.mockResolvedValueOnce({ id: "tx5" });
      mockUpdate.mockResolvedValue({});

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(0);
      expect(summary.daysExpired).toBe(6);
    });

    it("should skip balances that already have carried-forward days (idempotency)", async () => {
      const existingTarget = {
        id: "tb3",
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: "10.00",
        usedDays: "0.00",
        pendingDays: "0.00",
        remainingDays: "16.00",
        carriedForwardDays: "6.00",
      };
      mockFindMany.mockResolvedValue([sourceBalance]);
      mockFindUnique.mockResolvedValueOnce(existingTarget);

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.skippedExisting).toBe(1);
      expect(summary.daysCarriedForward).toBe(0);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("should skip zero and non-active employee balances", async () => {
      mockFindMany.mockResolvedValue([
        { ...sourceBalance, remainingDays: "0.00" },
        {
          ...sourceBalance,
          id: "sb2",
          employeeId: "e2",
          employee: {
            joinedAt: new Date("2020-01-01"),
            status: EmployeeStatus.TERMINATED,
          },
        },
      ]);

      const summary = await runCarryForwardForCompany({
        companyId: "c1",
        sourceYear: 2025,
        targetYear: 2026,
      });

      expect(summary.daysCarriedForward).toBe(0);
      expect(summary.employeesProcessed).toBe(0);
    });
  });

  describe("5. getBalanceForDate", () => {
    it("should resolve the leave year and read the matching balance", async () => {
      mockFindFirst.mockResolvedValue(null); // calendar fallback
      mockFindUnique.mockResolvedValue({
        id: "b4",
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        year: 2026,
        allocatedDays: "10.00",
        usedDays: "2.00",
        pendingDays: "1.00",
        carriedForwardDays: "0.00",
        remainingDays: "7.00",
      });

      const balance = await getBalanceForDate(prisma, {
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        date: new Date("2026-08-15"),
      });

      expect(balance?.year).toBe(2026);
      expect(balance?.remainingDays).toBe(7);
      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: "e1",
              leaveTypeId: "lt1",
              year: 2026,
            },
          },
        }),
      );
    });

    it("should return null when no balance exists for the resolved year", async () => {
      mockFindFirst.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue(null);

      const balance = await getBalanceForDate(prisma, {
        companyId: "c1",
        employeeId: "e1",
        leaveTypeId: "lt1",
        date: new Date("2026-08-15"),
      });

      expect(balance).toBeNull();
    });
  });
});
