"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import { MessageCategory, ThreadStatus } from "@prisma/client";
import {
  storageService,
  validateUploadFile,
  sanitizeFilename,
} from "@/lib/storage";
import { generateMessageAttachmentKey } from "@/lib/storage/partition";
import crypto from "crypto";
import type { ActionResult } from "@/lib/types";

export interface FileAttachmentPayload {
  originalName: string;
  base64: string;
  mimeType: string;
}

export interface CreateThreadInput {
  subject: string;
  category?: MessageCategory;
  companyId?: string;
  planUpgradeRequestId?: string;
  initialMessage: string;
  fileAttachment?: FileAttachmentPayload | null;
}

export interface ReplyMessageInput {
  threadId: string;
  content: string;
  isInternalOnly?: boolean;
  fileAttachment?: FileAttachmentPayload | null;
}

/**
 * Super Admin: Search companies dynamically for AutoSearch combobox
 */
export async function searchCompaniesAction(
  query: string,
): Promise<ActionResult<Array<{ id: string; name: string; code: string }>>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized", data: [] };
    }

    const trimmed = (query || "").trim();
    const companies = await prisma.company.findMany({
      where: trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { code: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
      take: 10,
    });

    return {
      success: true,
      data: companies,
    };
  } catch (error) {
    console.error("Search Companies Error:", error);
    return { success: false, message: "ค้นหาไม่สำเร็จ", data: [] };
  }
}

/**
 * Helper to process and store a file attachment in S3 and database
 */
async function processFileAttachment(
  filePayload: FileAttachmentPayload,
  companyId: string,
  threadId: string,
  messageId: string,
) {
  try {
    const buffer = Buffer.from(filePayload.base64, "base64");
    const uint8Array = new Uint8Array(buffer);

    const validation = validateUploadFile(
      filePayload.originalName,
      uint8Array,
      filePayload.mimeType,
    );

    if (!validation.isValid) {
      console.warn("Attachment validation warning:", validation.error);
      return null;
    }

    const fileId = crypto.randomUUID();
    const sanitizedBase = sanitizeFilename(filePayload.originalName);
    const objectKey = generateMessageAttachmentKey({
      companyId,
      threadId,
      fileId,
      extension: validation.extension || "bin",
    });

    await storageService.upload({
      key: objectKey,
      buffer,
      contentType: validation.mimeType || filePayload.mimeType,
    });

    return await prisma.messageAttachment.create({
      data: {
        id: fileId,
        messageId,
        originalName: filePayload.originalName,
        fileName: sanitizedBase,
        fileSize: buffer.length,
        mimeType: validation.mimeType || filePayload.mimeType,
        objectKey,
      },
    });
  } catch (err) {
    console.error("Process file attachment error:", err);
    return null;
  }
}

/**
 * Create a new message / ticket thread and initial message (supports file attachment)
 */
export async function createMessageThreadAction(
  input: CreateThreadInput,
): Promise<ActionResult<{ threadId: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    if (!input.subject.trim() || !input.initialMessage.trim()) {
      return { success: false, message: "กรุณาระบุหัวข้อและข้อความ" };
    }

    const companyId = session.role === "SYSTEM_ADMIN" ? input.companyId || null : session.companyId;

    const thread = await prisma.messageThread.create({
      data: {
        subject: input.subject.trim(),
        category: input.category || MessageCategory.GENERAL,
        status: ThreadStatus.OPEN,
        companyId,
        planUpgradeRequestId: input.planUpgradeRequestId || null,
        createdById: session.userId,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: session.userId,
            content: input.initialMessage.trim(),
            isRead: false,
          },
        },
      },
      include: {
        messages: { select: { id: true } },
      },
    });

    const firstMsg = thread.messages[0];
    if (input.fileAttachment && firstMsg) {
      await processFileAttachment(
        input.fileAttachment,
        companyId || "global",
        thread.id,
        firstMsg.id,
      );
    }

    await AuditLogger.log({
      companyId: companyId || "SYSTEM",
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_MESSAGE_THREAD",
      resource: "MessageThread",
      resourceId: thread.id,
      details: {
        subject: thread.subject,
        category: thread.category,
        companyId,
        hasAttachment: !!input.fileAttachment,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/system-admin/messages");
    revalidatePath("/admin/subscription");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: "ส่งข้อความเรียบร้อยแล้ว",
      data: { threadId: thread.id },
    };
  } catch (error) {
    console.error("Create Message Thread Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการส่งข้อความ" };
  }
}

/**
 * Post a reply in an existing thread (supports file attachment)
 */
