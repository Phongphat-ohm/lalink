"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { ActorType, WorkScheduleScope } from "@prisma/client";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

interface DaySlotInput {
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
}

/** Parses the seven per-day rows from a form into a slots map. */
function parseDaySlots(formData: FormData): DaySlotInput[] {
  return DAYS.map((day) => ({
    startTime: (formData.get(`start_${day}`) as string) || undefined,
    endTime: (formData.get(`end_${day}`) as string) || undefined,
    isWorkingDay: formData.get(`working_${day}`) === "on",
  }));
}

function validateSlots(slots: DaySlotInput[], allowEmptyTimes = false): string | null {
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.isWorkingDay) continue;
    if (!slot.startTime || !slot.endTime) {
      if (allowEmptyTimes) continue;
      return `กรุณาระบุเวลาเริ่มต้น-สิ้นสุดของวันทำงาน (วัน ${i})`;
    }
    if (!TIME_RE.test(slot.startTime) || !TIME_RE.test(slot.endTime)) {
      return `รูปแบบเวลาไม่ถูกต้อง (วัน ${i}) ต้องเป็น HH:MM`;
    }
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMin(slot.endTime) <= toMin(slot.startTime)) {
      return `เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น (วัน ${i})`;
    }
  }
  return null;
}

const shiftSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อกะทำงาน").trim(),
  description: z.string().optional(),
});

/**
 * Server action to create or update a Shift (กะทำงาน) with its
 * per-day-of-week time slots.
 */
export async function saveShiftAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการกะทำงาน",
      };
    }

    const validated = shiftSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const slots = parseDaySlots(formData);
    const slotError = validateSlots(slots);
    if (slotError) {
      return { success: false, message: slotError };
    }

    const data = validated.data;
    const hasWorkingDays = slots.some((s) => s.isWorkingDay);
    if (!hasWorkingDays) {
      return {
        success: false,
        message: "ต้องมีอย่างน้อย 1 วันทำงานในกะ",
      };
    }

    let shiftId = data.id;
    if (data.id) {
      const existing = await prisma.shift.findFirst({
        where: { id: data.id, companyId: tenant.companyId },
      });
      if (!existing) {
        return { success: false, message: "ไม่พบกะทำงานที่ต้องการแก้ไข" };
      }
      await prisma.$transaction(async (tx) => {
        await tx.shift.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description || null,
          },
        });
        await tx.shiftEntry.deleteMany({ where: { shiftId: data.id } });
        await tx.shiftEntry.createMany({
          data: DAYS.map((day, i) => ({
            shiftId: data.id as string,
            dayOfWeek: day,
            startTime: slots[i].startTime || "00:00",
            endTime: slots[i].endTime || "00:00",
            isWorkingDay: slots[i].isWorkingDay,
          })).filter((e) => e.isWorkingDay || true),
        });
      });
    } else {
      const created = await prisma.shift.create({
        data: {
          companyId: tenant.companyId,
          name: data.name,
          description: data.description || null,
          entries: {
            create: DAYS.map((day, i) => ({
              dayOfWeek: day,
              startTime: slots[i].startTime || "00:00",
              endTime: slots[i].endTime || "00:00",
              isWorkingDay: slots[i].isWorkingDay,
            })),
          },
        },
      });
      shiftId = created.id;
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: data.id ? "UPDATE_SHIFT" : "CREATE_SHIFT",
        resource: "Shift",
        resourceId: shiftId,
        details: { name: data.name },
      },
    });

    revalidatePath("/admin/shifts");
    revalidatePath("/admin/work-schedules");

    return {
      success: true,
      message: "บันทึกกะทำงานเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Save Shift Error:", error);
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message.includes("Unique constraint")
          ? "ชื่อกะทำงานนี้มีอยู่ในระบบแล้ว"
          : "เกิดข้อผิดพลาดในการบันทึกกะทำงาน",
    };
  }
}

