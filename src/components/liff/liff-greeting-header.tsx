"use client";

import * as React from "react";
import Link from "next/link";
import { useLiff } from "./liff-provider";
import { Button } from "@/components/ui/button";
import { User, Sparkles } from "lucide-react";

interface LiffGreetingHeaderProps {
  employee: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    avatarUrl?: string | null;
    company: {
      name: string;
      code: string;
    };
  };
}

export function LiffGreetingHeader({ employee }: LiffGreetingHeaderProps) {
  const { profile } = useLiff();

  // Prioritize live LINE LIFF pictureUrl, then employee.avatarUrl
  const avatarUrl = profile?.pictureUrl || employee.avatarUrl;
  const lineDisplayName = profile?.displayName;

  return (
    <div className="rounded-2xl mesh-gradient-dark p-5 text-white shadow-md border border-white/10 flex items-center justify-between">
      <div className="flex items-center space-x-3.5">
        <div className="relative w-12 h-12 shrink-0">
          {avatarUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#533afd] shadow-md">
              <img
                src={avatarUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#533afd] font-bold text-white shadow-md text-base border-2 border-white/20">
              {employee.firstName.charAt(0)}
            </div>
          )}

          {/* LINE official badge indicator */}
          <div
            className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#06c755] text-white flex items-center justify-center shadow-xs border border-white"
            title="เชื่อมต่อ LINE"
          >
            <span className="font-bold text-[7px] leading-none">L</span>
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="text-base font-bold text-white leading-tight truncate">
            {employee.firstName} {employee.lastName}
          </h1>

          {lineDisplayName ? (
            <p className="text-[11px] text-[#b9b9f9] flex items-center mt-0.5 truncate">
              <Sparkles className="h-3 w-3 mr-1 shrink-0" />
              LINE: {lineDisplayName}
            </p>
          ) : (
            <p className="text-xs text-white/70 mt-0.5 truncate">
              {employee.company.name} •{" "}
              <span className="font-mono">{employee.employeeCode}</span>
            </p>
          )}
        </div>
      </div>

      <Link href="/liff/profile">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-9 w-9"
        >
          <User className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
