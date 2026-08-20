import { prisma } from "@/lib/database";
import {
  CompanyManagementTable,
  SerializedCompany,
} from "@/components/system-admin/company-management-table";

export const dynamic = "force-dynamic";

export default async function SystemAdminCompaniesPage() {
  const [companies, globalLinePushSetting] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: {
          select: { employees: true, users: true, leaveRequests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "line_push_enabled" },
      select: { value: true },
    }),
  ]);

  const serializedCompanies: SerializedCompany[] = companies.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    contactEmail: c.email,
    contactPhone: c.phone,
    status: c.status as "ACTIVE" | "SUSPENDED",
    enableLinePush: c.enableLinePush,
    enableApi: c.enableApi,
    enableWebhook: c.enableWebhook,
    createdAt: c.createdAt.toISOString(),
    employeesCount: c._count.employees,
    usersCount: c._count.users,
    leaveRequestsCount: c._count.leaveRequests,
  }));

  const globalLinePushEnabled = globalLinePushSetting
    ? globalLinePushSetting.value !== "false"
    : true;

  return (
    <CompanyManagementTable
      initialCompanies={serializedCompanies}
      initialGlobalLinePush={globalLinePushEnabled}
    />
  );
}