/**
 * Server action to activate / deactivate a Shift.
 */
export async function toggleShiftAction(
  shiftId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการกะทำงาน" };
    }

    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบกะทำงานที่ระบุ" };
    }

    await prisma.shift.update({
      where: { id: shiftId },
      data: { isActive: !existing.isActive },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: existing.isActive ? "DEACTIVATE_SHIFT" : "ACTIVATE_SHIFT",
        resource: "Shift",
        resourceId: shiftId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/shifts");
    revalidatePath("/admin/work-schedules");

    return {
      success: true,
      message: existing.isActive
        ? "ปิดใช้งานกะทำงานเรียบร้อยแล้ว"
        : "เปิดใช้งานกะทำงานเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Toggle Shift Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะกะทำงาน" };
  }
}

/**
 * Server action to delete a Shift.
 */
export async function deleteShiftAction(shiftId: string): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการกะทำงาน" };
    }

    const existing = await prisma.shift.findFirst({
      where: { id: shiftId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบกะทำงานที่ระบุ" };
    }

    await prisma.shift.delete({ where: { id: shiftId } });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "DELETE_SHIFT",
        resource: "Shift",
        resourceId: shiftId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/shifts");
    revalidatePath("/admin/work-schedules");

    return { success: true, message: "ลบกะทำงานเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Shift Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบกะทำงาน" };
  }
}

const workScheduleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อตารางทำงาน").trim(),
  description: z.string().optional(),
  scope: z.nativeEnum(WorkScheduleScope),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  shiftId: z.string().optional(),
});

/**
 * Server action to create or update a WorkSchedule.
 * When a shiftId is bound, the schedule reuses the shift's time slots
 * (entries are ignored / cleared).
 */
