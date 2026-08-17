import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import {
  PositionView,
  SerializedPositionItem,
} from "@/components/admin/position-view";

export const dynamic = "force-dynamic";

export default async function AdminPositionsPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

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
