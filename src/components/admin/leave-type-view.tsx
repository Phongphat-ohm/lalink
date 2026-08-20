"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Plus, Check, X, Loader2, Pencil, Search } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedLeaveType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  allowCarryForward: boolean;
  maxCarryForwardDays: number | null;
  requireReason: boolean;
  isPaid: boolean;
  isActive: boolean;
}

interface LeaveTypeViewProps {
  leaveTypes: SerializedLeaveType[];
  onSaveLeaveType: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function LeaveTypeView({
  leaveTypes,
  onSaveLeaveType,
}: LeaveTypeViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<SerializedLeaveType | null>(
    null,
  );

  function openModal(target: SerializedLeaveType | null) {
    setEditTarget(target);
    setIsAddModalOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await onSaveLeaveType(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditTarget(null);
      router.refresh();
    }
  }

  const filteredLeaveTypes = leaveTypes.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(term) ||
      t.code.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && t.isActive) ||
      (statusFilter === "INACTIVE" && !t.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLeaveTypes.length / pageSize) || 1;
  const paginatedLeaveTypes = filteredLeaveTypes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            นโยบายและประเภทการลา (Leave Policies)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดประเภทการลา โควตาวันลาประจำปี กฎการลาครึ่งวัน
            และเงื่อนไขการจ่ายค่าจ้าง
          </p>
        </div>

        <Button
          onClick={() => openModal(null)}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มประเภทการลา
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อประเภทการลา หรือรหัส..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
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
                    ? "เปิดใช้งาน"
                    : "ปิดใช้งาน"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Leave Types Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <Sparkles className="h-4 w-4 text-[#533afd] mr-2" />
            ประเภทการลาทั้งหมด ({filteredLeaveTypes.length} ประเภท)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal(null)}
            className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
          >
            + สร้างใหม่
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">รหัส</th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อประเภทการลา</th>
                  <th className="py-3.5 px-4 font-semibold">โควตามาตรฐาน</th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    ลาครึ่งวัน
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    ลารายชั่วโมง
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    สะสมข้ามปี
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    ระบุเหตุผล
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-center">
                    จ่ายค่าจ้าง
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    สถานะ
                  </th>
                  <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedLeaveTypes.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[#64748d] text-xs">
                      ไม่พบประเภทการลาตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedLeaveTypes.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-semibold text-[#533afd] tabular-nums">
                        {t.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {t.name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0d253d] tabular-nums font-mono">
                        {t.defaultDays} วัน/ปี
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.allowHalfDay ? (
                          <Check className="h-4 w-4 text-[#059669] mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-[#64748d]/40 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.allowHourly ? (
                          <Check className="h-4 w-4 text-[#059669] mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-[#64748d]/40 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.allowCarryForward ? (
                          <span className="inline-flex flex-col items-center">
                            <Check className="h-4 w-4 text-[#059669]" />
                            {t.maxCarryForwardDays !== null &&
                              t.maxCarryForwardDays > 0 && (
                                <span className="text-[10px] text-[#64748d] mt-0.5 font-mono">
                                  สูงสุด {t.maxCarryForwardDays} วัน
                                </span>
                              )}
                          </span>
                        ) : (
                          <X className="h-4 w-4 text-[#64748d]/40 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.requireReason ? (
                          <Check className="h-4 w-4 text-[#059669] mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-[#64748d]/40 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {t.isPaid ? (
                          <Badge
                            variant="success"
                            className="text-[10px] rounded-full"
                          >
                            Paid
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] rounded-full"
                          >
                            Unpaid
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.isActive ? (
                          <Badge
                            variant="success"
                            className="text-[10px] rounded-full"
                          >
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] rounded-full"
                          >
                            ปิด
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openModal(t)}
                          className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          แก้ไข
                        </Button>
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
            totalItems={filteredLeaveTypes.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Modal: Add/Edit Leave Type */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent
          onClose={() => {
            setIsAddModalOpen(false);
            setEditTarget(null);
          }}
          className="max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              {editTarget ? "แก้ไขประเภทการลา" : "เพิ่มประเภทการลาใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดนโยบายและเงื่อนไขการใช้งานของประเภทการลานี้
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            {editTarget && <input type="hidden" name="id" value={editTarget.id} />}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  รหัสประเภทการลา <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  name="code"
                  defaultValue={editTarget?.code ?? ""}
                  placeholder="เช่น ANNUAL, SICK, BUSINESS"
                  className="h-9 rounded-xl text-xs uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อประเภทการลา <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  name="name"
                  defaultValue={editTarget?.name ?? ""}
                  placeholder="เช่น ลาพักร้อน, ลาป่วย"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  โควตาเริ่มต้น (วัน/ปี) <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  type="number"
                  name="defaultDays"
                  defaultValue={editTarget?.defaultDays ?? 6}
                  min={0}
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  โควตาสะสมข้ามปีสูงสุด (วัน)
                </label>
                <Input
                  type="number"
                  name="maxCarryForwardDays"
                  defaultValue={editTarget?.maxCarryForwardDays ?? ""}
                  placeholder="เว้นว่างหากไม่จำกัด"
                  min={0}
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                คำอธิบาย
              </label>
              <Input
                name="description"
                defaultValue={editTarget?.description ?? ""}
                placeholder="รายละเอียดเพิ่มเติมของเงื่อนไขการลา"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            {/* Checkbox Options */}
            <div className="border-t border-[#e3e8ee] pt-3 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowHalfDay"
                  defaultChecked={editTarget ? editTarget.allowHalfDay : true}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">อนุญาตให้ลาครึ่งวัน</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowHourly"
                  defaultChecked={editTarget ? editTarget.allowHourly : false}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">อนุญาตให้ลารายชั่วโมง</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowCarryForward"
                  defaultChecked={editTarget ? editTarget.allowCarryForward : false}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">สะสมวันลาข้ามปีได้</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="requireReason"
                  defaultChecked={editTarget ? editTarget.requireReason : true}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">ต้องระบุเหตุผลการลา</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPaid"
                  defaultChecked={editTarget ? editTarget.isPaid : true}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">จ่ายค่าจ้างตามปกติ (Paid)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editTarget ? editTarget.isActive : true}
                  value="true"
                  className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                />
                <span className="text-[#0d253d]">เปิดใช้งานในระบบ (Active)</span>
              </label>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditTarget(null);
                }}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isSaving && (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                )}
                บันทึกประเภทการลา
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
