import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  PositionView,
  SerializedPositionItem,
} from "@/components/admin/position-view";

export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.POSITION_MANAGE);

  const positions = await prisma.position.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const serializedPositions: SerializedPositionItem[] = positions.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    employeesCount: p._count.employees,
    createdAt: p.createdAt.toISOString(),
  }));

  return <PositionView positions={serializedPositions} />;
}
