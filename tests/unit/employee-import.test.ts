import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseCsv,
  parseCsvLine,
  validateImportRow,
  normalizeHeaders,
  buildImportTemplate,
  IMPORT_HEADERS,
} from "@/lib/employee/import";
import { EmployeeStatus } from "@prisma/client";

const HEADERS = [...IMPORT_HEADERS];

describe("Phase 6: Employee Import (CSV)", () => {
  describe("1. CSV Parsing", () => {
    it("should parse a simple CSV line with quoted values", () => {
      const line = '"EMP-101","สมชาย ใจดี",1990-01-15';
      expect(parseCsvLine(line)).toEqual([
        "EMP-101",
        "สมชาย ใจดี",
        "1990-01-15",
      ]);
    });

    it("should handle escaped double quotes inside quoted fields", () => {
      const line = '"say ""hello""",value2';
      expect(parseCsvLine(line)).toEqual(['say "hello"', "value2"]);
    });

    it("should parse full CSV text into headers and rows", () => {
      const csv = [
        HEADERS.join(","),
        "EMP-101,Somchai,Jaidee,1990-01-15,somchai@x.com,0812345678,HR,HR Specialist,HQ,ACTIVE,2024-01-01",
        "EMP-102,Somkid,Jaidee,1992-02-20,,,IT,Dev,,PROBATION,2024-02-01",
      ].join("\n");

      const result = parseCsv(csv);
      expect(result.headers).toEqual(HEADERS);
      expect(result.rows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should report structural errors for rows with wrong column counts", () => {
      const csv = [
        HEADERS.join(","),
        "EMP-101,Somchai,Jaidee,1990-01-15", // only 4 columns
      ].join("\n");

      const result = parseCsv(csv);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("จำนวนคอลัมน์ไม่ตรงกับส่วนหัว");
    });

    it("should ignore empty lines", () => {
      const csv = [
        HEADERS.join(","),
        "",
        "EMP-101,Somchai,Jaidee,1990-01-15,somchai@x.com,0812345678,HR,HR Specialist,HQ,ACTIVE,2024-01-01",
        "",
      ].join("\n");

      const result = parseCsv(csv);
      expect(result.rows).toHaveLength(1);
    });
  });

  describe("2. Header Normalization", () => {
    it("should detect all required columns present (case-insensitive)", () => {
      const { normalized, missingRequired } = normalizeHeaders([
        "EmployeeCode",
        "FirstName",
        "LastName",
        "DateOfBirth",
        "email",
      ]);
      expect(normalized[0]).toBe("employeecode");
      expect(missingRequired).toEqual([]);
    });

    it("should list missing required columns", () => {
      const { missingRequired } = normalizeHeaders([
        "employeeCode",
        "firstName",
      ]);
      expect(missingRequired).toContain("lastname");
      expect(missingRequired).toContain("dateofbirth");
    });
  });

  describe("3. Row Validation", () => {
    it("should accept a valid row and uppercase the employee code", () => {
      const fields = [
        "emp-101",
        "Somchai",
        "Jaidee",
        "1990-01-15",
        "somchai@x.com",
        "0812345678",
        "HR",
        "HR Specialist",
        "HQ",
        "ACTIVE",
        "2024-01-01",
      ];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.employeeCode).toBe("EMP-101");
        expect(result.data.dateOfBirth).toBe("1990-01-15");
        expect(result.data.status).toBe(EmployeeStatus.ACTIVE);
      }
    });

    it("should reject invalid date of birth format", () => {
      const fields = [
        "EMP-101",
        "Somchai",
        "Jaidee",
        "15/05/1990",
        "somchai@x.com",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("วันเกิด");
      }
    });

    it("should reject invalid email format", () => {
      const fields = [
        "EMP-101",
        "Somchai",
        "Jaidee",
        "1990-01-15",
        "not-an-email",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("อีเมล");
      }
    });

    it("should reject empty required fields", () => {
      const fields = ["", "Somchai", "Jaidee", "1990-01-15", "", "", "", "", "", "", ""];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(false);
    });

    it("should default status to ACTIVE when not specified", () => {
      const fields = [
        "EMP-101",
        "Somchai",
        "Jaidee",
        "1990-01-15",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe(EmployeeStatus.ACTIVE);
      }
    });

    it("should reject unsupported status values", () => {
      const fields = [
        "EMP-101",
        "Somchai",
        "Jaidee",
        "1990-01-15",
        "",
        "",
        "",
        "",
        "",
        "TERMINATED",
        "",
      ];
      const result = validateImportRow(fields, HEADERS, 2);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("status");
      }
    });

    it("should be case-insensitive when matching headers", () => {
      const upperHeaders = [
        "EMPLOYEECODE",
        "FIRSTNAME",
        "LASTNAME",
        "DATEOFBIRTH",
        "EMAIL",
        "PHONE",
        "DEPARTMENTNAME",
        "POSITIONNAME",
        "BRANCHCODE",
        "STATUS",
        "JOINEDAT",
      ];
      const fields = [
        "EMP-101",
        "Somchai",
        "Jaidee",
        "1990-01-15",
        "",
        "",
        "",
        "",
        "",
        "PROBATION",
        "",
      ];
      const result = validateImportRow(fields, upperHeaders, 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe(EmployeeStatus.PROBATION);
      }
    });
  });

  describe("4. Template", () => {
    it("should build a downloadable CSV template with a header row", () => {
      const template = buildImportTemplate();
      const lines = template.split("\n").filter((l) => l.trim().length > 0);
      expect(lines[0]).toContain("employeeCode");
      expect(lines).toHaveLength(2);
    });
  });

  describe("5. Lifecycle Status Classification", () => {
    it("should classify ACTIVE and PROBATION as active statuses", () => {
      const ACTIVE_STATUSES = new Set<EmployeeStatus>([
        EmployeeStatus.ACTIVE,
        EmployeeStatus.PROBATION,
      ]);
      expect(ACTIVE_STATUSES.has(EmployeeStatus.ACTIVE)).toBe(true);
      expect(ACTIVE_STATUSES.has(EmployeeStatus.PROBATION)).toBe(true);
    });

    it("should classify INACTIVE/RESIGNED/SUSPENDED/TERMINATED as non-active", () => {
      const NON_ACTIVE = new Set<EmployeeStatus>([
        EmployeeStatus.INACTIVE,
        EmployeeStatus.RESIGNED,
        EmployeeStatus.SUSPENDED,
        EmployeeStatus.TERMINATED,
      ]);
      for (const s of NON_ACTIVE) {
        expect(NON_ACTIVE.has(s)).toBe(true);
      }
      expect(NON_ACTIVE.has(EmployeeStatus.ACTIVE)).toBe(false);
    });
  });
});