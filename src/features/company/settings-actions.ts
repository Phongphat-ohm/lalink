"use server";

import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

const companySettingsSchema = z.object({
  name: z.string().min(2, "ชื่อบริษัทต้องมีความยาวอย่างน้อย 2 ตัวอักษร").trim(),
  taxId: z.string().optional().or(z.literal("")),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

/**
 * Server action to update company profile and organization settings.
 */
export async function updateCompanySettingsAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session || !session.companyId) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const rawData = {
      name: formData.get("name"),
      taxId: formData.get("taxId") || undefined,
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
    };

    const validated = companySettingsSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { name, taxId, email, phone, address } = validated.data;

    const updated = await prisma.company.update({
      where: { id: session.companyId },
      data: {
        name,
        taxId: taxId || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
      },
    });

    try {
      const { AuditLogger } = await import("@/lib/audit");
      await AuditLogger.log({
        companyId: session.companyId,
        actorType: "USER",
        actorId: session.userId,
        action: "UPDATE_SETTINGS",
        resource: "Company",
        resourceId: updated.id,
        details: { name: updated.name, email: updated.email },
      });
    } catch {
      // ignore
    }

    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "บันทึกการตั้งค่าองค์กรเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Update Company Settings Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า",
    };
  }
}
