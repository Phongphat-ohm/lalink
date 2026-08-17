"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuditLogger } from "@/lib/audit";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const positionSchema = z.object({
  code: z.string().optional().or(z.literal("")),
  name: z.string().min(1, "กรุณากรอกชื่อตำแหน่ง").max(100).trim(),
});

export async function createPositionAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      code: formData.get("code") || undefined,
      name: formData.get("name"),
    };

    const validated = positionSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { code, name } = validated.data;

    const existing = await prisma.position.findUnique({
      where: {
        companyId_name: {
          companyId: session.companyId,
          name,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: `ชื่อตำแหน่ง "${name}" มีอยู่ในระบบแล้ว`,
      };
    }

    const position = await prisma.position.create({
      data: {
        companyId: session.companyId,
        code: code || null,
        name,
      },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_POSITION",
      resource: "Position",
      resourceId: position.id,
      details: { code: position.code, name: position.name },
    });

    revalidatePath("/admin/positions");
    revalidatePath("/admin/departments");

    return {
      success: true,
      message: `สร้างตำแหน่ง "${position.name}" เรียบร้อยแล้ว`,
      data: position,
    };
  } catch (error) {
    console.error("Create Position Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างตำแหน่ง" };
  }
}

export async function deletePositionAction(
  positionId: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const position = await prisma.position.findFirst({
      where: { id: positionId, companyId: session.companyId },
      include: { _count: { select: { employees: true } } },
    });

    if (!position) {
      return { success: false, message: "ไม่พบข้อมูลตำแหน่ง" };
    }

    if (position._count.employees > 0) {
      return {
        success: false,
        message: `ไม่สามารถลบตำแหน่งนี้ได้เนื่องจากมีพนักงานดำรงตำแหน่งอยู่ ${position._count.employees} คน`,
      };
    }

    await prisma.position.delete({
      where: { id: positionId },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_POSITION",
      resource: "Position",
      resourceId: positionId,
      details: { name: position.name },
    });

    revalidatePath("/admin/positions");
    revalidatePath("/admin/departments");

    return { success: true, message: "ลบตำแหน่งเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Position Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบตำแหน่ง" };
  }
}
