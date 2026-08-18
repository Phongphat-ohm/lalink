"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { ActorType } from "@prisma/client";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const leaveTypePolicySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อประเภทการลา"),
  code: z.string().min(1, "กรุณาระบุรหัสประเภทการลา").toUpperCase(),
  defaultDays: z.coerce.number().min(0, "โควตาวันลาต้องไม่ติดลบ"),
  allowHalfDay: z.coerce.boolean(),
  requireReason: z.coerce.boolean(),
  requireAttachment: z.coerce.boolean(),
  isPaid: z.coerce.boolean().default(true),
});

/**
 * Server action to create or update Leave Type policy.
 */
export async function saveLeaveTypePolicyAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการนโยบายวันลา",
      };
    }

    const rawData = {
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      code: formData.get("code"),
      defaultDays: formData.get("defaultDays"),
      allowHalfDay:
        formData.get("allowHalfDay") === "on" ||
        formData.get("allowHalfDay") === "true",
      requireReason:
        formData.get("requireReason") === "on" ||
        formData.get("requireReason") === "true",
      requireAttachment:
        formData.get("requireAttachment") === "on" ||
        formData.get("requireAttachment") === "true",
      isPaid: formData.get("isPaid") !== "false",
    };

    const validated = leaveTypePolicySchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    if (data.id) {
      // Update existing
      await prisma.leaveType.update({
        where: { id: data.id },
        data: {
          name: data.name,
          defaultDays: data.defaultDays,
          allowHalfDay: data.allowHalfDay,
          requireReason: data.requireReason,
          requireAttachment: data.requireAttachment,
          isPaid: data.isPaid,
        },
      });
    } else {
      // Create new
      await prisma.leaveType.create({
        data: {
          companyId: tenant.companyId,
          name: data.name,
          code: data.code,
          defaultDays: data.defaultDays,
          allowHalfDay: data.allowHalfDay,
          requireReason: data.requireReason,
          requireAttachment: data.requireAttachment,
          isPaid: data.isPaid,
          isActive: true,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: data.id ? "UPDATE_LEAVE_TYPE" : "CREATE_LEAVE_TYPE",
        resource: "LeaveType",
        details: { code: data.code, defaultDays: data.defaultDays },
      },
    });

    return {
      success: true,
      message: "บันทึกนโยบายประเภทการลาเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Save Leave Type Policy Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกนโยบาย",
    };
  }
}

const holidaySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อวันหยุด"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD"),
});

/**
 * Server action to add a company holiday.
 */
export async function addHolidayAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.HOLIDAY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการวันหยุดบริษัท",
      };
    }

    const rawData = {
      name: formData.get("name"),
      date: formData.get("date"),
    };

    const validated = holidaySchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const dateObj = new Date(validated.data.date);
    const year = dateObj.getFullYear();

    await prisma.holiday.create({
      data: {
        companyId: tenant.companyId,
        name: validated.data.name,
        date: dateObj,
        year,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "CREATE_HOLIDAY",
        resource: "Holiday",
        details: { name: validated.data.name, date: validated.data.date },
      },
    });

    return {
      success: true,
      message: "เพิ่มวันหยุดบริษัทเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Add Holiday Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเพิ่มวันหยุด",
    };
  }
}
