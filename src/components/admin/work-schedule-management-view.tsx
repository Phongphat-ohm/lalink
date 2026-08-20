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
  CalendarClock,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  Search,
  AlertCircle,
} from "lucide-react";
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
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedWorkScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface SerializedWorkSchedule {
  id: string;
  name: string;
  description: string | null;
  scope: string;
  isActive: boolean;
  shiftId: string | null;
  shiftName: string | null;
  scopeTargetName: string | null;
  scopeTargetId: string | null;
  entries: SerializedWorkScheduleEntry[];
}

interface WorkScheduleManagementViewProps {
  schedules: SerializedWorkSchedule[];
  shifts: { id: string; name: string; isActive: boolean }[];
  branches: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  employees: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  }[];
  onSaveWorkSchedule: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onToggleWorkSchedule: (
    scheduleId: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteWorkSchedule: (
    scheduleId: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

const DAY_LABELS = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

const SCOPE_LABELS: Record<string, string> = {
  COMPANY: "บริษัท",
  BRANCH: "สาขา",
  DEPARTMENT: "แผนก",
  EMPLOYEE: "พนักงาน",
};

function formatSlot(entry: SerializedWorkScheduleEntry): string {
  if (!entry.isWorkingDay) return "วันหยุด";
  return `${entry.startTime} - ${entry.endTime}`;
}

export function WorkScheduleManagementView({
  schedules,
  shifts,
  branches,
  departments,
  employees,
  onSaveWorkSchedule,
  onToggleWorkSchedule,
  onDeleteWorkSchedule,
}: WorkScheduleManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [scopeFilter, setScopeFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SerializedWorkSchedule | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedWorkSchedule | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [scope, setScope] = React.useState("COMPANY");
  const [bindShift, setBindShift] = React.useState("");

  function openAddModal() {
    setEditing(null);
    setScope("COMPANY");
    setBindShift("");
    setIsAddModalOpen(true);
  }

  function openEditModal(schedule: SerializedWorkSchedule) {
    setEditing(schedule);
    setScope(schedule.scope);
    setBindShift(schedule.shiftId ?? "");
    setIsAddModalOpen(true);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    if (editing) formData.set("id", editing.id);
    const res = await onSaveWorkSchedule(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      setEditing(null);
      toast.success(res.message || "บันทึกตารางทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึกตารางทำงาน");
    }
  }

  async function handleToggle(scheduleId: string) {
    const res = await onToggleWorkSchedule(scheduleId);
    if (res.success) {
      toast.success(res.message || "เปลี่ยนสถานะตารางทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถเปลี่ยนสถานะตารางทำงานได้");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await onDeleteWorkSchedule(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setDeleteTarget(null);
      toast.success(res.message || "ลบตารางทำงานสำเร็จ");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบตารางทำงานได้");
    }
  }

  const filteredSchedules = schedules.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term)) ||
      (s.scopeTargetName && s.scopeTargetName.toLowerCase().includes(term)) ||
      (s.shiftName && s.shiftName.toLowerCase().includes(term));

    const matchesScope =
      scopeFilter === "ALL" || s.scope === scopeFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && s.isActive) ||
      (statusFilter === "INACTIVE" && !s.isActive);

    return matchesSearch && matchesScope && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSchedules.length / pageSize) || 1;
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            ตารางทำงาน (Work Schedules)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดตารางทำงานรายสัปดาห์ในระดับบริษัท สาขา แผนก หรือพนักงานรายคน
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เพิ่มตารางทำงาน
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อตาราง, กะ, แผนก, พนักงาน..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#64748d]">ระดับ:</span>
              <Select
                value={scopeFilter}
                onChange={(e) => {
                  setScopeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl text-xs w-36"
              >
                <option value="ALL">ทุกระดับ</option>
                <option value="COMPANY">ระดับบริษัท</option>
                <option value="BRANCH">ระดับสาขา</option>
                <option value="DEPARTMENT">ระดับแผนก</option>
                <option value="EMPLOYEE">ระดับพนักงาน</option>
              </Select>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#64748d]">สถานะ:</span>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl text-xs w-32"
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="ACTIVE">ใช้งานอยู่</option>
                <option value="INACTIVE">ปิดใช้งาน</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <CalendarClock className="h-4 w-4 text-[#533afd] mr-2" />
            ตารางทำงานทั้งหมด ({filteredSchedules.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อตาราง</th>
                  <th className="py-3.5 px-4 font-semibold">ระดับ</th>
                  <th className="py-3.5 px-4 font-semibold">ใช้กับ</th>
                  <th className="py-3.5 px-4 font-semibold">กะอ้างอิง</th>
                  <th className="py-3.5 px-4 font-semibold text-center">สถานะ</th>
                  <th className="py-3.5 px-4 pr-5 font-semibold text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-[#94a3b8] text-xs">
                      ไม่พบตารางทำงานตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f6f9fc]/50">
                      <td className="py-3.5 px-4 pl-5 font-medium text-[#0d253d]">
                        {s.name}
                        {s.description && (
                          <div className="text-[11px] text-[#64748d] font-normal">
                            {s.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] py-0.5"
                        >
                          {SCOPE_LABELS[s.scope] ?? s.scope}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {s.scopeTargetName ?? "-"}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {s.shiftName ? (
                          <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 rounded-full text-[10px] py-0.5">
                            {s.shiftName}
                          </Badge>
                        ) : (
                          <span className="text-[#94a3b8]">กำหนดเอง</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {s.isActive ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ใช้งานอยู่
                          </Badge>
                        ) : (
                          <Badge variant="secondary">ปิดใช้งาน</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(s.id)}
                            className="h-7 text-xs text-[#533afd] hover:bg-[#f0f4ff] rounded-full px-2.5"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {s.isActive ? "ปิด" : "เปิด"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(s)}
                            className="h-7 text-xs text-[#475569] hover:bg-[#f6f9fc] rounded-full px-2.5"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            แก้ไข
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(s)}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            ลบ
                          </Button>
                        </div>
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
            totalItems={filteredSchedules.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Work Schedule Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-xl p-6 rounded-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              {editing ? "แก้ไขตารางทำงาน" : "เพิ่มตารางทำงานใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดขอบเขตการใช้งาน และเลือกกะทำงานที่ต้องการผูก
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อตารางทำงาน <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                name="name"
                defaultValue={editing?.name ?? ""}
                placeholder="เช่น ตารางทำงานสำนักงานใหญ่, ตารางทีมไอที"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                คำอธิบาย
              </label>
              <Input
                name="description"
                defaultValue={editing?.description ?? ""}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ระดับการใช้งาน (Scope) <span className="text-[#ea2261]">*</span>
                </label>
                <Select
                  name="scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="h-9 rounded-xl text-xs"
                >
                  <option value="COMPANY">ทั้งบริษัท (Company)</option>
                  <option value="BRANCH">ตามสาขา (Branch)</option>
                  <option value="DEPARTMENT">ตามแผนก (Department)</option>
                  <option value="EMPLOYEE">รายพนักงาน (Employee)</option>
                </Select>
              </div>

              {scope === "BRANCH" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    เลือกสาขา <span className="text-[#ea2261]">*</span>
                  </label>
                  <Select
                    name="scopeTargetId"
                    defaultValue={editing?.scopeTargetId ?? ""}
                    required
                    className="h-9 rounded-xl text-xs"
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {scope === "DEPARTMENT" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    เลือกแผนก <span className="text-[#ea2261]">*</span>
                  </label>
                  <Select
                    name="scopeTargetId"
                    defaultValue={editing?.scopeTargetId ?? ""}
                    required
                    className="h-9 rounded-xl text-xs"
                  >
                    <option value="">-- เลือกแผนก --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {scope === "EMPLOYEE" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#0d253d]">
                    เลือกพนักงาน <span className="text-[#ea2261]">*</span>
                  </label>
                  <Select
                    name="scopeTargetId"
                    defaultValue={editing?.scopeTargetId ?? ""}
                    required
                    className="h-9 rounded-xl text-xs"
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.employeeCode} - {e.firstName} {e.lastName}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ผูกกับกะทำงาน (Shift)
              </label>
              <Select
                name="shiftId"
                value={bindShift}
                onChange={(e) => setBindShift(e.target.value)}
                className="h-9 rounded-xl text-xs"
              >
                <option value="">-- กำหนดเวลาทำงานเอง (ไม่ใช้กะ) --</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {!s.isActive && "(ปิดใช้งาน)"}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-[#64748d]">
                หากเลือกกะทำงาน ระบบจะใช้เวลาของกะในการคำนวณวันหยุดและชั่วโมงทำงานโดยอัตโนมัติ
              </p>
            </div>

            {!bindShift && (
              <div className="border-t border-[#e3e8ee] pt-3 space-y-2">
                <p className="text-xs font-semibold text-[#0d253d]">
                  กำหนดเวลาทำงานรายวัน (กรณีไม่ผูกกะ)
                </p>

                <div className="space-y-2">
                  {DAY_LABELS.map((dayName, idx) => {
                    const entry = editing?.entries.find(
                      (e) => e.dayOfWeek === idx,
                    );
                    const isWork = entry ? entry.isWorkingDay : idx >= 1 && idx <= 5;
                    const start = entry?.startTime ?? "09:00";
                    const end = entry?.endTime ?? "18:00";

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 items-center gap-2 rounded-xl bg-[#f6f9fc] p-2 text-xs"
                      >
                        <span className="col-span-3 font-semibold text-[#0d253d]">
                          {dayName}
                        </span>

                        <label className="col-span-3 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            name={`working_${idx}`}
                            defaultChecked={isWork}
                            value="true"
                            className="h-3.5 w-3.5 rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                          />
                          <span className="text-[11px] text-[#475569]">วันทำงาน</span>
                        </label>

                        <div className="col-span-6 flex items-center gap-1.5">
                          <Input
                            type="time"
                            name={`start_${idx}`}
                            defaultValue={start}
                            className="h-8 rounded-lg text-xs"
                          />
                          <span className="text-[#94a3b8]">-</span>
                          <Input
                            type="time"
                            name={`end_${idx}`}
                            defaultValue={end}
                            className="h-8 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                บันทึกตารางทำงาน
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
              ยืนยันการลบตารางทำงาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบตารางทำงาน &ldquo;{deleteTarget?.name}&rdquo; บุคลากรที่อ้างอิงตารางนี้จะกลับไปใช้ค่าเริ่มต้น
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