"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { createCompanyByAdminSchema } from "./schemas";
import { hashPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Super Admin: Toggle company status (ACTIVE / SUSPENDED).
 */
export async function toggleCompanyStatusAction(
  companyId: string,
  newStatus: "ACTIVE" | "SUSPENDED",
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "สิทธิ์การเข้าถึงไม่ถูกต้อง (ต้องเป็น Super Admin เท่านั้น)",
      };
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return {
        success: false,
        message: "ไม่พบข้อมูลบริษัทที่ต้องการ",
      };
    }

    await prisma.company.update({
      where: { id: companyId },
      data: { status: newStatus },
    });

    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        companyId: company.id,
        actorType: "USER",
        actorId: session.userId,
        action: newStatus === "ACTIVE" ? "ACTIVATE_TENANT" : "SUSPEND_TENANT",
        resource: "Company",
        resourceId: company.id,
        details: { companyCode: company.code, newStatus },
      });
    } catch {
      // ignore
    }

    revalidatePath("/system-admin");
    revalidatePath("/system-admin/companies");

    return {
      success: true,
      message: `เปลี่ยนสถานะบริษัท ${company.name} เป็น ${newStatus} สำเร็จ`,
    };
  } catch (error) {
    console.error("Toggle Company Status Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะบริษัท",
    };
  }
}

/**
 * Super Admin: Create a new tenant company directly with initial defaults.
 */
export async function createCompanySuperAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ companyId: string }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const rawData = {
      name: formData.get("name"),
      code: formData.get("code"),
      contactEmail: formData.get("contactEmail") || undefined,
      contactPhone: formData.get("contactPhone") || undefined,
    };

    const validated = createCompanyByAdminSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { name, code, contactEmail, contactPhone } = validated.data;

    // Check unique code
    const existing = await prisma.company.findUnique({
      where: { code },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message: `รหัสบริษัท "${code}" มีอยู่ในระบบแล้ว`,
        errors: { code: ["รหัสบริษัทนี้ถูกใช้งานแล้ว"] },
      };
    }

    const newCompany = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          code,
          email: contactEmail || null,
          phone: contactPhone || null,
          status: "ACTIVE",
        },
      });

      // Default Department
      await tx.department.create({
        data: {
          companyId: company.id,
          code: "GEN",
          name: "ฝ่ายบริหารและทั่วไป",
        },
      });

      // Default Leave Types
      await tx.leaveType.createMany({
        data: [
          {
            companyId: company.id,
            code: "ANNUAL",
            name: "ลาพักร้อนประจำปี",
            defaultDays: 6,
            allowHalfDay: true,
            isPaid: true,
            isActive: true,
          },
          {
            companyId: company.id,
            code: "SICK",
            name: "ลาป่วย",
            defaultDays: 30,
            allowHalfDay: true,
            isPaid: true,
            requireAttachment: true,
            attachmentRequiredDays: 3,
            isActive: true,
          },
          {
            companyId: company.id,
            code: "BUSINESS",
            name: "ลากิจธุระ",
            defaultDays: 3,
            allowHalfDay: true,
            isPaid: true,
            requireReason: true,
            isActive: true,
          },
        ],
      });

      return company;
    });

    revalidatePath("/system-admin");
    revalidatePath("/system-admin/companies");

    return {
      success: true,
      message: `สร้างบริษัท "${newCompany.name}" สำเร็จ`,
      data: { companyId: newCompany.id },
    };
  } catch (error) {
    console.error("Super Admin Create Company Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการสร้างบริษัท",
    };
  }
}

/**
 * Super Admin: Reset password for any user across all tenants.
 */
export async function superAdminResetUserPasswordAction(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
      };
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/system-admin/users");

    return {
      success: true,
      message: "รีเซ็ตรหัสผ่านของผู้ใช้งานสำเร็จ",
    };
  } catch (error) {
    console.error("Reset user password error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
    };
  }
}
