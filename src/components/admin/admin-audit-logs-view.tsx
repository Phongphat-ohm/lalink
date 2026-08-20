"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ShieldAlert, Search } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedAdminAuditLog {
  id: string;
  actorType: string;
  actorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AdminAuditLogsViewProps {
  logs: SerializedAdminAuditLog[];
}

export function AdminAuditLogsView({ logs }: AdminAuditLogsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [actionFilter, setActionFilter] = React.useState<string>("ALL");
  const [resourceFilter, setResourceFilter] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(15);

  const uniqueActions = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  const uniqueResources = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.resource) set.add(l.resource);
    });
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.resource.toLowerCase().includes(term) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(term)) ||
      (log.actorType && log.actorType.toLowerCase().includes(term)) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(term));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesResource = resourceFilter === "ALL" || log.resource === resourceFilter;

    return matchesSearch && matchesAction && matchesResource;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function getActionBadgeVariant(action: string) {
    if (action.includes("APPROVE") || action.includes("CREATE"))
      return "success";
    if (action.includes("REJECT") || action.includes("DELETE"))
      return "destructive";
    if (action.includes("CANCEL") || action.includes("UPDATE"))
      return "warning";
    return "outline";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#e3e8ee] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#0d253d] flex items-center">
          <ShieldAlert className="h-6 w-6 mr-2 text-[#533afd]" />
          บันทึกประวัติการทำงาน (Audit Trail)
        </h1>
        <p className="text-xs text-[#64748d] mt-1">
          บันทึกกิจกรรมและความปลอดภัยของระบบแบบไม่สามารถแก้ไขได้เพื่อความโปร่งใสและการตรวจสอบย้อนหลัง
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหากิจกรรม, ทรัพยากร, รายละเอียด..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {uniqueActions.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-[#64748d]">กิจกรรม:</span>
                <Select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-xl text-xs w-36"
                >
                  <option value="ALL">ทุกกิจกรรม</option>
                  {uniqueActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {uniqueResources.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-[#64748d]">ทรัพยากร:</span>
                <Select
                  value={resourceFilter}
                  onChange={(e) => {
                    setResourceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 rounded-xl text-xs w-36"
                >
                  <option value="ALL">ทุกทรัพยากร</option>
                  {uniqueResources.map((res) => (
                    <option key={res} value={res}>
                      {res}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d]">
            รายการบันทึกกิจกรรม ({filteredLogs.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
                <tr>
                  <th className="p-3.5 pl-5">วัน/เวลา</th>
                  <th className="p-3.5">ผู้กระทำ (Actor)</th>
                  <th className="p-3.5">กิจกรรม (Action)</th>
                  <th className="p-3.5">ทรัพยากร (Resource)</th>
                  <th className="p-3.5 pr-5">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#64748d]">
                      ไม่พบประวัติการทำงานตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="p-3.5 pl-5 text-[#64748d] whitespace-nowrap font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono rounded-full"
                        >
                          {log.actorType}
                        </Badge>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="text-[10px] font-mono rounded-full"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-[#0d253d] whitespace-nowrap font-mono">
                        {log.resource}{" "}
                        {log.resourceId
                          ? `(${log.resourceId.slice(0, 8)}...)`
                          : ""}
                      </td>
                      <td className="p-3.5 pr-5 text-[#64748d] max-w-xs font-mono text-[11px] truncate">
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
            pageSizeOptions={[15, 30, 50, 100]}
            totalItems={filteredLogs.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