export async function saveWorkScheduleAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการตารางทำงาน",
      };
    }

    const validated = workScheduleSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      scope: formData.get("scope"),
      branchId: formData.get("branchId") || undefined,
      departmentId: formData.get("departmentId") || undefined,
      employeeId: formData.get("employeeId") || undefined,
      shiftId: formData.get("shiftId") || undefined,
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;
    const scope = data.scope;

    // Scope target consistency.
    if (scope === WorkScheduleScope.BRANCH && !data.branchId) {
      return { success: false, message: "กรุณาเลือกสาขาสำหรับตารางระดับสาขา" };
    }
    if (scope === WorkScheduleScope.DEPARTMENT && !data.departmentId) {
      return { success: false, message: "กรุณาเลือกแผนกสำหรับตารางระดับแผนก" };
    }
    if (scope === WorkScheduleScope.EMPLOYEE && !data.employeeId) {
      return { success: false, message: "กรุณาเลือกพนักงานสำหรับตารางระดับพนักงาน" };
    }

    // Shift binding: shift must belong to the company.
    let boundShiftId: string | null = null;
    if (data.shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: data.shiftId, companyId: tenant.companyId },
      });
      if (!shift) {
        return { success: false, message: "ไม่พบกะทำงานที่อ้างอิง" };
      }
      boundShiftId = shift.id;
    }

    // Inline slots are only used when no shift is bound.
    const slots = parseDaySlots(formData);
    const usesInlineEntries = !boundShiftId;
    const slotError = usesInlineEntries ? validateSlots(slots, true) : null;
    if (slotError) {
      return { success: false, message: slotError };
    }
    const hasWorkingDays = slots.some((s) => s.isWorkingDay);
    if (usesInlineEntries && !hasWorkingDays) {
      return {
        success: false,
        message: "ต้องมีอย่างน้อย 1 วันทำงานในตาราง (หรือเลือกอ้างอิงกะทำงาน)",
      };
    }

    const baseData = {
      name: data.name,
      description: data.description || null,
      scope,
      branchId: scope === WorkScheduleScope.BRANCH ? data.branchId || null : null,
      departmentId:
        scope === WorkScheduleScope.DEPARTMENT ? data.departmentId || null : null,
      employeeId:
        scope === WorkScheduleScope.EMPLOYEE ? data.employeeId || null : null,
      shiftId: boundShiftId,
    };

    let scheduleId = data.id;
    if (data.id) {
      const existing = await prisma.workSchedule.findFirst({
        where: { id: data.id, companyId: tenant.companyId },
      });
      if (!existing) {
        return { success: false, message: "ไม่พบตารางทำงานที่ต้องการแก้ไข" };
      }
      await prisma.$transaction(async (tx) => {
        await tx.workSchedule.update({
          where: { id: data.id },
          data: baseData,
        });
        await tx.workScheduleEntry.deleteMany({
          where: { workScheduleId: data.id },
        });
        if (usesInlineEntries) {
          await tx.workScheduleEntry.createMany({
            data: DAYS.map((day, i) => ({
              workScheduleId: data.id as string,
              dayOfWeek: day,
              startTime: slots[i].startTime || "00:00",
              endTime: slots[i].endTime || "00:00",
              isWorkingDay: slots[i].isWorkingDay,
            })),
          });
        }
      });
    } else {
      const created = await prisma.workSchedule.create({
        data: {
          companyId: tenant.companyId,
          ...baseData,
          entries: usesInlineEntries
            ? {
                create: DAYS.map((day, i) => ({
                  dayOfWeek: day,
                  startTime: slots[i].startTime || "00:00",
                  endTime: slots[i].endTime || "00:00",
                  isWorkingDay: slots[i].isWorkingDay,
                })),
              }
            : undefined,
        },
      });
      scheduleId = created.id;
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: data.id ? "UPDATE_WORK_SCHEDULE" : "CREATE_WORK_SCHEDULE",
        resource: "WorkSchedule",
        resourceId: scheduleId,
        details: { name: data.name, scope },
      },
    });

    revalidatePath("/admin/work-schedules");
    revalidatePath("/admin/shifts");

    return {
      success: true,
      message: "บันทึกตารางทำงานเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Save Work Schedule Error:", error);
    return {
      success: false,
      message:
        error instanceof Error &&
        error.message.includes("Unique constraint")
          ? "ตารางทำงานนี้ซ้ำกับรายการในระบบ"
          : "เกิดข้อผิดพลาดในการบันทึกตารางทำงาน",
    };
  }
}

/**
 * Server action to activate / deactivate a WorkSchedule.
 */
export async function toggleWorkScheduleAction(
  scheduleId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการตารางทำงาน",
      };
    }

    const existing = await prisma.workSchedule.findFirst({
      where: { id: scheduleId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบตารางทำงานที่ระบุ" };
    }

    await prisma.workSchedule.update({
      where: { id: scheduleId },
      data: { isActive: !existing.isActive },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: existing.isActive
          ? "DEACTIVATE_WORK_SCHEDULE"
          : "ACTIVATE_WORK_SCHEDULE",
        resource: "WorkSchedule",
        resourceId: scheduleId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/work-schedules");

    return {
      success: true,
      message: existing.isActive
        ? "ปิดใช้งานตารางทำงานเรียบร้อยแล้ว"
        : "เปิดใช้งานตารางทำงานเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Toggle Work Schedule Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะตารางทำงาน",
    };
  }
}

/**
 * Server action to delete a WorkSchedule.
 */
export async function deleteWorkScheduleAction(
  scheduleId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.POLICY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการตารางทำงาน",
      };
    }

    const existing = await prisma.workSchedule.findFirst({
      where: { id: scheduleId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบตารางทำงานที่ระบุ" };
    }

    await prisma.workSchedule.delete({ where: { id: scheduleId } });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "DELETE_WORK_SCHEDULE",
        resource: "WorkSchedule",
        resourceId: scheduleId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/work-schedules");

    return { success: true, message: "ลบตารางทำงานเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Work Schedule Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบตารางทำงาน",
    };
  }
}