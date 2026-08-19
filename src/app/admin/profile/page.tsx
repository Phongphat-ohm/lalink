import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { ProfileSettingsView, SerializedProfile } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await getSession();
  if (!session || session.type !== "USER" || !session.userId) {
    redirect("/admin/login");
  }

  const [user, company] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    session.companyId
      ? prisma.company.findUnique({
          where: { id: session.companyId },
          select: { name: true, code: true },
        })
      : null,
  ]);

  if (!user) {
    redirect("/admin/login");
  }

  const serialized: SerializedProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: session.role,
    companyName: company?.name ?? null,
    companyCode: company?.code ?? null,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <ProfileSettingsView
      profile={serialized}
      isSystemAdmin={session.role === "SYSTEM_ADMIN"}
    />
  );
}