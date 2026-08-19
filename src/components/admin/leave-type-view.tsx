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
import { Sparkles, Plus, Check, X, Loader2, Pencil } from "lucide-react";

interface SerializedLeaveType {
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

      {/* Main Leave Types Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <Sparkles className="h-4 w-4 text-[#533afd] mr-2" />
            ประเภทการลาทั้งหมด ({leaveTypes.length} ประเภท)
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
                <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                  สถานะ
                </th>
                <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e8ee]/70">
              {leaveTypes.map((t) => (
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
                        variant="outline"
                        className="text-[10px] rounded-full text-[#64748d]"
                      >
                        Unpaid
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 pr-5 text-right">
                    <Badge
                      variant={t.isActive ? "success" : "outline"}
                      className="text-[10px] rounded-full"
                    >
                      {t.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(t)}
                      className="h-7 px-2 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                      title="แก้ไขประเภทการลา"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal: Add/Edit Leave Type Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => {
            setIsAddModalOpen(false);
            setEditTarget(null);
          }}
          className="max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Sparkles className="h-5 w-5 text-[#533afd] mr-2" />
              {editTarget ? "แก้ไขประเภทการลา" : "เพิ่มประเภทการลาใหม่"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              {editTarget
                ? `แก้ไขนโยบายวันลา "${editTarget.name}"`
                : "กำหนดนโยบายวันลา โควตาประจำปี และเงื่อนไขการใช้งานของพนักงาน"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-3">
            {editTarget && <input type="hidden" name="id" value={editTarget.id} />}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสประเภทการลา <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                name="code"
                defaultValue={editTarget?.code ?? ""}
                placeholder="เช่น VACATION, SICK, BUSINESS"
                required
                disabled={!!editTarget}
                className="h-10 uppercase rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อประเภทการลา <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                name="name"
                defaultValue={editTarget?.name ?? ""}
                placeholder="เช่น ลาพักร้อนประจำปี"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                โควตาเริ่มต้น (วัน/ปี) <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                name="defaultDays"
                type="number"
                step="0.5"
                defaultValue={editTarget?.defaultDays ?? 6}
                required
                className="h-10 rounded-xl tabular-nums font-mono"
              />
            </div>

            <div className="space-y-2.5 pt-1 rounded-xl bg-[#f6f9fc] p-3 border border-[#e3e8ee]">
              <label className="flex items-center text-xs text-[#0d253d] cursor-pointer">
                <input
                  type="checkbox"
                  name="allowHalfDay"
                  defaultChecked={editTarget ? editTarget.allowHalfDay : true}
                  className="mr-2 h-4 w-4 rounded border-[#a8c3de] text-[#533afd] accent-[#533afd]"
                />
                อนุญาตให้ลาครึ่งวัน (Half Day)
              </label>

              <label className="flex items-center text-xs text-[#0d253d] cursor-pointer">
                <input
                  type="checkbox"
                  name="allowHourly"
                  defaultChecked={editTarget ? editTarget.allowHourly : false}
                  className="mr-2 h-4 w-4 rounded border-[#a8c3de] text-[#533afd] accent-[#533afd]"
                />
                อนุญาตให้ลารายชั่วโมง (Hourly)
              </label>

              <div className="pt-1.5 border-t border-[#e3e8ee]">
                <label className="flex items-center text-xs text-[#0d253d] cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowCarryForward"
                    defaultChecked={
                      editTarget ? editTarget.allowCarryForward : false
                    }
                    className="mr-2 h-4 w-4 rounded border-[#a8c3de] text-[#533afd] accent-[#533afd]"
                  />
                  อนุญาตให้สะสมวันลาคงเหลือข้ามปี
                </label>
                <div className="mt-2 pl-6">
                  <label className="text-[11px] text-[#64748d] font-medium">
                    จำนวนวันสะสมสูงสุดต่อปี (เว้นว่าง = ไม่จำกัด)
                  </label>
                  <Input
                    name="maxCarryForwardDays"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="เช่น 10"
                    defaultValue={
                      editTarget?.maxCarryForwardDays
                        ? String(editTarget.maxCarryForwardDays)
                        : ""
                    }
                    className="h-8 mt-1 rounded-lg text-xs tabular-nums font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center text-xs text-[#0d253d] cursor-pointer">
                <input
                  type="checkbox"
                  name="requireReason"
                  defaultChecked={editTarget ? editTarget.requireReason : true}
                  className="mr-2 h-4 w-4 rounded border-[#a8c3de] text-[#533afd] accent-[#533afd]"
                />
                บังคับระบุเหตุผลการลา
              </label>
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditTarget(null);
                }}
                className="rounded-full h-9 px-4 text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  editTarget ? "บันทึกการแก้ไข" : "บันทึกประเภทการลา"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
