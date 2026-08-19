import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { ProfileSettingsView, SerializedProfile } from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function SystemAdminProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM_ADMIN" || !session.userId) {
    redirect("/admin/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (!user) {
    redirect("/admin/login");
  }

  const serialized: SerializedProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: session.role,
    companyName: null,
    companyCode: null,
    createdAt: user.createdAt.toISOString(),
  };

  return <ProfileSettingsView profile={serialized} isSystemAdmin />;
}