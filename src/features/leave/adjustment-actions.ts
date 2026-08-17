"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditLogger } from "@/lib/audit";
import { Prisma } from "@prisma/client";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const adjustmentSchema = z.object({
  employeeId: z.string().min(1, "กรุณาระบุพนักงาน"),
  leaveTypeId: z.string().min(1, "กรุณาระบุประเภทวันลา"),
  year: z.coerce.number().int().min(2020).max(2100),
  adjustmentDays: z.coerce
    .number()
    .refine((n) => n !== 0, "จำนวนวันปรับปรุงต้องไม่เป็น 0"),
  type: z.enum(["ADJUSTMENT", "CREDIT", "REVERSAL"]).default("ADJUSTMENT"),
  reason: z.string().min(1, "กรุณาระบุเหตุผลการปรับปรุงยอดวันลา").trim(),
});

export async function adjustLeaveBalanceAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      employeeId: formData.get("employeeId"),
      leaveTypeId: formData.get("leaveTypeId"),
      year: formData.get("year") || new Date().getFullYear(),
      adjustmentDays: formData.get("adjustmentDays"),
      type: formData.get("type") || "ADJUSTMENT",
      reason: formData.get("reason"),
    };

    const validated = adjustmentSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { employeeId, leaveTypeId, year, adjustmentDays, type, reason } =
      validated.data;

    const result = await prisma.$transaction(async (tx) => {
      // Find or create leave balance
      let balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId,
            leaveTypeId,
            year,
          },
        },
      });

      const leaveType = await tx.leaveType.findUniqueOrThrow({
        where: { id: leaveTypeId },
      });

      if (!balance) {
        balance = await tx.leaveBalance.create({
          data: {
            companyId: session.companyId!,
            employeeId,
            leaveTypeId,
            year,
            allocatedDays: leaveType.defaultDays,
            remainingDays: leaveType.defaultDays,
          },
        });
      }

      const balanceBefore = Number(balance.remainingDays);
      const balanceAfter = balanceBefore + adjustmentDays;

      if (balanceAfter < 0) {
        throw new Error("ยอดวันลาคงเหลือไม่สามารถติดลบได้");
      }

      // Update LeaveBalance
      const updatedBalance = await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          remainingDays: new Prisma.Decimal(balanceAfter),
          allocatedDays:
            adjustmentDays > 0 && type === "CREDIT"
              ? new Prisma.Decimal(
                  Number(balance.allocatedDays) + adjustmentDays,
                )
              : balance.allocatedDays,
        },
      });

      // Record LeaveTransaction Ledger
      const transaction = await tx.leaveTransaction.create({
        data: {
          companyId: session.companyId!,
          employeeId,
          leaveTypeId,
          type,
          days: new Prisma.Decimal(adjustmentDays),
          balanceBefore: new Prisma.Decimal(balanceBefore),
          balanceAfter: new Prisma.Decimal(balanceAfter),
          reason,
          createdBy: session.userId,
        },
      });

      return { updatedBalance, transaction };
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "ADJUST_LEAVE_BALANCE",
      resource: "LeaveBalance",
      resourceId: result.updatedBalance.id,
      details: {
        employeeId,
        leaveTypeId,
        adjustmentDays,
        reason,
        balanceAfter: Number(result.updatedBalance.remainingDays),
      },
    });

    revalidatePath("/admin/leave-balance");
    revalidatePath("/admin/employees");
    revalidatePath("/liff/dashboard");

    return {
      success: true,
      message: `ปรับปรุงยอดวันลาสำเร็จ ยอดคงเหลือใหม่คือ ${result.updatedBalance.remainingDays} วัน`,
    };
  } catch (error) {
    console.error("Adjust Leave Balance Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการปรับปรุงยอดวันลา",
    };
  }
}
