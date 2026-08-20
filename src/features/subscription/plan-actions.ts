"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import { z } from "zod";
import type { ActionResult } from "@/lib/types";

const planSchema = z.object({
  code: z
    .string()
    .min(2, "รหัสแพ็กเกจต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "รหัสแพ็กเกจต้องเป็นตัวพิมพ์ใหญ่และตัวเลขเท่านั้น"),
  name: z.string().min(2, "ชื่อแพ็กเกจต้องมีอย่างน้อย 2 ตัวอักษร").max(100),
  description: z.string().optional(),
  maxEmployees: z.coerce.number().min(1, "จำนวนพนักงานขั้นต่ำ 1 คน"),
  maxAdmins: z.coerce.number().min(1, "จำนวนผู้ดูแลขั้นต่ำ 1 คน"),
  priceMonthly: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
  priceYearly: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
  isActive: z.boolean().default(true),
});

/**
 * Super Admin: Create a new SaaS Plan
 */
export async function createPlanAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ planId: string }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "สิทธิ์ไม่ถูกต้อง (Super Admin เท่านั้น)" };
    }

    const rawData = {
      code: formData.get("code")?.toString().trim().toUpperCase(),
      name: formData.get("name")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || undefined,
      maxEmployees: formData.get("maxEmployees"),
      maxAdmins: formData.get("maxAdmins"),
      priceMonthly: formData.get("priceMonthly") || "0",
      priceYearly: formData.get("priceYearly") || "0",
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    };

    const parsed = planSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "ข้อมูลแพ็กเกจไม่ถูกต้อง",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { code, name, description, maxEmployees, maxAdmins, priceMonthly, priceYearly, isActive } =
      parsed.data;

    // Check unique code
    const existing = await prisma.plan.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message: `รหัสแพ็กเกจ "${code}" มีอยู่ในระบบแล้ว`,
        errors: { code: ["รหัสแพ็กเกจนี้ถูกใช้งานแล้ว"] },
      };
    }

    const plan = await prisma.plan.create({
      data: {
        code,
        name,
        description: description || null,
        maxEmployees,
        maxAdmins,
        priceMonthly,
        priceYearly,
        isActive,
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_PLAN",
      resource: "Plan",
      resourceId: plan.id,
      details: { code: plan.code, name: plan.name, maxEmployees, maxAdmins },
    });

    revalidatePath("/system-admin/plans");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: `สร้างแพ็กเกจ "${plan.name}" สำเร็จเรียบร้อย`,
      data: { planId: plan.id },
    };
  } catch (error) {
    console.error("Create Plan Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างแพ็กเกจ" };
  }
}

/**
 * Super Admin: Update SaaS Plan
 */
export async function updatePlanAction(
  planId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      code: formData.get("code")?.toString().trim().toUpperCase(),
      name: formData.get("name")?.toString().trim(),
      description: formData.get("description")?.toString().trim() || undefined,
      maxEmployees: formData.get("maxEmployees"),
      maxAdmins: formData.get("maxAdmins"),
      priceMonthly: formData.get("priceMonthly") || "0",
      priceYearly: formData.get("priceYearly") || "0",
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    };

    const parsed = planSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { code, name, description, maxEmployees, maxAdmins, priceMonthly, priceYearly, isActive } =
      parsed.data;

    // Check code duplication with other plans
    const existing = await prisma.plan.findFirst({
      where: { code, id: { not: planId } },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message: `รหัสแพ็กเกจ "${code}" ถูกใช้โดยแพ็กเกจอื่นแล้ว`,
      };
    }

    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        code,
        name,
        description: description || null,
        maxEmployees,
        maxAdmins,
        priceMonthly,
        priceYearly,
        isActive,
      },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "UPDATE_PLAN",
      resource: "Plan",
      resourceId: updated.id,
      details: { code: updated.code, name: updated.name, maxEmployees, maxAdmins },
    });

    revalidatePath("/system-admin/plans");
    revalidatePath("/system-admin/subscriptions");

    return {
      success: true,
      message: `อัปเดตแพ็กเกจ "${updated.name}" สำเร็จเรียบร้อย`,
    };
  } catch (error) {
    console.error("Update Plan Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตแพ็กเกจ" };
  }
}

/**
 * Super Admin: Toggle Plan Active Status
 */
export async function togglePlanStatusAction(
  planId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: { isActive },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: isActive ? "ACTIVATE_PLAN" : "DEACTIVATE_PLAN",
      resource: "Plan",
      resourceId: plan.id,
      details: { code: plan.code, isActive },
    });

    revalidatePath("/system-admin/plans");
    return {
      success: true,
      message: `เปลี่ยนสถานะแพ็กเกจ "${plan.name}" เป็น ${isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"} เรียบร้อย`,
    };
  } catch (error) {
    console.error("Toggle Plan Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะแพ็กเกจ" };
  }
}

/**
 * Super Admin: Delete Plan (if no active subscriptions)
 */
export async function deletePlanAction(planId: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const subCount = await prisma.subscription.count({
      where: { planId },
    });

    if (subCount > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบแพ็กเกจนี้ได้ เนื่องจากมีองค์กรกำลังใช้งานอยู่ ${subCount} บริษัท (แนะนำให้ปิดใช้งานแทน)`,
      };
    }

    const plan = await prisma.plan.delete({
      where: { id: planId },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_PLAN",
      resource: "Plan",
      resourceId: planId,
      details: { code: plan.code, name: plan.name },
    });

    revalidatePath("/system-admin/plans");
    return { success: true, message: `ลบแพ็กเกจ "${plan.name}" สำเร็จเรียบร้อย` };
  } catch (error) {
    console.error("Delete Plan Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบแพ็กเกจ" };
  }
}
