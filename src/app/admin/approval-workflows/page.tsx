import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { revalidatePath } from "next/cache";
import { WorkflowManagementView } from "@/components/admin/workflow-management-view";
import {
  saveWorkflowAction,
  toggleWorkflowAction,
  deleteWorkflowAction,
} from "@/features/leave";

export const dynamic = "force-dynamic";

async function saveWorkflowServerAction(formData: FormData) {
  "use server";
  const res = await saveWorkflowAction(null, formData);
  revalidatePath("/admin/approval-workflows");
  return { success: res.success, message: res.message };
}

async function toggleWorkflowServerAction(workflowId: string) {
  "use server";
  const res = await toggleWorkflowAction(workflowId);
  revalidatePath("/admin/approval-workflows");
  return { success: res.success, message: res.message };
}

async function deleteWorkflowServerAction(workflowId: string) {
  "use server";
  const res = await deleteWorkflowAction(workflowId);
  revalidatePath("/admin/approval-workflows");
  return { success: res.success, message: res.message };
}

export default async function AdminApprovalWorkflowsPage() {
  const { companyId } = await requireAdminPermission(
    PERMISSIONS.WORKFLOW_MANAGE,
  );

  const [workflows, leaveTypes] = await Promise.all([
    prisma.approvalWorkflow.findMany({
      where: { companyId },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        leaveType: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.leaveType.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    isActive: w.isActive,
    leaveTypeId: w.leaveTypeId,
    leaveTypeName: w.leaveType?.name ?? null,
    steps: w.steps.map((s) => ({
      stepOrder: s.stepOrder,
      roleCode: s.roleCode,
      name: s.name,
    })),
  }));

  return (
    <WorkflowManagementView
      workflows={serialized}
      leaveTypes={leaveTypes}
      onSaveWorkflow={saveWorkflowServerAction}
      onToggleWorkflow={toggleWorkflowServerAction}
      onDeleteWorkflow={deleteWorkflowServerAction}
    />
  );
}