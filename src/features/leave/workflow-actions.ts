"use server";

import { z } from "zod";
import { prisma } from "@/lib/database";
import { requireTenantContext } from "@/lib/tenant";
import { hasPermission, PERMISSIONS, ROLES } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { ActorType } from "@prisma/client";

import type { ActionResult } from "@/lib/types";
export type { ActionResult };

const MAX_STEPS = 6;

/** Role codes that may act as approvers on a workflow step. */
const APPROVER_ROLES: string[] = [
  ROLES.COMPANY_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.HR,
  ROLES.MANAGER,
  ROLES.ADMIN,
];

const stepSchema = z.object({
  roleCode: z
    .string()
    .refine((r) => APPROVER_ROLES.includes(r), {
      message: "บทบาทนี้ไม่สามารถเป็นผู้อนุมัติได้",
    }),
  name: z.string().min(1, "กรุณาระบุชื่อขั้นตอน").trim(),
});

const workflowSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อสายการอนุมัติ").trim(),
  description: z.string().optional(),
  leaveTypeId: z.string().optional(),
  steps: z
    .array(stepSchema)
    .min(1, "ต้องมีอย่างน้อย 1 ขั้นตอน")
    .max(MAX_STEPS, `สูงสุด ${MAX_STEPS} ขั้นตอน`),
});

/**
 * Parses sequential step rows from the form. Steps are read until a blank
 * roleCode/name is encountered (trailing empty rows are ignored).
 */
function parseSteps(formData: FormData): z.infer<typeof stepSchema>[] {
  const steps: z.infer<typeof stepSchema>[] = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    const roleCode = (formData.get(`stepRole_${i}`) as string)?.trim();
    const name = (formData.get(`stepName_${i}`) as string)?.trim();
    if (!roleCode && !name) break; // trailing empty row
    if (roleCode || name) {
      steps.push({ roleCode, name });
    }
  }
  return steps;
}

/**
 * Server action to create or update an ApprovalWorkflow with its steps.
 * Enforces at most one active workflow per leave type (null = general).
 */
export async function saveWorkflowAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.WORKFLOW_MANAGE)) {
      return {
        success: false,
        message: "คุณไม่มีสิทธิ์ในการจัดการสายการอนุมัติ",
      };
    }

    const validated = workflowSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      leaveTypeId: formData.get("leaveTypeId") || undefined,
      steps: parseSteps(formData),
    });

    if (!validated.success) {
      return {
        success: false,
        message: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const data = validated.data;
    const leaveTypeId = data.leaveTypeId || null;

    // Leave type must belong to the company when specified.
    if (leaveTypeId) {
      const leaveType = await prisma.leaveType.findFirst({
        where: { id: leaveTypeId, companyId: tenant.companyId },
        select: { id: true },
      });
      if (!leaveType) {
        return { success: false, message: "ไม่พบประเภทการลาที่อ้างอิง" };
      }
    }

    // Prevent duplicate active workflow for the same leave type scope.
    const duplicate = await prisma.approvalWorkflow.findFirst({
      where: {
        companyId: tenant.companyId,
        leaveTypeId,
        isActive: true,
        id: data.id ? { not: data.id } : undefined,
      },
      select: { id: true },
    });
    if (duplicate) {
      return {
        success: false,
        message:
          "มีสายการอนุมัติที่ใช้งานอยู่สำหรับเงื่อนไขนี้แล้ว (ประเภทการลาเดียวกัน)",
      };
    }

    let workflowId = data.id;
    if (data.id) {
      const existing = await prisma.approvalWorkflow.findFirst({
        where: { id: data.id, companyId: tenant.companyId },
      });
      if (!existing) {
        return { success: false, message: "ไม่พบสายการอนุมัติที่ต้องการแก้ไข" };
      }
      await prisma.$transaction(async (tx) => {
        await tx.approvalWorkflow.update({
          where: { id: data.id },
          data: {
            name: data.name,
            description: data.description || null,
            leaveTypeId,
          },
        });
        await tx.workflowStep.deleteMany({ where: { workflowId: data.id } });
        await tx.workflowStep.createMany({
          data: data.steps.map((step, index) => ({
            workflowId: data.id as string,
            stepOrder: index + 1,
            roleCode: step.roleCode,
            name: step.name,
          })),
        });
      });
    } else {
      const created = await prisma.approvalWorkflow.create({
        data: {
          companyId: tenant.companyId,
          name: data.name,
          description: data.description || null,
          leaveTypeId,
          steps: {
            create: data.steps.map((step, index) => ({
              stepOrder: index + 1,
              roleCode: step.roleCode,
              name: step.name,
            })),
          },
        },
      });
      workflowId = created.id;
    }

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: data.id ? "UPDATE_WORKFLOW" : "CREATE_WORKFLOW",
        resource: "ApprovalWorkflow",
        resourceId: workflowId,
        details: { name: data.name, steps: data.steps.length },
      },
    });

    revalidatePath("/admin/approval-workflows");

    return {
      success: true,
      message: "บันทึกสายการอนุมัติเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Save Workflow Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการบันทึกสายการอนุมัติ",
    };
  }
}

