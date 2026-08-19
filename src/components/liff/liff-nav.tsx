"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Clock, PlusCircle, User } from "lucide-react";

export function LiffNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/liff/dashboard", label: "หน้าแรก", icon: Calendar },
    { href: "/liff/leave", label: "ยื่นใบลา", icon: PlusCircle },
    { href: "/liff/history", label: "ประวัติ", icon: Clock },
    { href: "/liff/profile", label: "โปรไฟล์", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e3e8ee] bg-white/95 backdrop-blur-md shadow-[0_-1px_6px_rgba(0,55,112,0.04)]">
      <div className="flex items-center justify-around py-2.5 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center text-[10px] font-medium transition-all ${
                isActive
                  ? "text-[#533afd] font-bold"
                  : "text-[#64748d] hover:text-[#0d253d]"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive ? "bg-[#533afd]/10 text-[#533afd]" : "text-[#64748d]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
