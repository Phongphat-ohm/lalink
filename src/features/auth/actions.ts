"use server";

import { adminLoginSchema } from "./schemas";
import { prisma } from "@/lib/database";
import { verifyPassword } from "@/lib/security/password";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/security/rate-limiter";
import { createSession, destroySession } from "@/lib/auth/session";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

/**
 * Server action to authenticate Admin/HR/Manager users.
 */
export async function loginAdminAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 1. Zod Input Validation
  const validatedFields = adminLoginSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const rateLimitKey = `admin-login:${email}`;

  // 2. Brute Force Protection & Rate Limiting Check
  const rateLimitStatus = checkRateLimit(rateLimitKey, {
    maxAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
  });

  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      message: `คุณเข้าสู่ระบบผิดพลาดเกินกำหนด กรุณารออีก ${rateLimitStatus.lockoutRemainingSeconds} วินาทีก่อนลองใหม่`,
    };
  }

  try {
    // 3. Database Query
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        company: true,
      },
    });

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
      };
    }

    // 4. Password Verification
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const failInfo = recordFailedAttempt(rateLimitKey);
      const remainingMsg =
        failInfo.remainingAttempts > 0
          ? ` (เหลือโอกาสอีก ${failInfo.remainingAttempts} ครั้ง)`
          : " (บัญชีถูกระงับชั่วคราว 15 นาที)";

      return {
        success: false,
        message: `อีเมลหรือรหัสผ่านไม่ถูกต้อง${remainingMsg}`,
      };
    }

    // 5. Account Status Check
    if (user.status !== "ACTIVE") {
      return {
        success: false,
        message: "บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ",
      };
    }

    if (user.company && user.company.status !== "ACTIVE") {
      return {
        success: false,
        message: "บริษัทต้นสังกัดถูกระงับการใช้งาน กรุณาติดต่อฝ่ายบริการ",
      };
    }

    // 6. Employees use LINE LIFF, not the web admin.
    if (user.role.code === "EMPLOYEE") {
      return {
        success: false,
        message:
          "พนักงานใช้งานระบบผ่าน LINE LIFF กรุณาเปิดแอป LINE แล้วเข้าใช้งานจากลิงก์ LIFF ของบริษัท",
      };
    }

    // 6. Reset Rate Limiter on Success
    resetRateLimit(rateLimitKey);

    // 7. Create Server-side Session
    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
      role: user.role.code,
      type: "USER",
    });

    // 8. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          companyId: user.companyId,
          actorType: "USER",
          actorId: user.id,
          action: "LOGIN",
          resource: "User",
          resourceId: user.id,
          details: { email: user.email, role: user.role.code },
        },
      });
    } catch {
      // Audit log error shouldn't block login
    }

    const redirectUrl =
      user.role.code === "SYSTEM_ADMIN" ? "/system-admin" : "/admin/dashboard";

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    console.error("Login Server Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Server action to log out and destroy session.
 */
export async function logoutAdminAction(): Promise<ActionResult> {
  await destroySession();
  return {
    success: true,
    data: { redirectUrl: "/admin/login" },
  };
}

/**
 * Server action for an authenticated User/Admin to change their own password.
 */
export async function changePasswordAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const { getSession } = await import("@/lib/auth/session");
    const session = await getSession();

    if (!session || !session.userId) {
      return {
        success: false,
        message: "กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน",
      };
    }

    const { changePasswordSchema } = await import("./schemas");
    const rawData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const validated = changePasswordSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลรหัสผ่านไม่ถูกต้องตามเกณฑ์ความปลอดภัย",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword } = validated.data;

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return {
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้งานในระบบ",
      };
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      return {
        success: false,
        message: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
        errors: { currentPassword: ["รหัสผ่านปัจจุบันไม่ถูกต้อง"] },
      };
    }

    // Hash new password using Argon2id
    const { hashPassword } = await import("@/lib/security/password");
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Record Audit Log
    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        companyId: user.companyId,
        actorType: "USER",
        actorId: user.id,
        action: "CHANGE_PASSWORD",
        resource: "User",
        resourceId: user.id,
        details: { email: user.email },
      });
    } catch {
      // Audit log error shouldn't block password change
    }

    return {
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Change Password Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
    };
  }
}

/**
 * Server action for Admin/System Admin to reset any user's password.
 */
export async function adminResetPasswordAction(
  targetUserId: string,
  newPassword: string,
): Promise<ActionResult> {
  try {
    const { getSession } = await import("@/lib/auth/session");
    const session = await getSession();

    if (!session || !session.userId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const { adminResetPasswordSchema } = await import("./schemas");
    const validated = adminResetPasswordSchema.safeParse({
      targetUserId,
      newPassword,
    });

    if (!validated.success) {
      return {
        success: false,
        message:
          "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษรและมีตัวพิมพ์ใหญ่/เล็ก/ตัวเลข",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { hashPassword } = await import("@/lib/security/password");
    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: newPasswordHash },
    });

    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        companyId: session.companyId,
        actorType: "USER",
        actorId: session.userId,
        action: "ADMIN_RESET_PASSWORD",
        resource: "User",
        resourceId: targetUserId,
        details: { resetBy: session.email },
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: "รีเซ็ตรหัสผ่านของผู้ใช้งานสำเร็จ",
    };
  } catch (error) {
    console.error("Admin Reset Password Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน",
    };
  }
}
