import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPlanAction,
  updatePlanAction,
  togglePlanStatusAction,
  deletePlanAction,
  assignCompanySubscriptionAction,
  updateSubscriptionStatusAction,
  extendTrialAction,
} from "@/features/subscription";
import { EntitlementService } from "@/lib/subscription/entitlement";
import {
  updateCompanySuperAdminAction,
  deleteCompanySuperAdminAction,
  getCompanyDetailAction,
} from "@/features/company";
import {
  createUserSuperAdminAction,
  updateUserSuperAdminAction,
  toggleUserStatusSuperAdminAction,
  deleteUserSuperAdminAction,
} from "@/features/user";
import { superAdminUnlinkLineAction } from "@/features/employee";
import {
  blockIpAddressAction,
  unblockIpAddressAction,
  getBlockedIpsAction,
} from "@/features/company/security-actions";
import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";

// Mock dependencies
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    plan: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("Super Admin & SaaS CRUD Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. SaaS Plans CRUD", () => {
    it("should reject plan creation if not SYSTEM_ADMIN", async () => {
      (getSession as any).mockResolvedValueOnce({ role: "COMPANY_ADMIN" });
      const formData = new FormData();
      formData.append("code", "PRO");
      formData.append("name", "Pro Plan");

      const result = await createPlanAction(null, formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Super Admin เท่านั้น");
    });

    it("should create plan successfully when valid data provided", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.plan.findUnique as any).mockResolvedValueOnce(null);
      (prisma.plan.create as any).mockResolvedValueOnce({
        id: "plan-pro",
        code: "PRO",
        name: "Pro Plan",
      });

      const formData = new FormData();
      formData.append("code", "PRO");
      formData.append("name", "Pro Plan");
      formData.append("maxEmployees", "50");
      formData.append("maxAdmins", "5");
      formData.append("priceMonthly", "990");
      formData.append("priceYearly", "9900");
      formData.append("isActive", "true");

      const result = await createPlanAction(null, formData);
      expect(result.success).toBe(true);
      expect(result.data?.planId).toBe("plan-pro");
    });

    it("should toggle plan active status", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.plan.update as any).mockResolvedValueOnce({
        id: "plan-1",
        name: "Basic",
        code: "BASIC",
        isActive: false,
      });

      const result = await togglePlanStatusAction("plan-1", false);
      expect(result.success).toBe(true);
      expect(result.message).toContain("ปิดใช้งาน");
    });

    it("should prevent plan deletion if active subscriptions exist", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.subscription.count as any).mockResolvedValueOnce(3);

      const result = await deletePlanAction("plan-1");
      expect(result.success).toBe(false);
      expect(result.message).toContain("กำลังใช้งานอยู่ 3 บริษัท");
    });
  });

  describe("2. SaaS Subscriptions & Entitlements", () => {
    it("should assign subscription plan to company", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.company.findUnique as any).mockResolvedValueOnce({
        id: "c-1",
        name: "Acme Corp",
        code: "ACM001",
      });
      (prisma.plan.findUnique as any).mockResolvedValueOnce({
        id: "plan-pro",
        name: "Pro Plan",
        code: "PRO",
      });
      (prisma.subscription.upsert as any).mockResolvedValueOnce({
        id: "sub-1",
        companyId: "c-1",
        planId: "plan-pro",
        status: "ACTIVE",
      });

      const result = await assignCompanySubscriptionAction("c-1", "plan-pro", "ACTIVE" as any, 12);
      expect(result.success).toBe(true);
      expect(result.message).toContain("Acme Corp");
    });

    it("should check entitlement quota limit correctly", async () => {
      (prisma.subscription.findUnique as any).mockResolvedValueOnce({
        id: "sub-1",
        status: "ACTIVE",
        endDate: new Date(Date.now() + 86400000),
        plan: {
          isActive: true,
          name: "Pro Plan",
          maxEmployees: 10,
        },
      });
      (prisma.employee.count as any).mockResolvedValueOnce(10);

      const check = await EntitlementService.checkEmployeeLimit("c-1");
      expect(check.allowed).toBe(false);
      expect(check.currentCount).toBe(10);
      expect(check.maxLimit).toBe(10);
      expect(check.reason).toContain("เต็มโควตา");
    });

    it("should allow employee creation when quota is not exceeded", async () => {
      (prisma.subscription.findUnique as any).mockResolvedValueOnce({
        id: "sub-1",
        status: "ACTIVE",
        endDate: new Date(Date.now() + 86400000),
        plan: {
          isActive: true,
          name: "Pro Plan",
          maxEmployees: 50,
        },
      });
      (prisma.employee.count as any).mockResolvedValueOnce(12);

      const check = await EntitlementService.checkEmployeeLimit("c-1");
      expect(check.allowed).toBe(true);
      expect(check.currentCount).toBe(12);
    });
  });

  describe("3. Tenant Company CRUD", () => {
    it("should update company details in Super Admin", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.company.update as any).mockResolvedValueOnce({
        id: "c-1",
        name: "Lalink Siam Co Ltd",
        code: "LLK001",
      });

      const formData = new FormData();
      formData.append("name", "Lalink Siam Co Ltd");
      formData.append("email", "hr@lalink.com");

      const result = await updateCompanySuperAdminAction("c-1", formData);
      expect(result.success).toBe(true);
      expect(result.message).toContain("Lalink Siam Co Ltd");
    });

    it("should fetch company details & stats", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "admin-1",
      });
      (prisma.company.findUnique as any).mockResolvedValueOnce({
        id: "c-1",
        name: "Lalink Siam",
        code: "LLK001",
        taxId: "1234567890123",
        email: "contact@lalink.com",
        phone: "02-123-4567",
        address: "Bangkok",
        status: "ACTIVE",
        createdAt: new Date(),
        departments: [{ id: "d-1", name: "IT", code: "IT" }],
        subscription: {
          plan: { name: "Pro Plan", code: "PRO" },
          status: "ACTIVE",
        },
        _count: { employees: 25, users: 3, leaveRequests: 80 },
      });

      const result = await getCompanyDetailAction("c-1");
      expect(result.success).toBe(true);
      expect(result.data?.employeesCount).toBe(25);
      expect(result.data?.subscription?.planName).toBe("Pro Plan");
    });
  });

  describe("4. Platform User CRUD", () => {
    it("should create admin user successfully", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "super-1",
      });
      (prisma.user.findUnique as any).mockResolvedValueOnce(null);
      (prisma.user.create as any).mockResolvedValueOnce({
        id: "u-new",
        name: "Somchai Admin",
        email: "somchai@admin.com",
      });

      const formData = new FormData();
      formData.append("name", "Somchai Admin");
      formData.append("email", "somchai@admin.com");
      formData.append("password", "Password1234!");
      formData.append("roleId", "role-admin");

      const result = await createUserSuperAdminAction(null, formData);
      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe("u-new");
    });

    it("should prevent self-suspension by Super Admin", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "super-1",
      });

      const result = await toggleUserStatusSuperAdminAction("super-1", "SUSPENDED" as any);
      expect(result.success).toBe(false);
      expect(result.message).toContain("ไม่สามารถระงับบัญชีของตนเองได้");
    });
  });

  describe("5. Cross-Tenant Employee & Security Operations", () => {
    it("should unlink LINE from employee", async () => {
      (getSession as any).mockResolvedValueOnce({
        role: "SYSTEM_ADMIN",
        userId: "super-1",
      });
      (prisma.employee.findUnique as any).mockResolvedValueOnce({
        id: "emp-1",
        employeeCode: "EMP001",
        firstName: "Anan",
        lastName: "Ploy",
        lineUserId: "U1234567890abcdef",
        companyId: "c-1",
        company: { id: "c-1", name: "Company A", code: "COM01" },
      });
      (prisma.employee.update as any).mockResolvedValueOnce({
        id: "emp-1",
        lineUserId: null,
      });

      const result = await superAdminUnlinkLineAction("emp-1");
      expect(result.success).toBe(true);
      expect(result.message).toContain("ปลดการเชื่อมต่อ LINE");
    });

    it("should block and unblock suspicious IP", async () => {
      (getSession as any).mockResolvedValue({
        role: "SYSTEM_ADMIN",
        userId: "super-1",
      });
      (prisma.systemSetting.findUnique as any).mockResolvedValueOnce(null);
      (prisma.systemSetting.upsert as any).mockResolvedValueOnce({
        key: "SECURITY_IP_BLOCKLIST",
        value: JSON.stringify([{ ipAddress: "192.168.1.50", reason: "Brute force" }]),
      });

      const blockResult = await blockIpAddressAction("192.168.1.50", "Brute force");
      expect(blockResult.success).toBe(true);

      (prisma.systemSetting.findUnique as any).mockResolvedValueOnce({
        key: "SECURITY_IP_BLOCKLIST",
        value: JSON.stringify([{ ipAddress: "192.168.1.50", reason: "Brute force" }]),
      });
      (prisma.systemSetting.update as any).mockResolvedValueOnce({
        key: "SECURITY_IP_BLOCKLIST",
        value: "[]",
      });

      const unblockResult = await unblockIpAddressAction("192.168.1.50");
      expect(unblockResult.success).toBe(true);
    });
  });
});
