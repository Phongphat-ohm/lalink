import { describe, it, expect } from "vitest";
import {
  companyRegisterSchema,
  createCompanyByAdminSchema,
} from "@/features/company/schemas";
import { generateRandomCode } from "@/features/company/code-generator";

describe("Company Self-Registration & Code Generator", () => {
  describe("1. Auto-Code Generator", () => {
    it("should generate a valid uppercase 6-character code with COM prefix by default", () => {
      const code = generateRandomCode();
      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThanOrEqual(6);
      expect(code.startsWith("COM")).toBe(true);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it("should generate a valid code with custom prefix", () => {
      const code = generateRandomCode("LAL");
      expect(code.startsWith("LAL")).toBe(true);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });
  });

  describe("2. companyRegisterSchema Validation", () => {
    it("should accept valid registration payload", () => {
      const validPayload = {
        companyName: "Acme Corporation Co., Ltd.",
        companyCode: "ACM892",
        contactEmail: "contact@acme.com",
        contactPhone: "02-123-4567",
        adminName: "John Doe",
        adminEmail: "john.admin@acme.com",
        adminPassword: "StrongAdminPassword123",
        confirmPassword: "StrongAdminPassword123",
      };

      const result = companyRegisterSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject company code with invalid characters (lowercase or special chars)", () => {
      const invalidPayload = {
        companyName: "Acme Corporation",
        companyCode: "acm@892",
        adminName: "John Doe",
        adminEmail: "john@acme.com",
        adminPassword: "Password123!",
        confirmPassword: "Password123!",
      };

      const result = companyRegisterSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it("should reject when admin password and confirm password do not match", () => {
      const mismatchPayload = {
        companyName: "Acme Corporation",
        companyCode: "ACM892",
        adminName: "John Doe",
        adminEmail: "john@acme.com",
        adminPassword: "Password123!",
        confirmPassword: "DifferentPassword123!",
      };

      const result = companyRegisterSchema.safeParse(mismatchPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.confirmPassword?.[0],
        ).toContain("ไม่ตรงกัน");
      }
    });

    it("should reject weak admin password (missing uppercase or number)", () => {
      const weakPasswordPayload = {
        companyName: "Acme Corporation",
        companyCode: "ACM892",
        adminName: "John Doe",
        adminEmail: "john@acme.com",
        adminPassword: "weakpassword",
        confirmPassword: "weakpassword",
      };

      const result = companyRegisterSchema.safeParse(weakPasswordPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("3. createCompanyByAdminSchema Validation", () => {
    it("should accept valid admin creation payload", () => {
      const validPayload = {
        name: "Test Tenant Co.",
        code: "TEST01",
        contactEmail: "hr@test.com",
        contactPhone: "081-234-5678",
      };

      const result = createCompanyByAdminSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should reject empty company code or name", () => {
      const invalidPayload = {
        name: "",
        code: "",
      };

      const result = createCompanyByAdminSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
