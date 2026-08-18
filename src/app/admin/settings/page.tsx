import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  AdminSettingsView,
  SerializedCompanySettings,
} from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { companyId } = await requireAdminPermission(PERMISSIONS.COMPANY_UPDATE);

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
