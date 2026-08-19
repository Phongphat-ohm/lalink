import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { LeaveTypeView } from "@/components/admin/leave-type-view";
import { saveLeaveTypePolicyAction } from "@/features/leave";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function saveTypeServerAction(formData: FormData) {
  "use server";
  const res = await saveLeaveTypePolicyAction(null, formData);
  revalidatePath("/admin/leave-types");
  return { success: res.success, message: res.message };
}

export default async function AdminLeaveTypesPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POLICY_MANAGE);

  const rawLeaveTypes = await prisma.leaveType.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  const leaveTypes = rawLeaveTypes.map((lt) => ({
    id: lt.id,
    code: lt.code,
    name: lt.name,
    description: lt.description,
    defaultDays: Number(lt.defaultDays),
    allowHalfDay: lt.allowHalfDay,
    allowHourly: lt.allowHourly,
    allowCarryForward: lt.allowCarryForward,
    maxCarryForwardDays:
      lt.maxCarryForwardDays !== null ? Number(lt.maxCarryForwardDays) : null,
    requireReason: lt.requireReason,
    isPaid: lt.isPaid,
    isActive: lt.isActive,
  }));

  return (
    <LeaveTypeView
      leaveTypes={leaveTypes}
      onSaveLeaveType={saveTypeServerAction}
    />
  );
}
