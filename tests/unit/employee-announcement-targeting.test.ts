import { describe, it, expect } from "vitest";
import {
  buildEmployeeAnnouncementWhere,
  buildEmployeeAnnouncementOrderBy,
} from "@/lib/announcement/target";

describe("Phase 6: Employee Announcement Targeting", () => {
  describe("buildEmployeeAnnouncementWhere", () => {
    it("should always scope to the employee's company", () => {
      const where = buildEmployeeAnnouncementWhere({
        companyId: "c1",
        branchId: null,
        departmentId: null,
      });

      expect(where.companyId).toBe("c1");
      expect(where.isPublished).toBe(true);
    });

    it("should match ALL announcements for employees without branch/department", () => {
      const where = buildEmployeeAnnouncementWhere({
        companyId: "c1",
        branchId: null,
        departmentId: null,
      });

      const targeting = (where.AND as Record<string, unknown>[])[0];
      expect(targeting.OR).toEqual([
        { targetGroup: "ALL" },
        { targetGroup: "BRANCH", branchId: undefined },
        { targetGroup: "DEPARTMENT", departmentId: undefined },
      ]);
    });

    it("should target branch announcements matching the employee's branch", () => {
      const where = buildEmployeeAnnouncementWhere({
        companyId: "c1",
        branchId: "b1",
        departmentId: null,
      });

      const targeting = (where.AND as Record<string, unknown>[])[0];
      expect(targeting.OR).toContainEqual({
        targetGroup: "BRANCH",
        branchId: "b1",
      });
    });

    it("should target department announcements matching the employee's department", () => {
      const where = buildEmployeeAnnouncementWhere({
        companyId: "c1",
        branchId: null,
        departmentId: "d1",
      });

      const targeting = (where.AND as Record<string, unknown>[])[0];
      expect(targeting.OR).toContainEqual({
        targetGroup: "DEPARTMENT",
        departmentId: "d1",
      });
    });

    it("should exclude expired announcements but keep ones without expiry", () => {
      const where = buildEmployeeAnnouncementWhere({
        companyId: "c1",
        branchId: null,
        departmentId: null,
        now: new Date("2026-08-15"),
      });

      const expiry = (where.AND as Record<string, unknown>[])[1];
      expect(expiry.OR).toEqual([
        { expiresAt: null },
        { expiresAt: { gte: new Date("2026-08-15") } },
      ]);
    });
  });

  describe("buildEmployeeAnnouncementOrderBy", () => {
    it("should sort pinned first then newest published first", () => {
      expect(buildEmployeeAnnouncementOrderBy()).toEqual([
        { isPinned: "desc" },
        { publishedAt: "desc" },
      ]);
    });
  });
});