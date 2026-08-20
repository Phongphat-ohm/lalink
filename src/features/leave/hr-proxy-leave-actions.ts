"use server";

import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { AuditLogger } from "@/lib/audit";
import { LeaveRequestStatus, LeavePeriod, Prisma } from "@prisma/client";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

/**
 * HR / Admin: Submit leave request on behalf of an employee (Emergency / Proxy)
 */
export async function createLeaveRequestByHrAction(
  employeeId: string,
  leaveTypeId: string,
  startDateStr: string,
  endDateStr: string,
  reason: string,
  period: LeavePeriod = LeavePeriod.FULL_DAY,
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const tenant = await requireTenantContext();
    if (!hasPermission(tenant.role, PERMISSIONS.LEAVE_CREATE) && !hasPermission(tenant.role, PERMISSIONS.LEAVE_APPROVE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการยื่นใบลาแทนพนักงาน" };
    }

    const [employee, leaveType] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: employeeId, companyId: tenant.companyId },
        select: { id: true, firstName: true, lastName: true, employeeCode: true, lineUserId: true },
      }),
      prisma.leaveType.findFirst({
        where: { id: leaveTypeId, companyId: tenant.companyId },
      }),
    ]);

    if (!employee) {
      return { success: false, message: "ไม่พบข้อมูลพนักงาน" };
    }
    if (!leaveType) {
      return { success: false, message: "ไม่พบประเภทการลา" };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { success: false, message: "รูปแบบวันที่ไม่ถูกต้อง" };
    }
    if (endDate < startDate) {
      return { success: false, message: "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น" };
    }

    // Calculate days
    const calcResult = calculateLeaveDays({
      startDate,
      endDate,
      startPeriod: period,
      endPeriod: period,
    });
    const totalDays = calcResult.totalDays;

    if (totalDays <= 0) {
      return { success: false, message: "จำนวนวันลาต้องมากกว่า 0" };
    }

    // Check overlap
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        companyId: tenant.companyId,
        employeeId,
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlap) {
      return { success: false, message: "พนักงานมีรายการลาอื่นในช่วงวันดังกล่าวแล้ว" };
    }

    const currentYear = startDate.getFullYear();

    // Generate request number
    const countToday = await prisma.leaveRequest.count({
      where: { companyId: tenant.companyId },
    });
    const requestNumber = `LR-${currentYear}${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(countToday + 1).padStart(4, "0")}`;

    // Run in transaction: Create request, deduct balance, create transaction ledger
    const result = await prisma.$transaction(async (tx) => {
      // Find or create balance
      let balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (!balance) {
        balance = await tx.leaveBalance.create({
          data: {
            companyId: tenant.companyId,
            employeeId,
            leaveTypeId,
            year: currentYear,
            allocatedDays: leaveType.defaultDays,
            usedDays: new Prisma.Decimal(0),
            pendingDays: new Prisma.Decimal(0),
            remainingDays: leaveType.defaultDays,
          },
        });
      }

      const balanceBefore = Number(balance.remainingDays);

      // Check balance
      if (balanceBefore < totalDays) {
        throw new Error(`วันลาคงเหลือไม่เพียงพอ (คงเหลือ ${balanceBefore} วัน, ยื่น ${totalDays} วัน)`);
      }

      // Create leave request directly approved by HR
      const request = await tx.leaveRequest.create({
        data: {
          companyId: tenant.companyId,
          employeeId,
          leaveTypeId,
          requestNumber,
          startDate,
          endDate,
          startPeriod: period,
          endPeriod: period,
          totalDays: new Prisma.Decimal(totalDays),
          reason: `[HR Proxy Submission]: ${reason}`,
          status: LeaveRequestStatus.APPROVED,
          approvedBy: tenant.userId,
        },
      });

      // Update balance
      const newUsed = Number(balance.usedDays) + totalDays;
      const newRemaining = balanceBefore - totalDays;

      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: new Prisma.Decimal(newUsed),
          remainingDays: new Prisma.Decimal(newRemaining),
        },
      });

      // Create ledger transaction
      await tx.leaveTransaction.create({
        data: {
          companyId: tenant.companyId,
          employeeId,
          leaveTypeId,
          leaveRequestId: request.id,
          type: "DEBIT",
          days: new Prisma.Decimal(totalDays),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(newRemaining),
          reason: `HR proxy submission: ${reason}`,
          createdBy: tenant.userId,
        },
      });

      return request;
    });

    // Send LINE Notification if employee is linked
    if (employee.lineUserId) {
      try {
        const { NotificationDispatcher } = await import("@/lib/notification/dispatcher");
        const dispatcher = NotificationDispatcher.createDefault();
        await dispatcher.dispatch({
          companyId: tenant.companyId,
          recipientType: "EMPLOYEE",
          recipientId: employee.id,
          lineUserId: employee.lineUserId,
          channel: "LINE",
          title: "ฝ่ายบุคคล (HR) ได้บันทึกการลาให้คุณเรียบร้อยแล้ว",
          message: `ประเภท: ${leaveType.name}\nวันที่: ${startDate.toLocaleDateString("th-TH")} - ${endDate.toLocaleDateString("th-TH")}\nจำนวน: ${totalDays} วัน\nเหตุผล: ${reason}`,
        });
      } catch (notifErr) {
        console.warn("LINE Notification failed:", notifErr);
      }
    }

    await AuditLogger.log({
      companyId: tenant.companyId,
      actorType: "USER",
      actorId: tenant.userId,
      action: "HR_PROXY_LEAVE_CREATE",
      resource: "LeaveRequest",
      resourceId: result.id,
      details: {
        employeeCode: employee.employeeCode,
        leaveTypeName: leaveType.name,
        totalDays,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    revalidatePath("/admin/leave-requests");
    revalidatePath("/admin/leave-balance");
    revalidatePath("/admin");

    return {
      success: true,
      message: `ยื่นและอนุมัติใบลาแทนคุณ ${employee.firstName} ${employee.lastName} จำนวน ${totalDays} วันเรียบร้อยแล้ว`,
      data: { requestId: result.id },
    };
  } catch (error: any) {
    console.error("HR Proxy Leave Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการยื่นใบลาแทนพนักงาน",
    };
  }
}

/**
 * HR / Admin: Revoke an already APPROVED leave request (with automatic balance reversal in ledger)
 */
export async function revokeApprovedLeaveAction(
  leaveRequestId: string,
  revokeReason: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();
    if (!hasPermission(tenant.role, PERMISSIONS.LEAVE_APPROVE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการเพิกถอนใบลา" };
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, lineUserId: true } },
        leaveType: { select: { name: true } },
      },
    });

    if (!leaveRequest || leaveRequest.companyId !== tenant.companyId) {
      return { success: false, message: "ไม่พบข้อมูลใบลา" };
    }

    if (leaveRequest.status !== LeaveRequestStatus.APPROVED) {
      return { success: false, message: "สามารถเพิกถอนได้เฉพาะใบลาที่อนุมัติแล้วเท่านั้น" };
    }

    const totalDays = Number(leaveRequest.totalDays);
    const currentYear = leaveRequest.startDate.getFullYear();

    // Transaction: Mark CANCELLED, revert balance, add REVERSAL ledger entry
    await prisma.$transaction(async (tx) => {
      // 1. Mark request as CANCELLED
      await tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: LeaveRequestStatus.CANCELLED,
          rejectionReason: `[REVOKED BY HR]: ${revokeReason}`,
        },
      });

      // 2. Find balance
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year: currentYear,
          },
        },
      });

      if (balance) {
        const balanceBefore = Number(balance.remainingDays);
        const newUsed = Math.max(0, Number(balance.usedDays) - totalDays);
        const newRemaining = balanceBefore + totalDays;

        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: new Prisma.Decimal(newUsed),
            remainingDays: new Prisma.Decimal(newRemaining),
          },
        });

        // 3. Create REVERSAL transaction
        await tx.leaveTransaction.create({
          data: {
            companyId: tenant.companyId,
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            leaveRequestId: leaveRequest.id,
            type: "REVERSAL",
            days: new Prisma.Decimal(totalDays),
            balanceBefore: new Prisma.Decimal(balanceBefore),
            balanceAfter: new Prisma.Decimal(newRemaining),
            reason: `Revocation & balance reversal by HR: ${revokeReason}`,
            createdBy: tenant.userId,
          },
        });
      }
    });

    // Notify employee via LINE
    if (leaveRequest.employee.lineUserId) {
      try {
        const { NotificationDispatcher } = await import("@/lib/notification/dispatcher");
        const dispatcher = NotificationDispatcher.createDefault();
        await dispatcher.dispatch({
          companyId: tenant.companyId,
          recipientType: "EMPLOYEE",
          recipientId: leaveRequest.employee.id,
          lineUserId: leaveRequest.employee.lineUserId,
          channel: "LINE",
          title: "ใบลาของคุณได้รับการเพิกถอนและคืนยอดวันลาแล้ว",
          message: `ประเภท: ${leaveRequest.leaveType.name}\nวันที่: ${leaveRequest.startDate.toLocaleDateString("th-TH")} - ${leaveRequest.endDate.toLocaleDateString("th-TH")}\nคืนยอดวันลา: ${totalDays} วัน\nเหตุผล: ${revokeReason}`,
        });
      } catch (notifErr) {
        console.warn("LINE Notification failed:", notifErr);
      }
    }

    await AuditLogger.log({
      companyId: tenant.companyId,
      actorType: "USER",
      actorId: tenant.userId,
      action: "REVOKE_APPROVED_LEAVE",
      resource: "LeaveRequest",
      resourceId: leaveRequestId,
      details: {
        employeeCode: leaveRequest.employee.employeeCode,
        totalDays,
        revokeReason,
      },
    });

    revalidatePath("/admin/leave-requests");
    revalidatePath("/admin/leave-balance");
    revalidatePath("/admin");

    return {
      success: true,
      message: `เพิกถอนใบลาและคืนยอดวันลา ${totalDays} วันให้คุณ ${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName} เรียบร้อยแล้ว`,
    };
  } catch (error: any) {
    console.error("Revoke Leave Error:", error);
    return {
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการเพิกถอนใบลา",
    };
  }
}
