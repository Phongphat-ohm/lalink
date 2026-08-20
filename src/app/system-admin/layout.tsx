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
    <div className="h-screen h-[100dvh] overflow-hidden bg-[#f6f9fc] flex flex-col lg:flex-row text-[#0d253d]">
      {/* Super Admin Sidebar */}
      <SystemAdminSidebar userName={session.name} />

      {/* Main Content Area with Navbar - Independent Scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f6f9fc]">
        <SystemAdminNavbar userName={session.name} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
