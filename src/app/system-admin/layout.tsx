import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  SystemAdminSidebar,
  SystemAdminNavbar,
} from "@/components/system-admin";

export default async function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "SYSTEM_ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col lg:flex-row text-[#0d253d]">
      {/* Super Admin Sidebar */}
      <SystemAdminSidebar userName={session.name} />

      {/* Main Content Area with Navbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <SystemAdminNavbar userName={session.name} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
