"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import {
  requireTenantContext,
  scopedEmployee,
  scopedLeaveType,
} from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { ActorType, EmployeeStatus } from "@prisma/client";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const createEmployeeAdminSchema = z.object({
  employeeCode: z.string().min(1, "กรุณาระบุรหัสพนักงาน").trim().toUpperCase(),
  firstName: z.string().min(1, "กรุณาระบุชื่อ"),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันเกิดต้องเป็น YYYY-MM-DD"),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  phone: z.string().optional(),
});

/**
 * Server action for HR/Admin to create a new employee and seed initial leave balances.
 */
export async function createEmployeeAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.EMPLOYEE_CREATE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการเพิ่มพนักงาน",
      };
    }

    const rawData = {
      employeeCode: formData.get("employeeCode"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dateOfBirth: formData.get("dateOfBirth"),
      departmentId: formData.get("departmentId") || undefined,
      positionId: formData.get("positionId") || undefined,
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
    };

    const validated = createEmployeeAdminSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    // Check duplicate employee code within company
    const existing = await scopedEmployee.findByCode(
      tenant.companyId,
      data.employeeCode,
    );
    if (existing) {
      return {
        success: false,
        message: `รหัสพนักงาน "${data.employeeCode}" มีอยู่ในระบบแล้ว`,
        errors: { employeeCode: ["รหัสพนักงานนี้ซ้ำกับในระบบ"] },
      };
    }

    const currentYear = new Date().getFullYear();
    const activeLeaveTypes = await scopedLeaveType.list(tenant.companyId);

    // Atomic creation of Employee + Initial Balances
    await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          companyId: tenant.companyId,
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          departmentId: data.departmentId || null,
          positionId: data.positionId || null,
          email: data.email || null,
          phone: data.phone || null,
          status: EmployeeStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      // Seed Leave Balances for all active Leave Types
      if (activeLeaveTypes.length > 0) {
        await tx.leaveBalance.createMany({
          data: activeLeaveTypes.map((lt) => ({
            companyId: tenant.companyId,
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
            allocatedDays: lt.defaultDays,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: lt.defaultDays,
          })),
        });
      }

      // Record Audit Trail
      await tx.auditLog.create({
        data: {
          companyId: tenant.companyId,
          actorType: ActorType.USER,
          actorId: tenant.userId,
          action: "CREATE_EMPLOYEE",
          resource: "Employee",
          resourceId: employee.id,
          details: {
            employeeCode: employee.employeeCode,
            name: `${employee.firstName} ${employee.lastName}`,
          },
        },
      });
    });

    return {
      success: true,
      message: "เพิ่มข้อมูลพนักงานและตั้งค่าโควตาวันลาเริ่มต้นเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Create Employee Admin Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างพนักงาน",
    };
  }
}

/**
 * Server action to unlink LINE account from employee.
 */
export async function unlinkLineEmployeeAction(
  employeeId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.EMPLOYEE_UPDATE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลพนักงาน",
      };
    }

    const employee = await scopedEmployee.findById(
      tenant.companyId,
      employeeId,
    );
    if (!employee) {
      return {
        success: false,
        message: "ไม่พบพนักงานที่ระบุ",
      };
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        lineUserId: null,
        avatarUrl: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "UNLINK_LINE",
        resource: "Employee",
        resourceId: employee.id,
        details: { employeeCode: employee.employeeCode },
      },
    });

    return {
      success: true,
      message: "ยกเลิกการเชื่อมต่อ LINE สำเร็จ",
    };
  } catch (error) {
    console.error("Unlink LINE Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ LINE",
    };
  }
}

/**
 * Server action for HR/Admin to perform PDPA Right to Erasure / Data Anonymization.
 */
export async function anonymizeEmployeeAction(
  employeeId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.EMPLOYEE_DELETE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการลบหรือ Anonymize ข้อมูลพนักงาน",
      };
    }

    const { anonymizeEmployeePII } = await import("@/lib/pdpa");
    const result = await anonymizeEmployeePII(
      employeeId,
      tenant.companyId,
      tenant.userId,
    );

    return result;
  } catch (error) {
    console.error("Anonymize Employee Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการลบข้อมูลส่วนบุคคล",
    };
  }
}
