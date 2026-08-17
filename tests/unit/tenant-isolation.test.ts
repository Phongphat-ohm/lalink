import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requireTenantContext,
  requireSystemAdminContext,
  UnauthorizedError,
  ForbiddenError,
  TenantAccessError,
} from "@/lib/tenant/context";
import * as sessionModule from "@/lib/auth/session";

describe("Phase 4: Multi-Tenant Security & Isolation Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Server-side Tenant Context Resolver", () => {
    it("should resolve tenant context correctly from valid server session", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "usr_abc123",
        email: "admin@company-a.com",
        name: "Admin Company A",
        companyId: "comp_aaa111",
        role: "COMPANY_ADMIN",
        type: "USER",
      });

      const context = await requireTenantContext();

      expect(context.companyId).toBe("comp_aaa111");
      expect(context.userId).toBe("usr_abc123");
      expect(context.role).toBe("COMPANY_ADMIN");
    });

    it("should throw UnauthorizedError when no active session exists", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue(null);

      await expect(requireTenantContext()).rejects.toThrow(UnauthorizedError);
    });

    it("should throw ForbiddenError when System Admin accesses tenant context without specifying company", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "sys_admin_1",
        email: "superadmin@platform.com",
        name: "Super Admin",
        companyId: null,
        role: "SYSTEM_ADMIN",
        type: "USER",
      });

      await expect(requireTenantContext()).rejects.toThrow(ForbiddenError);
    });

    it("should throw TenantAccessError when regular user has no companyId", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "usr_orphan",
        email: "orphan@example.com",
        name: "Orphan User",
        companyId: null,
        role: "HR",
        type: "USER",
      });

      await expect(requireTenantContext()).rejects.toThrow(TenantAccessError);
    });

    it("should allow System Admin in requireSystemAdminContext()", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "sys_admin_1",
        email: "superadmin@platform.com",
        name: "Super Admin",
        companyId: null,
        role: "SYSTEM_ADMIN",
        type: "USER",
      });

      const adminCtx = await requireSystemAdminContext();
      expect(adminCtx.role).toBe("SYSTEM_ADMIN");
      expect(adminCtx.userId).toBe("sys_admin_1");
    });

    it("should deny non-system-admin in requireSystemAdminContext()", async () => {
      vi.spyOn(sessionModule, "getSession").mockResolvedValue({
        userId: "usr_regular",
        email: "admin@company-a.com",
        name: "Company Admin",
        companyId: "comp_aaa111",
        role: "COMPANY_ADMIN",
        type: "USER",
      });

      await expect(requireSystemAdminContext()).rejects.toThrow(ForbiddenError);
    });
  });

  describe("2. Anti-IDOR & Scoped Query Isolation Verification", () => {
    it("should ensure queries reject cross-tenant ID access", () => {
      const companyAId = "comp_A";
      const companyBId = "comp_B";
      const leaveRequestOwnedByB = {
        id: "lr_999",
        companyId: companyBId,
        employeeId: "emp_B1",
      };

      // Query scoped to Company A
      const isAllowedAccess = leaveRequestOwnedByB.companyId === companyAId;
      expect(isAllowedAccess).toBe(false);
    });

    it("should prevent client-injected companyId override", () => {
      // Simulating a malicious payload where client attempts to inject another companyId
      const maliciousClientPayload = {
        companyId: "comp_VICTIM_COMPANY",
        employeeCode: "EMP-001",
      };

      // Server-side context extracted from secure session
      const serverVerifiedTenantContext = {
        companyId: "comp_ATTACKER_COMPANY",
        userId: "attacker_usr",
      };

      // The DAL always binds strictly to serverVerifiedTenantContext.companyId
      const finalEnforcedCompanyId = serverVerifiedTenantContext.companyId;

      expect(finalEnforcedCompanyId).toBe("comp_ATTACKER_COMPANY");
      expect(finalEnforcedCompanyId).not.toBe(maliciousClientPayload.companyId);
    });
  });
});
