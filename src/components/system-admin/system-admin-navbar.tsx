"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldCheck } from "lucide-react";

interface SystemAdminNavbarProps {
  userName: string;
}

export function SystemAdminNavbar({ userName }: SystemAdminNavbarProps) {
  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b border-[#e3e8ee] bg-white px-8">
      <div className="flex items-center space-x-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 text-xs font-semibold text-[#059669]">
          <Activity className="h-3.5 w-3.5 animate-pulse text-[#059669]" />
          Platform Infrastructure Healthy
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-xs font-bold text-[#0d253d]">{userName}</p>
          <p className="text-[10px] text-[#533afd] font-semibold font-mono">
            SUPER_ADMINISTRATOR
          </p>
        </div>
        <Badge className="bg-[#533afd] text-white border-0 px-3 py-1 text-[11px] rounded-full shadow-xs">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Full System Access
        </Badge>
      </div>
    </header>
  );
}
