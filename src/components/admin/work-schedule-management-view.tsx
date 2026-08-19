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
} from "lucide-react";

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
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SerializedWorkSchedule | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
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
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleToggle(scheduleId: string) {
    const res = await onToggleWorkSchedule(scheduleId);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  async function handleDelete(schedule: SerializedWorkSchedule) {
    if (!confirm(`ลบตารางทำงาน "${schedule.name}" หรือไม่?`)) return;
    const res = await onDeleteWorkSchedule(schedule.id);
    if (res.success) {
      router.refresh();
    } else if (res.message) {
      alert(res.message);
    }
  }

  const activeShifts = shifts.filter((s) => s.isActive);
  const dayRowDisabled = bindShift !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            ตารางเวลาทำงาน (Work Schedules)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดวันทำงานและเวลาทำงานตามระดับ บริษัท / สาขา / แผนก / พนักงาน
            ใช้ในการคำนวณวันลา (โดยเฉพาะลารายชั่วโมง)
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

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <Card className="border-[#e3e8ee] bg-white rounded-2xl">
          <CardContent className="p-10 text-center text-[#94a3b8] text-sm">
            ยังไม่มีตารางทำงาน ระบบจะใช้ค่าเริ่มต้นคือวันเสาร์-อาทิตย์เป็นวันหยุด
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
          <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
              <CalendarClock className="h-4 w-4 text-[#533afd] mr-2" />
              ตารางทำงานทั้งหมด ({schedules.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {schedules.map((s) => (
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
                          onClick={() => handleDelete(s)}
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50 rounded-full px-2.5"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          ลบ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Work Schedule Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขตารางทำงาน" : "เพิ่มตารางทำงาน"}
            </DialogTitle>
            <DialogDescription>
              กำหนดระดับของตารางและเวลาทำงานรายสัปดาห์ หรืออ้างอิงจากกะทำงาน
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">ชื่อตารางทำงาน</span>
              <Input
                id="ws-name"
                name="name"
                placeholder="เช่น มาตรฐาน จ-ศ 08:30-17:30"
                defaultValue={editing?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">คำอธิบาย (ไม่บังคับ)</span>
              <Input
                id="ws-desc"
                name="description"
                defaultValue={editing?.description ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs text-[#64748d]">ระดับของตาราง</span>
                <Select
                  name="scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="h-10"
                >
                  <option value="COMPANY">บริษัท</option>
                  <option value="BRANCH">สาขา</option>
                  <option value="DEPARTMENT">แผนก</option>
                  <option value="EMPLOYEE">พนักงานรายคน</option>
                </Select>
              </div>

              {scope === "BRANCH" && (
                <div className="space-y-1.5">
                  <span className="text-xs text-[#64748d]">สาขา</span>
                  <Select
                    name="branchId"
                    className="h-10"
                    required
                    defaultValue={
                      editing && editing.scope === "BRANCH"
                        ? editing.scopeTargetId ?? undefined
                        : undefined
                    }
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
                <div className="space-y-1.5">
                  <span className="text-xs text-[#64748d]">แผนก</span>
                  <Select
                    name="departmentId"
                    className="h-10"
                    required
                    defaultValue={
                      editing && editing.scope === "DEPARTMENT"
                        ? editing.scopeTargetId ?? undefined
                        : undefined
                    }
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
                <div className="space-y-1.5">
                  <span className="text-xs text-[#64748d]">พนักงาน</span>
                  <Select
                    name="employeeId"
                    className="h-10"
                    required
                    defaultValue={
                      editing && editing.scope === "EMPLOYEE"
                        ? editing.scopeTargetId ?? undefined
                        : undefined
                    }
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

            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d]">
                อ้างอิงกะทำงาน (ไม่บังคับ)
              </span>
              <Select
                name="shiftId"
                value={bindShift}
                onChange={(e) => setBindShift(e.target.value)}
                className="h-10"
              >
                <option value="">-- กำหนดเวลาด้วยตัวเอง --</option>
                {activeShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {bindShift !== "" && (
                <p className="text-[11px] text-[#533afd]">
                  ตารางนี้จะใช้เวลาทำงานตามกะ "{shifts.find((s) => s.id === bindShift)?.name}" (ไม่ต้องกรอกเวลาด้านล่าง)
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-[#64748d] font-semibold">
                เวลาทำงานรายสัปดาห์
              </span>
              <div
                className={`rounded-xl border border-[#e3e8ee] divide-y divide-[#e3e8ee] ${
                  dayRowDisabled ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {DAY_LABELS.map((label, index) => {
                  const entry = editing?.entries.find(
                    (e) => e.dayOfWeek === index,
                  );
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          name={`working_${index}`}
                          defaultChecked={entry ? entry.isWorkingDay : index !== 0 && index !== 6}
                          className="h-4 w-4 rounded border-[#a8c3de] text-[#533afd] focus:ring-[#533afd]/30"
                        />
                        <span className="text-xs font-medium text-[#0d253d] w-20">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          name={`start_${index}`}
                          defaultValue={entry?.startTime && entry.isWorkingDay ? entry.startTime : "09:00"}
                          className="h-8 w-28 text-xs"
                        />
                        <span className="text-[#94a3b8] text-xs">ถึง</span>
                        <Input
                          type="time"
                          name={`end_${index}`}
                          defaultValue={entry?.endTime && entry.isWorkingDay ? entry.endTime : "18:00"}
                          className="h-8 w-28 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#533afd] text-white hover:bg-[#4434d4]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "บันทึก"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}