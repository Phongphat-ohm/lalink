import { prisma } from "@/lib/database";
import {
  SubscriptionManagementView,
  SerializedCompanySubscription,
  AvailablePlan,
} from "@/components/system-admin/subscription-management-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminSubscriptionsPage() {
  const [companies, plans] = await Promise.all([
    prisma.company.findMany({
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: { employees: { where: { status: { in: ["ACTIVE", "PROBATION"] } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
  ]);

  const serializedCompanies: SerializedCompanySubscription[] = companies.map((c) => ({
    companyId: c.id,
    companyName: c.name,
    companyCode: c.code,
    employeesCount: c._count.employees,
    subscription: c.subscription
      ? {
          id: c.subscription.id,
          status: c.subscription.status,
          startDate: c.subscription.startDate.toISOString(),
          endDate: c.subscription.endDate ? c.subscription.endDate.toISOString() : null,
          trialEndsAt: c.subscription.trialEndsAt ? c.subscription.trialEndsAt.toISOString() : null,
          plan: {
            id: c.subscription.plan.id,
            code: c.subscription.plan.code,
            name: c.subscription.plan.name,
            maxEmployees: c.subscription.plan.maxEmployees,
            maxAdmins: c.subscription.plan.maxAdmins,
          },
        }
      : null,
  }));

  const availablePlans: AvailablePlan[] = plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    maxEmployees: p.maxEmployees,
  }));

  return (
    <SubscriptionManagementView
      companies={serializedCompanies}
      availablePlans={availablePlans}
    />
  );
}
