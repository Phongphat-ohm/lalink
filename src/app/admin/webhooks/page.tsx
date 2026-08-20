import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { AdminWebhooksView } from "@/components/admin/admin-webhooks-view";
import type { SerializedWebhookSubscription } from "@/components/admin/admin-webhooks-view";

export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage() {
  const { companyId } = await requireAdminPermission(
    PERMISSIONS.WEBHOOK_MANAGE,
  );

  // Fetch company and webhook subscriptions
  const [company, subs] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { enableWebhook: true },
    }),
    prisma.webhookSubscription.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { eventLogs: true } },
      },
    }),
  ]);

  const serializedSubs: SerializedWebhookSubscription[] = subs.map((s) => ({
    id: s.id,
    url: s.url,
    events: s.events,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    eventLogCount: s._count.eventLogs,
  }));

  return (
    <AdminWebhooksView
      subscriptions={serializedSubs}
      isWebhookEnabled={company?.enableWebhook ?? false}
    />
  );
}
