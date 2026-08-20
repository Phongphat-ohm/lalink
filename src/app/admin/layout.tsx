import * as React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/database";
import { AdminSidebarLayout } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If unauthenticated or accessing admin login, render plain layout without sidebar
  if (!session || session.type !== "USER" || !session.companyId) {
    return <>{children}</>;
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: {
      name: true,
      code: true,
      enableApi: true,
      enableWebhook: true,
    },
  });

  return (
    <AdminSidebarLayout
      userName={session.name}
      userRole={session.role}
      companyName={company?.name || "LALINK"}
      companyCode={company?.code || "DEMO"}
      enableApi={company?.enableApi ?? true}
      enableWebhook={company?.enableWebhook ?? true}
    >
      {children}
    </AdminSidebarLayout>
  );
}
