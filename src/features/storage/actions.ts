"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/database";
import {
  storageService,
  validateUploadFile,
  sanitizeFilename,
  generateLeaveAttachmentKey,
} from "@/lib/storage";
import crypto from "crypto";

import type { ActionResult } from "@/lib/types";
/** @deprecated Use ActionResult instead */
export type StorageActionResult<T = unknown> = ActionResult<T>;

/**
 * Upload an attachment for a Leave Request
 */
export async function uploadLeaveAttachmentAction(formData: FormData): Promise<
  StorageActionResult<{
    attachmentId: string;
    originalName: string;
    size: number;
    objectKey: string;
  }>
> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนอัปโหลดไฟล์" };
    }

    const leaveRequestId = formData.get("leaveRequestId") as string;
    const file = formData.get("file") as File | null;

    if (!leaveRequestId) {
      return {
        success: false,
        message: "ไม่พบรหัสคำขอลางาน (leaveRequestId)",
      };
    }

    if (!file || file.size === 0) {
      return { success: false, message: "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด" };
    }

    // Verify Leave Request Ownership & Tenant Boundary
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: { employee: true },
    });

    if (!leaveRequest || leaveRequest.companyId !== session.companyId) {
      return {
        success: false,
        message: "ไม่พบข้อมูลคำขอลางาน หรือไม่มีสิทธิ์เข้าถึง",
      };
    }

    // If Employee session, verify ownership
    if (
      session.type === "EMPLOYEE" &&
      leaveRequest.employeeId !== session.employeeId
    ) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์อัปโหลดเอกสารสำหรับใบลาของผู้อื่น",
      };
    }

    // Convert file to Uint8Array Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate File Signature, Size, and Extension
    const rawFilename = file.name || "attachment";
    const validation = validateUploadFile(rawFilename, buffer, file.type);

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || "ไฟล์ไม่ผ่านการตรวจสอบความปลอดภัย",
      };
    }

    const safeName = sanitizeFilename(rawFilename);
    const fileId = crypto.randomUUID();
    const extension = validation.extension || "pdf";

    // Generate Tenant-partitioned Object Key
    const objectKey = generateLeaveAttachmentKey({
      companyId: session.companyId!,
      employeeId: leaveRequest.employeeId,
      leaveRequestId: leaveRequest.id,
      fileId,
      extension,
    });

    // Upload to S3-Compatible Storage
    const uploadResult = await storageService.upload({
      key: objectKey,
      buffer,
      contentType: validation.mimeType || file.type,
      metadata: {
        companyId: session.companyId!,
        employeeId: leaveRequest.employeeId,
        originalName: encodeURIComponent(safeName),
      },
    });

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const uploadedBy =
      session.type === "EMPLOYEE" ? session.employeeId! : session.userId!;

    // Save Attachment record to Database
    const attachment = await prisma.leaveAttachment.create({
      data: {
        companyId: session.companyId!,
        leaveRequestId: leaveRequest.id,
        uploadedBy,
        originalName: safeName,
        objectKey,
        mimeType: validation.mimeType || file.type,
        size: buffer.byteLength,
        bucket: uploadResult.bucket,
        checksum,
      },
    });

    return {
      success: true,
      message: "อัปโหลดเอกสารแนบสำเร็จ",
      data: {
        attachmentId: attachment.id,
        originalName: attachment.originalName,
        size: attachment.size,
        objectKey: attachment.objectKey,
      },
    };
  } catch (error) {
    console.error("Storage upload error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" };
  }
}

/**
 * Get Temporary Pre-signed Download URL with Tenant and IDOR Security Checks
 */
export async function getLeaveAttachmentDownloadUrlAction(
  attachmentId: string,
): Promise<StorageActionResult<{ downloadUrl: string; originalName: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนดาวน์โหลดเอกสาร" };
    }

    const attachment = await prisma.leaveAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        leaveRequest: true,
      },
    });

    if (!attachment || attachment.companyId !== session.companyId) {
      return {
        success: false,
        message: "ไม่พบเอกสาร หรือไม่มีสิทธิ์เข้าถึงเอกสารนี้",
      };
    }

    // If Employee session, verify ownership
    if (
      session.type === "EMPLOYEE" &&
      attachment.leaveRequest.employeeId !== session.employeeId
    ) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์เข้าถึงเอกสารใบลาของผู้อื่น",
      };
    }

    // Generate Pre-signed URL valid for 15 minutes (900 seconds)
    const downloadUrl = await storageService.getSignedDownloadUrl(
      attachment.objectKey,
      900,
    );

    return {
      success: true,
      data: {
        downloadUrl,
        originalName: attachment.originalName,
      },
    };
  } catch (error) {
    console.error("Storage get signed url error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างลิงก์ดาวน์โหลด",
    };
  }
}

/**
 * Delete Leave Attachment with Anti-IDOR Check
 */
export async function deleteLeaveAttachmentAction(
  attachmentId: string,
): Promise<StorageActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ" };
    }

    const attachment = await prisma.leaveAttachment.findUnique({
      where: { id: attachmentId },
      include: { leaveRequest: true },
    });

    if (!attachment || attachment.companyId !== session.companyId) {
      return {
        success: false,
        message: "ไม่พบเอกสาร หรือไม่มีสิทธิ์ลบเอกสารนี้",
      };
    }

    // Only allow deletion if leave request is still PENDING
    if (attachment.leaveRequest.status !== "PENDING") {
      return {
        success: false,
        message: "ไม่สามารถลบเอกสารแนบของใบลาที่ได้รับการพิจารณาแล้ว",
      };
    }

    // If Employee, check ownership
    if (
      session.type === "EMPLOYEE" &&
      attachment.leaveRequest.employeeId !== session.employeeId
    ) {
      return { success: false, message: "คุณไม่มีสิทธิ์ลบเอกสารของผู้อื่น" };
    }

    // Delete from S3
    await storageService.delete(attachment.objectKey);

    // Delete from DB
    await prisma.leaveAttachment.delete({
      where: { id: attachmentId },
    });

    return { success: true, message: "ลบเอกสารแนบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Storage delete error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบเอกสารแนบ" };
  }
}
