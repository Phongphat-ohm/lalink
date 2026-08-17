import { prisma } from "@/lib/database";
import {
  sendLinePushMessage,
  buildLeaveSubmittedFlex,
  buildLeaveApprovedFlex,
  buildLeaveRejectedFlex,
  buildLeaveCancelledFlex,
  LeaveFlexData,
} from "@/lib/line";

export class NotificationService {
  /**
   * 1. Trigger when Employee submits a Leave Request
   */
  static async notifyLeaveSubmitted(leaveRequestId: string): Promise<void> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: true,
          company: true,
          leaveType: true,
        },
      });

      if (!leaveRequest) return;

      const flexData: LeaveFlexData = {
        requestNumber: leaveRequest.requestNumber,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        leaveTypeName: leaveRequest.leaveType.name,
        startDate: leaveRequest.startDate.toLocaleDateString("th-TH"),
        endDate: leaveRequest.endDate.toLocaleDateString("th-TH"),
        totalDays: Number(leaveRequest.totalDays),
        reason: leaveRequest.reason || undefined,
        companyName: leaveRequest.company.name,
      };

      const flexMessage = buildLeaveSubmittedFlex(flexData);

      // Save In-App Notification for Employee
      await prisma.notification.create({
        data: {
          companyId: leaveRequest.companyId,
          recipientType: "EMPLOYEE",
          recipientId: leaveRequest.employeeId,
          channel: "LINE",
          title: "ยื่นใบลาสำเร็จ",
          message: `ใบลาเลขที่ ${leaveRequest.requestNumber} (${leaveRequest.leaveType.name}) อยู่ระหว่างรออนุมัติ`,
          status: "SENT",
          payload: flexMessage as any,
          sentAt: new Date(),
        },
      });

      // Send LINE Push Message to Employee if linked
      if (leaveRequest.employee.lineUserId) {
        await sendLinePushMessage(leaveRequest.employee.lineUserId, [
          flexMessage,
        ]);
      }

      // Notify Company Admins / HR In-app
      const adminUsers = await prisma.user.findMany({
        where: {
          companyId: leaveRequest.companyId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        await prisma.notification.create({
          data: {
            companyId: leaveRequest.companyId,
            recipientType: "USER",
            recipientId: admin.id,
            channel: "IN_APP",
            title: "มีคำขอลางานใหม่",
            message: `${flexData.employeeName} ยื่นขอ ${flexData.leaveTypeName} (${flexData.totalDays} วัน)`,
            status: "SENT",
            payload: { leaveRequestId: leaveRequest.id },
            sentAt: new Date(),
          },
        });
      }
    } catch (err) {
      console.warn("notifyLeaveSubmitted error (non-blocking):", err);
    }
  }

  /**
   * 2. Trigger when Leave Request is Approved
   */
  static async notifyLeaveApproved(leaveRequestId: string): Promise<void> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: true,
          company: true,
          leaveType: true,
        },
      });

      if (!leaveRequest) return;

      const flexData: LeaveFlexData = {
        requestNumber: leaveRequest.requestNumber,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        leaveTypeName: leaveRequest.leaveType.name,
        startDate: leaveRequest.startDate.toLocaleDateString("th-TH"),
        endDate: leaveRequest.endDate.toLocaleDateString("th-TH"),
        totalDays: Number(leaveRequest.totalDays),
        companyName: leaveRequest.company.name,
      };

      const flexMessage = buildLeaveApprovedFlex(flexData);

      // Save In-App Notification
      await prisma.notification.create({
        data: {
          companyId: leaveRequest.companyId,
          recipientType: "EMPLOYEE",
          recipientId: leaveRequest.employeeId,
          channel: "LINE",
          title: "ใบลาได้รับการอนุมัติ",
          message: `คำขอลา ${leaveRequest.leaveType.name} วันที่ ${flexData.startDate} ได้รับการอนุมัติแล้ว`,
          status: "SENT",
          payload: flexMessage as any,
          sentAt: new Date(),
        },
      });

      // Send LINE Push Message
      if (leaveRequest.employee.lineUserId) {
        await sendLinePushMessage(leaveRequest.employee.lineUserId, [
          flexMessage,
        ]);
      }
    } catch (err) {
      console.warn("notifyLeaveApproved error (non-blocking):", err);
    }
  }

  /**
   * 3. Trigger when Leave Request is Rejected
   */
  static async notifyLeaveRejected(
    leaveRequestId: string,
    reason: string,
  ): Promise<void> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: true,
          company: true,
          leaveType: true,
        },
      });

      if (!leaveRequest) return;

      const flexData: LeaveFlexData = {
        requestNumber: leaveRequest.requestNumber,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        leaveTypeName: leaveRequest.leaveType.name,
        startDate: leaveRequest.startDate.toLocaleDateString("th-TH"),
        endDate: leaveRequest.endDate.toLocaleDateString("th-TH"),
        totalDays: Number(leaveRequest.totalDays),
        companyName: leaveRequest.company.name,
      };

      const flexMessage = buildLeaveRejectedFlex(flexData, reason);

      // Save In-App Notification
      await prisma.notification.create({
        data: {
          companyId: leaveRequest.companyId,
          recipientType: "EMPLOYEE",
          recipientId: leaveRequest.employeeId,
          channel: "LINE",
          title: "ใบลาไม่ได้รับการอนุมัติ",
          message: `คำขอลา ${leaveRequest.leaveType.name} ไม่ได้รับการอนุมัติ (เหตุผล: ${reason})`,
          status: "SENT",
          payload: flexMessage as any,
          sentAt: new Date(),
        },
      });

      // Send LINE Push Message
      if (leaveRequest.employee.lineUserId) {
        await sendLinePushMessage(leaveRequest.employee.lineUserId, [
          flexMessage,
        ]);
      }
    } catch (err) {
      console.warn("notifyLeaveRejected error (non-blocking):", err);
    }
  }

  /**
   * 4. Trigger when Leave Request is Cancelled
   */
  static async notifyLeaveCancelled(leaveRequestId: string): Promise<void> {
    try {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          employee: true,
          company: true,
          leaveType: true,
        },
      });

      if (!leaveRequest) return;

      const flexData: LeaveFlexData = {
        requestNumber: leaveRequest.requestNumber,
        employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
        leaveTypeName: leaveRequest.leaveType.name,
        startDate: leaveRequest.startDate.toLocaleDateString("th-TH"),
        endDate: leaveRequest.endDate.toLocaleDateString("th-TH"),
        totalDays: Number(leaveRequest.totalDays),
        companyName: leaveRequest.company.name,
      };

      const flexMessage = buildLeaveCancelledFlex(flexData);

      // Save In-App Notification
      await prisma.notification.create({
        data: {
          companyId: leaveRequest.companyId,
          recipientType: "EMPLOYEE",
          recipientId: leaveRequest.employeeId,
          channel: "LINE",
          title: "ยกเลิกคำขอลาแล้ว",
          message: `คำขอลาเลขที่ ${leaveRequest.requestNumber} ได้รับการยกเลิกเรียบร้อยแล้ว`,
          status: "SENT",
          payload: flexMessage as any,
          sentAt: new Date(),
        },
      });

      // Send LINE Push Message
      if (leaveRequest.employee.lineUserId) {
        await sendLinePushMessage(leaveRequest.employee.lineUserId, [
          flexMessage,
        ]);
      }
    } catch (err) {
      console.warn("notifyLeaveCancelled error (non-blocking):", err);
    }
  }
}
