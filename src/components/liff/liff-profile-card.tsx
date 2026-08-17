"use client";

import * as React from "react";
import Image from "next/image";
import { useLiff } from "./liff-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export interface SerializedEmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
  lineUserId: string | null;
  avatarUrl?: string | null;
  company: {
    name: string;
    code: string;
  };
  department: {
    name: string;
  } | null;
  position: {
    name: string;
  } | null;
}

interface LiffProfileCardProps {
  employee: SerializedEmployeeProfile;
}

export function LiffProfileCard({ employee }: LiffProfileCardProps) {
  const { profile, isReady, isLoggedIn } = useLiff();

  // Prioritize live LINE LIFF pictureUrl, then employee.avatarUrl
  const avatarUrl = profile?.pictureUrl || employee.avatarUrl;
  const lineDisplayName = profile?.displayName;
  const statusMessage = profile?.statusMessage;

  return (
    <div className="space-y-4">
      {/* Profile Avatar & Identity Card */}
      <div className="text-center py-6 px-4 bg-white rounded-2xl border border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.06)] relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#533afd]/5 to-transparent pointer-events-none" />

        <div className="relative mx-auto w-24 h-24 mb-3">
          {avatarUrl ? (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-[#533afd] shadow-md mx-auto">
              <img
                src={avatarUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#533afd] text-3xl font-bold text-white shadow-md mx-auto border-3 border-white">
              {employee.firstName.charAt(0)}
            </div>
          )}

          {/* LINE official badge icon */}
          {employee.lineUserId && (
            <div
              className="absolute bottom-0 right-1 h-6 w-6 rounded-full bg-[#06c755] text-white flex items-center justify-center shadow-md border-2 border-white"
              title="เชื่อมต่อกับ LINE แล้ว"
            >
              <span className="font-bold text-[10px]">LINE</span>
            </div>
          )}
        </div>

        <h2 className="text-lg font-bold text-[#0d253d]">
          {employee.firstName} {employee.lastName}
        </h2>

        {lineDisplayName && (
          <p className="text-xs text-[#533afd] font-medium mt-0.5 flex items-center justify-center">
            <Sparkles className="h-3 w-3 mr-1" />
            LINE: {lineDisplayName}
          </p>
        )}

        {statusMessage && (
          <p className="text-[11px] text-[#64748d] italic mt-1 max-w-xs mx-auto truncate">
            &ldquo;{statusMessage}&rdquo;
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-center space-x-2">
          <span className="font-mono text-xs text-[#64748d] bg-[#f6f9fc] px-2.5 py-0.5 rounded-full border border-[#e3e8ee]">
            {employee.employeeCode}
          </span>
          <Badge
            variant="success"
            className="text-[11px] rounded-full px-2.5 py-0.5"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {employee.lineUserId ? "เชื่อมต่อ LINE แล้ว" : "เข้าใช้งานระบบแล้ว"}
          </Badge>
        </div>
      </div>

      {/* Details List */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 pb-2 bg-[#f6f9fc]/60 border-b border-[#e3e8ee]">
          <CardTitle className="text-xs font-bold text-[#64748d] uppercase tracking-wider">
            ข้อมูลสังกัดและพนักงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 divide-y divide-[#e3e8ee]/70 text-xs">
          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#64748d] flex items-center">
              <Building2 className="h-3.5 w-3.5 mr-2 text-[#533afd]" /> บริษัท
            </span>
            <span className="font-semibold text-[#0d253d]">
              {employee.company.name} ({employee.company.code})
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#64748d] flex items-center">
              <User className="h-3.5 w-3.5 mr-2 text-[#533afd]" /> แผนก
            </span>
            <span className="font-semibold text-[#0d253d]">
              {employee.department?.name || "-"}
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#64748d] flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-2 text-[#533afd]" />{" "}
              ตำแหน่ง
            </span>
            <span className="font-semibold text-[#0d253d]">
              {employee.position?.name || "-"}
            </span>
          </div>

          <div className="py-2.5 flex justify-between items-center">
            <span className="text-[#64748d] flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-2 text-[#533afd]" /> วันเกิด
            </span>
            <span className="font-semibold text-[#0d253d] tabular-nums font-mono">
              {new Date(employee.dateOfBirth).toLocaleDateString("th-TH")}
            </span>
          </div>

          {employee.email && (
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#64748d] flex items-center">
                <Mail className="h-3.5 w-3.5 mr-2 text-[#533afd]" /> อีเมล
              </span>
              <span className="font-semibold text-[#0d253d]">
                {employee.email}
              </span>
            </div>
          )}

          {employee.phone && (
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#64748d] flex items-center">
                <Phone className="h-3.5 w-3.5 mr-2 text-[#533afd]" /> โทรศัพท์
              </span>
              <span className="font-semibold text-[#0d253d] tabular-nums font-mono">
                {employee.phone}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
