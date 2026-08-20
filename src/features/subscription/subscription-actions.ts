"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import { SubscriptionStatus } from "@prisma/client";
import type { ActionResult } from "@/lib/types";

/**
 * Super Admin: Assign or change a company's SaaS Plan and Subscription
 */
export async function assignCompanySubscriptionAction(
  companyId: string,
  planId: string,
  status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
  durationMonths: number = 12,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง (Super Admin เท่านั้น)" };
    }

    const [company, plan] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, code: true } }),
      prisma.plan.findUnique({ where: { id: planId }, select: { id: true, name: true, code: true } }),
    ]);

    if (!company) {
      return { success: false, message: "ไม่พบข้อมูลบริษัท" };
    }
    if (!plan) {
      return { success: false, message: "ไม่พบข้อมูลแพ็กเกจ" };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
    const trialEndsAt =
      status === SubscriptionStatus.TRIAL
        ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
        : null;

    const subscription = await prisma.subscription.upsert({
      where: { companyId },
      create: {
        companyId,
        planId,
        status,
        startDate: now,
        endDate,
        trialEndsAt,
      },
      update: {
        planId,
        status,
        startDate: now,
        endDate,
        trialEndsAt,
        cancelledAt: null,
      },
    });

    await AuditLogger.log({
      companyId: company.id,
      actorType: "USER",
      actorId: session.userId,
      action: "ASSIGN_SUBSCRIPTION",
      resource: "Subscription",
      resourceId: subscription.id,
      details: {
        companyCode: company.code,
        planCode: plan.code,
        status,
        endDate: endDate.toISOString(),
      },
    });

    revalidatePath("/system-admin/subscriptions");
    revalidatePath("/system-admin/companies");
    revalidatePath("/system-admin");

    return {
      success: true,
      message: `กำหนดแพ็กเกจ "${plan.name}" ให้กับบริษัท "${company.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Assign Subscription Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการกำหนดแพ็กเกจ" };
  }
}

/**
 * Super Admin: Update subscription status (TRIAL, ACTIVE, CANCELLED, EXPIRED, PAST_DUE)
 */
export async function updateSubscriptionStatusAction(
  subscriptionId: string,
  status: SubscriptionStatus,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const currentSub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        company: { select: { id: true, name: true, code: true } },
        plan: { select: { name: true } },
      },
    });

    if (!currentSub) {
      return { success: false, message: "ไม่พบข้อมูล Subscription" };
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status,
        cancelledAt: status === SubscriptionStatus.CANCELLED ? new Date() : currentSub.cancelledAt,
      },
    });

    await AuditLogger.log({
      companyId: currentSub.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "UPDATE_SUBSCRIPTION_STATUS",
      resource: "Subscription",
      resourceId: updated.id,
      details: {
        companyCode: currentSub.company.code,
        previousStatus: currentSub.status,
        newStatus: status,
      },
    });

    revalidatePath("/system-admin/subscriptions");
    revalidatePath("/system-admin/companies");

    return {
      success: true,
      message: `เปลี่ยนสถานะ Subscription ของ ${currentSub.company.name} เป็น ${status} สำเร็จ`,
    };
  } catch (error) {
    console.error("Update Subscription Status Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ" };
  }
}

/**
 * Super Admin: Extend trial period by days
 */
export async function extendTrialAction(
  subscriptionId: string,
  extraDays: number,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { company: { select: { name: true } } },
    });

    if (!sub) {
      return { success: false, message: "ไม่พบข้อมูล Subscription" };
    }

    const baseDate = sub.trialEndsAt && sub.trialEndsAt > new Date() ? sub.trialEndsAt : new Date();
    const newTrialEnd = new Date(baseDate.getTime() + extraDays * 24 * 60 * 60 * 1000);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        trialEndsAt: newTrialEnd,
        status: SubscriptionStatus.TRIAL,
      },
    });

    await AuditLogger.log({
      companyId: sub.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "EXTEND_TRIAL",
      resource: "Subscription",
      resourceId: sub.id,
      details: { extraDays, newTrialEnd: newTrialEnd.toISOString() },
    });

    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: `ขยายระยะเวลาทดลองใช้งานของ ${sub.company.name} ไปจนถึง ${newTrialEnd.toLocaleDateString("th-TH")} สำเร็จ`,
    };
  } catch (error) {
    console.error("Extend Trial Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการขยายเวลาทดลองใช้งาน" };
  }
}
