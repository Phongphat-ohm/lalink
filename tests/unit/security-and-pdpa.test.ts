import { describe, it, expect, vi, beforeEach } from "vitest";
import { anonymizeEmployeePII } from "@/lib/pdpa";
import { prisma } from "@/lib/database";
import { AuditLogger } from "@/lib/audit";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimitStore,
} from "@/lib/security/rate-limiter";

// Mock Prisma & AuditLogger
vi.mock("@/lib/database", () => {
  const mockFindFirst = vi.fn();
  const mockUpdate = vi.fn();
  const mockDeleteMany = vi.fn();
  const mockTransaction = vi.fn(async (callback) =>
    callback({
      employee: { update: mockUpdate },
      notification: { deleteMany: mockDeleteMany },
    }),
  );

  return {
    prisma: {
      employee: {
        findFirst: mockFindFirst,
        update: mockUpdate,
      },
      notification: {
        deleteMany: mockDeleteMany,
      },
      $transaction: mockTransaction,
    },
  };
});

vi.mock("@/lib/audit", () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Phase 11: Security Hardening, PDPA & Privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRateLimitStore();
  });

  describe("1. PDPA Data Minimization & Right to Erasure", () => {
    const mockEmployee = {
      id: "emp-pdpa-1",
      companyId: "comp-1",
      employeeCode: "EMP-999",
      firstName: "นายกิตติศักดิ์",
      lastName: "มหาศาล",
      email: "kittisak@secret.com",
      phone: "0812345678",
      dateOfBirth: new Date("1990-05-12"),
      lineUserId: "U_PRIVATE_LINE_USER_ID",
      status: "ACTIVE",
    };

    it("should successfully anonymize PII and set status to RESIGNED", async () => {
      vi.mocked(prisma.employee.findFirst).mockResolvedValue(
        mockEmployee as any,
      );

      const result = await anonymizeEmployeePII(
        "emp-pdpa-1",
        "comp-1",
        "hr-admin-id",
      );

      expect(result.success).toBe(true);

      // Verify Prisma transaction operations
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify Audit Trail was recorded
      expect(AuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: "comp-1",
          actorId: "hr-admin-id",
          action: "PDPA_ANONYMIZE_EMPLOYEE",
          resource: "Employee",
          resourceId: "emp-pdpa-1",
        }),
      );
    });

    it("should return error if employee does not belong to company or does not exist", async () => {
      vi.mocked(prisma.employee.findFirst).mockResolvedValue(null);

      const result = await anonymizeEmployeePII(
        "non-existent-emp",
        "comp-1",
        "hr-admin-id",
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("ไม่พบข้อมูลพนักงาน");
      expect(AuditLogger.log).not.toHaveBeenCalled();
    });
  });

  describe("2. Rate Limiting & Abuse Protection", () => {
    it("should allow initial request when not rate limited", () => {
      const key = `test-ip-${Date.now()}`;
      const status = checkRateLimit(key, { maxAttempts: 3 });

      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBe(3);
    });

    it("should decrement remaining attempts on failed attempt and lock out when limit exceeded", () => {
      const key = `lockout-test-${Date.now()}`;
      const opts = { maxAttempts: 2, lockoutDurationMs: 60000 };

      const attempt1 = recordFailedAttempt(key, opts);
      expect(attempt1.isLocked).toBe(false);
      expect(attempt1.remainingAttempts).toBe(1);

      const attempt2 = recordFailedAttempt(key, opts);
      expect(attempt2.isLocked).toBe(true);
      expect(attempt2.remainingAttempts).toBe(0);

      const status = checkRateLimit(key, opts);
      expect(status.allowed).toBe(false);
      expect(status.lockoutRemainingSeconds).toBeGreaterThan(0);
    });
  });
});
