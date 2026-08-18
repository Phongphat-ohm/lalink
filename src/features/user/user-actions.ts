"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS } from "@/lib/permissions/rbac";
import { hashPassword } from "@/lib/security/password";
import { revalidatePath } from "next/cache";
import { ActorType, UserStatus } from "@prisma/client";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร")
  .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว")
  .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว");

const createUserSchema = z.object({
  name: z.string().min(1, "กรุณาระบุชื่อผู้ใช้").trim(),
  email: z
    .string()
    .min(1, "กรุณาระบุอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .trim()
    .toLowerCase(),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
  password: passwordSchema,
});

const updateUserSchema = z.object({
  userId: z.string().min(1, "กรุณาระบุผู้ใช้"),
  name: z.string().min(1, "กรุณาระบุชื่อผู้ใช้").trim(),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "กรุณาระบุผู้ใช้"),
  newPassword: passwordSchema,
});

/**
 * Returns the roles available within the tenant (excludes global SYSTEM_ADMIN).
 */
async function resolveTenantRole(companyId: string, roleId: string) {
  return prisma.role.findFirst({
    where: { id: roleId, companyId, code: { not: "SYSTEM_ADMIN" } },
  });
}

/**
 * Server action for the company admin to create a new login user.
 */
export async function createUserAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.USER_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการผู้ใช้ระบบ" };
    }

    const validated = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      roleId: formData.get("roleId"),
      password: formData.get("password"),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    const [existingUser, role] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      resolveTenantRole(tenant.companyId, data.roleId),
    ]);

    if (existingUser) {
      return {
        success: false,
        message: `อีเมล "${data.email}" มีบัญชีผู้ใช้ในระบบแล้ว`,
        errors: { email: ["อีเมลนี้ถูกใช้งานแล้ว"] },
      };
    }

    if (!role) {
      return {
        success: false,
        message: "ไม่พบบทบาทที่เลือกในบริษัทนี้",
        errors: { roleId: ["บทบาทไม่ถูกต้อง"] },
      };
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        companyId: tenant.companyId,
        roleId: role.id,
        email: data.email,
        name: data.name,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "CREATE_USER",
        resource: "User",
        resourceId: user.id,
        details: { email: user.email, name: user.name, role: role.code },
      },
    });

    revalidatePath("/admin/users");

    return { success: true, message: "เพิ่มผู้ใช้สำหรับเข้าสู่ระบบเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Create User Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้" };
  }
}

/**
 * Server action to update a user's name, role, or status.
 * Prevents self-deactivation to avoid admin lockout.
 */
export async function updateUserAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.USER_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการผู้ใช้ระบบ" };
    }

    const validated = updateUserSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      roleId: formData.get("roleId"),
      status: formData.get("status"),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    // Anti-IDOR: ensure the target user belongs to this company.
    const target = await prisma.user.findFirst({
      where: { id: data.userId, companyId: tenant.companyId },
    });
    if (!target) {
      return { success: false, message: "ไม่พบผู้ใช้ที่ระบุ" };
    }

    // Prevent self-deactivation / self status change.
    if (target.id === tenant.userId && data.status !== "ACTIVE") {
      return {
        success: false,
        message: "ไม่สามารถปิดใช้งานบัญชีของตนเองได้",
      };
    }

    const role = await resolveTenantRole(tenant.companyId, data.roleId);
    if (!role) {
      return {
        success: false,
        message: "ไม่พบบทบาทที่เลือกในบริษัทนี้",
        errors: { roleId: ["บทบาทไม่ถูกต้อง"] },
      };
    }

    await prisma.user.update({
      where: { id: target.id },
      data: { name: data.name, roleId: role.id, status: data.status },
    });

    // Revoke sessions when the account is deactivated.
    if (data.status !== "ACTIVE") {
      await prisma.userSession.updateMany({
        where: { userId: target.id, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "UPDATE_USER",
        resource: "User",
        resourceId: target.id,
        details: { email: target.email, name: data.name, role: role.code, status: data.status },
      },
    });

    revalidatePath("/admin/users");

    return { success: true, message: "อัปเดตผู้ใช้เรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการอัปเดตผู้ใช้" };
  }
}

/**
 * Server action for an admin to reset another user's password.
 */
export async function resetUserPasswordAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.USER_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการผู้ใช้ระบบ" };
    }

    const validated = resetPasswordSchema.safeParse({
      userId: formData.get("userId"),
      newPassword: formData.get("newPassword"),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;

    const target = await prisma.user.findFirst({
      where: { id: data.userId, companyId: tenant.companyId },
    });
    if (!target) {
      return { success: false, message: "ไม่พบผู้ใช้ที่ระบุ" };
    }

    const passwordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: target.id },
      data: { passwordHash },
    });

    // Force re-login: revoke all existing sessions.
    await prisma.userSession.updateMany({
      where: { userId: target.id, isRevoked: false },
      data: { isRevoked: true },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "RESET_USER_PASSWORD",
        resource: "User",
        resourceId: target.id,
        details: { email: target.email },
      },
    });

    revalidatePath("/admin/users");

    return { success: true, message: "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Reset User Password Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" };
  }
}