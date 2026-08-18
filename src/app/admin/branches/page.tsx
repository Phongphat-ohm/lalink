import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { BranchView, SerializedBranch } from "@/components/admin/branch-view";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.BRANCH_MANAGE);

  const branches = await prisma.branch.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { employees: true, departments: true },
      },
    },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });

  const serializedBranches: SerializedBranch[] = branches.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    address: b.address,
    phone: b.phone,
    isMain: b.isMain,
    employeesCount: b._count.employees,
    departmentsCount: b._count.departments,
    createdAt: b.createdAt.toISOString(),
  }));

  return <BranchView branches={serializedBranches} />;
}
