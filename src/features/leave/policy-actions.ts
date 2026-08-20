"use server";

import { z } from "zod";
import Holidays from "date-holidays";
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
  allowHourly: z.coerce.boolean(),
  allowCarryForward: z.coerce.boolean(),
  maxCarryForwardDays: z
    .union([z.coerce.number().min(0, "จำนวนวันสะสมสูงสุดต้องไม่ติดลบ"), z.null()])
    .optional(),
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
      allowHourly:
        formData.get("allowHourly") === "on" ||
        formData.get("allowHourly") === "true",
      allowCarryForward:
        formData.get("allowCarryForward") === "on" ||
        formData.get("allowCarryForward") === "true",
      maxCarryForwardDays:
        formData.get("maxCarryForwardDays") &&
        formData.get("maxCarryForwardDays") !== ""
          ? formData.get("maxCarryForwardDays")
          : null,
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

    const persistData = {
      name: data.name,
      defaultDays: data.defaultDays,
      allowHalfDay: data.allowHalfDay,
      allowHourly: data.allowHourly,
      allowCarryForward: data.allowCarryForward,
      ...(data.maxCarryForwardDays !== undefined
        ? { maxCarryForwardDays: data.maxCarryForwardDays }
        : {}),
      requireReason: data.requireReason,
      requireAttachment: data.requireAttachment,
      isPaid: data.isPaid,
    };

    if (data.id) {
      // Update existing
      await prisma.leaveType.update({
        where: { id: data.id },
        data: persistData,
      });
    } else {
      // Create new
      await prisma.leaveType.create({
        data: {
          companyId: tenant.companyId,
          code: data.code,
          isActive: true,
          ...persistData,
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

import {
  parseThaiDateToCE,
  toGregorianYear,
  toBuddhistYear,
  formatThaiDate,
} from "@/lib/utils/date";
import { revalidatePath } from "next/cache";

const holidaySchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อวันหยุด"),
  date: z
    .string()
    .min(1, "กรุณาระบุวันที่")
    .refine((val) => parseThaiDateToCE(val) !== null, {
      message: "รูปแบบวันที่ไม่ถูกต้อง",
    }),
});

const holidayUpdateSchema = z.object({
  id: z.string().min(1, "ไม่พบรหัสวันหยุด"),
  ...holidaySchema.shape,
});

/**
 * Server action to update an existing company holiday.
 */
export async function updateHolidayAction(
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
      id: formData.get("id"),
      name: formData.get("name"),
      date: formData.get("date"),
    };

    const validated = holidayUpdateSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    // Anti-IDOR: holiday must belong to the tenant company.
    const existing = await prisma.holiday.findFirst({
      where: { id: validated.data.id, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบวันหยุดที่ต้องการแก้ไข" };
    }

    const dateObj = parseThaiDateToCE(validated.data.date)!;
    await prisma.holiday.update({
      where: { id: existing.id },
      data: {
        name: validated.data.name,
        date: dateObj,
        year: dateObj.getFullYear(),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "UPDATE_HOLIDAY",
        resource: "Holiday",
        resourceId: existing.id,
        details: { name: validated.data.name, date: validated.data.date },
      },
    });

    revalidatePath("/admin/holidays");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "แก้ไขวันหยุดบริษัทเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Update Holiday Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการแก้ไขวันหยุด",
    };
  }
}

/**
 * Server action to delete a company holiday.
 */
export async function deleteHolidayAction(
  holidayId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.HOLIDAY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการวันหยุดบริษัท",
      };
    }

    const existing = await prisma.holiday.findFirst({
      where: { id: holidayId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบวันหยุดที่ต้องการลบ" };
    }

    await prisma.holiday.delete({ where: { id: existing.id } });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "DELETE_HOLIDAY",
        resource: "Holiday",
        resourceId: existing.id,
        details: { name: existing.name, date: existing.date },
      },
    });

    revalidatePath("/admin/holidays");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "ลบวันหยุดบริษัทเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Delete Holiday Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบวันหยุด",
    };
  }
}

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

    const dateObj = parseThaiDateToCE(validated.data.date)!;
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

    revalidatePath("/admin/holidays");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/dashboard");

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

export interface ThaiOfficialHolidayItem {
  name: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  weekday: string;
  isAlreadyImported: boolean;
}

export interface SerializedHolidayData {
  id: string;
  date: string;
  isoDate: string;
  name: string;
  weekday: string;
}

/**
 * Server action to get/preview Thai Official Public Holidays from `date-holidays` library for a specific year.
 */
