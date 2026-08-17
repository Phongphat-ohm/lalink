import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import {
  AdminSettingsView,
  SerializedCompanySettings,
} from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  const companyId = session.companyId!;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    redirect("/admin/login");
  }

  const serializedCompany: SerializedCompanySettings = {
    id: company.id,
    code: company.code,
    name: company.name,
    taxId: company.taxId,
    email: company.email,
    phone: company.phone,
    address: company.address,
    status: company.status,
  };

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

  return <AdminSettingsView company={serializedCompany} liffId={liffId} />;
}
