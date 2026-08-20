import { prisma } from "@/lib/database";
import { PlanManagementView, SerializedPlan } from "@/components/system-admin/plan-management-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminPlansPage() {
  const plans = await prisma.plan.findMany({
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
    orderBy: { priceMonthly: "asc" },
  });

  const serializedPlans: SerializedPlan[] = plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description,
    maxEmployees: p.maxEmployees,
    maxAdmins: p.maxAdmins,
    priceMonthly: p.priceMonthly.toString(),
    priceYearly: p.priceYearly.toString(),
    isActive: p.isActive,
    activeSubscriptionsCount: p._count.subscriptions,
    createdAt: p.createdAt.toISOString(),
  }));

  return <PlanManagementView plans={serializedPlans} />;
}
