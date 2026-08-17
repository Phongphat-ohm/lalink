import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCsvWithBom } from "@/features/report/csv-exporter";
import { sanitizeAuditDetails, AuditLogger } from "@/lib/audit";
import { prisma } from "@/lib/database";

// Mock Prisma
vi.mock("@/lib/database", () => {
  const mockCreate = vi.fn();
  const mockFindMany = vi.fn();
  const mockCount = vi.fn();

  return {
    prisma: {
      auditLog: {
        create: mockCreate,
        findMany: mockFindMany,
      },
      leaveRequest: {
        findMany: mockFindMany,
      },
      employee: {
        count: mockCount,
      },
    },
  };
});

describe("Phase 10: Reports, Analytics & Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. CSV Exporter with Thai BOM & RFC 4180 Escaping", () => {
    it("should prepend UTF-8 BOM (\\uFEFF) to the CSV output", () => {
      const headers = ["ลำดับ", "ชื่อพนักงาน"];
      const rows = [[1, "นายสมชาย"]];

      const csv = generateCsvWithBom(headers, rows);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("นายสมชาย");
    });

    it("should escape commas, quotes, and newlines in cells", () => {
      const headers = ["หัวข้อ", "รายละเอียด"];
      const rows = [
        ["เหตุผล", 'ไปทำธุระ "ส่วนตัว", และพบแพทย์'],
        ["หมายเหตุ", "บรรทัดที่ 1\nบรรทัดที่ 2"],
      ];

      const csv = generateCsvWithBom(headers, rows);

      expect(csv).toContain('"ไปทำธุระ ""ส่วนตัว"", และพบแพทย์"');
      expect(csv).toContain('"บรรทัดที่ 1\nบรรทัดที่ 2"');
    });

    it("should handle null and undefined values safely as empty strings", () => {
      const headers = ["ฟิลด์ 1", "ฟิลด์ 2"];
      const rows = [
        [null, undefined],
        ["ค่าปกติ", 100],
      ];

      const csv = generateCsvWithBom(headers, rows);

      expect(csv).toContain(",\r\n");
      expect(csv).toContain("ค่าปกติ,100");
    });
  });

  describe("2. Audit Log Sanitization & Security", () => {
    it("should recursively redact passwords, tokens, secrets, and OTPs", () => {
      const dirtyInput = {
        action: "USER_LOGIN",
        username: "admin@platform.com",
        password: "SuperSecretPassword123!",
        lineIdToken: "eyJhbGciOi...",
        nested: {
          apiKey: "sk-live-99999",
          normalField: "Safe Data",
          otp: "123456",
        },
        tokenList: [
          { token: "tok-abc", name: "device 1" },
          { secret: "sec-xyz", name: "device 2" },
        ],
      };

      const cleanOutput = sanitizeAuditDetails(dirtyInput) as any;

      expect(cleanOutput.password).toBe("[REDACTED]");
      expect(cleanOutput.lineIdToken).toBe("[REDACTED]");
      expect(cleanOutput.nested.apiKey).toBe("[REDACTED]");
      expect(cleanOutput.nested.otp).toBe("[REDACTED]");
      expect(cleanOutput.nested.normalField).toBe("Safe Data");
      expect(cleanOutput.tokenList[0].token).toBe("[REDACTED]");
      expect(cleanOutput.tokenList[1].secret).toBe("[REDACTED]");
    });

    it("should log sanitized audit records to Prisma safely without failing", async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: "log-1",
      } as any);

      await AuditLogger.log({
        companyId: "comp-1",
        actorType: "USER",
        actorId: "user-1",
        action: "CREATE_EMPLOYEE",
        resource: "Employee",
        resourceId: "emp-100",
        details: {
          employeeCode: "EMP-005",
          password: "plain-text-pass",
        },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: "comp-1",
            actorType: "USER",
            action: "CREATE_EMPLOYEE",
            details: expect.objectContaining({
              employeeCode: "EMP-005",
              password: "[REDACTED]",
            }),
          }),
        }),
      );
    });

    it("should handle non-object and null audit details gracefully", () => {
      expect(sanitizeAuditDetails(null)).toBe(null);
      expect(sanitizeAuditDetails(undefined)).toBe(undefined);
      expect(sanitizeAuditDetails("string-value")).toBe("string-value");
      expect(sanitizeAuditDetails(12345)).toBe(12345);
    });
  });
});
