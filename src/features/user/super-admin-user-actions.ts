"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";
import { AuditLogger } from "@/lib/audit";
import { z } from "zod";
import { UserStatus } from "@prisma/client";
import type { ActionResult } from "@/lib/types";

const createUserSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
  roleId: z.string().min(1, "กรุณาเลือกสิทธิ์ (Role)"),
  companyId: z.string().optional().nullable(),
});

/**
 * Super Admin: Create a new User / Admin
 */
export async function createUserSuperAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized: Super Admin access required" };
    }

    const rawData = {
      name: formData.get("name")?.toString().trim(),
      email: formData.get("email")?.toString().trim().toLowerCase(),
      password: formData.get("password")?.toString(),
      roleId: formData.get("roleId")?.toString(),
      companyId: formData.get("companyId")?.toString() || null,
    };

    const parsed = createUserSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name, email, password, roleId, companyId } = parsed.data;

    // Check unique email
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        message: `อีเมล "${email}" มีอยู่ในระบบแล้ว`,
        errors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId,
        companyId: companyId || null,
        status: UserStatus.ACTIVE,
      },
    });

    await AuditLogger.log({
      companyId: companyId || undefined,
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_USER",
      resource: "User",
      resourceId: user.id,
      details: { email: user.email, name: user.name, roleId },
    });

    revalidatePath("/system-admin/users");
    revalidatePath("/system-admin");

    return {
      success: true,
      message: `สร้างผู้ใช้งาน "${user.name}" สำเร็จเรียบร้อย`,
      data: { userId: user.id },
    };
  } catch (error) {
    console.error("Create User Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน" };
  }
}

/**
 * Super Admin: Update User details and role
 */
export async function updateUserSuperAdminAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const roleId = formData.get("roleId")?.toString();
    const companyId = formData.get("companyId")?.toString() || null;
    const status = formData.get("status")?.toString() as UserStatus;

    if (!name || name.length < 2) {
      return { success: false, message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" };
    }
    if (!email) {
      return { success: false, message: "กรุณาระบุอีเมล" };
    }

    // Check email duplication with other users
    const existing = await prisma.user.findFirst({
      where: { email, id: { not: userId } },
      select: { id: true },
    });

    if (existing) {
      return { success: false, message: `อีเมล "${email}" ถูกใช้โดยบัญชีอื่นแล้ว` };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        roleId: roleId || undefined,
        companyId: companyId || null,
        status: status || undefined,
      },
    });

    await AuditLogger.log({
      companyId: updated.companyId || undefined,
      actorType: "USER",
      actorId: session.userId,
      action: "UPDATE_USER",
      resource: "User",
      resourceId: updated.id,
      details: { email: updated.email, name: updated.name },
    });

    revalidatePath("/system-admin/users");

    return {
      success: true,
      message: `อัปเดตข้อมูลผู้ใช้ "${updated.name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้งาน" };
  }
}

/**
 * Super Admin: Toggle User Status
 */
export async function toggleUserStatusSuperAdminAction(
  userId: string,
  status: UserStatus,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    // Prevent self-suspension
    if (session.userId === userId) {
      return { success: false, message: "ไม่สามารถระงับบัญชีของตนเองได้" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: status === "ACTIVE" ? "ACTIVATE_USER" : "SUSPEND_USER",
      resource: "User",
      resourceId: userId,
      details: { email: updated.email, status },
    });

    revalidatePath("/system-admin/users");
    return {
      success: true,
      message: `เปลี่ยนสถานะผู้ใช้ "${updated.name}" เป็น ${status} เรียบร้อย`,
    };
  } catch (error) {
    console.error("Toggle User Status Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ" };
  }
}

/**
 * Super Admin: Delete User
 */
export async function deleteUserSuperAdminAction(userId: string): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || session.role !== "SYSTEM_ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    if (session.userId === userId) {
      return { success: false, message: "ไม่สามารถลบบัญชีของตนเองได้" };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return { success: false, message: "ไม่พบผู้ใช้งาน" };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await AuditLogger.log({
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_USER",
      resource: "User",
      resourceId: userId,
      details: { email: user.email, name: user.name },
    });

    revalidatePath("/system-admin/users");
    return { success: true, message: `ลบผู้ใช้งาน "${user.name}" สำเร็จเรียบร้อย` };
  } catch (error) {
    console.error("Delete User Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบผู้ใช้งาน" };
  }
}
