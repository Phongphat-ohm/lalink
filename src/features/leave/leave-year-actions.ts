"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { ActorType } from "@prisma/client";
import {
  createLeaveYear,
  updateLeaveYear,
  deleteLeaveYear,
  activateLeaveYear,
} from "@/lib/leave/leave-year";
import { runCarryForwardForCompany } from "@/lib/leave/carry-forward";
import { getDefaultJobQueue } from "@/lib/jobs";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const leaveYearSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "กรุณาระบุชื่อปีลา"),
    year: z.coerce.number().int().min(2020).max(2100),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
  })
  .refine((d) => new Date(d.startDate) <= new Date(d.endDate), {
    message: "วันที่เริ่มต้นต้องมาก่อนหรือตรงกับวันที่สิ้นสุด",
    path: ["endDate"],
  });

/**
 * Server action to create or update a leave year.
 */
export async function saveLeaveYearAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการปีลา",
      };
    }

    const validated = leaveYearSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      year: formData.get("year"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;
    const startObj = new Date(data.startDate);
    const endObj = new Date(data.endDate);

    let result;
    if (data.id) {
      result = await updateLeaveYear({
        id: data.id,
        companyId: tenant.companyId,
        name: data.name,
        startDate: startObj,
        endDate: endObj,
      });
    } else {
      result = await createLeaveYear({
        companyId: tenant.companyId,
        name: data.name,
        year: data.year,
        startDate: startObj,
        endDate: endObj,
      });
    }

    if (!result) {
      return {
        success: false,
        message: "ไม่พบปีลาที่ต้องการแก้ไข",
      };
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: data.id ? "UPDATE_LEAVE_YEAR" : "CREATE_LEAVE_YEAR",
        resource: "LeaveYear",
        resourceId: result.id,
        details: { name: result.name, year: result.year },
      },
    });

    revalidatePath("/admin/leave-years");

    return {
      success: true,
      message: "บันทึกปีลาเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Save Leave Year Error:", error);
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message.includes("Unique constraint")
          ? "ปีลานี้มีอยู่ในระบบแล้ว (ชื่อหรือปีซ้ำ)"
          : "เกิดข้อผิดพลาดในการบันทึกปีลา",
    };
  }
}

/**
 * Server action to activate a leave year (deactivates others).
 */
export async function activateLeaveYearAction(
  leaveYearId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการปีลา" };
    }

    const result = await activateLeaveYear(tenant.companyId, leaveYearId);
    if (!result) {
      return { success: false, message: "ไม่พบปีลาที่ต้องการเปิดใช้งาน" };
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "ACTIVATE_LEAVE_YEAR",
        resource: "LeaveYear",
        resourceId: result.id,
        details: { name: result.name, year: result.year },
      },
    });

    revalidatePath("/admin/leave-years");
    revalidatePath("/admin/leave-balance");

    return {
      success: true,
      message: `เปิดใช้งานปีลา "${result.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Activate Leave Year Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปิดใช้งานปีลา" };
  }
}

/**
 * Server action to delete a leave year.
 */
export async function deleteLeaveYearAction(
  leaveYearId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการปีลา" };
    }

    const deleted = await deleteLeaveYear(tenant.companyId, leaveYearId);
    if (!deleted) {
      return { success: false, message: "ไม่พบปีลาที่ต้องการลบ" };
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "DELETE_LEAVE_YEAR",
        resource: "LeaveYear",
        resourceId: leaveYearId,
      },
    });

    revalidatePath("/admin/leave-years");

    return { success: true, message: "ลบปีลาเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Leave Year Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบปีลา" };
  }
}

const carryForwardSchema = z.object({
  sourceYear: z.coerce.number().int().min(2020).max(2100),
  targetYear: z.coerce.number().int().min(2020).max(2100),
});

/**
 * Server action to trigger the carry-forward for the current company.
 * Runs synchronously so the admin gets immediate feedback.
 */
export async function runCarryForwardAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ summary: string }>> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการดำเนินการสะสมวันลา",
      };
    }

    const validated = carryForwardSchema.safeParse({
      sourceYear: formData.get("sourceYear"),
      targetYear: formData.get("targetYear"),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const summary = await runCarryForwardForCompany({
      companyId: tenant.companyId,
      sourceYear: validated.data.sourceYear,
      targetYear: validated.data.targetYear,
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "RUN_CARRY_FORWARD",
        resource: "LeaveBalance",
        details: {
          sourceYear: summary.sourceYear,
          targetYear: summary.targetYear,
          employeesProcessed: summary.employeesProcessed,
          daysCarriedForward: summary.daysCarriedForward,
          daysExpired: summary.daysExpired,
        },
      },
    });

    revalidatePath("/admin/leave-years");
    revalidatePath("/admin/leave-balance");

    const summaryText =
      `สะสม ${summary.daysCarriedForward.toFixed(2)} วัน, ` +
      `หมดอายุ ${summary.daysExpired.toFixed(2)} วัน, ` +
      `พนักงาน ${summary.employeesProcessed} คน`;

    return {
      success: true,
      message: `ดำเนินการสะสมวันลาสำเร็จ (${summaryText})`,
      data: { summary: summaryText },
    };
  } catch (error) {
    console.error("Run Carry Forward Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสะสมวันลา",
    };
  }
}

/**
 * Enqueues the carry-forward as a background job (fire-and-forget).
 * Useful for the year rollover scheduled task.
 */
export async function enqueueCarryForwardJobAction(): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการปีลา" };
    }

    const currentYear = new Date().getFullYear();
    const jobId = await getDefaultJobQueue().enqueue("leave:carry-forward", {
      sourceYear: currentYear - 1,
      targetYear: currentYear,
      companyId: tenant.companyId,
    });

    return {
      success: true,
      message: `จัดคิวงานสะสมวันลาแล้ว (Job: ${jobId})`,
    };
  } catch (error) {
    console.error("Enqueue Carry Forward Job Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการจัดคิวงาน" };
  }
}