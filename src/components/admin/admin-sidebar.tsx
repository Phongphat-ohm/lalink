"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Building,
  CalendarDays,
  Sparkles,
  BarChart3,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronRight,
  KeyRound,
  Settings,
  Briefcase,
  GitBranch,
  Scale,
  Smartphone,
  Megaphone,
} from "lucide-react";
import { logoutAdminAction } from "@/features/auth";
import { ChangePasswordModal } from "@/components/admin/change-password-modal";

interface AdminSidebarProps {
  userName: string;
  userRole: string;
  companyName: string;
  companyCode?: string;
  children: React.ReactNode;
}

export function AdminSidebarLayout({
  userName,
  userRole,
  companyName,
  companyCode = "DEMO",
  children,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);

  const navigationGroups = [
    {
      group: "ภาพรวม & งานประจำวัน",
      items: [
        {
          href: "/admin/dashboard",
          label: "แดชบอร์ดภาพรวม",
          icon: LayoutDashboard,
        },
        {
          href: "/admin/calendar",
          label: "ปฏิทินวันลาองค์กร",
          icon: CalendarDays,
        },
        {
          href: "/admin/leave-requests",
          label: "การอนุมัติใบลา",
          icon: FileCheck,
        },
      ],
    },
    {
      group: "โครงสร้างองค์กร",
      items: [
        {
          href: "/admin/employees",
          label: "ข้อมูลพนักงาน",
          icon: Users,
        },
        {
          href: "/admin/departments",
          label: "แผนกงาน",
          icon: Building,
        },
        {
          href: "/admin/positions",
          label: "ตำแหน่งงาน",
          icon: Briefcase,
        },
        {
          href: "/admin/branches",
          label: "สาขาองค์กร",
          icon: GitBranch,
        },
      ],
    },
    {
      group: "การจัดการวันลา",
      items: [
        {
          href: "/admin/leave-types",
          label: "นโยบายประเภทการลา",
          icon: Sparkles,
        },
        {
          href: "/admin/leave-balance",
          label: "โควตาและยอดวันลา",
          icon: Scale,
        },
        {
          href: "/admin/holidays",
          label: "ปฏิทินวันหยุดบริษัท",
          icon: CalendarDays,
        },
      ],
    },
    {
      group: "LINE & การสื่อสาร",
      items: [
        {
          href: "/admin/line-accounts",
          label: "บัญชี LINE ที่เชื่อมต่อ",
          icon: Smartphone,
        },
        {
          href: "/admin/announcements",
          label: "ประกาศและข่าวสาร",
          icon: Megaphone,
        },
      ],
    },
    {
      group: "รายงาน & ประวัติการทำงาน",
      items: [
        {
          href: "/admin/reports",
          label: "รายงานและสถิติ",
          icon: BarChart3,
        },
        {
          href: "/admin/audit-logs",
          label: "บันทึกประวัติการทำงาน",
          icon: ShieldAlert,
        },
      ],
    },
    {
      group: "ระบบ & นโยบาย",
      items: [
        {
          href: "/admin/settings",
          label: "ตั้งค่าระบบองค์กร",
          icon: Settings,
        },
      ],
    },
  ];

  async function handleLogout() {
    await logoutAdminAction();
    window.location.href = "/admin/login";
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f6f9fc] flex flex-col lg:flex-row text-[#0d253d]">
      {/* Mobile Top Header (Light Theme) */}
      <header className="lg:hidden shrink-0 flex h-16 items-center justify-between border-b border-[#e3e8ee] bg-white text-[#0d253d] px-4 shadow-xs z-40">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="LALINK Logo"
            className="h-9 w-9 object-contain shrink-0 rounded-xl"
          />
          <div>
            <span className="font-bold text-[#0d253d] text-sm tracking-tight">
              LALINK
            </span>
            <span className="text-[10px] text-[#533afd] bg-[#533afd]/10 font-semibold px-2 py-0.5 rounded-full ml-1.5 font-mono">
              {companyCode}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-[#64748d] hover:text-[#0d253d] hover:bg-[#f6f9fc]"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0d253d]/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar - Clean Light Theme */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e3e8ee] bg-white text-[#0d253d] transition-transform duration-200 ease-in-out lg:static lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:shadow-none"
        }`}
      >
        {/* Brand & Organization Section */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-[#e3e8ee] px-5 bg-white">
          <Link href="/admin/dashboard" className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="LALINK Logo"
              className="h-9 w-9 object-contain shrink-0 rounded-xl"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-[#0d253d] tracking-tight text-base">
                  LALINK
                </span>
                <span className="text-[10px] font-semibold text-[#533afd] bg-[#533afd]/10 border border-[#533afd]/20 px-2 py-0.5 rounded-full font-mono">
                  {companyCode}
                </span>
              </div>
              <p className="text-[11px] text-[#64748d] truncate max-w-[130px] font-medium">
                {companyName}
              </p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden h-8 w-8 text-[#64748d] hover:bg-[#f6f9fc]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Menu Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {navigationGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748d]/80">
                {grp.group}
              </h3>
              <div className="space-y-1 pt-1">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`group flex items-center justify-between px-3.5 py-2 rounded-full text-xs transition-all ${
                        isActive
                          ? "bg-[#533afd]/10 text-[#533afd] font-bold shadow-xs"
                          : "text-[#64748d] font-medium hover:bg-[#f6f9fc] hover:text-[#0d253d]"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? "text-[#533afd]"
                              : "text-[#64748d]/70 group-hover:text-[#0d253d]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-[#533afd]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Logout Footer (Light Theme) */}
        <div className="shrink-0 border-t border-[#e3e8ee] p-3 bg-[#f6f9fc]/60">
          <div className="rounded-2xl border border-[#e3e8ee] bg-white p-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-white font-bold text-xs shadow-sm">
                {userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0d253d] truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-[#64748d] font-medium truncate">
                  {userRole}
                </p>
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full h-8 text-xs font-medium text-[#0d253d] border-[#e3e8ee] bg-[#f6f9fc] hover:bg-[#533afd]/10 hover:text-[#533afd] hover:border-[#533afd]/30 justify-center rounded-full"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5 text-[#533afd]" />
                เปลี่ยนรหัสผ่าน
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full h-8 text-xs font-medium text-[#ea2261] border-[#ea2261]/20 bg-transparent hover:bg-[#ffe4e6] hover:border-[#ea2261] justify-center rounded-full"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
      />

      {/* Main Content Area - Independent Scroll */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#f6f9fc]">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
