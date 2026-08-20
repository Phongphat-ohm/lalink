"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import crypto from "crypto";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

/**
 * Super Admin: Force Revoke a user session
 */
export async function superAdminRevokeSessionAction(
  sessionId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    const targetSession = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!targetSession) {
      return { success: false, message: "ไม่พบ Session" };
    }

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "REVOKE_SESSION",
      resource: "UserSession",
      resourceId: sessionId,
      details: {
        targetUser: targetSession.user.email,
        device: targetSession.device,
      },
    });

    revalidatePath("/system-admin/sessions");

    return {
      success: true,
      message: `เพิกถอน Session ของ ${targetSession.user.name} เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Revoke Session Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิกถอน Session" };
  }
}

/**
 * Super Admin: Trigger Real Database Backup
 */
export async function triggerDatabaseBackupAction(): Promise<ActionResult<{ backupId: string; filename: string }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    const { BackupService } = await import("@/lib/backup/backup-service");
    const { backupLog } = await BackupService.createDatabaseBackup("MANUAL");

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "DATABASE_BACKUP",
      resource: "BackupLog",
      resourceId: backupLog.id,
      details: { filename: backupLog.filename, sizeBytes: Number(backupLog.sizeBytes), triggerType: "MANUAL" },
    });

    revalidatePath("/system-admin/backup");

    return {
      success: true,
      message: `สร้างไฟล์สำรองฐานข้อมูลจริง "${backupLog.filename}" สำเร็จเรียบร้อยแล้ว`,
      data: { backupId: backupLog.id, filename: backupLog.filename },
    };
  } catch (error) {
    console.error("Trigger Backup Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสำรองฐานข้อมูล" };
  }
}

/**
 * Super Admin: Create API Key (Platform or Company-scoped)
 */
export async function createApiKeyAction(
  name: string,
  permissions: string[],
  companyId?: string | null,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    const rawSecret = crypto.randomBytes(24).toString("hex");
    const keyPrefix = `lal_live_${rawSecret.slice(0, 8)}`;
    const fullApiKey = `lal_live_${rawSecret}`;
    const keyHash = crypto
      .createHash("sha256")
      .update(fullApiKey)
      .digest("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        companyId: companyId || null,
        name,
        keyPrefix,
        keyHash,
        permissions: permissions.length > 0 ? permissions : ["*"],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_API_KEY",
      resource: "ApiKey",
      resourceId: apiKey.id,
      details: { name: apiKey.name, keyPrefix: apiKey.keyPrefix, companyId: apiKey.companyId },
    });

    revalidatePath("/system-admin/api-keys");

    return {
      success: true,
      message:
        "สร้าง API Key สำเร็จ! กรุณาคัดลอกและเก็บกุญแจนี้ไว้ในที่ปลอดภัย",
      data: {
        id: apiKey.id,
        name: apiKey.name,
        fullApiKey,
        keyPrefix: apiKey.keyPrefix,
      },
    };
  } catch (error) {
    console.error("Create API Key Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้าง API Key" };
  }
}

/**
 * Super Admin: Revoke API Key
 */
export async function revokeApiKeyAction(
  apiKeyId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isRevoked: true },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "REVOKE_API_KEY",
      resource: "ApiKey",
      resourceId: apiKeyId,
    });

    revalidatePath("/system-admin/api-keys");

    return { success: true, message: "เพิกถอน API Key เรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Revoke API Key Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิกถอน API Key" };
  }
}

/**
 * Super Admin: Create Webhook Subscription for any company
 */
export async function superAdminCreateWebhookAction(
  companyId: string,
  url: string,
  events: string[],
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    if (!companyId || !url || !Array.isArray(events) || events.length === 0) {
      return { success: false, message: "กรุณาระบุข้อมูลให้ครบถ้วน" };
    }

    const secret = crypto.randomBytes(32).toString("hex");
    const secretHash = crypto
      .createHash("sha256")
      .update(secret)
      .digest("hex");

    const sub = await prisma.webhookSubscription.create({
      data: {
        companyId,
        url,
        secret: secretHash,
        events,
        isActive: true,
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_WEBHOOK",
      resource: "WebhookSubscription",
      resourceId: sub.id,
      details: { url, events, companyId },
    });

    revalidatePath("/system-admin/webhooks");

    return {
      success: true,
      message: "สร้าง Webhook Subscription สำเร็จ!",
      data: {
        id: sub.id,
        url: sub.url,
        events: sub.events,
        secret,
      },
    };
  } catch (error) {
    console.error("Super Admin Create Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้าง Webhook" };
  }
}

/**
 * Super Admin: Delete Webhook Subscription
 */
export async function superAdminDeleteWebhookAction(
  subscriptionId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    await prisma.webhookSubscription.delete({
      where: { id: subscriptionId },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_WEBHOOK",
      resource: "WebhookSubscription",
      resourceId: subscriptionId,
    });

    revalidatePath("/system-admin/webhooks");

    return { success: true, message: "ลบ Webhook เรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Super Admin Delete Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบ Webhook" };
  }
}

/**
 * Super Admin: Toggle Webhook Subscription Active
 */
export async function superAdminToggleWebhookAction(
  subscriptionId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    await prisma.webhookSubscription.update({
      where: { id: subscriptionId },
      data: { isActive },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: isActive ? "ENABLE_WEBHOOK_SYSTEM" : "DISABLE_WEBHOOK_SYSTEM",
      resource: "WebhookSubscription",
      resourceId: subscriptionId,
      details: { url: (await prisma.webhookSubscription.findUnique({ where: { id: subscriptionId } }))?.url, isActive },
    });

    revalidatePath("/system-admin/webhooks");

    return {
      success: true,
      message: isActive ? "เปิดใช้งาน Webhook แล้ว" : "ปิดการใช้งาน Webhook แล้ว",
    };
  } catch (error) {
    console.error("Super Admin Toggle Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาด" };
  }
}

/**
 * Super Admin: Test Webhook Endpoint Dispatch
 */
export async function superAdminTestWebhookAction(
  subscriptionId: string,
): Promise<ActionResult<{ status: number; success: boolean; body?: string }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized: Super Admin access required",
      };
    }

    const sub = await prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) {
      return { success: false, message: "ไม่พบ Webhook Subscription" };
    }

    const testPayload = {
      event: "system.test",
      timestamp: new Date().toISOString(),
      triggeredBy: session.name,
      message: "Test webhook event triggered from LALINK System Admin console.",
    };

    const signature = crypto
      .createHash("sha256")
      .update(sub.secret + JSON.stringify(testPayload))
      .digest("hex");

    const res = await fetch(sub.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-signature": signature,
      },
      body: JSON.stringify(testPayload),
    });

    const resBody = await res.text();

    await prisma.webhookEventLog.create({
      data: {
        subscriptionId: sub.id,
        eventName: "system.test",
        payload: testPayload,
        success: res.ok,
        responseStatus: res.status,
        responseBody: resBody.slice(0, 500),
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "TEST_WEBHOOK",
      resource: "WebhookSubscription",
      resourceId: sub.id,
      details: { url: sub.url, event: "system.test", success: res.ok, status: res.status },
    });

    revalidatePath("/system-admin/webhooks");

    if (res.ok) {
      return {
        success: true,
        message: `ทดสอบสำเร็จ! Server ปลายทางตอบกลับ HTTP ${res.status}`,
        data: { status: res.status, success: true, body: resBody.slice(0, 200) },
      };
    } else {
      return {
        success: false,
        message: `Server ปลายทางตอบกลับข้อผิดพลาด HTTP ${res.status}`,
        data: { status: res.status, success: false, body: resBody.slice(0, 200) },
      };
    }
  } catch (error) {
    console.error("Super Admin Test Webhook Error:", error);
    return {
      success: false,
      message: `ไม่สามารถส่ง Webhook ไปยังปลายทางได้: ${(error as Error).message}`,
    };
  }
}

