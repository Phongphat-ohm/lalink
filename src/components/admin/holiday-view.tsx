"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CalendarDays,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
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

interface SerializedHoliday {
  id: string;
  date: string;
  isoDate: string;
  name: string;
  weekday: string;
}

interface HolidayViewProps {
  holidays: SerializedHoliday[];
  year: number;
  onAddHoliday: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onUpdateHoliday: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string }>;
  onDeleteHoliday: (
    holidayId: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function HolidayView({
  holidays,
  year,
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
}: HolidayViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Edit Holiday State
  const [editTarget, setEditTarget] = React.useState<SerializedHoliday | null>(
    null,
  );
  const [isEditSaving, setIsEditSaving] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Delete Holiday State
  const [deleteTarget, setDeleteTarget] =
    React.useState<SerializedHoliday | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const res = await onAddHoliday(formData);
    setIsSaving(false);

    if (res.success) {
      setIsAddModalOpen(false);
      router.refresh();
    }
  }

  async function handleUpdateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setIsEditSaving(true);
    setEditError(null);
    const formData = new FormData(e.currentTarget);
    const res = await onUpdateHoliday(formData);
    setIsEditSaving(false);

    if (res.success) {
      setEditTarget(null);
      router.refresh();
    } else {
      setEditError(res.message || "เกิดข้อผิดพลาดในการแก้ไขวันหยุด");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await onDeleteHoliday(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setDeleteTarget(null);
      toast.success(res.message || "ลบวันหยุดเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบวันหยุดได้");
    }
  }

  const filteredHolidays = holidays.filter((h) => {
    const term = searchTerm.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      h.date.toLowerCase().includes(term) ||
      h.weekday.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredHolidays.length / pageSize) || 1;
  const paginatedHolidays = filteredHolidays.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e3e8ee] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
            ปฏิทินวันหยุดบริษัท ประจำปี {year} (Holidays)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            วันหยุดที่บันทึกไว้จะไม่ถูกคิดหักเป็นวันลาของพนักงานเมื่อมีการยื่นใบลา
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/holidays?year=${year - 1}`)}
            className="h-9 px-3 text-xs rounded-full border-[#e3e8ee] hover:bg-[#f6f9fc]"
          >
            ปีก่อนหน้า ({year - 1})
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/holidays?year=${year + 1}`)}
            className="h-9 px-3 text-xs rounded-full border-[#e3e8ee] hover:bg-[#f6f9fc]"
          >
            ปีถัดไป ({year + 1})
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> เพิ่มวันหยุด
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อวันหยุด, วันที่..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Holidays List Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <CalendarDays className="h-4 w-4 text-[#533afd] mr-2" />
            รายการวันหยุด ({filteredHolidays.length} วัน)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
          >
            + เพิ่มวันหยุด
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedHolidays.length === 0 ? (
            <div className="py-10 text-center text-[#64748d] text-xs">
              {searchTerm
                ? "ไม่พบวันหยุดที่ตรงกับคำค้นหา"
                : `ยังไม่มีการกำหนดวันหยุดบริษัทสำหรับปี ${year}`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3.5 px-4 pl-5 font-semibold">วันที่</th>
                    <th className="py-3.5 px-4 font-semibold">วันในสัปดาห์</th>
                    <th className="py-3.5 px-4 font-semibold">ชื่อวันหยุด</th>
                    <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {paginatedHolidays.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-semibold text-[#533afd] tabular-nums">
                        {h.date}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">{h.weekday}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {h.name}
                      </td>
                      <td className="py-3.5 px-4 pr-5">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTarget(h)}
                            className="h-7 px-2 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                            title="แก้ไขวันหยุด"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(h)}
                            className="h-7 px-2 text-xs text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                            title="ลบวันหยุด"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredHolidays.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Add Holiday Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-md p-6 rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              เพิ่มวันหยุดประจำปี {year}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดวันที่และชื่อวันหยุดพิเศษหรือวันหยุดตามประเพณี
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                วันที่ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                type="date"
                name="date"
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อวันหยุด <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                name="name"
                placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์"
                className="h-9 rounded-xl text-xs"
              />
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
                บันทึกวันหยุด
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent
          onClose={() => setEditTarget(null)}
          className="max-w-md p-6 rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              แก้ไขวันหยุด
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ปรับปรุงวันที่หรือชื่อวันหยุด
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {editTarget && (
            <form onSubmit={handleUpdateSubmit} className="space-y-3 mt-3">
              <input type="hidden" name="id" value={editTarget.id} />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  วันที่ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  type="date"
                  name="date"
                  defaultValue={editTarget.isoDate}
                  min={`${year}-01-01`}
                  max={`${year}-12-31`}
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อวันหยุด <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  name="name"
                  defaultValue={editTarget.name}
                  placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์"
                  className="h-9 rounded-xl text-xs"
                />
              </div>
              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditTarget(null)}
                  className="h-9 rounded-full text-xs"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isEditSaving}
                  className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
                >
                  {isEditSaving && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  บันทึกการแก้ไข
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d]">
              ยืนยันการลบวันหยุด?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะลบวันหยุด &ldquo;{deleteTarget?.name}&rdquo; (
              {deleteTarget?.date}) ออกจากปฏิทินบริษัทประจำปี {year}
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
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : null}
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
