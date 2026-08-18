"use server";

import { prisma } from "@/lib/database";
import { requireTenantContext, scopedLeaveRequest } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { NotificationService } from "@/lib/notification";
import { processApproval } from "@/lib/leave/approval-engine";
import { resolveLeaveYear } from "@/lib/leave/leave-year";
import type { ActionResult } from "@/lib/types";
import {
  LeaveRequestStatus,
  LeaveTransactionType,
  ActorType,
} from "@prisma/client";

export type { ActionResult };

/**
 * Server action to approve a leave request (single or multi-step).
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

    // 3. Atomic Transaction: advance workflow + balance on final approval
    const outcome = await prisma.$transaction(async (tx) => {
      const result = await processApproval(tx, {
        leaveRequestId: request.id,
        actor: {
          userId: tenant.userId,
          roleCode: tenant.role,
        },
        decision: "APPROVE",
      });

      const isFinal = result.isFinalized;
      const isApproved = result.requestStatus === LeaveRequestStatus.APPROVED;

      // Advance the request status to the outcome
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: result.requestStatus,
          ...(isApproved
            ? { approvedBy: tenant.userId, approvedAt: new Date() }
            : {}),
        },
      });

      if (isFinal && isApproved) {
        const leaveDays = Number(request.totalDays);
        const leaveYear = await resolveLeaveYear(
          tenant.companyId,
          request.startDate,
        );
        const requestYear = leaveYear.year;

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

        // Notify employee (final approval)
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
      }

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.USER,
          actorId: tenant.userId,
          action: isApproved && isFinal ? "APPROVE_LEAVE" : "APPROVE_LEAVE_STEP",
          resource: "LeaveRequest",
          resourceId: request.id,
          details: {
            requestNumber: request.requestNumber,
            employeeId: request.employeeId,
            step: result.currentStep,
            totalSteps: result.totalSteps,
            workflowDriven: result.isWorkflowDriven,
          },
        },
      });

      return result;
    });

    // 4. Non-blocking Notification Dispatch
    if (outcome.isFinalized) {
      NotificationService.notifyLeaveApproved(request.id).catch((err) => {
        console.warn("Failed to dispatch leave approved notification:", err);
      });
    }

    return {
      success: true,
      message:
        outcome.isFinalized
          ? "อนุมัติใบลาเรียบร้อยแล้ว"
          : `อนุมัติขั้นตอนที่ ${outcome.currentStep}/${outcome.totalSteps} แล้ว ใบลายังอยู่ในระหว่างการอนุมัติ`,
    };
  } catch (error) {
    console.error("Approve Leave Error:", error);
    const message =
      error instanceof Error &&
      error.message.includes("is not assigned to you")
        ? "คุณไม่มีสิทธิ์อนุมัติใบลาในขั้นตอนนี้"
        : "เกิดข้อผิดพลาดในการอนุมัติใบลา";
    return {
      success: false,
      message,
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

    // 4. Atomic Transaction: advance workflow + restore balance
    const outcome = await prisma.$transaction(async (tx) => {
      const result = await processApproval(tx, {
        leaveRequestId: request.id,
        actor: {
          userId: tenant.userId,
          roleCode: tenant.role,
        },
        decision: "REJECT",
        comment: rejectionReason.trim(),
      });

      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: LeaveRequestStatus.REJECTED,
          rejectionReason: rejectionReason.trim(),
          rejectedBy: tenant.userId,
          rejectedAt: new Date(),
        },
      });

      // Restore Balance (Move from pending back to remaining)
      const leaveDays = Number(request.totalDays);
      const leaveYear = await resolveLeaveYear(
        tenant.companyId,
        request.startDate,
      );
      const requestYear = leaveYear.year;
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

      // Notify employee
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
            step: result.currentStep,
            totalSteps: result.totalSteps,
            rejectionReason,
          },
        },
      });

      return result;
    });

    // 5. Non-blocking Notification Dispatch
    if (outcome.isFinalized) {
      NotificationService.notifyLeaveRejected(
        request.id,
        rejectionReason.trim(),
      ).catch((err) => {
        console.warn("Failed to dispatch leave rejected notification:", err);
      });
    }

    return {
      success: true,
      message: "ไม่อนุมัติใบลาเรียบร้อยแล้ว และคืนยอดวันลาให้พนักงาน",
    };
  } catch (error) {
    console.error("Reject Leave Error:", error);
    const message =
      error instanceof Error &&
      error.message.includes("is not assigned to you")
        ? "คุณไม่มีสิทธิ์ปฏิเสธใบลาในขั้นตอนนี้"
        : "เกิดข้อผิดพลาดในการปฏิเสธใบลา";
    return {
      success: false,
      message,
    };
  }
}