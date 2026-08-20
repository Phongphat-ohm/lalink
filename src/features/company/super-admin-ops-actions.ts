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
 * Super Admin: Create API Key
 */
export async function createApiKeyAction(
  name: string,
  permissions: string[],
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
      details: { name: apiKey.name, keyPrefix: apiKey.keyPrefix },
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