/**
 * Server action to activate / deactivate an ApprovalWorkflow.
 * Activating a workflow with the same leave-type scope as another active
 * workflow is blocked to keep resolution deterministic.
 */
export async function toggleWorkflowAction(
  workflowId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.WORKFLOW_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการสายการอนุมัติ" };
    }

    const existing = await prisma.approvalWorkflow.findFirst({
      where: { id: workflowId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบสายการอนุมัติที่ระบุ" };
    }

    if (!existing.isActive) {
      const duplicate = await prisma.approvalWorkflow.findFirst({
        where: {
          companyId: tenant.companyId,
          leaveTypeId: existing.leaveTypeId,
          isActive: true,
          id: { not: workflowId },
        },
        select: { id: true },
      });
      if (duplicate) {
        return {
          success: false,
          message:
            "ไม่สามารถเปิดใช้งานได้ เนื่องจากมีสายการอนุมัติอื่นใช้งานอยู่แล้วสำหรับเงื่อนไขเดียวกัน",
        };
      }
    }

    await prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: { isActive: !existing.isActive },
    });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: existing.isActive ? "DEACTIVATE_WORKFLOW" : "ACTIVATE_WORKFLOW",
        resource: "ApprovalWorkflow",
        resourceId: workflowId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/approval-workflows");

    return {
      success: true,
      message: existing.isActive
        ? "ปิดใช้งานสายการอนุมัติเรียบร้อยแล้ว"
        : "เปิดใช้งานสายการอนุมัติเรียบร้อยแล้ว",
    };
  } catch (error) {
    console.error("Toggle Workflow Error:", error);
    return {
      success: false,
      message: "เกิดข้อผิดพลาดในการเปลี่ยนสถานะสายการอนุมัติ",
    };
  }
}

/**
 * Server action to delete an ApprovalWorkflow.
 */
export async function deleteWorkflowAction(
  workflowId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();

    if (!hasPermission(tenant.role, PERMISSIONS.WORKFLOW_MANAGE)) {
      return { success: false, message: "คุณไม่มีสิทธิ์ในการจัดการสายการอนุมัติ" };
    }

    const existing = await prisma.approvalWorkflow.findFirst({
      where: { id: workflowId, companyId: tenant.companyId },
    });
    if (!existing) {
      return { success: false, message: "ไม่พบสายการอนุมัติที่ระบุ" };
    }

    await prisma.approvalWorkflow.delete({ where: { id: workflowId } });

    await prisma.auditLog.create({
      data: {
        companyId: tenant.companyId,
        actorType: ActorType.USER,
        actorId: tenant.userId,
        action: "DELETE_WORKFLOW",
        resource: "ApprovalWorkflow",
        resourceId: workflowId,
        details: { name: existing.name },
      },
    });

    revalidatePath("/admin/approval-workflows");

    return { success: true, message: "ลบสายการอนุมัติเรียบร้อยแล้ว" };
  } catch (error) {
    console.error("Delete Workflow Error:", error);
    return { success: false, message: "เกิดข้อผิดพลาดในการลบสายการอนุมัติ" };
  }
}