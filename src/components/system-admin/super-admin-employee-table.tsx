"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Search,
  CheckCircle2,
  Unlink,
  Loader2,
  Building2,
  Calendar,
  Phone,
  Mail,
  Eye,
  Shield,
} from "lucide-react";
import { superAdminUnlinkLineAction } from "@/features/employee";

export interface SerializedSuperAdminEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  status: string;
  lineUserId: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    code: string;
  };
  department: { name: string } | null;
  position: { name: string } | null;
}

export interface AvailableCompanyFilter {
  id: string;
  name: string;
  code: string;
}

interface SuperAdminEmployeeTableProps {
  initialEmployees: SerializedSuperAdminEmployee[];
  companies: AvailableCompanyFilter[];
}

export function SuperAdminEmployeeTable({
  initialEmployees,
  companies,
}: SuperAdminEmployeeTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [companyFilter, setCompanyFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [lineFilter, setLineFilter] = React.useState<string>("ALL");

  // Unlink LINE State
  const [unlinkTarget, setUnlinkTarget] = React.useState<SerializedSuperAdminEmployee | null>(null);
  const [isUnlinking, setIsUnlinking] = React.useState(false);

  // View Details Modal
  const [viewEmployee, setViewEmployee] = React.useState<SerializedSuperAdminEmployee | null>(null);

  async function handleUnlinkConfirm() {
    if (!unlinkTarget) return;

    setIsUnlinking(true);
    const result = await superAdminUnlinkLineAction(unlinkTarget.id);
    setIsUnlinking(false);

    if (result.success) {
      setUnlinkTarget(null);
      router.refresh();
    } else {
      alert(result.message || "เกิดข้อผิดพลาดในการปลด LINE");
    }
  }

  const filteredEmployees = initialEmployees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.company.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = companyFilter === "ALL" || emp.company.id === companyFilter;
    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    const matchesLine =
      lineFilter === "ALL" ||
      (lineFilter === "LINKED" && !!emp.lineUserId) ||
      (lineFilter === "UNLINKED" && !emp.lineUserId);

    return matchesSearch && matchesCompany && matchesStatus && matchesLine;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          รายชื่อพนักงานทั้งหมดในระบบ (All LIFF Employees)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ค้นหา ตรวจสอบสถานะการเชื่อมต่อ LINE Messaging API ข้ามทุกองค์กร และจัดการแก้ไขกรณีผูกผิดบัญชี
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, บริษัท..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Company Filter */}
            <Select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-44"
            >
              <option value="ALL">ทุกองค์กร (ทั้งหมด)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-36"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PROBATION">PROBATION</option>
              <option value="RESIGNED">RESIGNED</option>
              <option value="TERMINATED">TERMINATED</option>
            </Select>

            {/* LINE Filter */}
            <Select
              value={lineFilter}
              onChange={(e) => setLineFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-36"
            >
              <option value="ALL">สถานะ LINE (ทั้งหมด)</option>
              <option value="LINKED">เชื่อมต่อแล้ว</option>
              <option value="UNLINKED">ยังไม่เชื่อมต่อ</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">รหัสพนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กรต้นสังกัด</th>
                  <th className="py-3.5 px-4 font-semibold">แผนก / ตำแหน่ง</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ LINE</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะพนักงาน</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#64748d]">
                      ไม่พบข้อมูลพนักงานตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                      <td className="py-3.5 px-4 pl-5 font-mono font-bold text-[#533afd] tabular-nums">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-[#0d253d]">{emp.company.name}</span>
                          <span className="font-mono text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full">
                            {emp.company.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {emp.department?.name || "-"} / {emp.position?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.lineUserId ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> เชื่อมต่อแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-[#64748d] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-full">
                            ยังไม่เชื่อมต่อ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={emp.status === "ACTIVE" ? "success" : "destructive"}
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewEmployee(emp)}
                            className="h-7 text-xs rounded-full px-2 text-[#0d253d] border-[#e3e8ee] hover:bg-[#f6f9fc]"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {emp.lineUserId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUnlinkTarget(emp)}
                              className="h-7 text-xs rounded-full px-2.5 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                            >
                              <Unlink className="h-3 w-3 mr-1" /> ปลด LINE
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Modal: View Details */}
      <Dialog open={!!viewEmployee} onOpenChange={(open) => !open && setViewEmployee(null)}>
        <DialogContent onClose={() => setViewEmployee(null)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Users className="h-5 w-5 text-[#533afd] mr-2" />
              ข้อมูลพนักงาน ({viewEmployee?.employeeCode})
            </DialogTitle>
          </DialogHeader>

          {viewEmployee && (
            <div className="space-y-3.5 my-2 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] space-y-1.5">
                <div className="font-bold text-sm text-[#0d253d]">
                  {viewEmployee.firstName} {viewEmployee.lastName}
                </div>
                <div className="text-[#64748d]">
                  สังกัด: <strong className="text-[#0d253d]">{viewEmployee.company.name}</strong> ({viewEmployee.company.code})
                </div>
                <div className="text-[#64748d]">
                  แผนก / ตำแหน่ง: {viewEmployee.department?.name || "-"} / {viewEmployee.position?.name || "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white border border-[#e3e8ee]">
                <div>วันเกิด: {viewEmployee.dateOfBirth}</div>
                <div>สถานะ: <Badge variant="outline">{viewEmployee.status}</Badge></div>
                <div>อีเมล: {viewEmployee.email || "-"}</div>
                <div>โทร: {viewEmployee.phone || "-"}</div>
                <div className="col-span-2 text-[11px] text-[#64748d]">
                  LINE ID: {viewEmployee.lineUserId ? `${viewEmployee.lineUserId.slice(0, 16)}...` : "ยังไม่เชื่อมต่อ"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-2 border-t border-[#e3e8ee]">
            <Button
              type="button"
              onClick={() => setViewEmployee(null)}
              className="rounded-full text-xs h-9 px-5 bg-[#0d253d] text-white"
            >
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Alert Dialog: Unlink LINE */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => !open && setUnlinkTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Unlink className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการปลดการเชื่อมต่อ LINE?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการปลดบัญชี LINE ของ{" "}
              <strong className="text-[#0d253d]">
                {unlinkTarget?.firstName} {unlinkTarget?.lastName}
              </strong>{" "}
              ({unlinkTarget?.employeeCode}) สังกัด {unlinkTarget?.company.name} ใช่หรือไม่?
              หลังจากปลดแล้ว พนักงานจะสามารถนำบัญชี LINE ใหม่มาผูกใหม่อีกครั้งได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isUnlinking} className="rounded-full text-xs">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              disabled={isUnlinking}
              className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs font-semibold"
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> กำลังดำเนินการ...
                </>
              ) : (
                "ยืนยันปลด LINE"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
