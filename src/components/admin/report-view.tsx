"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  exportLeaveRequestsCsvAction,
  exportEmployeeBalancesCsvAction,
  SummaryReportData,
} from "@/features/report";
import {
  BarChart3,
  CalendarCheck,
  Clock,
  Users,
  Building2,
  PieChart,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

interface ReportViewProps {
  initialData: SummaryReportData;
  year: number;
}

export function ReportView({ initialData, year }: ReportViewProps) {
  const [isExportingRequests, setIsExportingRequests] = React.useState(false);
  const [isExportingBalances, setIsExportingBalances] = React.useState(false);

  function triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleExportRequests() {
    setIsExportingRequests(true);
    const res = await exportLeaveRequestsCsvAction(year);
    setIsExportingRequests(false);
    if (res.success && res.data) {
      triggerDownload(res.data.csvContent, res.data.filename);
    }
  }

  async function handleExportBalances() {
    setIsExportingBalances(true);
    const res = await exportEmployeeBalancesCsvAction(year);
    setIsExportingBalances(false);
    if (res.success && res.data) {
      triggerDownload(res.data.csvContent, res.data.filename);
    }
  }

  const maxDeptDays = Math.max(
    ...initialData.departmentStats.map((d) => d.totalDays),
    1,
  );
  const maxTypeDays = Math.max(
    ...initialData.leaveTypeStats.map((t) => t.totalDays),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Action Buttons for Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0d253d]">
            ภาพรวมสถิติและรายงานประจำปี {year}
          </h2>
          <p className="text-xs text-[#64748d]">
            ข้อมูลสรุปเชิงลึกและส่งออกข้อมูลสำหรับฝ่ายบุคคลและผู้บริหาร
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportRequests}
            disabled={isExportingRequests}
            className="h-9 text-xs rounded-full border-[#e3e8ee] text-[#533afd] hover:bg-[#533afd]/10 font-semibold px-4"
          >
            {isExportingRequests ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-[#533afd]" />
            )}
            ส่งออกใบลา (CSV)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBalances}
            disabled={isExportingBalances}
            className="h-9 text-xs rounded-full border-[#059669]/30 text-[#059669] hover:bg-[#059669]/10 font-semibold px-4"
          >
            {isExportingBalances ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-[#059669]" />
            )}
            ส่งออกยอดวันลาคงเหลือ (CSV)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d]">
              วันลาที่อนุมัติแล้วทั้งหมด
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {initialData.totalLeaveDays}{" "}
              <span className="text-xs font-normal text-[#64748d]">วัน</span>
            </div>
            <p className="text-[11px] text-[#64748d] mt-1">
              จาก {initialData.approvedCount} คำขอที่อนุมัติ
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d]">
              คำขอที่รอการอนุมัติ
            </CardTitle>
            <div className="p-2 rounded-full bg-[#fde68a]/40 text-[#d97706]">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706] tabular-nums font-mono">
              {initialData.pendingCount}{" "}
              <span className="text-xs font-normal text-[#64748d]">รายการ</span>
            </div>
            <p className="text-[11px] text-[#64748d] mt-1">
              รอ HR และหัวหน้างานพิจารณา
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d]">
              คำขอที่ไม่อนุมัติ
            </CardTitle>
            <div className="p-2 rounded-full bg-[#ffe4e6] text-[#ea2261]">
              <BarChart3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ea2261] tabular-nums font-mono">
              {initialData.rejectedCount}{" "}
              <span className="text-xs font-normal text-[#64748d]">รายการ</span>
            </div>
            <p className="text-[11px] text-[#64748d] mt-1">
              คืนสิทธิ์วันลาให้พนักงานแล้ว
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d]">
              พนักงานทั้งหมด
            </CardTitle>
            <div className="p-2 rounded-full bg-[#1c1e54]/10 text-[#1c1e54]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {initialData.totalEmployees}{" "}
              <span className="text-xs font-normal text-[#64748d]">คน</span>
            </div>
            <p className="text-[11px] text-[#64748d] mt-1">
              สถานะ Active ในระบบ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Breakdown */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
            <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-[#533afd]" />
              สถิติการลาจำแนกตามแผนก
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {initialData.departmentStats.length === 0 ? (
              <p className="text-xs text-[#64748d] text-center py-6">
                ยังไม่มีข้อมูลการลาในรอบปีนี้
              </p>
            ) : (
              initialData.departmentStats.map((dept) => {
                const percentage = Math.round(
                  (dept.totalDays / maxDeptDays) * 100,
                );
                return (
                  <div key={dept.departmentName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#0d253d]">
                        {dept.departmentName}
                      </span>
                      <span className="text-[#64748d] font-mono tabular-nums">
                        {dept.totalDays} วัน ({dept.requestCount} รายการ)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f6f9fc] border border-[#e3e8ee]/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#533afd] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Leave Type Breakdown */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-3 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
            <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-[#533afd]" />
              สถิติการลาจำแนกตามประเภทวันลา
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {initialData.leaveTypeStats.length === 0 ? (
              <p className="text-xs text-[#64748d] text-center py-6">
                ยังไม่มีข้อมูลประเภทการลา
              </p>
            ) : (
              initialData.leaveTypeStats.map((lt) => {
                const percentage = Math.round(
                  (lt.totalDays / maxTypeDays) * 100,
                );
                return (
                  <div key={lt.leaveTypeName} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[#0d253d]">{lt.leaveTypeName}</span>
                      <span className="text-[#64748d] font-mono tabular-nums">
                        {lt.totalDays} วัน ({lt.requestCount} รายการ)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#f6f9fc] border border-[#e3e8ee]/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#059669] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
