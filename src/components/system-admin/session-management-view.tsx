"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Search,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { superAdminRevokeSessionAction } from "@/features/company/super-admin-ops-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedUserSession {
  id: string;
  userName: string;
  userEmail: string;
  companyName: string | null;
  companyCode: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isRevoked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface SessionManagementViewProps {
  sessions: SerializedUserSession[];
}

export function SessionManagementView({
  sessions,
}: SessionManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  async function handleRevoke(sessionId: string) {
    setIsLoading(sessionId);
    const result = await superAdminRevokeSessionAction(sessionId);
    setIsLoading(null);

    if (result.success) {
      toast.success(result.message || "เพิกถอน Session สำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถเพิกถอน Session ได้");
    }
  }

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.ipAddress && s.ipAddress.includes(searchTerm)) ||
      (s.companyName &&
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !s.isRevoked) ||
      (statusFilter === "REVOKED" && s.isRevoked);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          จัดการ Session ผู้ใช้งานทั้งหมด (Active Sessions)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ตรวจสอบรายการ Session ที่กำลังล็อกอินอยู่ในระบบทุกอุปกรณ์ และสั่ง
          Force Revoke เมื่อพบความผิดปกติ
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, อีเมล, IP, บริษัท..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "ACTIVE", "REVOKED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "ACTIVE"
                    ? "กำลังใช้งาน"
                    : "เพิกถอนแล้ว"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ผู้ใช้งาน</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">
                    อุปกรณ์ / เบราว์เซอร์
                  </th>
                  <th className="py-3.5 px-4 font-semibold">IP Address</th>
                  <th className="py-3.5 px-4 font-semibold">กิจกรรมล่าสุด</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ไม่พบข้อมูล Session ในระบบตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedSessions.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5">
                        <span className="font-bold text-[#0d253d] block">
                          {s.userName}
                        </span>
                        <span className="text-[#64748d] text-[11px]">
                          {s.userEmail}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.companyName ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-[#0d253d]">
                              {s.companyName}
                            </span>
                            <span className="font-mono text-[10px] text-[#533afd]">
                              ({s.companyCode})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#533afd] font-semibold italic text-[11px]">
                            Platform Central
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        <div className="flex items-center space-x-1.5">
                          {s.device === "Mobile" ? (
                            <Smartphone className="h-3.5 w-3.5 text-[#533afd]" />
                          ) : s.device === "Tablet" ? (
                            <Tablet className="h-3.5 w-3.5 text-[#533afd]" />
                          ) : (
                            <Laptop className="h-3.5 w-3.5 text-[#533afd]" />
                          )}
                          <span>
                            {s.browser || "Unknown"} on {s.os || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0d253d]">
                        {s.ipAddress || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {new Date(s.lastActiveAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.isRevoked ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] rounded-full px-2"
                          >
                            เพิกถอนแล้ว
                          </Badge>
                        ) : (
                          <Badge
                            variant="success"
                            className="text-[10px] rounded-full px-2"
                          >
                            กำลังใช้งาน (Active)
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        {!s.isRevoked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(s.id)}
                            disabled={isLoading === s.id}
                            className="h-7 text-xs rounded-full px-3 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                          >
                            {isLoading === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <LogOut className="h-3 w-3 mr-1" /> สั่ง Force
                                Logout
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredSessions.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
