"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import crypto from "crypto";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

/**
 * Company Admin: Create API Key (scoped to the admin's company)
 */
export async function createCompanyApiKeyAction(
  name: string,
  permissions: string[],
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.type !== "USER" || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized: Company Admin access required",
      };
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { enableApi: true, status: true },
    });

    if (!company || company.status === "SUSPENDED") {
      return { success: false, message: "องค์กรถูกระงับการใช้งานชั่วคราว" };
    }

    if (!company.enableApi) {
      return {
        success: false,
        message: "องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน API กรุณาติดต่อ System Administrator เพื่อขอเปิดใช้งาน",
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
        companyId: session.companyId,
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
      details: { name: apiKey.name, keyPrefix: apiKey.keyPrefix, companyId: session.companyId },
    });

    revalidatePath("/admin/api-keys");

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
    console.error("Create Company API Key Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้าง API Key" };
  }
}

/**
 * Company Admin: Revoke API Key (only keys belonging to the admin's company)
 */
export async function revokeCompanyApiKeyAction(
  apiKeyId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.type !== "USER" || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized: Company Admin access required",
      };
    }

    // Verify the key belongs to this company
    const key = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!key) {
      return { success: false, message: "ไม่พบ API Key" };
    }
    if (key.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์เข้าถึง API Key นี้" };
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
      details: { companyId: session.companyId },
    });

    revalidatePath("/admin/api-keys");

    return { success: true, message: "เพิกถอน API Key เรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Revoke Company API Key Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิกถอน API Key" };
  }
}

/**
 * Company Admin: Create Webhook Subscription (scoped to the admin's company)
 */
export async function createWebhookSubscriptionAction(
  url: string,
  events: string[],
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.type !== "USER" || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized: Company Admin access required",
      };
    }

    if (!url || events.length === 0) {
      return { success: false, message: "กรุณาระบุ URL และ Events" };
    }

    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { enableWebhook: true, status: true },
    });

    if (!company || company.status === "SUSPENDED") {
      return { success: false, message: "องค์กรถูกระงับการใช้งานชั่วคราว" };
    }

    if (!company.enableWebhook) {
      return {
        success: false,
        message: "องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน Webhook กรุณาติดต่อ System Administrator เพื่อขอเปิดใช้งาน",
      };
    }

    // Generate signing secret
    const secret = crypto.randomBytes(32).toString("hex");
    const secretHash = crypto
      .createHash("sha256")
      .update(secret)
      .digest("hex");

    const sub = await prisma.webhookSubscription.create({
      data: {
        companyId: session.companyId,
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
      details: { url, events, companyId: session.companyId },
    });

    revalidatePath("/admin/webhooks");

    return {
      success: true,
      message: "สร้าง Webhook สำเร็จ! กรุณาคัดลอก Secret ไว้ในที่ปลอดภัย",
      data: {
        id: sub.id,
        url: sub.url,
        events: sub.events,
        secret, // Return raw secret only once
      },
    };
  } catch (error) {
    console.error("Create Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้าง Webhook" };
  }
}

/**
 * Company Admin: Delete Webhook Subscription (only subscriptions belonging to the admin's company)
 */
export async function deleteWebhookSubscriptionAction(
  subscriptionId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.type !== "USER" || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized: Company Admin access required",
      };
    }

    const sub = await prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) {
      return { success: false, message: "ไม่พบ Webhook Subscription" };
    }
    if (sub.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์เข้าถึง Webhook นี้" };
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
      details: { companyId: session.companyId },
    });

    revalidatePath("/admin/webhooks");

    return { success: true, message: "ลบ Webhook Subscription เรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบ Webhook" };
  }
}

/**
 * Company Admin: Toggle Webhook Subscription active/inactive
 */
export async function toggleWebhookSubscriptionAction(
  subscriptionId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.type !== "USER" || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized: Company Admin access required",
      };
    }

    const sub = await prisma.webhookSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) {
      return { success: false, message: "ไม่พบ Webhook Subscription" };
    }
    if (sub.companyId !== session.companyId) {
      return { success: false, message: "ไม่มีสิทธิ์เข้าถึง Webhook นี้" };
    }

    await prisma.webhookSubscription.update({
      where: { id: subscriptionId },
      data: { isActive },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: isActive ? "ENABLE_WEBHOOK" : "DISABLE_WEBHOOK",
      resource: "WebhookSubscription",
      resourceId: subscriptionId,
      details: { url: sub.url, isActive, companyId: session.companyId },
    });

    revalidatePath("/admin/webhooks");

    return {
      success: true,
      message: isActive
        ? "เปิดใช้งาน Webhook เรียบร้อย"
        : "ปิดใช้งาน Webhook เรียบร้อย",
    };
  } catch (error) {
    console.error("Toggle Webhook Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาด" };
  }
}
