import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  LineAccountsView,
  SerializedLineEmployee,
} from "@/components/admin/line-accounts-view";

export const dynamic = "force-dynamic";

export default async function AdminLineAccountsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.LINE_MANAGE);

  const [company, employees] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, code: true },
    }),
    prisma.employee.findMany({
      where: { companyId },
      include: {
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: [{ lineUserId: "desc" }, { employeeCode: "asc" }],
    }),
  ]);

  const serializedEmployees: SerializedLineEmployee[] = employees.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    firstName: e.firstName,
    lastName: e.lastName,
    avatarUrl: e.avatarUrl,
    departmentName: e.department?.name || null,
    positionName: e.position?.name || null,
    isConnected: !!e.lineUserId,
    linkedAt: e.updatedAt.toISOString(),
  }));

  return (
    <LineAccountsView
      employees={serializedEmployees}
      companyName={company?.name || "LALINK"}
      companyCode={company?.code || "DEMO"}
    />
  );
}
