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

const announcementSchema = z.object({
  title: z.string().min(1, "กรุณากรอกหัวข้อประกาศ").max(200).trim(),
  content: z.string().min(1, "กรุณากรอกเนื้อหาประกาศ").trim(),
  targetGroup: z.enum(["ALL", "BRANCH", "DEPARTMENT"]).default("ALL"),
  branchId: z.string().optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
});

export async function createAnnouncementAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const rawData = {
      title: formData.get("title"),
      content: formData.get("content"),
      targetGroup: formData.get("targetGroup") || "ALL",
      branchId: formData.get("branchId") || undefined,
      departmentId: formData.get("departmentId") || undefined,
    };

    const validated = announcementSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { title, content, targetGroup, branchId, departmentId } =
      validated.data;

    const announcement = await prisma.announcement.create({
      data: {
        companyId: session.companyId,
        title,
        content,
        targetGroup,
        branchId: targetGroup === "BRANCH" && branchId ? branchId : null,
        departmentId:
          targetGroup === "DEPARTMENT" && departmentId ? departmentId : null,
        isPublished: true,
      },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "CREATE_ANNOUNCEMENT",
      resource: "Announcement",
      resourceId: announcement.id,
      details: {
        title: announcement.title,
        targetGroup: announcement.targetGroup,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/liff/dashboard");

    return {
      success: true,
      message: "สร้างและเผยแพร่ประกาศเรียบร้อยแล้ว",
      data: announcement,
    };
  } catch (error) {
    console.error("Create Announcement Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการสร้างประกาศ" };
  }
}

export async function deleteAnnouncementAction(
  id: string,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return { success: false, message: "Unauthorized" };
    }

    const announcement = await prisma.announcement.findFirst({
      where: { id, companyId: session.companyId },
    });

    if (!announcement) {
      return { success: false, message: "ไม่พบประกาศ" };
    }

    await prisma.announcement.delete({
      where: { id },
    });

    await AuditLogger.log({
      companyId: session.companyId,
      actorType: "USER",
      actorId: session.userId,
      action: "DELETE_ANNOUNCEMENT",
      resource: "Announcement",
      resourceId: id,
      details: { title: announcement.title },
    });

    revalidatePath("/admin/announcements");

    return { success: true, message: "ลบประกาศเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบประกาศ" };
  }
}
