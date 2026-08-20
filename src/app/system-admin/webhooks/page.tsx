import { prisma } from "@/lib/database";
import {
  SystemAdminWebhooksView,
  SerializedGlobalWebhook,
  AvailableCompany,
} from "@/components/system-admin/webhooks-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminWebhooksPage() {
  const [subs, companies] = await Promise.all([
    prisma.webhookSubscription.findMany({
      include: {
        company: { select: { id: true, name: true, code: true } },
        _count: { select: { eventLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedSubs: SerializedGlobalWebhook[] = subs.map((s) => ({
    id: s.id,
    url: s.url,
    events: s.events,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    eventLogCount: s._count.eventLogs,
    company: s.company,
  }));

  const availableCompanies: AvailableCompany[] = companies;

  return (
    <SystemAdminWebhooksView
      subscriptions={serializedSubs}
      availableCompanies={availableCompanies}
    />
  );
}
