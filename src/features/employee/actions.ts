"use server";

import { accountLinkingSchema } from "./schemas";
import { prisma } from "@/lib/database";
import { verifyLineIdToken } from "@/lib/line/verify-token";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/security/rate-limiter";
import { createSession } from "@/lib/auth/session";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const GENERIC_LINK_ERROR =
  "ไม่สามารถเชื่อมต่อบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง";

/**
 * Server action to link LINE account with employee record for the first time.
 */
export async function linkAccountAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawData = {
    companyCode: formData.get("companyCode"),
    employeeCode: formData.get("employeeCode"),
    dateOfBirth: formData.get("dateOfBirth"),
    lineIdToken: formData.get("lineIdToken"),
  };

  // 1. Zod Validation
  const validatedFields = accountLinkingSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { companyCode, employeeCode, dateOfBirth, lineIdToken } =
    validatedFields.data;

  // 2. Rate Limiting Check (Anti-Brute Force on Account Linking)
  const rateLimitKey = `account-link:${companyCode}:${employeeCode}`;
  const rateLimitStatus = checkRateLimit(rateLimitKey, {
    maxAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000,
  });

  if (!rateLimitStatus.allowed) {
    return {
      success: false,
      message: `คุณพยายามเชื่อมต่อบัญชีผิดพลาดเกินกำหนด กรุณารออีก ${rateLimitStatus.lockoutRemainingSeconds} วินาทีก่อนลองใหม่`,
    };
  }

  try {
    // 3. Verify LINE Token if provided
    let verifiedLineUserId: string | null = null;
    let verifiedPictureUrl: string | null = null;

    if (lineIdToken) {
      const linePayload = await verifyLineIdToken(lineIdToken);
      if (linePayload) {
        verifiedLineUserId = linePayload.sub;
        verifiedPictureUrl = linePayload.picture || null;
      }
    }

    // 4. Find Company by Code
    const company = await prisma.company.findUnique({
      where: { code: companyCode },
    });

    if (!company || company.status !== "ACTIVE") {
      recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        message: GENERIC_LINK_ERROR,
      };
    }

    // 5. Find Employee by Company & Employee Code
    const employee = await prisma.employee.findUnique({
      where: {
        companyId_employeeCode: {
          companyId: company.id,
          employeeCode,
        },
      },
    });

    if (!employee || employee.status !== "ACTIVE") {
      recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        message: GENERIC_LINK_ERROR,
      };
    }

    // 6. Verify Date of Birth (Strict check against DB)
    const empDobFormatted = employee.dateOfBirth.toISOString().slice(0, 10);
    if (empDobFormatted !== dateOfBirth) {
      recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        message: GENERIC_LINK_ERROR,
      };
    }

    // 7. Check if already linked
    if (
      employee.lineUserId &&
      verifiedLineUserId &&
      employee.lineUserId !== verifiedLineUserId
    ) {
      recordFailedAttempt(rateLimitKey);
      return {
        success: false,
        message:
          "พนักงานนี้ได้เชื่อมต่อกับบัญชี LINE อื่นไปแล้ว กรุณาติดต่อ HR",
      };
    }

    // 8. Check if LINE User ID is already linked to another employee
    if (verifiedLineUserId) {
      const existingLineOwner = await prisma.employee.findUnique({
        where: { lineUserId: verifiedLineUserId },
      });

      if (existingLineOwner && existingLineOwner.id !== employee.id) {
        recordFailedAttempt(rateLimitKey);
        return {
          success: false,
          message:
            "บัญชี LINE นี้ถูกผูกกับพนักงานท่านอื่นแล้ว กรุณาติดต่อผู้ดูแลระบบ",
        };
      }
    }

    // 9. Update Employee Record
    const updateData: Record<string, unknown> = {};
    if (verifiedLineUserId) {
      updateData.lineUserId = verifiedLineUserId;
    }
    if (verifiedPictureUrl) {
      updateData.avatarUrl = verifiedPictureUrl;
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: updateData,
    });

    // 10. Reset Rate Limiter
    resetRateLimit(rateLimitKey);

    // 11. Create Employee Session
    await createSession({
      userId: employee.id,
      employeeId: employee.id,
      companyId: company.id,
      email: employee.email || "",
      name: `${employee.firstName} ${employee.lastName}`,
      role: "EMPLOYEE",
      type: "EMPLOYEE",
    });

    // 12. Audit Trail
    try {
      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          actorType: "EMPLOYEE",
          actorId: employee.id,
          action: "LINK_LINE",
          resource: "Employee",
          resourceId: employee.id,
          details: {
            employeeCode: employee.employeeCode,
            lineUserId: verifiedLineUserId,
          },
        },
      });
    } catch {
      // Non-blocking audit error
    }

    return {
      success: true,
      data: { redirectUrl: "/liff/dashboard" },
    };
  } catch (error) {
    console.error("Account Linking Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

/**
 * Checks if a LINE ID token belongs to an existing linked employee and logs them in.
 */
export async function checkLineAuthAction(
  idToken: string,
): Promise<ActionResult<{ isLinked: boolean; redirectUrl?: string }>> {
  try {
    const payload = await verifyLineIdToken(idToken);
    if (!payload || !payload.sub) {
      return {
        success: false,
        message: "LINE Token ไม่ถูกต้องหรือหมดอายุ",
      };
    }

    const employee = await prisma.employee.findUnique({
      where: { lineUserId: payload.sub },
      include: { company: true },
    });

    if (
      !employee ||
      employee.status !== "ACTIVE" ||
      employee.company.status !== "ACTIVE"
    ) {
      return {
        success: true,
        data: { isLinked: false },
      };
    }

    // Auto-login existing linked employee
    await createSession({
      userId: employee.id,
      employeeId: employee.id,
      companyId: employee.companyId,
      email: employee.email || "",
      name: `${employee.firstName} ${employee.lastName}`,
      role: "EMPLOYEE",
      type: "EMPLOYEE",
    });

    return {
      success: true,
      data: {
        isLinked: true,
        redirectUrl: "/liff/dashboard",
      },
    };
  } catch (err) {
    console.error("Check LINE Auth Error:", err);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ LINE",
    };
  }
}