export async function getThaiOfficialHolidaysAction(
  year: number = new Date().getFullYear(),
): Promise<
  ActionResult<{
    year: number;
    buddhistYear: number;
    holidays: ThaiOfficialHolidayItem[];
  }>
> {
  try {
    const tenant = await requireTenantContext();
    if (!hasPermission(tenant.role, PERMISSIONS.HOLIDAY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลวันหยุดบริษัท",
      };
    }

    const targetYear = toGregorianYear(year);
    const hd = new Holidays("TH", { languages: "th" });
    const rawList = hd.getHolidays(targetYear) || [];

    // Query existing holidays for this company and year to identify already-imported days
    const existingHolidays = await prisma.holiday.findMany({
      where: {
        companyId: tenant.companyId,
        year: targetYear,
      },
      select: {
        id: true,
        name: true,
        date: true,
      },
    });

    const existingDateSet = new Set(
      existingHolidays.map((h) => h.date.toISOString().slice(0, 10)),
    );

    const holidays: ThaiOfficialHolidayItem[] = rawList.map((h: any) => {
      const isoDate = h.date.substring(0, 10);
      const dateObj = new Date(isoDate + "T00:00:00.000Z");
      const isAlreadyImported = existingDateSet.has(isoDate);

      return {
        name: h.name,
        date: isoDate,
        formattedDate: formatThaiDate(dateObj, "long"),
        weekday: dateObj.toLocaleDateString("th-TH", {
          weekday: "long",
          timeZone: "UTC",
        }),
        isAlreadyImported,
      };
    });

    return {
      success: true,
      data: {
        year: targetYear,
        buddhistYear: toBuddhistYear(targetYear),
        holidays,
      },
    };
  } catch (error) {
    console.error("Get Thai Holidays Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลวันหยุดราชการไทย",
    };
  }
}

/**
 * Server action to automatically import Thai Official Public Holidays from `date-holidays` library for a specific year.
 * Allows importing all or a user-selected subset of holidays for that company.
 */
export async function importOfficialHolidaysAction(
  year: number = new Date().getFullYear(),
  selectedHolidays?: { name: string; date: string }[],
): Promise<
  ActionResult<{
    count: number;
    skippedCount: number;
    year: number;
    holidays: SerializedHolidayData[];
  }>
> {
  try {
    const tenant = await requireTenantContext();
    if (!hasPermission(tenant.role, PERMISSIONS.HOLIDAY_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการวันหยุดบริษัท",
      };
    }

    const targetYear = toGregorianYear(year);

    let holidaysToImport: { name: string; date: string }[] = [];

    if (selectedHolidays && selectedHolidays.length > 0) {
      holidaysToImport = selectedHolidays;
    } else {
      const hd = new Holidays("TH", { languages: "th" });
      const rawList = hd.getHolidays(targetYear) || [];
      holidaysToImport = rawList.map((h: any) => ({
        name: h.name,
        date: h.date.substring(0, 10),
      }));
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const h of holidaysToImport) {
      const dateObj = new Date(h.date + "T00:00:00.000Z");
      const existing = await prisma.holiday.findFirst({
        where: {
          companyId: tenant.companyId,
          date: dateObj,
        },
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            companyId: tenant.companyId,
            name: h.name,
            date: dateObj,
            year: targetYear,
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "IMPORT_THAI_HOLIDAYS",
        resource: "Holiday",
        details: {
          year: targetYear,
          importedCount: createdCount,
          skippedCount,
          source: "date-holidays",
        },
      },
    });

    revalidatePath("/admin/holidays");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/dashboard");

    const allHolidays = await prisma.holiday.findMany({
      where: {
        companyId: tenant.companyId,
        year: targetYear,
      },
      orderBy: { date: "asc" },
    });

    const formattedHolidays: SerializedHolidayData[] = allHolidays.map((h) => ({
      id: h.id,
      date: formatThaiDate(h.date, "short"),
      isoDate: h.date.toISOString().slice(0, 10),
      weekday: h.date.toLocaleDateString("th-TH", {
        weekday: "long",
        timeZone: "UTC",
      }),
      name: h.name,
    }));

    const bYear = toBuddhistYear(targetYear);
    return {
      success: true,
      message: `นำเข้าวันหยุดนักขัตฤกษ์ไทยประจำปี ${bYear} สำเร็จจำนวน ${createdCount} วัน${
        skippedCount > 0 ? ` (มีอยู่แล้ว ${skippedCount} วัน)` : ""
      }`,
      data: {
        count: createdCount,
        skippedCount,
        year: targetYear,
        holidays: formattedHolidays,
      },
    };
  } catch (error) {
    console.error("Import Holidays Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการนำเข้าวันหยุดนักขัตฤกษ์",
    };
  }
}

