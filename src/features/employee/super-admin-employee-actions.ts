"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import type { ActionResult } from "@/lib/types";

/**
 * Super Admin: Unlink LINE account from an employee (e.g. employee linked wrong LINE account)
 */
export async function superAdminUnlinkLineAction(
  employeeId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin only" };
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { company: { select: { id: true, name: true, code: true } } },
    });

    if (!employee) {
      return { success: false, message: "ไม่พบข้อมูลพนักงาน" };
    }

    if (!employee.lineUserId) {
      return { success: false, message: "พนักงานท่านนี้ยังไม่ได้ผูกบัญชี LINE" };
    }

    const oldLineId = employee.lineUserId;

    await prisma.employee.update({
      where: { id: employeeId },
      data: { lineUserId: null },
    });

    await AuditLogger.log({
      companyId: employee.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "UNLINK_LINE",
      resource: "Employee",
      resourceId: employee.id,
      details: {
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        oldLineUserId: oldLineId.slice(0, 8) + "...",
        performedBy: "SUPER_ADMIN",
      },
    });

    revalidatePath("/system-admin/employees");
    return {
      success: true,
      message: `ปลดการเชื่อมต่อ LINE ของคุณ ${employee.firstName} ${employee.lastName} เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Super Admin Unlink LINE Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการปลดการเชื่อมต่อ LINE" };
  }
}
