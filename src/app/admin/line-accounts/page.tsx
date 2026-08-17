import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import {
  LineAccountsView,
  SerializedLineEmployee,
} from "@/components/admin/line-accounts-view";

export const dynamic = "force-dynamic";

export default async function AdminLineAccountsPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

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
