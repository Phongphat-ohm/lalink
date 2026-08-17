"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  AlertTriangle,
  Lock,
  Flame,
  Activity,
  Globe,
  Radio,
} from "lucide-react";

export interface SerializedSecurityEvent {
  id: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  email: string | null;
  companyName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  createdAt: string;
}

interface SecurityCenterViewProps {
  events: SerializedSecurityEvent[];
  stats: {
    totalEvents: number;
    failedLogins: number;
    rateLimitBlocks: number;
    activeFirewallStatus: string;
  };
}

export function SecurityCenterView({ events, stats }: SecurityCenterViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      (ev.email && ev.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.ipAddress && ev.ipAddress.includes(searchTerm)) ||
      ev.eventType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || ev.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          ศูนย์ความปลอดภัยระบบ (Security Center)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          มอนิเตอร์ภัยคุกคาม Failed Logins, Brute Force, Rate Limiting
          และเหตุการณ์ความปลอดภัยข้ามทุก Tenant
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">
              สถานะระบบป้องกัน
            </span>
            <ShieldCheck className="h-5 w-5 text-[#059669]" />
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-sm font-bold text-[#059669]">
              ACTIVE & PROTECTED
            </span>
          </div>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">
              Failed Logins
            </span>
            <Lock className="h-5 w-5 text-[#ea2261]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#0d253d] mt-1">
            {stats.failedLogins}
          </p>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">
              Rate Limit Blocks
            </span>
            <Flame className="h-5 w-5 text-[#d97706]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#0d253d] mt-1">
            {stats.rateLimitBlocks}
          </p>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">
              Security Events
            </span>
            <Activity className="h-5 w-5 text-[#533afd]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#533afd] mt-1">
            {stats.totalEvents}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหา IP, อีเมล, Event Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#64748d]">
              ระดับความรุนแรง:
            </span>
            <Select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-36"
            >
              <option value="ALL">ทุกระดับ (ทั้งหมด)</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Events Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">วัน-เวลา</th>
                  <th className="py-3.5 px-4 font-semibold">ระดับ</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">
                    ผู้ใช้งาน / อีเมล
                  </th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 pr-5 font-semibold">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#64748d] font-sans"
                    >
                      ไม่พบบันทึกเหตุการณ์ความปลอดภัย
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 text-[#64748d] whitespace-nowrap tabular-nums">
                        {new Date(ev.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            ev.severity === "CRITICAL" ||
                            ev.severity === "ERROR"
                              ? "destructive"
                              : ev.severity === "WARNING"
                                ? "warning"
                                : "secondary"
                          }
                          className="text-[10px] rounded-full px-2"
                        >
                          {ev.severity}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0d253d]">
                        {ev.eventType}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] font-sans">
                        {ev.email || <span className="italic">Anonymous</span>}
                      </td>
                      <td className="py-3.5 px-4 text-[#533afd] font-semibold">
                        {ev.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-[#64748d] max-w-xs truncate font-sans text-[11px]">
                        {ev.details ? JSON.stringify(ev.details) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
