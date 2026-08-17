"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function unlinkEmployeeLineAction(
  employeeId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: session.companyId },
    });

    if (!employee) {
      return { success: false, message: "ไม่พบข้อมูลพนักงาน" };
    }

    if (!employee.lineUserId) {
      return { success: false, message: "พนักงานรายนี้ยังไม่ได้ผูกบัญชี LINE" };
    }

    const previousLineId = employee.lineUserId;

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        lineUserId: null,
        avatarUrl: null,
      },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "UNLINK_LINE",
      resource: "Employee",
      resourceId: employeeId,
      details: {
        employeeCode: employee.employeeCode,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        previousLineId: previousLineId
          ? `${previousLineId.slice(0, 6)}...`
          : null,
      },
    });

    revalidatePath("/admin/line-accounts");
    revalidatePath("/admin/employees");

    return {
      success: true,
      message: `ยกเลิกการเชื่อมต่อ LINE ของ ${employee.firstName} ${employee.lastName} เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Unlink LINE Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE",
    };
  }
}
