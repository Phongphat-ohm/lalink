import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  CompanySubscriptionView,
  SerializedSubscriptionData,
  SerializedUpgradeRequest,
} from "@/components/admin/company-subscription-view";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.SUBSCRIPTION_VIEW);

  const [
    company,
    subscription,
    availablePlans,
    upgradeRequests,
    employeesCount,
    adminsCount,
    branchesCount,
    departmentsCount,
    leaveRequestsCount,
    attachmentsCount,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, code: true, status: true, createdAt: true },
    }),
    prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    }),
    prisma.planUpgradeRequest.findMany({
      where: { companyId },
      include: {
        targetPlan: true,
        currentPlan: true,
        requestedBy: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.employee.count({
      where: { companyId, status: { in: ["ACTIVE", "PROBATION"] } },
    }),
    prisma.user.count({
      where: { companyId, status: "ACTIVE" },
    }),
    prisma.branch.count({
      where: { companyId },
    }),
    prisma.department.count({
      where: { companyId },
    }),
    prisma.leaveRequest.count({
      where: { companyId },
    }),
    prisma.leaveAttachment.count({
      where: { leaveRequest: { companyId } },
    }),
  ]);

  if (!company) {
    redirect("/admin/login");
  }

  const serializedRequests: SerializedUpgradeRequest[] = upgradeRequests.map((r) => ({
    id: r.id,
    targetPlanId: r.targetPlanId,
    targetPlanName: r.targetPlan.name,
    targetPlanCode: r.targetPlan.code,
    currentPlanName: r.currentPlan?.name || null,
    requestedSeats: r.requestedSeats,
    billingCycle: r.billingCycle,
    notes: r.notes,
    status: r.status,
    requestedByName: r.requestedBy.name,
    reviewedByName: r.reviewedBy?.name || null,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
  }));

  const serializedData: SerializedSubscriptionData = {
    company: {
      id: company.id,
      name: company.name,
      code: company.code,
      status: company.status,
      createdAt: company.createdAt.toISOString(),
    },
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
          trialEndsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
          plan: {
            id: subscription.plan.id,
            code: subscription.plan.code,
            name: subscription.plan.name,
            description: subscription.plan.description,
            maxEmployees: subscription.plan.maxEmployees,
            maxAdmins: subscription.plan.maxAdmins,
            priceMonthly: Number(subscription.plan.priceMonthly),
            priceYearly: Number(subscription.plan.priceYearly),
            features: (subscription.plan.features as Record<string, any>) || null,
          },
        }
      : null,
    usage: {
      employeesCount,
      adminsCount,
      branchesCount,
      departmentsCount,
      leaveRequestsCount,
      attachmentsCount,
    },
    availablePlans: availablePlans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      maxEmployees: p.maxEmployees,
      maxAdmins: p.maxAdmins,
      priceMonthly: Number(p.priceMonthly),
      priceYearly: Number(p.priceYearly),
      features: (p.features as Record<string, any>) || null,
    })),
    upgradeRequests: serializedRequests,
  };

  return <CompanySubscriptionView data={serializedData} />;
}
