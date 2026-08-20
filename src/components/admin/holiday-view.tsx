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
  Sparkles,
  CheckSquare,
  Square,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { ThaiDatePicker } from "@/components/ui/thai-date-picker";
import { toBuddhistYear, formatThaiDate } from "@/lib/utils/date";

interface SerializedHoliday {
  id: string;
  date: string;
  isoDate: string;
  name: string;
  weekday: string;
}

export interface ThaiOfficialHolidayItem {
  name: string;
  date: string;
  formattedDate: string;
  weekday: string;
  isAlreadyImported: boolean;
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
  onImportOfficialHolidays?: (
    year: number,
    selectedHolidays?: { name: string; date: string }[],
  ) => Promise<{
    success: boolean;
    message?: string;
    data?: {
      count: number;
      skippedCount: number;
      year?: number;
      holidays?: SerializedHoliday[];
    };
  }>;
  onGetThaiHolidays?: (
    year: number,
  ) => Promise<{
    success: boolean;
    data?: {
      year: number;
      buddhistYear: number;
      holidays: ThaiOfficialHolidayItem[];
    };
    message?: string;
  }>;
}

export function HolidayView({
  holidays,
  year,
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
  onImportOfficialHolidays,
  onGetThaiHolidays,
}: HolidayViewProps) {
  const router = useRouter();
  const [displayHolidays, setDisplayHolidays] =
    React.useState<SerializedHoliday[]>(holidays);

  React.useEffect(() => {
    setDisplayHolidays(holidays);
  }, [holidays]);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Auto-Sync Thai Holidays State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importYear, setImportYear] = React.useState(year);
  const [isLoadingThaiHolidays, setIsLoadingThaiHolidays] = React.useState(false);
  const [thaiHolidaysList, setThaiHolidaysList] = React.useState<ThaiOfficialHolidayItem[]>([]);
  const [selectedHolidayDates, setSelectedHolidayDates] = React.useState<Set<string>>(new Set());
  const [importSearchTerm, setImportSearchTerm] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);

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

  const loadThaiHolidays = React.useCallback(
    async (targetYear: number) => {
      if (!onGetThaiHolidays) return;
      setIsLoadingThaiHolidays(true);
      const res = await onGetThaiHolidays(targetYear);
      setIsLoadingThaiHolidays(false);

      if (res.success && res.data) {
        setThaiHolidaysList(res.data.holidays);
        // Default selection: select all that are NOT already imported
        const newSelected = new Set<string>();
        res.data.holidays.forEach((h) => {
          if (!h.isAlreadyImported) {
            newSelected.add(h.date);
          }
        });
        setSelectedHolidayDates(newSelected);
      } else {
        toast.error(res.message || "ไม่สามารถดึงข้อมูลวันหยุดราชการไทยได้");
      }
    },
    [onGetThaiHolidays],
  );

  function handleOpenImportModal() {
    setImportYear(year);
    setImportSearchTerm("");
    setIsImportModalOpen(true);
    loadThaiHolidays(year);
  }

  function handleYearChangeInImportModal(newYear: number) {
    setImportYear(newYear);
    loadThaiHolidays(newYear);
  }

  function toggleSelectDate(dateStr: string) {
    setSelectedHolidayDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }

  function handleSelectAllNew() {
    const next = new Set<string>();
    thaiHolidaysList.forEach((h) => {
      if (!h.isAlreadyImported) {
        next.add(h.date);
      }
    });
    setSelectedHolidayDates(next);
  }

  function handleSelectAll() {
    const next = new Set<string>();
    thaiHolidaysList.forEach((h) => next.add(h.date));
    setSelectedHolidayDates(next);
  }

  function handleDeselectAll() {
    setSelectedHolidayDates(new Set());
  }

  async function handleConfirmImport() {
    if (!onImportOfficialHolidays) return;
    if (selectedHolidayDates.size === 0) {
      toast.error("กรุณาเลือกวันหยุดที่ต้องการนำเข้าอย่างน้อย 1 วัน");
      return;
    }

    const holidaysToImport = thaiHolidaysList
      .filter((h) => selectedHolidayDates.has(h.date))
      .map((h) => ({ name: h.name, date: h.date }));

    setIsImporting(true);
    const res = await onImportOfficialHolidays(importYear, holidaysToImport);
    setIsImporting(false);

    if (res.success) {
      if (res.data?.holidays && importYear === year) {
        setDisplayHolidays(res.data.holidays);
      }
      toast.success(res.message || "นำเข้าวันหยุดสำเร็จ");
      setIsImportModalOpen(false);

      if (importYear !== year) {
        router.push(`/admin/holidays?year=${importYear}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการนำเข้าวันหยุด");
    }
  }

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
      setDisplayHolidays((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success(res.message || "ลบวันหยุดเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถลบวันหยุดได้");
    }
  }

  const filteredHolidays = displayHolidays.filter((h) => {
    const term = searchTerm.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      h.date.toLowerCase().includes(term) ||
      h.weekday.toLowerCase().includes(term)
    );
  });

  const filteredModalHolidays = thaiHolidaysList.filter((h) => {
    if (!importSearchTerm) return true;
    const term = importSearchTerm.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      h.date.toLowerCase().includes(term) ||
      h.weekday.toLowerCase().includes(term) ||
      h.formattedDate.toLowerCase().includes(term)
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
            ปฏิทินวันหยุดบริษัท ประจำปี {toBuddhistYear(year)} (Holidays)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            วันหยุดที่บันทึกไว้จะไม่ถูกคิดหักเป็นวันลาของพนักงานเมื่อมีการยื่นใบลา
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/holidays?year=${year - 1}`)}
            className="h-9 px-3 text-xs rounded-full border-[#e3e8ee] hover:bg-[#f6f9fc] cursor-pointer"
          >
            ปีก่อนหน้า ({toBuddhistYear(year - 1)})
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/holidays?year=${year + 1}`)}
            className="h-9 px-3 text-xs rounded-full border-[#e3e8ee] hover:bg-[#f6f9fc] cursor-pointer"
          >
            ปีถัดไป ({toBuddhistYear(year + 1)})
          </Button>
          {onImportOfficialHolidays && (
            <Button
              type="button"
              onClick={handleOpenImportModal}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold px-3.5 shadow-sm flex items-center cursor-pointer"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              เชื่อมวันหยุดอัตโนมัติ
            </Button>
          )}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4 shadow-sm cursor-pointer"
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
          <div className="flex items-center space-x-2">
            {onImportOfficialHolidays && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenImportModal}
                className="h-7 text-xs text-emerald-600 hover:bg-emerald-50 rounded-full px-2.5 flex items-center cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> เชื่อมวันหยุดอัตโนมัติ
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5 cursor-pointer"
            >
              + เพิ่มวันหยุด
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedHolidays.length === 0 ? (
            <div className="py-12 text-center text-[#64748d] text-xs">
              <CalendarDays className="h-10 w-10 mx-auto text-[#64748d]/30 mb-2" />
              {searchTerm
                ? "ไม่พบวันหยุดที่ตรงกับคำค้นหา"
                : `ยังไม่มีการกำหนดวันหยุดบริษัทสำหรับปี ${toBuddhistYear(year)}`}
              {onImportOfficialHolidays && !searchTerm && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenImportModal}
                    className="rounded-full text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> ดึงวันหยุดราชการไทยอัตโนมัติ (date-holidays)
                  </Button>
                </div>
              )}
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
              เพิ่มวันหยุดประจำปี {toBuddhistYear(year)}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดวันที่และชื่อวันหยุดพิเศษหรือวันหยุดตามประเพณี
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                วันที่ (พ.ศ.) <span className="text-[#ea2261]">*</span>
              </label>
              <ThaiDatePicker
                required
                name="date"
                defaultValue={`${year}-01-01`}
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
                  วันที่ (พ.ศ.) <span className="text-[#ea2261]">*</span>
                </label>
                <ThaiDatePicker
                  required
                  name="date"
                  defaultValue={editTarget.isoDate}
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

      {/* Auto-Sync Thai Public Holidays Modal */}
      <Dialog
        open={isImportModalOpen}
        onOpenChange={(open) => !open && !isImporting && setIsImportModalOpen(false)}
      >
        <DialogContent
          onClose={() => !isImporting && setIsImportModalOpen(false)}
          className="max-w-2xl p-6 rounded-2xl max-h-[85vh] flex flex-col"
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              เชื่อมวันหยุดนักขัตฤกษ์ไทยอัตโนมัติ (Thai Public Holidays)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ดึงข้อมูลวันหยุดราชการและนักขัตฤกษ์ของไทยประจำปี พ.ศ. {toBuddhistYear(importYear)} (ค.ศ. {importYear}) จากไลบรารี <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">date-holidays</code> เพื่อนำเข้าสู่ปฏิทินบริษัท
            </DialogDescription>
          </DialogHeader>

          {/* Year Switcher & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 my-3 shrink-0">
            <div className="flex items-center space-x-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingThaiHolidays || isImporting}
                onClick={() => handleYearChangeInImportModal(importYear - 1)}
                className="h-8 px-2.5 text-xs rounded-full cursor-pointer"
              >
                ← {toBuddhistYear(importYear - 1)}
              </Button>
              <span className="font-bold text-xs text-[#0d253d] px-2.5 py-1 rounded-lg bg-[#f6f9fc] border border-[#e3e8ee]">
                พ.ศ. {toBuddhistYear(importYear)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingThaiHolidays || isImporting}
                onClick={() => handleYearChangeInImportModal(importYear + 1)}
                className="h-8 px-2.5 text-xs rounded-full cursor-pointer"
              >
                {toBuddhistYear(importYear + 1)} →
              </Button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748d]" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อวันหยุด..."
                value={importSearchTerm}
                onChange={(e) => setImportSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Selection controls & Statistics */}
          <div className="flex items-center justify-between bg-[#f6f9fc] p-2.5 rounded-xl border border-[#e3e8ee] text-xs shrink-0 mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllNew}
                className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                เลือกเฉพาะที่ยังไม่มี ({thaiHolidaysList.filter((h) => !h.isAlreadyImported).length})
              </button>
              <span className="text-[#64748d]">|</span>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-[#533afd] hover:underline cursor-pointer"
              >
                เลือกทั้งหมด ({thaiHolidaysList.length})
              </button>
              <span className="text-[#64748d]">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-[#64748d] hover:underline cursor-pointer"
              >
                ล้างการเลือก
              </button>
            </div>
            <div className="font-semibold text-[#0d253d]">
              เลือกไว้ <span className="text-emerald-600 font-bold">{selectedHolidayDates.size}</span> / {thaiHolidaysList.length} วัน
            </div>
          </div>

          {/* Holidays List with Checkbox */}
          <div className="flex-1 overflow-y-auto border border-[#e3e8ee] rounded-xl divide-y divide-[#e3e8ee] min-h-[220px]">
            {isLoadingThaiHolidays ? (
              <div className="p-8 text-center text-xs text-[#64748d] flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mb-2" />
                กำลังโหลดข้อมูลวันหยุดราชการไทยจาก date-holidays...
              </div>
            ) : filteredModalHolidays.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748d]">
                ไม่พบวันหยุดที่ตรงกับคำค้นหา
              </div>
            ) : (
              filteredModalHolidays.map((h) => {
                const isSelected = selectedHolidayDates.has(h.date);
                return (
                  <div
                    key={h.date}
                    onClick={() => toggleSelectDate(h.date)}
                    className={`p-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-50/50 hover:bg-emerald-50"
                        : "hover:bg-[#f6f9fc]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectDate(h.date)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <p className="font-semibold text-[#0d253d]">{h.name}</p>
                        <p className="text-[11px] text-[#64748d]">
                          {h.weekday}, {h.formattedDate} ({h.date})
                        </p>
                      </div>
                    </div>

                    <div>
                      {h.isAlreadyImported ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] rounded-full text-slate-500 border-slate-300 bg-slate-100"
                        >
                          มีในระบบแล้ว
                        </Badge>
                      ) : (
                        <Badge
                          variant="success"
                          className="text-[10px] rounded-full bg-emerald-100 text-emerald-800 border-emerald-200"
                        >
                          พร้อมนำเข้า
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-[#e3e8ee] shrink-0 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isImporting}
              className="rounded-full text-xs h-9 px-4 cursor-pointer"
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || selectedHolidayDates.size === 0 || isLoadingThaiHolidays}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 h-9 shadow-sm cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> กำลังนำเข้าวันหยุด...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> นำเข้าวันหยุด ({selectedHolidayDates.size} วัน)
                </>
              )}
            </Button>
          </DialogFooter>
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
              {deleteTarget?.date}) ออกจากปฏิทินบริษัทประจำปี {toBuddhistYear(year)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-full text-xs h-9 cursor-pointer"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4 cursor-pointer"
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
