import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { BranchView, SerializedBranch } from "@/components/admin/branch-view";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

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
