"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Search } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedAuditLog {
  id: string;
  action: string;
  resource: string;
  actorType: string;
  actorId: string | null;
  details: any;
  createdAt: string;
  company: {
    name: string;
    code: string;
  } | null;
}

interface AuditLogsViewProps {
  logs: SerializedAuditLog[];
}

export function AuditLogsView({ logs }: AuditLogsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Extract unique actions for filter dropdown
  const uniqueActions = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorId && log.actorId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.company &&
        (log.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.company.code.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          บันทึกกิจกรรมระดับแพลตฟอร์ม (Platform Audit Logs)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ประวัติการกระทำ การเปลี่ยนแปลงสิทธิ์
          และธุรกรรมสำคัญทั้งหมดในระดับโครงสร้างพื้นฐาน
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหา Action, Resource, องค์กร, Actor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#64748d]">Action:</span>
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 rounded-xl text-xs w-48"
            >
              <option value="ALL">ทุก Action (ทั้งหมด)</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">วัน-เวลา</th>
                  <th className="py-3.5 px-4 font-semibold">ประเภท Action</th>
                  <th className="py-3.5 px-4 font-semibold">Resource</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">ผู้กระทำ (Actor)</th>
                  <th className="py-3.5 px-4 pr-5 font-semibold">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#64748d] font-sans">
                      ไม่พบบันทึก Audit Logs ตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                      <td className="py-3.5 px-4 pl-5 text-[#64748d] tabular-nums whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#0d253d] font-semibold">
                        {log.resource}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {log.company ? (
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold text-[#0d253d]">
                              {log.company.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#533afd]">
                              ({log.company.code})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#64748d] italic font-mono text-[11px]">
                            PLATFORM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] text-[11px]">
                        {log.actorType} ({log.actorId ? log.actorId.slice(-6) : "SYSTEM"})
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-[#64748d] text-[11px] max-w-xs truncate font-sans">
                        {log.details ? JSON.stringify(log.details) : "-"}
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
            totalItems={filteredLogs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
