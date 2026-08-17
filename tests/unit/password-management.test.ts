import { describe, it, expect } from "vitest";
import {
  changePasswordSchema,
  adminResetPasswordSchema,
} from "@/features/auth/schemas";
import { hashPassword, verifyPassword } from "@/lib/security/password";

describe("Password Management System", () => {
  describe("1. changePasswordSchema Validation", () => {
    it("should accept valid password change data with complexity requirements", () => {
      const validData = {
        currentPassword: "OldPassword123!",
        newPassword: "NewSecretPassword2026",
        confirmPassword: "NewSecretPassword2026",
      };
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject password if less than 8 characters", () => {
      const invalidData = {
        currentPassword: "OldPassword123!",
        newPassword: "Ab1!",
        confirmPassword: "Ab1!",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.newPassword?.[0]).toContain(
          "อย่างน้อย 8 ตัวอักษร",
        );
      }
    });

    it("should reject password without uppercase character", () => {
      const invalidData = {
        currentPassword: "OldPassword123!",
        newPassword: "alllowercase123",
        confirmPassword: "alllowercase123",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.newPassword?.[0]).toContain(
          "ตัวพิมพ์ใหญ่",
        );
      }
    });

    it("should reject password without numbers", () => {
      const invalidData = {
        currentPassword: "OldPassword123!",
        newPassword: "NoNumbersInPassword",
        confirmPassword: "NoNumbersInPassword",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.newPassword?.[0]).toContain(
          "ตัวเลข",
        );
      }
    });

    it("should reject when confirm password does not match", () => {
      const invalidData = {
        currentPassword: "OldPassword123!",
        newPassword: "SecretPassword123",
        confirmPassword: "DifferentPassword123",
      };
      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.flatten().fieldErrors.confirmPassword?.[0],
        ).toContain("ไม่ตรงกัน");
      }
    });
  });

  describe("2. adminResetPasswordSchema Validation", () => {
    it("should accept valid admin reset payload", () => {
      const validData = {
        targetUserId: "usr-12345",
        newPassword: "ResetPassword2026",
      };
      const result = adminResetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty user ID", () => {
      const invalidData = {
        targetUserId: "",
        newPassword: "ResetPassword2026",
      };
      const result = adminResetPasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("3. Password Lifecycle & Argon2id Verification", () => {
    it("should hash new password and successfully verify against matching input", async () => {
      const rawPassword = "StrongUserPassword@2026";
      const hash = await hashPassword(rawPassword);

      expect(await verifyPassword(rawPassword, hash)).toBe(true);
      expect(await verifyPassword("WrongPassword123", hash)).toBe(false);
    });
  });
});
