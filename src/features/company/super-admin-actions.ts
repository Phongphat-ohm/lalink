"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { createCompanyByAdminSchema } from "./schemas";
import { hashPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

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

/**
 * Super Admin: Update Company details (Name, taxId, email, phone, address)
 */
export async function updateCompanySuperAdminAction(
  companyId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin only" };
    }

    const name = formData.get("name")?.toString().trim();
    const taxId = formData.get("taxId")?.toString().trim() || null;
    const email = formData.get("email")?.toString().trim() || null;
    const phone = formData.get("phone")?.toString().trim() || null;
    const address = formData.get("address")?.toString().trim() || null;

    if (!name || name.length < 2) {
      return { success: false, message: "ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร" };
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        taxId,
        email,
        phone,
        address,
      },
    });

    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        companyId: updated.id,
        actorType: "USER",
        actorId: session.userId,
        action: "UPDATE_TENANT",
        resource: "Company",
        resourceId: updated.id,
        details: { name: updated.name, code: updated.code, email, phone },
      });
    } catch {
      // ignore
    }

    revalidatePath("/system-admin");
    revalidatePath("/system-admin/companies");

    return {
      success: true,
      message: `อัปเดตข้อมูลบริษัท "${updated.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Update Company Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลบริษัท" };
  }
}

/**
 * Super Admin: Delete / Archive a company
 */
export async function deleteCompanySuperAdminAction(
  companyId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin only" };
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, code: true },
    });

    if (!company) {
      return { success: false, message: "ไม่พบข้อมูลบริษัท" };
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        actorType: "USER",
        actorId: session.userId,
        action: "DELETE_TENANT",
        resource: "Company",
        resourceId: companyId,
        details: { companyCode: company.code, companyName: company.name },
      });
    } catch {
      // ignore
    }

    revalidatePath("/system-admin");
    revalidatePath("/system-admin/companies");

    return {
      success: true,
      message: `ลบบริษัท "${company.name}" ออกจากระบบเรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Delete Company Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบบริษัท" };
  }
}

/**
 * Super Admin: Get complete details & stats for a tenant company
 */
export async function getCompanyDetailAction(companyId: string): Promise<
  ActionResult<{
    id: string;
    code: string;
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    createdAt: string;
    employeesCount: number;
    usersCount: number;
    leaveRequestsCount: number;
    departments: { id: string; name: string; code: string | null }[];
    subscription: { planName: string; planCode: string; status: string } | null;
  }>
> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        departments: { select: { id: true, name: true, code: true } },
        subscription: { include: { plan: true } },
        _count: {
          select: { employees: true, users: true, leaveRequests: true },
        },
      },
    });

    if (!company) {
      return { success: false, message: "ไม่พบข้อมูลบริษัท" };
    }

    return {
      success: true,
      data: {
        id: company.id,
        code: company.code,
        name: company.name,
        taxId: company.taxId,
        email: company.email,
        phone: company.phone,
        address: company.address,
        status: company.status,
        createdAt: company.createdAt.toISOString(),
        employeesCount: company._count.employees,
        usersCount: company._count.users,
        leaveRequestsCount: company._count.leaveRequests,
        departments: company.departments,
        subscription: company.subscription
          ? {
              planName: company.subscription.plan.name,
              planCode: company.subscription.plan.code,
              status: company.subscription.status,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Get Company Detail Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" };
  }
}

