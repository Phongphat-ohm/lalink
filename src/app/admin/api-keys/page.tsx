import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import { redirect } from "next/navigation";
import { AdminApiKeysView } from "@/components/admin/admin-api-keys-view";
import type { SerializedApiKey } from "@/components/admin/admin-api-keys-view";

export const dynamic = "force-dynamic";

export default async function AdminApiKeysPage() {
  const { companyId } = await requireAdminPermission(
    PERMISSIONS.APIKEY_MANAGE,
  );

  // Fetch company and API keys
  const [company, keys] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { enableApi: true },
    }),
    prisma.apiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
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
  }));

  return (
    <AdminApiKeysView
      apiKeys={serializedKeys}
      isApiEnabled={company?.enableApi ?? false}
    />
  );
}
