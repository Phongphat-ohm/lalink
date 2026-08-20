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
import { Clock, Plus, Loader2, Pencil, Trash2, Check, Search, AlertCircle } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedShiftEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface SerializedShift {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entries: SerializedShiftEntry[];
}

interface ShiftManagementViewProps {
  shifts: SerializedShift[];
  onSaveShift: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onToggleShift: (
    shiftId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteShift: (
    shiftId: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

const DAY_LABELS = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

const DEFAULT_DAYS: SerializedShiftEntry[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorkingDay: false },
  { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
  { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
  { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
  { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
  { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorkingDay: true },
  { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorkingDay: false },
];

export function ShiftManagementView({
  shifts,
  onSaveShift,
  onToggleShift,
  onDeleteShift,
}: ShiftManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(6);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingShift, setEditingShift] = React.useState<SerializedShift | null>(
    null,
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedShift | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [entries, setEntries] =
    React.useState<SerializedShiftEntry[]>(DEFAULT_DAYS);

  function openAddModal() {
    setEditingShift(null);
    setEntries(DEFAULT_DAYS);
    setIsAddModalOpen(true);
  }

  function openEditModal(shift: SerializedShift) {
    setEditingShift(shift);
    const map = new Map(shift.entries.map((e) => [e.dayOfWeek, e]));
    const merged = DEFAULT_DAYS.map((d) => map.get(d.dayOfWeek) ?? d);
    setEntries(merged);
    setIsAddModalOpen(true);
  }

  function updateEntry(
    dayOfWeek: number,
    patch: Partial<SerializedShiftEntry>,
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === dayOfWeek ? { ...e, ...patch } : e)),
    );
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    if (editingShift) formData.set("id", editingShift.id);
    entries.forEach((entry) => {
      formData.set(`start_${entry.dayOfWeek}`, entry.startTime);
      formData.set(`end_${entry.dayOfWeek}`, entry.endTime);
      formData.set(
        `work_${entry.dayOfWeek}`,
        entry.isWorkingDay ? "true" : "false",
      );
    });
    const res = await onSaveShift(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditingShift(null);
      toast.success(res.message || "บันทึกกะทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึกกะทำงาน");
    }
  }

  async function handleToggle(shiftId: string) {
    const res = await onToggleShift(shiftId);
    if (res.success) {
      toast.success(res.message || "เปลี่ยนสถานะกะทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถเปลี่ยนสถานะกะทำงานได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await onDeleteShift(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setDeleteTarget(null);
      toast.success(res.message || "ลบกะทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบกะทำงานได้");
    }
  }

  const filteredShifts = shifts.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && s.isActive) ||
      (statusFilter === "INACTIVE" && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredShifts.length / pageSize) || 1;
  const paginatedShifts = filteredShifts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function formatSlot(entry: SerializedShiftEntry): string {
    if (!entry.isWorkingDay) return "วันหยุด";
    return `${entry.startTime} - ${entry.endTime}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            กะการทำงาน (Work Shifts)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดเวลาเริ่ม-เลิกงานและวันทำงานในสัปดาห์
            เพื่อนำไปผูกกับตารางเวลาทำงานของพนักงาน
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มกะทำงาน
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหากะทำงาน หรือรายละเอียด..."
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
                    ? "ใช้งานอยู่"
                    : "ปิดใช้งาน"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shifts Grid */}
      {paginatedShifts.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl">
          <CardContent className="p-10 text-center text-[#94a3b8] text-sm">
            ไม่พบกะการทำงานที่ตรงกับเงื่อนไข
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedShifts.map((shift) => (
            <Card
              key={shift.id}
              className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 text-[#533afd] shrink-0" />
                    <CardTitle className="text-sm font-semibold text-[#0d253d] truncate">
                      {shift.name}
                    </CardTitle>
                  </div>
                  {shift.isActive ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ใช้งานอยู่
                    </Badge>
                  ) : (
                    <Badge variant="secondary">ปิดใช้งาน</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  {shift.description && (
                    <p className="text-xs text-[#64748d] mb-3">
                      {shift.description}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    {shift.entries.map((entry) => (
                      <div
                        key={entry.dayOfWeek}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-xs ${
                          entry.isWorkingDay
                            ? "bg-[#f0f4ff] text-[#0d253d]"
                            : "bg-[#f6f9fc] text-[#94a3b8]"
                        }`}
                      >
                        <span className="font-medium">
                          {DAY_LABELS[entry.dayOfWeek]}
                        </span>
                        <span className="font-mono">
                          {formatSlot(entry)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-[#e3e8ee] flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(shift.id)}
                    className="h-7 text-xs text-[#533afd] hover:bg-[#f0f4ff] rounded-full px-2.5"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    {shift.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(shift)}
                    className="h-7 text-xs text-[#475569] hover:bg-[#f6f9fc] rounded-full px-2.5"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(shift)}
                    className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    ลบ
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] p-2">
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[6, 12, 24]}
          totalItems={filteredShifts.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Shift Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              {editingShift ? "แก้ไขกะทำงาน" : "เพิ่มกะทำงานใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดเวลาเริ่มต้น-สิ้นสุด และเลือกวันทำงานในสัปดาห์
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อกะทำงาน <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                name="name"
                defaultValue={editingShift?.name ?? ""}
                placeholder="เช่น กะปกติ (09:00 - 18:00)"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                คำอธิบาย
              </label>
              <Input
                name="description"
                defaultValue={editingShift?.description ?? ""}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="border-t border-[#e3e8ee] pt-3 space-y-2">
              <p className="text-xs font-semibold text-[#0d253d]">
                ตารางเวลาแต่ละวันในสัปดาห์
              </p>

              {entries.map((entry) => (
                <div
                  key={entry.dayOfWeek}
                  className="flex items-center gap-3 rounded-xl bg-[#f6f9fc] p-2.5 text-xs"
                >
                  <label className="flex items-center space-x-2 w-32 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entry.isWorkingDay}
                      onChange={(e) =>
                        updateEntry(entry.dayOfWeek, {
                          isWorkingDay: e.target.checked,
                        })
                      }
                      className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                    />
                    <span
                      className={`font-medium ${
                        entry.isWorkingDay
                          ? "text-[#0d253d]"
                          : "text-[#94a3b8]"
                      }`}
                    >
                      {DAY_LABELS[entry.dayOfWeek]}
                    </span>
                  </label>

                  {entry.isWorkingDay ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={entry.startTime}
                        onChange={(e) =>
                          updateEntry(entry.dayOfWeek, {
                            startTime: e.target.value,
                          })
                        }
                        className="h-8 text-xs font-mono"
                        required
                      />
                      <span className="text-[#64748d]">ถึง</span>
                      <Input
                        type="time"
                        value={entry.endTime}
                        onChange={(e) =>
                          updateEntry(entry.dayOfWeek, {
                            endTime: e.target.value,
                          })
                        }
                        className="h-8 text-xs font-mono"
                        required
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-[#94a3b8] italic">
                      วันหยุดประจำสัปดาห์
                    </span>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
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
                บันทึกกะทำงาน
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการลบกะทำงาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบกะทำงาน &ldquo;{deleteTarget?.name}&rdquo; ตารางทำงานที่อ้างอิงกะนี้จะกลับไปใช้เวลาตามที่กำหนดเอง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isDeleting && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}