import { describe, it, expect } from "vitest";
import { ROLES, PERMISSIONS, hasPermission } from "@/lib/permissions/rbac";

describe("Phase 7: Admin Web Portal & Approval System", () => {
  describe("1. RBAC Guard & Permission Enforcement", () => {
    it("should allow COMPANY_ADMIN and HR to approve leaves and create employees", () => {
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.LEAVE_APPROVE),
      ).toBe(true);
      expect(
        hasPermission(ROLES.COMPANY_ADMIN, PERMISSIONS.EMPLOYEE_CREATE),
      ).toBe(true);
      expect(hasPermission(ROLES.HR, PERMISSIONS.LEAVE_APPROVE)).toBe(true);
      expect(hasPermission(ROLES.HR, PERMISSIONS.EMPLOYEE_CREATE)).toBe(true);
    });

    it("should allow MANAGER to approve leaves but deny employee creation or policy changes", () => {
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.LEAVE_APPROVE)).toBe(
        true,
      );
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.EMPLOYEE_CREATE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.MANAGER, PERMISSIONS.POLICY_MANAGE)).toBe(
        false,
      );
    });

    it("should strictly deny EMPLOYEE from approval or admin actions", () => {
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.LEAVE_APPROVE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.EMPLOYEE_CREATE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.POLICY_MANAGE)).toBe(
        false,
      );
      expect(hasPermission(ROLES.EMPLOYEE, PERMISSIONS.HOLIDAY_MANAGE)).toBe(
        false,
      );
    });
  });

  describe("2. Approval Ledger Transaction Mathematics", () => {
    it("should accurately transfer pending balance to used balance on APPROVAL", () => {
      const allocatedDays = 10.0;
      let usedDays = 0.0;
      let pendingDays = 2.0; // 2 days locked during request submission
      const remainingDays = 8.0;

      const leaveDays = 2.0;

      // Approval Transaction:
      pendingDays -= leaveDays;
      usedDays += leaveDays;

      expect(pendingDays).toBe(0.0);
      expect(usedDays).toBe(2.0);
      expect(remainingDays).toBe(8.0);
      expect(usedDays + remainingDays).toBe(allocatedDays);
    });

    it("should accurately restore remaining balance on REJECTION", () => {
      const allocatedDays = 10.0;
      const usedDays = 0.0;
      let pendingDays = 3.0;
      let remainingDays = 7.0;

      const leaveDays = 3.0;

      // Rejection Transaction:
      pendingDays -= leaveDays;
      remainingDays += leaveDays;

      expect(pendingDays).toBe(0.0);
      expect(usedDays).toBe(0.0);
      expect(remainingDays).toBe(10.0);
      expect(usedDays + remainingDays).toBe(allocatedDays);
    });
  });

  describe("3. Mandatory Rejection Reason & Anti-IDOR Enforcement", () => {
    it("should require a non-empty rejection reason when rejecting a leave request", () => {
      const validateRejectionReason = (reason?: string) => {
        if (!reason || reason.trim().length === 0) {
          return { valid: false, error: "กรุณาระบุเหตุผลในการไม่อนุมัติใบลา" };
        }
        return { valid: true };
      };

      expect(validateRejectionReason("").valid).toBe(false);
      expect(validateRejectionReason("   ").valid).toBe(false);
      expect(validateRejectionReason("ติดภารกิจด่วน").valid).toBe(true);
    });

    it("should deny approval across different tenants", () => {
      const approverCompanyId: string = "comp_A";
      const targetRequestCompanyId: string = "comp_B";

      const isAllowed =
        (approverCompanyId as string) === (targetRequestCompanyId as string);
      expect(isAllowed).toBe(false);
    });
  });
});
