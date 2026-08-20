"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import { SubscriptionStatus, PlanUpgradeRequestStatus } from "@prisma/client";
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
    revalidatePath("/admin/subscription");

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
    revalidatePath("/admin/subscription");

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
    revalidatePath("/admin/subscription");

    return {
      success: true,
      message: `ขยายระยะเวลาทดลองใช้งานของ ${sub.company.name} ไปจนถึง ${newTrialEnd.toLocaleDateString("th-TH")} สำเร็จ`,
    };
  } catch (error) {
    console.error("Extend Trial Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการขยายเวลาทดลองใช้งาน" };
  }
}

/**
 * Company Admin: Submit a plan upgrade or quota expansion request
 */
export async function requestPlanUpgradeAction(
  targetPlanId: string,
  requestedSeats?: number,
  billingCycle: string = "MONTHLY",
  notes?: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง (เข้าสู่ระบบก่อนทำรายการ)" };
    }

    const [company, plan, currentSub] = await Promise.all([
      prisma.company.findUnique({ where: { id: session.companyId } }),
      prisma.plan.findUnique({ where: { id: targetPlanId } }),
      prisma.subscription.findUnique({
        where: { companyId: session.companyId },
        include: { plan: true },
      }),
    ]);

    if (!company) {
      return { success: false, message: "ไม่พบข้อมูลบริษัท" };
    }
    if (!plan) {
      return { success: false, message: "ไม่พบข้อมูลแพ็กเกจที่เลือก" };
    }

    // Create the PlanUpgradeRequest record
    const request = await prisma.planUpgradeRequest.create({
      data: {
        companyId: company.id,
        currentPlanId: currentSub?.planId || null,
        targetPlanId: plan.id,
        requestedSeats: requestedSeats && requestedSeats > 0 ? requestedSeats : null,
        billingCycle: billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY",
        notes: notes?.trim() || null,
        status: PlanUpgradeRequestStatus.PENDING,
        requestedById: session.userId,
      },
    });

    await AuditLogger.log({
      companyId: company.id,
      actorType: "USER",
      actorId: session.userId,
      action: "REQUEST_PLAN_UPGRADE",
      resource: "PlanUpgradeRequest",
      resourceId: request.id,
      details: {
        currentPlan: currentSub?.plan.code || "NONE",
        targetPlan: plan.code,
        targetPlanName: plan.name,
        requestedSeats,
        billingCycle,
        notes,
      },
    });

    revalidatePath("/admin/subscription");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: `ส่งคำขอปรับระดับแพ็กเกจเป็น "${plan.name}" เรียบร้อยแล้ว ทีมงานผู้ดูแลระบบจะตรวจสอบและดำเนินการให้ท่านโดยเร็ว`,
    };
  } catch (error) {
    console.error("Request Plan Upgrade Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการส่งคำขอปรับระดับแพ็กเกจ" };
  }
}

/**
 * Company Admin: Cancel own pending plan upgrade request
 */
export async function cancelPlanUpgradeRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง" };
    }

    const request = await prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
      include: { targetPlan: true },
    });

    if (!request || request.companyId !== session.companyId) {
      return { success: false, message: "ไม่พบคำขอที่ระบุ" };
    }

    if (request.status !== PlanUpgradeRequestStatus.PENDING) {
      return { success: false, message: "ไม่สามารถยกเลิกคำขอที่ดำเนินการไปแล้วได้" };
    }

    await prisma.planUpgradeRequest.update({
      where: { id: requestId },
      data: {
        status: PlanUpgradeRequestStatus.CANCELLED,
      },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "CANCEL_PLAN_UPGRADE_REQUEST",
      resource: "PlanUpgradeRequest",
      resourceId: requestId,
      details: {
        targetPlan: request.targetPlan.name,
      },
    });

    revalidatePath("/admin/subscription");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: "ยกเลิกคำขอปรับระดับแพ็กเกจเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Cancel Plan Upgrade Request Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการยกเลิกคำขอ" };
  }
}

