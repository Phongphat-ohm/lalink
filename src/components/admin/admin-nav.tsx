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
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logoutAdminAction } from "@/features/auth";

interface AdminNavProps {
  userName: string;
  userRole: string;
  companyName: string;
}

export function AdminNav({ userName, userRole, companyName }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: "/admin/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { href: "/admin/leave-requests", label: "รายการใบลา", icon: FileCheck },
    { href: "/admin/employees", label: "พนักงาน", icon: Users },
    { href: "/admin/departments", label: "แผนก & ตำแหน่ง", icon: Building },
    { href: "/admin/leave-types", label: "นโยบายวันลา", icon: Sparkles },
    { href: "/admin/holidays", label: "วันหยุดบริษัท", icon: CalendarDays },
  ];

  async function handleLogout() {
    await logoutAdminAction();
    window.location.href = "/admin/login";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 font-bold text-white shadow-sm">
                L
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base">
                  LALINK
                </span>
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md ml-2 font-medium">
                  {companyName}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout Button */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">{userName}</p>
              <p className="text-[10px] text-slate-500">{userRole}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span>ออก</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-700"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-teal-50 text-teal-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{userName}</p>
                <p className="text-[10px] text-slate-500">{userRole}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-200"
              >
                <LogOut className="h-4 w-4 mr-1" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
