"use server";

import { createLeaveRequestSchema, cancelLeaveRequestSchema } from "./schemas";
import { parseThaiDateToCE } from "@/lib/utils/date";
import { prisma } from "@/lib/database";
import {
  requireTenantContext,
  scopedLeaveRequest,
  scopedHoliday,
  scopedLeaveType,
  scopedLeaveBalance,
  scopedAudit,
} from "@/lib/tenant";
import { calculateLeaveDays } from "@/lib/leave/calculator";
import { resolveEffectiveWorkSchedule } from "@/lib/leave/work-schedule";
import { resolveLeaveYear } from "@/lib/leave/leave-year";
import { initializeApprovals } from "@/lib/leave/approval-engine";
import { NotificationService } from "@/lib/notification";
import {
  storageService,
  validateUploadFile,
  sanitizeFilename,
  generateLeaveAttachmentKey,
} from "@/lib/storage";
import crypto from "crypto";
import { LeavePeriod, LeaveRequestStatus, ActorType } from "@prisma/client";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

/**
 * Creates a new Leave Request on behalf of the authenticated employee.
 */
export async function createLeaveRequestAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ redirectUrl: string }>> {
  try {
    const tenant = await requireTenantContext();
    if (tenant.type !== "EMPLOYEE" || !tenant.employeeId) {
      return {
        success: false,
        message: "เฉพาะพนักงานเท่านั้นที่สามารถยื่นใบลาผ่าน LINE LIFF ได้",
      };
    }

    const rawData = {
      leaveTypeId: formData.get("leaveTypeId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      startPeriod:
        (formData.get("startPeriod") as LeavePeriod) || LeavePeriod.FULL_DAY,
      endPeriod:
        (formData.get("endPeriod") as LeavePeriod) || LeavePeriod.FULL_DAY,
      hours: formData.get("hours"),
      reason: (formData.get("reason") as string) || "",
    };

    // 1. Zod Schema Validation
    const validated = createLeaveRequestSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const {
      leaveTypeId,
      startDate,
      endDate,
      startPeriod,
      endPeriod,
      hours,
      reason,
    } = validated.data;
    const startObj = parseThaiDateToCE(startDate)!;
    const endObj = parseThaiDateToCE(endDate)!;
    const leaveYear = await resolveLeaveYear(tenant.companyId, startObj);
    const requestYear = leaveYear.year;

    // 2. Fetch & Validate Leave Type Policy
    const leaveType = await scopedLeaveType.findById(
      tenant.companyId,
      leaveTypeId,
    );
    if (!leaveType || !leaveType.isActive) {
      return {
        success: false,
        message: "ไม่พบประเภทการลาที่เลือกหรือประเภทการลานี้ปิดใช้งานอยู่",
      };
    }

    if (leaveType.requireReason && (!reason || reason.trim().length === 0)) {
      return {
        success: false,
        message: `การลาประเภท "${leaveType.name}" จำเป็นต้องระบุเหตุผลการลา`,
        errors: { reason: ["กรุณาระบุเหตุผลการลา"] },
      };
    }

    const isHalfDay =
      startPeriod !== LeavePeriod.FULL_DAY ||
      endPeriod !== LeavePeriod.FULL_DAY;
    if (isHalfDay && !leaveType.allowHalfDay) {
      return {
        success: false,
        message: `ประเภทการลา "${leaveType.name}" ไม่อนุญาตให้ลาครึ่งวัน`,
      };
    }

    const isHourly =
      startPeriod === LeavePeriod.HOURLY || endPeriod === LeavePeriod.HOURLY;
    if (isHourly && !leaveType.allowHourly) {
      return {
        success: false,
        message: `ประเภทการลา "${leaveType.name}" ไม่อนุญาตให้ลารายชั่วโมง`,
      };
    }

    // 3. Fetch Company Holidays + Effective Work Schedule for Calculation
    const [holidays, workSchedule] = await Promise.all([
      scopedHoliday.listByYear(tenant.companyId, requestYear),
      resolveEffectiveWorkSchedule(tenant.companyId, tenant.employeeId!),
    ]);
    const calculation = calculateLeaveDays({
      startDate: startObj,
      endDate: endObj,
      startPeriod,
      endPeriod,
      hours: isHourly ? Number(hours) : undefined,
      holidays: holidays.map((h) => ({ date: h.date, name: h.name })),
      workSchedule:
        workSchedule.entries.length > 0 ? workSchedule.entries : undefined,
    });

    if (calculation.totalDays <= 0) {
      return {
        success: false,
        message:
          "ช่วงวันที่เลือกไม่มีวันทำการที่ต้องคิดเป็นวันลา (ตรงกับวันหยุด)",
      };
    }

    const totalLeaveDays = calculation.totalDays;

    // 4. Overlapping Check
    const hasOverlap = await scopedLeaveRequest.checkOverlappingLeave(
      tenant.companyId,
      tenant.employeeId,
      startObj,
      endObj,
    );

    if (hasOverlap) {
      return {
        success: false,
        message:
          "คุณมีคำขอลางานที่รออนุมัติหรืออนุมัติแล้วซ้อนทับกับช่วงเวลาดังกล่าว",
      };
    }

    // 5. Balance Check (for Paid Leave)
    const balance = await scopedLeaveBalance.getByEmployeeAndType(
      tenant.companyId,
      tenant.employeeId,
      leaveTypeId,
      requestYear,
    );

    if (leaveType.isPaid && balance) {
      const remaining = Number(balance.remainingDays);
      if (remaining < totalLeaveDays) {
        return {
          success: false,
          message: `โควตาวันลาคงเหลือไม่เพียงพอ (คงเหลือ: ${remaining} วัน, ขอลา: ${totalLeaveDays} วัน)`,
        };
      }
    }

    // 6. Attachment Validation & Storage Upload
    const attachmentFile = (formData.get("attachment") || formData.get("file")) as File | null;
    const requiredDays = leaveType.attachmentRequiredDays ? Number(leaveType.attachmentRequiredDays) : 1;
    if (leaveType.requireAttachment && totalLeaveDays >= requiredDays) {
      if (!attachmentFile || attachmentFile.size === 0) {
        return {
          success: false,
          message: `การลาประเภท "${leaveType.name}" ตั้งแต่ ${requiredDays} วันขึ้นไป จำเป็นต้องแนบเอกสารหรือใบรับรองแพทย์`,
        };
      }
    }

    let attachmentData: {
      originalName: string;
      objectKey: string;
      mimeType: string;
      size: number;
      bucket: string;
      checksum: string;
    } | null = null;

    if (attachmentFile && attachmentFile.size > 0) {
      const arrayBuffer = await attachmentFile.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const rawFilename = attachmentFile.name || "attachment";
      const validation = validateUploadFile(rawFilename, buffer, attachmentFile.type);

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || "ไฟล์เอกสารแนบไม่ผ่านการตรวจสอบความปลอดภัย",
        };
      }

      const safeName = sanitizeFilename(rawFilename);
      const fileId = crypto.randomUUID();
      const extension = validation.extension || "pdf";

      const objectKey = generateLeaveAttachmentKey({
        companyId: tenant.companyId,
        employeeId: tenant.employeeId!,
        leaveRequestId: "req_" + fileId.slice(0, 8),
        fileId,
        extension,
      });

      const uploadResult = await storageService.upload({
        key: objectKey,
        buffer,
        contentType: validation.mimeType || attachmentFile.type,
        metadata: {
          companyId: tenant.companyId,
          employeeId: tenant.employeeId!,
          originalName: encodeURIComponent(safeName),
        },
      });

      const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

      attachmentData = {
        originalName: safeName,
        objectKey,
        mimeType: validation.mimeType || attachmentFile.type,
        size: buffer.byteLength,
        bucket: uploadResult.bucket,
        checksum,
      };
    }

    // 7. Generate Sequential Request Number (e.g. LR-202608-0001)
    const countThisMonth = await prisma.leaveRequest.count({
      where: {
        companyId: tenant.companyId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const monthStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const seqStr = String(countThisMonth + 1).padStart(4, "0");
    const requestNumber = `LR-${monthStr}-${seqStr}`;

    let createdRequestId: string | null = null;

    // 8. Atomic Database Transaction: Create Request & Deduct Balance
    await prisma.$transaction(async (tx) => {
      // Create Leave Request
      const createdRequest = await tx.leaveRequest.create({
        data: {
          companyId: tenant.companyId,
          employeeId: tenant.employeeId!,
          leaveTypeId,
          requestNumber,
          startDate: startObj,
          endDate: endObj,
          startPeriod,
          endPeriod,
          totalDays: totalLeaveDays,
          hours: isHourly ? Number(hours) : null,
          reason,
          status: LeaveRequestStatus.PENDING,
        },
      });

      createdRequestId = createdRequest.id;

      // Create Attachment Record if uploaded
      if (attachmentData) {
        await tx.leaveAttachment.create({
          data: {
            companyId: tenant.companyId,
            leaveRequestId: createdRequest.id,
            uploadedBy: tenant.employeeId!,
            originalName: attachmentData.originalName,
            objectKey: attachmentData.objectKey,
            mimeType: attachmentData.mimeType,
            size: attachmentData.size,
            bucket: attachmentData.bucket,
            checksum: attachmentData.checksum,
          },
        });
      }

      // Initialize multi-level approval steps (if workflow configured)
      await initializeApprovals(tx, {
        companyId: tenant.companyId,
        leaveTypeId,
        leaveRequestId: createdRequest.id,
      });

      // Update Leave Balance (Move from remaining to pending)
      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { increment: totalLeaveDays },
            remainingDays: { decrement: totalLeaveDays },
          },
        });
      }

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.EMPLOYEE,
          actorId: tenant.employeeId,
          action: "CREATE_LEAVE",
          resource: "LeaveRequest",
          resourceId: createdRequest.id,
          details: {
            requestNumber,
            leaveTypeId,
            totalDays: totalLeaveDays,
            hours: isHourly ? Number(hours) : null,
            startDate: startObj.toISOString(),
            endDate: endObj.toISOString(),
            hasAttachment: !!attachmentData,
          },
        },
      });
    });

    // 8. Non-blocking Notification Dispatch
    if (createdRequestId) {
      NotificationService.notifyLeaveSubmitted(createdRequestId).catch(
        (err) => {
          console.warn("Failed to dispatch leave submitted notification:", err);
        },
      );
    }

    return {
      success: true,
      data: { redirectUrl: "/liff/history" },
    };
  } catch (error) {
    console.error("Create Leave Request Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการส่งใบลา กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Cancels a pending leave request and restores employee's balance.
 */
export async function cancelLeaveRequestAction(
  leaveRequestId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();
    if (tenant.type !== "EMPLOYEE" || !tenant.employeeId) {
      return {
        success: false,
        message: "เฉพาะพนักงานเจ้าของใบลาเท่านั้นที่สามารถยกเลิกใบลาได้",
      };
    }

    const validated = cancelLeaveRequestSchema.safeParse({ leaveRequestId });
    if (!validated.success) {
      return {
        success: false,
        message: "รหัสใบลาไม่ถูกต้อง",
      };
    }

    // 1. Fetch & Verify Ownership (Anti-IDOR)
    const request = await scopedLeaveRequest.findById(
      tenant.companyId,
      leaveRequestId,
    );
    if (!request || request.employeeId !== tenant.employeeId) {
      return {
        success: false,
        message: "ไม่พบใบลาที่ระบุหรือคุณไม่มีสิทธิ์ในการยกเลิกใบลานี้",
      };
    }

    if (request.status !== LeaveRequestStatus.PENDING) {
      return {
        success: false,
        message: `ไม่สามารถยกเลิกใบลาที่มีสถานะ "${request.status}" ได้`,
      };
    }

    const leaveDays = Number(request.totalDays);
    const leaveYear = await resolveLeaveYear(
      tenant.companyId,
      request.startDate,
    );
    const requestYear = leaveYear.year;

    // 2. Atomic Transaction: Cancel & Restore Pending Balance
    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: LeaveRequestStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      // Restore Balance
      const balance = await tx.leaveBalance.findFirst({
        where: {
          companyId: tenant.companyId,
          employeeId: tenant.employeeId!,
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

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.EMPLOYEE,
          actorId: tenant.employeeId,
          action: "CANCEL_LEAVE",
          resource: "LeaveRequest",
          resourceId: request.id,
          details: {
            requestNumber: request.requestNumber,
            totalDays: leaveDays,
          },
        },
      });
    });

    // 3. Non-blocking Notification Dispatch
    NotificationService.notifyLeaveCancelled(request.id).catch((err) => {
      console.warn("Failed to dispatch leave cancelled notification:", err);
    });

    return {
      success: true,
      message: "ยกเลิกใบลาเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Cancel Leave Request Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการยกเลิกใบลา",
    };
  }
}