export async function replyMessageAction(
  input: ReplyMessageInput,
): Promise<ActionResult<{ messageId: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    if (!input.content.trim() && !input.fileAttachment) {
      return { success: false, message: "กรุณากรอกข้อความตอบกลับหรือแนบไฟล์" };
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: input.threadId },
    });

    if (!thread) {
      return { success: false, message: "ไม่พบหัวข้อสนทนานี้" };
    }

    if (session.role !== "SYSTEM_ADMIN" && thread.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์ในการส่งข้อความในหัวข้อนี้" };
    }

    const now = new Date();

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: session.userId,
          content: input.content.trim() || (input.fileAttachment ? `[แนบไฟล์: ${input.fileAttachment.originalName}]` : ""),
          isInternalOnly: session.role === "SYSTEM_ADMIN" ? !!input.isInternalOnly : false,
          isRead: false,
        },
      }),
      prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          lastMessageAt: now,
          status: ThreadStatus.OPEN, // Reopen if closed
        },
      }),
    ]);

    if (input.fileAttachment) {
      await processFileAttachment(
        input.fileAttachment,
        thread.companyId || "global",
        thread.id,
        message.id,
      );
    }

    await AuditLogger.log({
      companyId: thread.companyId || "SYSTEM",
      actorType: "USER",
      actorId: session.userId,
      action: "REPLY_MESSAGE",
      resource: "MessageThread",
      resourceId: thread.id,
      details: {
        messageId: message.id,
        isInternalOnly: input.isInternalOnly,
        hasAttachment: !!input.fileAttachment,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/system-admin/messages");
    revalidatePath("/admin/subscription");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: "ส่งข้อความตอบกลับเรียบร้อยแล้ว",
      data: { messageId: message.id },
    };
  } catch (error) {
    console.error("Reply Message Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการตอบกลับ" };
  }
}

/**
 * Get Download URL for a Message Attachment
 */
export async function getMessageAttachmentDownloadUrlAction(
  attachmentId: string,
): Promise<ActionResult<{ url: string; originalName: string; mimeType: string }>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized" };
    }

    const attachment = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          include: {
            thread: { select: { companyId: true } },
          },
        },
      },
    });

    if (!attachment) {
      return { success: false, message: "ไม่พบไฟล์แนบที่ระบุ" };
    }

    // Tenant check
    if (
      session.role !== "SYSTEM_ADMIN" &&
      attachment.message.thread.companyId !== session.companyId
    ) {
      return { success: false, message: "ไม่มีสิทธิ์เข้าถึงไฟล์นี้" };
    }

    const presignedUrl = await storageService.getSignedDownloadUrl(
      attachment.objectKey,
      3600,
    );

    return {
      success: true,
      data: {
        url: presignedUrl,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
      },
    };
  } catch (error) {
    console.error("Get Attachment URL Error:", error);
    return { success: false, message: "ไม่สามารถสร้างลิงก์ดาวน์โหลดได้" };
  }
}

/**
 * Change status of a message thread (OPEN, RESOLVED, CLOSED)
 */
export async function updateThreadStatusAction(
  threadId: string,
  status: ThreadStatus,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" };
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return { success: false, message: "ไม่พบหัวข้อสนทนา" };
    }

    if (session.role !== "SYSTEM_ADMIN" && thread.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์แก้ไขสถานะนี้" };
    }

    await prisma.messageThread.update({
      where: { id: threadId },
      data: { status },
    });

    await AuditLogger.log({
      companyId: thread.companyId || "SYSTEM",
      actorType: "USER",
      actorId: session.userId,
      action: "UPDATE_THREAD_STATUS",
      resource: "MessageThread",
      resourceId: threadId,
      details: { previousStatus: thread.status, newStatus: status },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/system-admin/messages");

    return {
      success: true,
      message: `เปลี่ยนสถานะหัวข้อเป็น ${status === "RESOLVED" ? "แก้ไขแล้ว" : status === "CLOSED" ? "ปิดงาน" : "เปิดอยู่"} สำเร็จ`,
    };
  } catch (error) {
    console.error("Update Thread Status Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ" };
  }
}

/**
 * Fetch messages for a thread and mark other parties' messages as read
 */
export async function getThreadMessagesAction(threadId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: "Unauthorized", data: null };
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        company: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, email: true, role: { select: { code: true } } } },
        planUpgradeRequest: {
          include: {
            targetPlan: true,
            currentPlan: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: { select: { code: true, name: true } },
              },
            },
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!thread) {
      return { success: false, message: "ไม่พบหัวข้อสนทนา", data: null };
    }

    if (session.role !== "SYSTEM_ADMIN" && thread.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์เข้าถึง", data: null };
    }

    // Mark unread messages sent by other users as read
    const unreadMessageIds = thread.messages
      .filter((m) => !m.isRead && m.senderId !== session.userId)
      .map((m) => m.id);

    if (unreadMessageIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadMessageIds } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return {
      success: true,
      data: thread,
    };
  } catch (error) {
    console.error("Get Thread Messages Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อความ", data: null };
  }
}
