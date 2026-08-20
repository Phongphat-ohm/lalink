import { prisma } from "@/lib/database";
import {
  ApiKeysView,
  SerializedApiKey,
} from "@/components/system-admin/api-keys-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminApiKeysPage() {
  const [keys, companies] = await Promise.all([
    prisma.apiKey.findMany({
      include: {
        company: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedKeys: SerializedApiKey[] = keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    permissions: k.permissions,
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
    isRevoked: k.isRevoked,
    createdAt: k.createdAt.toISOString(),
    company: k.company,
  }));

  return <ApiKeysView apiKeys={serializedKeys} availableCompanies={companies} />;
}
