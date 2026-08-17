import { prisma } from "@/lib/database";
import {
  ApiKeysView,
  SerializedApiKey,
} from "@/components/system-admin/api-keys-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminApiKeysPage() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializedKeys: SerializedApiKey[] = keys.map((k) => ({
    id: k.id,
    name: k.name,
    keyPrefix: k.keyPrefix,
    permissions: k.permissions,
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
    isRevoked: k.isRevoked,
    createdAt: k.createdAt.toISOString(),
  }));

  return <ApiKeysView apiKeys={serializedKeys} />;
}
