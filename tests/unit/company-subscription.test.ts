import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestPlanUpgradeAction,
  cancelPlanUpgradeRequestAction,
  approvePlanUpgradeRequestAction,
  rejectPlanUpgradeRequestAction,
} from "@/features/subscription/subscription-actions";
import { hasPermission, PERMISSIONS, ROLES } from "@/lib/permissions/rbac";

vi.mock("@/lib/database", () => ({
  prisma: {
    company: {
      findUnique: vi.fn().mockResolvedValue({
        id: "comp-123",
        name: "Test Company",
        code: "TESTCO",
      }),
    },
    plan: {
      findUnique: vi.fn().mockResolvedValue({
        id: "plan-pro",
        name: "Professional Plan",
        code: "PRO",
      }),
    },
    subscription: {
      findUnique: vi.fn().mockResolvedValue({
        id: "sub-123",
        companyId: "comp-123",
        plan: { code: "STARTER", name: "Starter Plan" },
      }),
      upsert: vi.fn().mockResolvedValue({
        id: "sub-123",
        companyId: "comp-123",
        planId: "plan-pro",
        status: "ACTIVE",
      }),
    },
    planUpgradeRequest: {
      create: vi.fn().mockResolvedValue({
        id: "req-123",
        companyId: "comp-123",
        targetPlanId: "plan-pro",
        status: "PENDING",
      }),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === "req-123") {
          return Promise.resolve({
            id: "req-123",
            companyId: "comp-123",
            targetPlanId: "plan-pro",
            status: "PENDING",
            company: { id: "comp-123", name: "Test Company", code: "TESTCO" },
            targetPlan: { id: "plan-pro", name: "Professional Plan", code: "PRO" },
          });
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockResolvedValue({
        id: "req-123",
        status: "APPROVED",
      }),
    },
    $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
  },
}));

let mockSession = {
  userId: "user-123",
  companyId: "comp-123",
  role: "COMPANY_ADMIN",
  type: "USER",
};

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/audit", () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Company Subscription & Plan Upgrade Requests Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      userId: "user-123",
      companyId: "comp-123",
      role: "COMPANY_ADMIN",
      type: "USER",
    };
  });

  describe("Subscription RBAC Permissions", () => {
    it("COMPANY_ADMIN has SUBSCRIPTION_VIEW and SUBSCRIPTION_MANAGE permissions", () => {
      expect(hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(true);
      expect(hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.SUBSCRIPTION_MANAGE)).toBe(true);
    });

    it("HR_ADMIN has SUBSCRIPTION_VIEW permission", () => {
      expect(hasPermission(ROLES.HR_ADMIN, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(true);
    });

    it("EMPLOYEE does not have SUBSCRIPTION_VIEW permission", () => {
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.SUBSCRIPTION_VIEW)).toBe(false);
    });
  });

  describe("requestPlanUpgradeAction", () => {
    it("successfully creates plan upgrade request record for company", async () => {
      const result = await requestPlanUpgradeAction("plan-pro", 100, "YEARLY", "ต้องการเพิ่มโควตาพนักงาน");

      expect(result.success).toBe(true);
      expect(result.message).toContain("ส่งคำขอปรับระดับแพ็กเกจเป็น \"Professional Plan\" เรียบร้อยแล้ว");
    });
  });

  describe("cancelPlanUpgradeRequestAction", () => {
    it("successfully cancels own pending plan upgrade request", async () => {
      const result = await cancelPlanUpgradeRequestAction("req-123");

      expect(result.success).toBe(true);
      expect(result.message).toContain("ยกเลิกคำขอปรับระดับแพ็กเกจเรียบร้อยแล้ว");
    });
  });

  describe("Super Admin Plan Upgrade Review Actions", () => {
    beforeEach(() => {
      mockSession = {
        userId: "superadmin-1",
        companyId: "",
        role: "SYSTEM_ADMIN",
        type: "USER",
      };
    });

    it("successfully approves plan upgrade request and activates subscription", async () => {
      const result = await approvePlanUpgradeRequestAction("req-123", 12, "อนุมัติเรียบร้อย");

      expect(result.success).toBe(true);
      expect(result.message).toContain("อนุมัติคำขอและเปิดใช้งานแพ็กเกจ");
    });

    it("successfully rejects plan upgrade request with feedback notes", async () => {
      const result = await rejectPlanUpgradeRequestAction("req-123", "เอกสารการชำระเงินไม่ถูกต้อง");

      expect(result.success).toBe(true);
      expect(result.message).toContain("ปฏิเสธคำขอปรับระดับแพ็กเกจ");
    });

    it("fails to reject without admin notes", async () => {
      const result = await rejectPlanUpgradeRequestAction("req-123", "");

      expect(result.success).toBe(false);
      expect(result.message).toContain("กรุณาระบุเหตุผล");
    });
  });
});
