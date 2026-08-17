import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  clearRateLimitStore,
} from "@/lib/security/rate-limiter";
import { signSessionToken, verifySessionToken } from "@/lib/auth/session";
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getRolePermissions,
} from "@/lib/permissions/rbac";

describe("Phase 3: Authentication, Security & Central RBAC Engine", () => {
  describe("1. Password Service", () => {
    it("should correctly hash a password and verify it", async () => {
      const rawPassword = "SecurePassword@123";
      const hash = await hashPassword(rawPassword);

      expect(hash).not.toBe(rawPassword);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(20);

      const isValid = await verifyPassword(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("WrongPassword", hash);
      expect(isInvalid).toBe(false);
    });

    it("should reject empty passwords", async () => {
      await expect(hashPassword("")).rejects.toThrow(
        "Password cannot be empty",
      );
    });
  });

  describe("2. Rate Limiter & Brute Force Protection", () => {
    beforeEach(() => {
      clearRateLimitStore();
    });

    it("should allow requests within threshold and track remaining attempts", () => {
      const key = "test-user@example.com";
      const status1 = checkRateLimit(key, { maxAttempts: 3 });
      expect(status1.allowed).toBe(true);
      expect(status1.remainingAttempts).toBe(3);

      const fail1 = recordFailedAttempt(key, { maxAttempts: 3 });
      expect(fail1.isLocked).toBe(false);
      expect(fail1.remainingAttempts).toBe(2);

      const fail2 = recordFailedAttempt(key, { maxAttempts: 3 });
      expect(fail2.isLocked).toBe(false);
      expect(fail2.remainingAttempts).toBe(1);

      const fail3 = recordFailedAttempt(key, { maxAttempts: 3 });
      expect(fail3.isLocked).toBe(true);
      expect(fail3.remainingAttempts).toBe(0);

      const statusBlocked = checkRateLimit(key, { maxAttempts: 3 });
      expect(statusBlocked.allowed).toBe(false);
    });

    it("should reset rate limit upon successful action", () => {
      const key = "test-reset@example.com";
      recordFailedAttempt(key, { maxAttempts: 3 });
      recordFailedAttempt(key, { maxAttempts: 3 });

      resetRateLimit(key);

      const status = checkRateLimit(key, { maxAttempts: 3 });
      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBe(3);
    });
  });

  describe("3. Server-side Session Management", () => {
    it("should sign a JWT session token and verify it correctly", async () => {
      const mockPayload = {
        userId: "usr_123456",
        email: "admin@demo.com",
        name: "Admin User",
        companyId: "comp_123456",
        role: "COMPANY_ADMIN",
        type: "USER" as const,
      };

      const token = await signSessionToken(mockPayload);
      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(mockPayload.userId);
      expect(verified?.email).toBe(mockPayload.email);
      expect(verified?.companyId).toBe(mockPayload.companyId);
      expect(verified?.role).toBe(mockPayload.role);
      expect(verified?.type).toBe(mockPayload.type);
    });

    it("should return null for tampered or invalid tokens", async () => {
      const result = await verifySessionToken("invalid.tampered.token");
      expect(result).toBeNull();
    });
  });

  describe("4. Central RBAC & Authorization Layer", () => {
    it("should grant full permissions to SYSTEM_ADMIN and COMPANY_ADMIN", () => {
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.LEAVE_APPROVE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.EMPLOYEE_CREATE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.POLICY_MANAGE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.SYSTEM_ADMIN, PERMISSIONS.COMPANY_MANAGE),
      ).toBe(true);
    });

    it("should enforce HR permissions matrix properly", () => {
      expect(hasPermission(ROLES.HR, PERMISSIONS.LEAVE_APPROVE)).toBe(true);
      expect(hasPermission(ROLES.HR, PERMISSIONS.EMPLOYEE_CREATE)).toBe(true);
      expect(hasPermission(ROLES.HR, PERMISSIONS.POLICY_MANAGE)).toBe(true);
      expect(hasPermission(ROLES.HR, PERMISSIONS.COMPANY_MANAGE)).toBe(false);
    });

    it("should enforce EMPLOYEE permissions strictly", () => {
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_CREATE)).toBe(
        true,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_READ)).toBe(true);
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_APPROVE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.EMPLOYEE_CREATE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.POLICY_MANAGE)).toBe(
        false,
      );
    });

    it("should return list of permissions for a role", () => {
      const hrPerms = getRolePermissions(ROLES.HR);
      expect(hrPerms).toContain(PERMISSIONS.LEAVE_APPROVE);
      expect(hrPerms).not.toContain(PERMISSIONS.COMPANY_MANAGE);
    });
  });
});
