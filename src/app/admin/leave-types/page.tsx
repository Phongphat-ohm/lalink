import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
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
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

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
