import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLeaveRequestByHrAction,
  revokeApprovedLeaveAction,
  importOfficialHolidaysAction,
} from "@/features/leave";
import { batchAdjustLeaveBalanceAction } from "@/features/leave/adjustment-actions";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";

// Mock dependencies
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/tenant", () => ({
  requireTenantContext: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    $transaction: vi.fn(),
    leaveRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    leaveBalance: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leaveTransaction: {
      create: vi.fn(),
    },
    employee: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    leaveType: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    holiday: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditLog: {
      create: vi.fn(),
    },
    backupLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(Buffer.from("mock data")),
}));

describe("HR Proxy Leave & Advanced Operations Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation(async (cb: any) => {
      return cb({
        leaveBalance: {
          findUnique: vi.fn().mockResolvedValue({
            id: "bal-1",
            remainingDays: 25,
            usedDays: 5,
          }),
          create: vi.fn().mockResolvedValue({ id: "bal-1" }),
          update: vi.fn().mockResolvedValue({ id: "bal-1", remainingDays: 23 }),
        },
        leaveRequest: {
          create: vi.fn().mockResolvedValue({
            id: "req-hr-1",
            status: "APPROVED",
            totalDays: 2,
          }),
          update: vi.fn().mockResolvedValue({ id: "req-1", status: "CANCELLED" }),
        },
        leaveTransaction: {
          create: vi.fn().mockResolvedValue({ id: "tx-1" }),
        },
      });
    });
  });

  describe("1. HR Proxy Leave Submission", () => {
    it("should allow HR to submit leave on behalf of an employee and approve immediately", async () => {
      (requireTenantContext as any).mockResolvedValueOnce({
        companyId: "c-1",
        userId: "hr-user-1",
        role: "HR_ADMIN",
      });

      (prisma.employee.findFirst as any).mockResolvedValueOnce({
        id: "emp-1",
        firstName: "Somchai",
        lastName: "Dee",
        employeeCode: "EMP001",
        lineUserId: null,
      });

      (prisma.leaveType.findFirst as any).mockResolvedValueOnce({
        id: "lt-sick",
        name: "ลาป่วย",
        code: "SICK",
        defaultDays: 30,
      });

      (prisma.leaveRequest.findFirst as any).mockResolvedValueOnce(null); // No overlap

      const result = await createLeaveRequestByHrAction(
        "emp-1",
        "lt-sick",
        "2026-09-01",
        "2026-09-02",
        "แอดมิทโรงพยาบาลฉุกเฉิน",
      );

      expect(result.success).toBe(true);
      expect(result.data?.requestId).toBe("req-hr-1");
      expect(result.message).toContain("ยื่นและอนุมัติใบลาแทนคุณ Somchai Dee");
    });
  });

  describe("2. Revoke Approved Leave with Reversal Ledger", () => {
    it("should revoke approved leave and restore balance in ledger", async () => {
      (requireTenantContext as any).mockResolvedValueOnce({
        companyId: "c-1",
        userId: "hr-user-1",
        role: "HR_ADMIN",
      });

      (prisma.leaveRequest.findUnique as any).mockResolvedValueOnce({
        id: "req-1",
        companyId: "c-1",
        employeeId: "emp-1",
        leaveTypeId: "lt-annual",
        totalDays: 3,
        status: "APPROVED",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-10-03"),
        employee: {
          id: "emp-1",
          firstName: "Suda",
          lastName: "Rak",
          employeeCode: "EMP002",
          lineUserId: null,
        },
        leaveType: { name: "ลาพักร้อน" },
      });

      const result = await revokeApprovedLeaveAction("req-1", "พนักงานขอยกเลิกเนื่องจากเลื่อนทริป");
      expect(result.success).toBe(true);
      expect(result.message).toContain("เพิกถอนใบลาและคืนยอดวันลา 3 วัน");
    });
  });

  describe("3. Thai Public Holidays Auto-Import", () => {
    it("should import Thai public holidays for the company", async () => {
      (requireTenantContext as any).mockResolvedValueOnce({
        companyId: "c-1",
        userId: "hr-user-1",
        role: "HR_ADMIN",
      });

      (prisma.holiday.findFirst as any).mockResolvedValue(null);
      (prisma.holiday.create as any).mockResolvedValue({ id: "h-1" });

      const result = await importOfficialHolidaysAction(2026);
      expect(result.success).toBe(true);
      expect(result.data?.count).toBeGreaterThan(10);
      expect(result.message).toContain("สำเร็จจำนวน");
    });
  });

  describe("4. Batch Leave Balance Adjustment", () => {
    it("should batch adjust leave balances for active employees", async () => {
      const { getSession } = await import("@/lib/auth/session");
      (getSession as any).mockResolvedValueOnce({
        companyId: "c-1",
        userId: "hr-user-1",
      });

      (prisma.employee.findMany as any).mockResolvedValueOnce([
        { id: "e-1", firstName: "A", lastName: "B" },
        { id: "e-2", firstName: "C", lastName: "D" },
      ]);

      (prisma.leaveType.findUnique as any).mockResolvedValueOnce({
        id: "lt-special",
        defaultDays: 5,
      });

      const result = await batchAdjustLeaveBalanceAction(null, "lt-special", 1, "Special Annual Bonus", 2026);
      expect(result.success).toBe(true);
      expect(result.data?.adjustedCount).toBe(2);
    });
  });
});
