import { prisma } from "@/lib/database";
import {
  SubscriptionManagementView,
  SerializedCompanySubscription,
  AvailablePlan,
  SerializedGlobalPlanUpgradeRequest,
} from "@/components/system-admin/subscription-management-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminSubscriptionsPage() {
  const [companies, plans, upgradeRequests] = await Promise.all([
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
    prisma.planUpgradeRequest.findMany({
      include: {
        company: { select: { id: true, name: true, code: true } },
        targetPlan: true,
        currentPlan: true,
        requestedBy: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
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

  const serializedRequests: SerializedGlobalPlanUpgradeRequest[] = upgradeRequests.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyName: r.company.name,
    companyCode: r.company.code,
    targetPlanId: r.targetPlanId,
    targetPlanName: r.targetPlan.name,
    targetPlanCode: r.targetPlan.code,
    currentPlanName: r.currentPlan?.name || null,
    requestedSeats: r.requestedSeats,
    billingCycle: r.billingCycle,
    notes: r.notes,
    status: r.status,
    requestedByName: r.requestedBy.name,
    requestedByEmail: r.requestedBy.email,
    reviewedByName: r.reviewedBy?.name || null,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <SubscriptionManagementView
      companies={serializedCompanies}
      availablePlans={availablePlans}
      upgradeRequests={serializedRequests}
    />
  );
}