/**
 * Super Admin: Approve a company's plan upgrade request and activate the subscription
 */
export async function approvePlanUpgradeRequestAction(
  requestId: string,
  durationMonths: number = 12,
  adminNotes?: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง (Super Admin เท่านั้น)" };
    }

    const request = await prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        company: { select: { id: true, name: true, code: true } },
        targetPlan: true,
      },
    });

    if (!request) {
      return { success: false, message: "ไม่พบคำขอปรับระดับแพ็กเกจ" };
    }

    if (request.status !== PlanUpgradeRequestStatus.PENDING) {
      return { success: false, message: "คำขอนี้ได้รับการดำเนินการแล้ว" };
    }

    const now = new Date();
    const endDate = new Date(now.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // Run in transaction: update request status and update/upsert company subscription
    await prisma.$transaction([
      prisma.planUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: PlanUpgradeRequestStatus.APPROVED,
          reviewedById: session.userId,
          reviewedAt: now,
          adminNotes: adminNotes?.trim() || null,
        },
      }),
      prisma.subscription.upsert({
        where: { companyId: request.companyId },
        create: {
          companyId: request.companyId,
          planId: request.targetPlanId,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate,
          trialEndsAt: null,
        },
        update: {
          planId: request.targetPlanId,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate,
          trialEndsAt: null,
          cancelledAt: null,
        },
      }),
    ]);

    await AuditLogger.log({
      companyId: request.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "APPROVE_PLAN_UPGRADE_REQUEST",
      resource: "PlanUpgradeRequest",
      resourceId: requestId,
      details: {
        companyCode: request.company.code,
        targetPlanCode: request.targetPlan.code,
        targetPlanName: request.targetPlan.name,
        durationMonths,
        adminNotes,
      },
    });

    revalidatePath("/system-admin/subscriptions");
    revalidatePath("/system-admin/companies");
    revalidatePath("/admin/subscription");

    return {
      success: true,
      message: `อนุมัติคำขอและเปิดใช้งานแพ็กเกจ "${request.targetPlan.name}" ให้กับ "${request.company.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Approve Plan Upgrade Request Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอนุมัติคำขอ" };
  }
}

/**
 * Super Admin: Reject a company's plan upgrade request
 */
export async function rejectPlanUpgradeRequestAction(
  requestId: string,
  adminNotes: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง (Super Admin เท่านั้น)" };
    }

    if (!adminNotes || !adminNotes.trim()) {
      return { success: false, message: "กรุณาระบุเหตุผลหรือข้อความตอบกลับในการปฏิเสธคำขอ" };
    }

    const request = await prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
      include: {
        company: { select: { id: true, name: true, code: true } },
        targetPlan: { select: { name: true } },
      },
    });

    if (!request) {
      return { success: false, message: "ไม่พบคำขอปรับระดับแพ็กเกจ" };
    }

    if (request.status !== PlanUpgradeRequestStatus.PENDING) {
      return { success: false, message: "คำขอนี้ได้รับการดำเนินการแล้ว" };
    }

    await prisma.planUpgradeRequest.update({
      where: { id: requestId },
      data: {
        status: PlanUpgradeRequestStatus.REJECTED,
        reviewedById: session.userId,
        reviewedAt: new Date(),
        adminNotes: adminNotes.trim(),
      },
    });

    await AuditLogger.log({
      companyId: request.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "REJECT_PLAN_UPGRADE_REQUEST",
      resource: "PlanUpgradeRequest",
      resourceId: requestId,
      details: {
        companyCode: request.company.code,
        targetPlanName: request.targetPlan.name,
        adminNotes,
      },
    });

    revalidatePath("/system-admin/subscriptions");
    revalidatePath("/admin/subscription");

    return {
      success: true,
      message: `ปฏิเสธคำขอปรับระดับแพ็กเกจของ "${request.company.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Reject Plan Upgrade Request Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการปฏิเสธคำขอ" };
  }
}
