import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildLeaveSubmittedFlex,
  buildLeaveApprovedFlex,
  buildLeaveRejectedFlex,
  buildLeaveCancelledFlex,
  sendLinePushMessage,
  sendLineMulticastMessage,
} from "@/lib/line";
import { NotificationService } from "@/lib/notification";
import { prisma } from "@/lib/database";

// Mock Prisma
vi.mock("@/lib/database", () => {
  const mockFindUnique = vi.fn();
  const mockFindMany = vi.fn();
  const mockCreate = vi.fn();

  return {
    prisma: {
      leaveRequest: {
        findUnique: mockFindUnique,
      },
      notification: {
        create: mockCreate,
      },
      user: {
        findMany: mockFindMany,
      },
    },
  };
});

describe("Phase 9: LINE Messaging & Notification Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. LINE Flex Message Templates", () => {
    const mockData = {
      requestNumber: "LR-202608-0001",
      employeeName: "สมชาย ใจดี",
      leaveTypeName: "ลาพักร้อนประจำปี",
      startDate: "18/08/2026",
      endDate: "19/08/2026",
      totalDays: 2,
      reason: "ไปพักผ่อนต่างจังหวัด",
      companyName: "Lalink Demo Company",
    };

    it("should build valid Leave Submitted Flex Message with Teal theme", () => {
      const flex = buildLeaveSubmittedFlex(mockData);

      expect(flex.type).toBe("flex");
      expect(flex.altText).toContain("LR-202608-0001");
      expect(flex.contents.type).toBe("bubble");
      expect(flex.contents.header.backgroundColor).toBe("#0D9488"); // Brand Teal
      expect(JSON.stringify(flex)).toContain("สมชาย ใจดี");
      expect(JSON.stringify(flex)).toContain("2 วัน");
      expect(JSON.stringify(flex)).toContain("ไปพักผ่อนต่างจังหวัด");
    });

    it("should build valid Leave Approved Flex Message with Emerald theme", () => {
      const flex = buildLeaveApprovedFlex(mockData);

      expect(flex.type).toBe("flex");
      expect(flex.altText).toContain("ได้รับการอนุมัติแล้ว");
      expect(flex.contents.header.backgroundColor).toBe("#10B981"); // Emerald
      expect(JSON.stringify(flex)).toContain("✓ อนุมัติใบลาเรียบร้อยแล้ว");
    });

    it("should build valid Leave Rejected Flex Message with Rose theme and reason", () => {
      const reason = "ช่วงเวลาดังกล่าวมีงานเร่งด่วน";
      const flex = buildLeaveRejectedFlex(mockData, reason);

      expect(flex.type).toBe("flex");
      expect(flex.altText).toContain("ไม่ได้รับการอนุมัติ");
      expect(flex.contents.header.backgroundColor).toBe("#E11D48"); // Rose
      expect(JSON.stringify(flex)).toContain(reason);
    });

    it("should build valid Leave Cancelled Flex Message with Slate theme", () => {
      const flex = buildLeaveCancelledFlex(mockData);

      expect(flex.type).toBe("flex");
      expect(flex.altText).toContain("ถูกยกเลิกแล้ว");
      expect(flex.contents.header.backgroundColor).toBe("#64748B"); // Slate
      expect(JSON.stringify(flex)).toContain("ยกเลิกคำขอลาเรียบร้อยแล้ว");
    });
  });

  describe("2. LINE Push & Multicast Messaging Client", () => {
    it("should handle push message in mock/development mode gracefully when no token is present", async () => {
      const result = await sendLinePushMessage("U1234567890", [
        { type: "text", text: "Hello" },
      ]);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it("should handle multicast message gracefully with empty list", async () => {
      const result = await sendLineMulticastMessage(
        [],
        [{ type: "text", text: "Hello" }],
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });
  });

  describe("3. Decoupled NotificationService Triggers", () => {
    const mockLeaveRequest = {
      id: "req-123",
      requestNumber: "LR-202608-0005",
      companyId: "comp-1",
      employeeId: "emp-1",
      leaveTypeId: "lt-1",
      startDate: new Date("2026-08-20"),
      endDate: new Date("2026-08-21"),
      totalDays: 2,
      reason: "ธุระส่วนตัว",
      employee: {
        firstName: "สมหมาย",
        lastName: "มุ่งมั่น",
        lineUserId: "U_LINE_SOMMAI",
      },
      company: {
        name: "Lalink Demo Corp",
      },
      leaveType: {
        name: "ลากิจ",
      },
    };

    it("should notify on leave submitted: logs in DB and notifies admins in-app", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(
        mockLeaveRequest as any,
      );
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "admin-user-1" },
        { id: "admin-user-2" },
      ] as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-1",
      } as any);

      await NotificationService.notifyLeaveSubmitted("req-123");

      expect(prisma.leaveRequest.findUnique).toHaveBeenCalledWith({
        where: { id: "req-123" },
        include: {
          employee: true,
          company: true,
          leaveType: true,
        },
      });

      // Should create notifications: 1 for employee + 2 for admins
      expect(prisma.notification.create).toHaveBeenCalledTimes(3);
    });

    it("should notify on leave approved: logs DB record and sends LINE push", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(
        mockLeaveRequest as any,
      );
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-2",
      } as any);

      await NotificationService.notifyLeaveApproved("req-123");

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: "emp-1",
            title: "ใบลาได้รับการอนุมัติ",
            channel: "LINE",
          }),
        }),
      );
    });

    it("should notify on leave rejected with rejection reason", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(
        mockLeaveRequest as any,
      );
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-3",
      } as any);

      await NotificationService.notifyLeaveRejected(
        "req-123",
        "เนื่องจากมีพนักงานในแผนกลาพร้อมกันหลายคน",
      );

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: "emp-1",
            title: "ใบลาไม่ได้รับการอนุมัติ",
            channel: "LINE",
          }),
        }),
      );
    });

    it("should notify on leave cancelled gracefully", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(
        mockLeaveRequest as any,
      );
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-4",
      } as any);

      await NotificationService.notifyLeaveCancelled("req-123");

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: "emp-1",
            title: "ยกเลิกคำขอลาแล้ว",
            channel: "LINE",
          }),
        }),
      );
    });

    it("should not throw or block when leave request is not found or DB fails", async () => {
      vi.mocked(prisma.leaveRequest.findUnique).mockResolvedValue(null);

      // Should complete without throwing exception
      await expect(
        NotificationService.notifyLeaveSubmitted("non-existent-id"),
      ).resolves.not.toThrow();
    });
  });
});
