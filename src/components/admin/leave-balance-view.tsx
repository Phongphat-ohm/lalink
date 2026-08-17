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
  Scale,
  Search,
  PlusCircle,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
} from "lucide-react";
import { adjustLeaveBalanceAction } from "@/features/leave/adjustment-actions";

export interface SerializedBalanceEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: { name: string } | null;
  balances: {
    id: string;
    leaveTypeId: string;
    leaveTypeName: string;
    leaveTypeCode: string;
    allocatedDays: number;
    usedDays: number;
    pendingDays: number;
    remainingDays: number;
  }[];
}

export interface SerializedLeaveTypeOption {
  id: string;
  name: string;
  code: string;
}

interface LeaveBalanceViewProps {
  employees: SerializedBalanceEmployee[];
  leaveTypes: SerializedLeaveTypeOption[];
  currentYear: number;
}

export function LeaveBalanceView({
  employees,
  leaveTypes,
  currentYear,
}: LeaveBalanceViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Adjustment Modal State
  const [adjustTarget, setAdjustTarget] = React.useState<{
    employee: SerializedBalanceEmployee;
    leaveTypeId?: string;
  } | null>(null);

  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = React.useState("");
  const [adjustmentDays, setAdjustmentDays] = React.useState("1");
  const [type, setType] = React.useState<"ADJUSTMENT" | "CREDIT" | "REVERSAL">(
    "ADJUSTMENT",
  );
  const [reason, setReason] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function openAdjustment(
    employee: SerializedBalanceEmployee,
    leaveTypeId?: string,
  ) {
    setAdjustTarget({ employee, leaveTypeId });
    setSelectedLeaveTypeId(leaveTypeId || leaveTypes[0]?.id || "");
    setAdjustmentDays("1");
    setType("ADJUSTMENT");
    setReason("");
    setMessage(null);
  }

  async function handleAdjustSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adjustTarget) return;

    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("employeeId", adjustTarget.employee.id);
    formData.append("leaveTypeId", selectedLeaveTypeId);
    formData.append("year", String(currentYear));
    formData.append("adjustmentDays", adjustmentDays);
    formData.append("type", type);
    formData.append("reason", reason);

    const result = await adjustLeaveBalanceAction(null, formData);
    setIsLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "ปรับปรุงยอดสำเร็จ",
      });
      setTimeout(() => {
        setAdjustTarget(null);
        router.refresh();
      }, 1200);
    } else {
      setMessage({ type: "error", text: result.message || "เกิดข้อผิดพลาด" });
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    return (
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department &&
        emp.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการโควตาและยอดวันลาคงเหลือ (Leave Balances)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ตรวจสอบยอดคงเหลือประจำปี {currentYear}{" "}
            และปรับเพิ่ม/ลดยอดวันลารายบุคคล (Ledger Adjustment)
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees Balances Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">
                    รหัสพนักงาน
                  </th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 font-semibold">แผนก</th>
                  <th className="py-3.5 px-4 font-semibold">
                    ยอดวันลาคงเหลือ ({currentYear})
                  </th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    ปรับยอด (Adjust)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ไม่พบข้อมูลพนักงาน
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-bold text-[#533afd]">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {emp.department?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {emp.balances.length === 0 ? (
                            <span className="text-[#64748d] italic">
                              ยังไม่มีโควตา
                            </span>
                          ) : (
                            emp.balances.map((b) => (
                              <span
                                key={b.id}
                                className="inline-flex items-center text-[11px] bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-2 py-0.5"
                              >
                                <span className="text-[#64748d] mr-1">
                                  {b.leaveTypeName}:
                                </span>
                                <strong className="font-mono text-[#533afd] mr-0.5">
                                  {b.remainingDays}
                                </strong>
                                <span className="text-[10px] text-[#64748d]">
                                  /{b.allocatedDays}
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustment(emp)}
                          className="h-7 text-xs rounded-full px-3 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10 font-semibold"
                        >
                          <Sliders className="h-3 w-3 mr-1" /> ปรับยอดวันลา
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Adjustment Modal */}
      <Dialog
        open={!!adjustTarget}
        onOpenChange={(open) => !open && setAdjustTarget(null)}
      >
        <DialogContent
          onClose={() => setAdjustTarget(null)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Scale className="h-5 w-5 text-[#533afd] mr-2" />
              ปรับปรุงยอดวันลา (Leave Adjustment)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              พนักงาน:{" "}
              <strong className="text-[#0d253d]">
                {adjustTarget?.employee.firstName}{" "}
                {adjustTarget?.employee.lastName}
              </strong>{" "}
              ({adjustTarget?.employee.employeeCode})
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center ${
                message.type === "success"
                  ? "bg-[#ecfdf5] text-[#059669]"
                  : "bg-[#ffe4e6] text-[#ea2261]"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-1.5" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleAdjustSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ประเภทการลา <span className="text-[#ea2261]">*</span>
              </label>
              <Select
                value={selectedLeaveTypeId}
                onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                disabled={isLoading}
                className="h-9 rounded-xl text-xs"
              >
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ประเภทการทำรายการ
                </label>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  disabled={isLoading}
                  className="h-9 rounded-xl text-xs"
                >
                  <option value="ADJUSTMENT">ADJUSTMENT (ปรับปรุง)</option>
                  <option value="CREDIT">CREDIT (เพิ่มโควตาพิเศษ)</option>
                  <option value="REVERSAL">REVERSAL (คืนยอดวันลา)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  จำนวนวัน (+ หรือ -) <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="เช่น 1 หรือ -2"
                  value={adjustmentDays}
                  onChange={(e) => setAdjustmentDays(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เหตุผลการปรับปรุงยอด (Audit Trail){" "}
                <span className="text-[#ea2261]">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="เช่น เพิ่มโควตาพิเศษทำงานวันหยุด, ยกยอดจากปีก่อน"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={isLoading}
                className="w-full rounded-xl border border-[#a8c3de]/60 p-2.5 text-xs focus:border-[#533afd] focus:outline-none"
              />
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustTarget(null)}
                disabled={isLoading}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกยอดวันลา"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
