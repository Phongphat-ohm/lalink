"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Smartphone,
  Search,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Building,
  QrCode,
} from "lucide-react";
import { unlinkEmployeeLineAction } from "@/features/employee/line-actions";
import { CompanyQrModal } from "@/components/admin/company-qr-modal";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedLineEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  departmentName: string | null;
  positionName: string | null;
  isConnected: boolean;
  linkedAt: string;
}

interface LineAccountsViewProps {
  employees: SerializedLineEmployee[];
  companyName?: string;
  companyCode?: string;
}

export function LineAccountsView({
  employees,
  companyName = "LALINK",
  companyCode = "DEMO",
}: LineAccountsViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "CONNECTED" | "UNLINKED">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [unlinkTarget, setUnlinkTarget] =
    React.useState<SerializedLineEmployee | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);

  const connectedCount = employees.filter((e) => e.isConnected).length;
  const unlinkedCount = employees.length - connectedCount;

  async function handleUnlinkConfirm() {
    if (!unlinkTarget) return;
    setIsLoading(true);

    const result = await unlinkEmployeeLineAction(unlinkTarget.id);
    setIsLoading(false);

    if (result.success) {
      setUnlinkTarget(null);
      toast.success(result.message || "ยกเลิกการผูกบัญชี LINE เรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถยกเลิกการเชื่อมต่อได้");
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.employeeCode.toLowerCase().includes(term) ||
      (emp.departmentName &&
        emp.departmentName.toLowerCase().includes(term)) ||
      (emp.positionName &&
        emp.positionName.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CONNECTED" && emp.isConnected) ||
      (statusFilter === "UNLINKED" && !emp.isConnected);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            บัญชี LINE ที่เชื่อมต่อ (LINE Accounts)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ตรวจสอบสถานะการผูกบัญชี LINE Messaging API ของพนักงาน
            และจัดการปลดล็อค/ยกเลิกการเชื่อมต่อ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsQrModalOpen(true)}
            className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-4 h-9 text-xs font-semibold shadow-xs"
          >
            <QrCode className="h-4 w-4 mr-1.5" />
            QR Code ให้พนักงานสแกน
          </Button>

          <div className="flex items-center space-x-1.5 bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1.5 rounded-full text-xs font-semibold text-[#059669]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>เชื่อมต่อแล้ว: {connectedCount} คน</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#f6f9fc] border border-[#e3e8ee] px-3 py-1.5 rounded-full text-xs font-medium text-[#64748d]">
            <span>ยังไม่เชื่อมต่อ: {unlinkedCount} คน</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "CONNECTED", "UNLINKED"] as const).map((st) => (
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
                  : st === "CONNECTED"
                    ? "เชื่อมต่อแล้ว"
                    : "ยังไม่เชื่อมต่อ"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">พนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">รหัสพนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">แผนก / ตำแหน่ง</th>
                  <th className="py-3.5 px-4 font-semibold">
                    สถานะการผูกบัญชี
                  </th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ไม่พบข้อมูลพนักงานตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#533afd] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              emp.firstName.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-[#0d253d] block">
                              {emp.firstName} {emp.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#533afd]">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {emp.departmentName || "-"} / {emp.positionName || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.isConnected ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                            เชื่อมต่อแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-[#64748d] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-full">
                            ยังไม่เชื่อมต่อ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        {emp.isConnected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnlinkTarget(emp)}
                            className="h-7 text-xs rounded-full px-3 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                          >
                            <Unlink className="h-3 w-3 mr-1" /> ปลดล็อค LINE
                          </Button>
                        ) : (
                          <span className="text-[#64748d] text-[11px]">-</span>
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
            totalItems={filteredEmployees.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <AlertDialog
        open={!!unlinkTarget}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการยกเลิกการเชื่อมต่อ LINE?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะปลดการผูกบัญชี LINE ของ{" "}
              <strong>
                {unlinkTarget?.firstName} {unlinkTarget?.lastName}
              </strong>{" "}
              ({unlinkTarget?.employeeCode})
              พนักงานจะไม่ได้รับการแจ้งเตือนหรือยื่นคำขอลาผ่าน LINE ได้
              จนกว่าจะทำการผูกบัญชีใหม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isLoading}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkConfirm}
              disabled={isLoading}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              ยืนยันปลดล็อค
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Modal for on-site onboarding */}
      <CompanyQrModal
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
        companyName={companyName}
        companyCode={companyCode}
      />
    </div>
  );
}
