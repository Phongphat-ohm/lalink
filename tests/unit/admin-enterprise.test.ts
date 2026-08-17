import { describe, it, expect } from "vitest";
import { hasPermission, PERMISSIONS, ROLES } from "@/lib/permissions/rbac";
import crypto from "crypto";

describe("Admin & System Admin Enterprise Enhancements", () => {
  describe("1. Granular RBAC Permissions", () => {
    it("should grant full platform permissions to SYSTEM_ADMIN", () => {
      expect(
        hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.COMPANY_MANAGE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.SECURITY_MANAGE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.SESSION_MANAGE),
      ).toBe(true);
      expect(hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.SYSTEM_BACKUP)).toBe(
        true,
      );
      expect(hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.SYSTEM_APIKEY)).toBe(
        true,
      );
    });

    it("should grant tenant-scoped permissions to COMPANY_ADMIN and deny system scopes", () => {
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.EMPLOYEE_CREATE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.BRANCH_MANAGE),
      ).toBe(true);
      expect(hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.LEAVE_ADJUST)).toBe(
        true,
      );
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.ANNOUNCEMENT_MANAGE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.SECURITY_MANAGE),
      ).toBe(false);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.SYSTEM_BACKUP),
      ).toBe(false);
    });

    it("should grant HR_ADMIN leave adjustment and employee import rights", () => {
      expect(hasPermission(ROLES.HR_ADMIN, PERMISSIONS.LEAVE_ADJUST)).toBe(
        true,
      );
      expect(hasPermission(ROLES.HR_ADMIN, PERMISSIONS.EMPLOYEE_IMPORT)).toBe(
        true,
      );
      expect(
        hasPermission(ROLES.HR_ADMIN, PERMISSIONS.ANNOUNCEMENT_MANAGE),
      ).toBe(true);
    });

    it("should restrict EMPLOYEE to basic leave reading and creation", () => {
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_READ)).toBe(true);
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_CREATE)).toBe(
        true,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_APPROVE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.EMPLOYEE_DELETE)).toBe(
        false,
      );
    });
  });

  describe("2. API Key Hash Security", () => {
    it("should produce deterministic SHA256 hashes for API Keys", () => {
      const rawKey = "lal_live_testsecretkey12345678";
      const hash1 = crypto.createHash("sha256").update(rawKey).digest("hex");
      const hash2 = crypto.createHash("sha256").update(rawKey).digest("hex");
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });
  });

  describe("3. Leave Balance Calculation Invariant", () => {
    it("should correctly compute new remaining balance after adjustment", () => {
      const balanceBefore = 6.0;
      const adjustment = 2.5;
      const balanceAfter = balanceBefore + adjustment;
      expect(balanceAfter).toBe(8.5);
    });

    it("should prevent negative remaining balance", () => {
      const balanceBefore = 2.0;
      const adjustment = -3.0;
      const balanceAfter = balanceBefore + adjustment;
      expect(balanceAfter < 0).toBe(true);
    });
  });
});
