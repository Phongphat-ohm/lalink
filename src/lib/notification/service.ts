import { prisma } from "@/lib/database";
import {
  buildLeaveSubmittedFlex,
  buildLeaveApprovedFlex,
  buildLeaveRejectedFlex,
  buildLeaveCancelledFlex,
  type LeaveFlexData,
} from "@/lib/line";
import { NotificationDispatcher } from "./dispatcher";
import { NotificationChannel } from "@prisma/client";

/**
 * NotificationService — legacy facade.
 *
 * Kept for backward compatibility. All delivery logic is delegated to
 * the `NotificationDispatcher` which routes to individual providers
 * (LINE / In-App / Email).
 */
export class NotificationService {
  private static dispatcher: NotificationDispatcher | null = null;

  private static getDispatcher(): NotificationDispatcher {
    if (!this.dispatcher) {
      this.dispatcher = NotificationDispatcher.createDefault();
    }
    return this.dispatcher;
  }

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

      // Save In-App Notification for Employee via LINE channel
      await this.getDispatcher().dispatch({
        companyId: leaveRequest.companyId,
        recipientType: "EMPLOYEE",
        recipientId: leaveRequest.employeeId,
        channel: NotificationChannel.LINE,
        title: "ยื่นใบลาสำเร็จ",
        message: `ใบลาเลขที่ ${leaveRequest.requestNumber} (${leaveRequest.leaveType.name}) อยู่ระหว่างรออนุมัติ`,
        payload: flexMessage,
        lineUserId: leaveRequest.employee.lineUserId,
      });

      // Notify Company Admins / HR In-app
      const adminUsers = await prisma.user.findMany({
        where: {
          companyId: leaveRequest.companyId,
          status: "ACTIVE",
        },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        await this.getDispatcher().dispatch({
          companyId: leaveRequest.companyId,
          recipientType: "USER",
          recipientId: admin.id,
          channel: NotificationChannel.IN_APP,
          title: "มีคำขอลางานใหม่",
          message: `${flexData.employeeName} ยื่นขอ ${flexData.leaveTypeName} (${flexData.totalDays} วัน)`,
          payload: { leaveRequestId: leaveRequest.id },
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

      await this.getDispatcher().dispatch({
        companyId: leaveRequest.companyId,
        recipientType: "EMPLOYEE",
        recipientId: leaveRequest.employeeId,
        channel: NotificationChannel.LINE,
        title: "ใบลาได้รับการอนุมัติ",
        message: `คำขอลา ${leaveRequest.leaveType.name} วันที่ ${flexData.startDate} ได้รับการอนุมัติแล้ว`,
        payload: flexMessage,
        lineUserId: leaveRequest.employee.lineUserId,
      });
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

      await this.getDispatcher().dispatch({
        companyId: leaveRequest.companyId,
        recipientType: "EMPLOYEE",
        recipientId: leaveRequest.employeeId,
        channel: NotificationChannel.LINE,
        title: "ใบลาไม่ได้รับการอนุมัติ",
        message: `คำขอลา ${leaveRequest.leaveType.name} ไม่ได้รับการอนุมัติ (เหตุผล: ${reason})`,
        payload: flexMessage,
        lineUserId: leaveRequest.employee.lineUserId,
      });
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

      await this.getDispatcher().dispatch({
        companyId: leaveRequest.companyId,
        recipientType: "EMPLOYEE",
        recipientId: leaveRequest.employeeId,
        channel: NotificationChannel.LINE,
        title: "ยกเลิกคำขอลาแล้ว",
        message: `คำขอลาเลขที่ ${leaveRequest.requestNumber} ได้รับการยกเลิกเรียบร้อยแล้ว`,
        payload: flexMessage,
        lineUserId: leaveRequest.employee.lineUserId,
      });
    } catch (err) {
      console.warn("notifyLeaveCancelled error (non-blocking):", err);
    }
  }
}