"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditLogger } from "@/lib/audit";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const branchSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสสาขา").max(20).trim().toUpperCase(),
  name: z.string().min(1, "กรุณากรอกชื่อสาขา").max(100).trim(),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  isMain: z.boolean().default(false),
});

export async function createBranchAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      code: formData.get("code"),
      name: formData.get("name"),
      address: formData.get("address") || undefined,
      phone: formData.get("phone") || undefined,
      isMain: formData.get("isMain") === "true",
    };

    const validated = branchSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { code, name, address, phone, isMain } = validated.data;

    // Check duplicate code in company
    const existing = await prisma.branch.findUnique({
      where: {
        companyId_code: {
          companyId: session.companyId,
          code,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: `รหัสสาขา "${code}" มีอยู่ในระบบแล้ว`,
        errors: { code: ["รหัสสาขานี้ถูกใช้งานแล้ว"] },
      };
    }

    const branch = await prisma.$transaction(async (tx) => {
      if (isMain) {
        // Reset previous main branch
        await tx.branch.updateMany({
          where: { companyId: session.companyId! },
          data: { isMain: false },
        });
      }

      return tx.branch.create({
        data: {
          companyId: session.companyId!,
          code,
          name,
          address: address || null,
          phone: phone || null,
          isMain,
        },
      });
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_BRANCH",
      resource: "Branch",
      resourceId: branch.id,
      details: { code: branch.code, name: branch.name },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `สร้างสาขา "${branch.name}" เรียบร้อยแล้ว`,
      data: branch,
    };
  } catch (error) {
    console.error("Create Branch Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างสาขา" };
  }
}

export async function updateBranchAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      id: formData.get("id"),
      code: formData.get("code"),
      name: formData.get("name"),
      address: formData.get("address") || undefined,
      phone: formData.get("phone") || undefined,
      isMain: formData.get("isMain") === "true",
    };

    const branchUpdateSchema = z.object({
      id: z.string().min(1, "ไม่พบรหัสสาขา"),
      ...branchSchema.shape,
    });

    const validated = branchUpdateSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { id, code, name, address, phone, isMain } = validated.data;

    // Anti-IDOR: must belong to the company
    const existing = await prisma.branch.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบข้อมูลสาขา" };
    }

    // Check duplicate code in company (excluding self)
    if (code !== existing.code) {
      const dup = await prisma.branch.findUnique({
        where: {
          companyId_code: { companyId: session.companyId, code },
        },
      });
      if (dup) {
        return {
          success: false,
          message: `รหัสสาขา "${code}" มีอยู่ในระบบแล้ว`,
          errors: { code: ["รหัสสาขานี้ถูกใช้งานแล้ว"] },
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      if (isMain) {
        await tx.branch.updateMany({
          where: { companyId: session.companyId! },
          data: { isMain: false },
        });
      }

      await tx.branch.update({
        where: { id },
        data: {
          code,
          name,
          address: address || null,
          phone: phone || null,
          isMain,
        },
      });
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "UPDATE_BRANCH",
      resource: "Branch",
      resourceId: id,
      details: { code, name },
    });

    revalidatePath("/admin/branches");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `แก้ไขสาขา "${name}" เรียบร้อยแล้ว`,
    };
  } catch (error) {
    console.error("Update Branch Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการแก้ไขสาขา" };
  }
}

export async function deleteBranchAction(
  branchId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, companyId: session.companyId },
      include: { _count: { select: { employees: true } } },
    });

    if (!branch) {
      return { success: false, message: "ไม่พบข้อมูลสาขา" };
    }

    if (branch._count.employees > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบสาขานี้ได้เนื่องจากมีพนักงานสังกัดอยู่ ${branch._count.employees} คน`,
      };
    }

    await prisma.branch.delete({
      where: { id: branchId },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_BRANCH",
      resource: "Branch",
      resourceId: branchId,
      details: { code: branch.code, name: branch.name },
    });

    revalidatePath("/admin/branches");

    return { success: true, message: "ลบสาขาเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Branch Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบสาขา" };
  }
}
