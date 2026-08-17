"use server";

import { prisma } from "@/lib/database";
import { requireTenantContext, scopedLeaveRequest } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { NotificationService } from "@/lib/notification";
import {
  LeaveRequestStatus,
  LeaveTransactionType,
  ActorType,
} from "@prisma/client";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Server action to approve a pending leave request.
 */
export async function approveLeaveRequestAction(
  leaveRequestId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    // 1. RBAC Permission Check
    if (!hasPermission(tenant.role, PERMISSIONS.LEAVE_APPROVE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการอนุมัติใบลา",
      };
    }

    // 2. Fetch & Validate Scoped Leave Request (Anti-IDOR)
    const request = await scopedLeaveRequest.findById(
      tenant.companyId,
      leaveRequestId,
    );
    if (!request) {
      return {
        success: false,
        message: "ไม่พบใบลาที่ระบุในบริษัทของคุณ",
      };
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      return {
        success: false,
        message: `ไม่สามารถอนุมัติใบลาที่มีสถานะ "${request.status}" ได้`,
      };
    }

    const leaveDays = Number(request.totalDays);
    const requestYear = request.startDate.getFullYear();

    // 3. Atomic Database Transaction
    await prisma.$transaction(async (tx) => {
      // Update Leave Request
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: LeaveRequestStatus.APPROVED,
          approvedBy: tenant.userId,
          approvedAt: new Date(),
        },
      });

      // Update Leave Balance (move from pending to used)
      const balance = await tx.leaveBalance.findFirst({
        where: {
          companyId: tenant.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: requestYear,
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: leaveDays },
            usedDays: { increment: leaveDays },
          },
        });

        // Record Leave Balance Transaction
        await tx.leaveTransaction.create({
          data: {
            companyId: tenant.companyId,
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            leaveRequestId: request.id,
            type: LeaveTransactionType.DEBIT,
            days: leaveDays,
            balanceBefore: Number(balance.remainingDays) + leaveDays,
            balanceAfter: Number(balance.remainingDays),
            reason: `อนุมัติคำขอลาเลขที่ ${request.requestNumber}`,
            createdBy: tenant.userId,
          },
        });
      }

      // Create Notification for Employee
      await tx.notification.create({
        data: {
          companyId: tenant.companyId,
          recipientType: ActorType.EMPLOYEE,
          recipientId: request.employeeId,
          title: "ใบลาของคุณได้รับการอนุมัติแล้ว",
          message: `คำขอลาเลขที่ ${request.requestNumber} ได้รับการอนุมัติเรียบร้อยแล้ว`,
          payload: {
            leaveRequestId: request.id,
            requestNumber: request.requestNumber,
          },
        },
      });

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.USER,
          actorId: tenant.userId,
          action: "APPROVE_LEAVE",
          resource: "LeaveRequest",
          resourceId: request.id,
          details: {
            requestNumber: request.requestNumber,
            employeeId: request.employeeId,
            totalDays: leaveDays,
          },
        },
      });
    });

    // 4. Non-blocking Notification Dispatch
    NotificationService.notifyLeaveApproved(request.id).catch((err) => {
      console.warn("Failed to dispatch leave approved notification:", err);
    });

    return {
      success: true,
      message: "อนุมัติใบลาเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Approve Leave Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการอนุมัติใบลา",
    };
  }
}

/**
 * Server action to reject a pending leave request with mandatory reason.
 */
export async function rejectLeaveRequestAction(
  leaveRequestId: string,
  rejectionReason: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    // 1. RBAC Permission Check
    if (!hasPermission(tenant.role, PERMISSIONS.LEAVE_APPROVE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการปฏิเสธใบลา",
      };
    }

    // 2. Mandatory Rejection Reason Check
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return {
        success: false,
        message: "กรุณาระบุเหตุผลในการไม่อนุมัติใบลา",
        errors: { rejectionReason: ["กรุณาระบุเหตุผลการไม่อนุมัติ"] },
      };
    }

    // 3. Fetch & Validate Scoped Leave Request
    const request = await scopedLeaveRequest.findById(
      tenant.companyId,
      leaveRequestId,
    );
    if (!request) {
      return {
        success: false,
        message: "ไม่พบใบลาที่ระบุในบริษัทของคุณ",
      };
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      return {
        success: false,
        message: `ไม่สามารถปฏิเสธใบลาที่มีสถานะ "${request.status}" ได้`,
      };
    }

    const leaveDays = Number(request.totalDays);
    const requestYear = request.startDate.getFullYear();

    // 4. Atomic Database Transaction
    await prisma.$transaction(async (tx) => {
      // Update Leave Request
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: LeaveRequestStatus.REJECTED,
          rejectionReason: rejectionReason.trim(),
          rejectedBy: tenant.userId,
          rejectedAt: new Date(),
        },
      });

      // Restore Leave Balance (Move from pending back to remaining)
      const balance = await tx.leaveBalance.findFirst({
        where: {
          companyId: tenant.companyId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: requestYear,
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: leaveDays },
            remainingDays: { increment: leaveDays },
          },
        });
      }

      // Create Notification for Employee
      await tx.notification.create({
        data: {
          companyId: tenant.companyId,
          recipientType: ActorType.EMPLOYEE,
          recipientId: request.employeeId,
          title: "ใบลาของคุณไม่ได้รับการอนุมัติ",
          message: `คำขอลาเลขที่ ${request.requestNumber} ไม่ได้รับการอนุมัติ เหตุผล: ${rejectionReason}`,
          payload: { leaveRequestId: request.id, rejectionReason },
        },
      });

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.USER,
          actorId: tenant.userId,
          action: "REJECT_LEAVE",
          resource: "LeaveRequest",
          resourceId: request.id,
          details: {
            requestNumber: request.requestNumber,
            employeeId: request.employeeId,
            rejectionReason,
          },
        },
      });
    });

    // 5. Non-blocking Notification Dispatch
    NotificationService.notifyLeaveRejected(
      request.id,
      rejectionReason.trim(),
    ).catch((err) => {
      console.warn("Failed to dispatch leave rejected notification:", err);
    });

    return {
      success: true,
      message: "ไม่อนุมัติใบลาเรียบร้อยแล้ว และคืนยอดวันลาให้พนักงาน",
    };
  } catch (error) {
    console.error("Reject Leave Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการปฏิเสธใบลา",
    };
  }
}
