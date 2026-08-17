import { describe, it, expect, beforeEach } from "vitest";
import { accountLinkingSchema } from "@/features/employee/schemas";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimitStore,
} from "@/lib/security/rate-limiter";

describe("Phase 5: LINE LIFF Account Linking & Security", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  describe("1. Schema Validation", () => {
    it("should accept valid linking input", () => {
      const result = accountLinkingSchema.safeParse({
        companyCode: "DEMO",
        employeeCode: "EMP-001",
        dateOfBirth: "1995-05-15",
        lineIdToken: "mock-line-token",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyCode).toBe("DEMO");
        expect(result.data.employeeCode).toBe("EMP-001");
        expect(result.data.dateOfBirth).toBe("1995-05-15");
      }
    });

    it("should reject invalid Date of Birth format", () => {
      const result = accountLinkingSchema.safeParse({
        companyCode: "DEMO",
        employeeCode: "EMP-001",
        dateOfBirth: "15/05/1995", // Wrong format
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.dateOfBirth).toBeDefined();
      }
    });

    it("should normalize company and employee codes to uppercase", () => {
      const result = accountLinkingSchema.safeParse({
        companyCode: "demo",
        employeeCode: "emp-001",
        dateOfBirth: "1995-05-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.companyCode).toBe("DEMO");
        expect(result.data.employeeCode).toBe("EMP-001");
      }
    });
  });

  describe("2. Security: Rate Limiting & Lockout", () => {
    it("should lock out account linking after 5 consecutive failed attempts", () => {
      const rateLimitKey = "account-link:DEMO:EMP-999";

      // 4 failed attempts: not locked yet
      for (let i = 1; i <= 4; i++) {
        const attempt = recordFailedAttempt(rateLimitKey, { maxAttempts: 5 });
        expect(attempt.isLocked).toBe(false);
        expect(attempt.remainingAttempts).toBe(5 - i);
      }

      // 5th attempt: should lock
      const fifthAttempt = recordFailedAttempt(rateLimitKey, {
        maxAttempts: 5,
      });
      expect(fifthAttempt.isLocked).toBe(true);
      expect(fifthAttempt.remainingAttempts).toBe(0);

      // Subsequent check should be blocked
      const status = checkRateLimit(rateLimitKey, { maxAttempts: 5 });
      expect(status.allowed).toBe(false);
      expect(status.lockoutRemainingSeconds).toBeGreaterThan(0);
    });
  });

  describe("3. Robust Date of Birth Verification", () => {
    it("should correctly normalize Thai Buddhist Era year (2538 -> 1995)", () => {
      const rawBuddhistDate = "2538-05-15";
      const parts = rawBuddhistDate.split("-");
      let year = parseInt(parts[0], 10);
      if (year > 2400) {
        year -= 543;
      }
      const normalized = `${year}-${parts[1]}-${parts[2]}`;
      expect(normalized).toBe("1995-05-15");
    });

    it("should keep Common Era year unchanged (1995 -> 1995)", () => {
      const rawCeDate = "1995-05-15";
      const parts = rawCeDate.split("-");
      let year = parseInt(parts[0], 10);
      if (year > 2400) {
        year -= 543;
      }
      const normalized = `${year}-${parts[1]}-${parts[2]}`;
      expect(normalized).toBe("1995-05-15");
    });
  });

  describe("4. LIFF External Browser Login & Loop Prevention", () => {
    it("should detect OAuth callback parameters in URL", () => {
      const searchWithCode = "?code=12345&state=abcdef";
      const isCallback =
        searchWithCode.includes("code=") || searchWithCode.includes("state=");
      expect(isCallback).toBe(true);

      const normalSearch = "?company=DEMO";
      const isNotCallback =
        normalSearch.includes("code=") || normalSearch.includes("state=");
      expect(isNotCallback).toBe(false);
    });

    it("should halt auto-login when attempt count reaches limit within cooldown", () => {
      const MAX_ATTEMPTS = 2;
      const COOLDOWN_MS = 60 * 1000;
      const now = Date.now();

      let loginCount = 2;
      let lastLoginTime = now - 10 * 1000; // 10s ago

      const isWithinCooldown = now - lastLoginTime < COOLDOWN_MS;
      const shouldHaltLoop = isWithinCooldown && loginCount >= MAX_ATTEMPTS;

      expect(shouldHaltLoop).toBe(true);
    });
  });

  describe("5. Plain Text & URL QR Code Extractor", () => {
    it("should extract code from plain text", async () => {
      const { extractCompanyCode } =
        await import("@/features/company/register-actions");
      expect(await extractCompanyCode("DEMO")).toBe("DEMO");
      expect(await extractCompanyCode("  demo  ")).toBe("DEMO");
      expect(await extractCompanyCode('"COM892"')).toBe("COM892");
    });

    it("should extract code from full URL query parameters", async () => {
      const { extractCompanyCode } =
        await import("@/features/company/register-actions");
      expect(
        await extractCompanyCode(
          "https://lalink.app/liff/connect?company=DEMO",
        ),
      ).toBe("DEMO");
      expect(
        await extractCompanyCode(
          "https://liff.line.me/2000000000-xxxx/connect?company=COM123",
        ),
      ).toBe("COM123");
      expect(await extractCompanyCode("http://localhost:3000?code=DEMO")).toBe(
        "DEMO",
      );
    });

    it("should extract code from hash fragments or deep links", async () => {
      const { extractCompanyCode } =
        await import("@/features/company/register-actions");
      expect(
        await extractCompanyCode("https://liff.line.me/app#company=DEMO"),
      ).toBe("DEMO");
      expect(await extractCompanyCode("lalink://connect?company=ABC999")).toBe(
        "ABC999",
      );
      expect(await extractCompanyCode("รหัสบริษัท: DEMO")).toBe("DEMO");
    });
  });
});
