"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Laptop,
  Activity,
  Database,
  Key,
  UserRound,
  CreditCard,
  Sparkles,
  Mail,
  BookOpen,
  Webhook,
} from "lucide-react";
import { logoutAdminAction } from "@/features/auth";

interface SystemAdminSidebarProps {
  userName: string;
}

interface NavigationCategory {
  title: string;
  items: {
    href: string;
    label: string;
    icon: React.ElementType;
    exact?: boolean;
    badge?: string;
  }[];
}

export function SystemAdminSidebar({ userName }: SystemAdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const navigationCategories: NavigationCategory[] = [
    {
      title: "ภาพรวมระบบ",
      items: [
        {
          href: "/system-admin",
          label: "แดชบอร์ดภาพรวม",
          icon: LayoutDashboard,
          exact: true,
        },
        {
          href: "/system-admin/health",
          label: "สถานะระบบ (System Health)",
          icon: Activity,
        },
      ],
    },
    {
      title: "การจัดการผู้เช่า & SaaS",
      items: [
        {
          href: "/system-admin/companies",
          label: "องค์กรและบริษัท (Tenants)",
          icon: Building2,
        },
        {
          href: "/system-admin/plans",
          label: "แพ็กเกจบริการ (SaaS Plans)",
          icon: CreditCard,
        },
        {
          href: "/system-admin/subscriptions",
          label: "การสมัครสมาชิก (Subscriptions)",
          icon: Sparkles,
        },
        {
          href: "/system-admin/messages",
          label: "ศูนย์ข้อความ & ซัพพอร์ต (Mailbox)",
          icon: Mail,
        },
      ],
    },
    {
      title: "ผู้ใช้งาน & บุคลากร",
      items: [
        {
          href: "/system-admin/users",
          label: "ผู้ดูแลระบบทั้งหมด (Admins)",
          icon: Users,
        },
        {
          href: "/system-admin/employees",
          label: "พนักงานข้ามองค์กร (Employees)",
          icon: UserCheck,
        },
        {
          href: "/system-admin/sessions",
          label: "เซสชันที่ทำงานอยู่ (Sessions)",
          icon: Laptop,
        },
      ],
    },
    {
      title: "ความปลอดภัย & บำรุงรักษา",
      items: [
        {
          href: "/system-admin/security",
          label: "ศูนย์ความปลอดภัย & IP Block",
          icon: ShieldCheck,
        },
        {
          href: "/system-admin/audit-logs",
          label: "บันทึกกิจกรรม (Audit Logs)",
          icon: ShieldAlert,
        },
        {
          href: "/system-admin/backup",
          label: "สำรองฐานข้อมูล (Backup)",
          icon: Database,
        },
      ],
    },
    {
      title: "เชื่อมต่อ & API",
      items: [
        {
          href: "/system-admin/api-keys",
          label: "กุญแจเชื่อมต่อ (API Keys)",
          icon: Key,
        },
        {
          href: "/system-admin/webhooks",
          label: "เว็บฮุกระบบ (Webhooks)",
          icon: Webhook,
        },
        {
          href: "/docs",
          label: "เอกสารคู่มือ & API Docs",
          icon: BookOpen,
        },
      ],
    },
  ];

  async function handleLogout() {
    await logoutAdminAction();
    window.location.href = "/admin/login";
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e3e8ee] bg-white text-[#0d253d] px-4 shadow-xs">
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
            <span className="text-[10px] text-[#533afd] bg-[#533afd]/10 font-bold px-2 py-0.5 rounded-full ml-1.5 font-mono">
              SUPER ADMIN
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-[#64748d] hover:text-[#0d253d]"
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

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e3e8ee] bg-white text-[#0d253d] transition-transform duration-200 ease-in-out lg:static lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:shadow-none"
        }`}
      >
        {/* Brand & Super Admin Badge */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-[#e3e8ee] px-5 bg-white">
          <Link href="/system-admin" className="flex items-center space-x-3">
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
                <span className="text-[9px] font-bold text-[#533afd] bg-[#533afd]/10 border border-[#533afd]/20 px-2 py-0.5 rounded-full font-mono uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-[#64748d] font-medium">
                Platform Multi-Tenant Hub
              </p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden h-8 w-8 text-[#64748d]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Categorized Navigation Items with independent scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navigationCategories.map((category) => (
            <div key={category.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#64748d]/80 flex items-center justify-between">
                <span>{category.title}</span>
              </div>

              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`group flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? "bg-[#533afd]/10 text-[#533afd] font-bold shadow-xs"
                          : "text-[#64748d] font-medium hover:bg-[#f6f9fc] hover:text-[#0d253d]"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-[#533afd]"
                              : "text-[#64748d]/70 group-hover:text-[#0d253d]"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-[#533afd] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Logout Footer */}
        <div className="shrink-0 border-t border-[#e3e8ee] p-3 bg-[#f6f9fc]/60">
          <div className="rounded-2xl border border-[#e3e8ee] bg-white p-3 shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#533afd] text-white font-bold text-xs shadow-sm">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0d253d] truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-[#533afd] font-semibold truncate">
                  SYSTEM_ADMIN
                </p>
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <Link
                href="/system-admin/profile"
                onClick={() => setIsMobileOpen(false)}
                className="w-full h-8 inline-flex items-center justify-center rounded-full text-xs font-medium text-[#0d253d] border border-[#e3e8ee] bg-[#f6f9fc] hover:bg-[#533afd]/10 hover:text-[#533afd] hover:border-[#533afd]/30 transition-colors"
              >
                <UserRound className="h-3.5 w-3.5 mr-1.5 text-[#533afd]" />
                ข้อมูลส่วนตัว
              </Link>

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
    </>
  );
}
