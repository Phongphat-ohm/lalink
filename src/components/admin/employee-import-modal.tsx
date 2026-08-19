"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { importEmployeesAction, type ImportResult } from "@/features/employee";
import { buildImportTemplate } from "@/lib/employee/import";
import {
  Upload,
  FileDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface EmployeeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeImportModal({
  open,
  onOpenChange,
}: EmployeeImportModalProps) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  function handleClose() {
    onOpenChange(false);
    setFile(null);
    setError(null);
    setResult(null);
  }

  function handleDownloadTemplate() {
    const blob = new Blob([buildImportTemplate()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("กรุณาเลือกไฟล์ CSV");
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importEmployeesAction(null, formData);
    setIsImporting(false);

    if (res.success && res.data) {
      setResult(res.data);
      router.refresh();
    } else {
      setError(res.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent
        onClose={handleClose}
        className="max-w-xl rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
            <Upload className="h-5 w-5 text-[#533afd] mr-2" />
            นำเข้าข้อมูลพนักงาน (CSV)
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748d]">
            นำเข้าพนักงานหลายรายพร้อมกันจากไฟล์ CSV
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 p-3 rounded-xl bg-[#f0f7ff] border border-[#dbeafe] text-[11px] text-[#1e40af] leading-relaxed">
          <p className="font-semibold mb-1">คอลัมน์ที่รองรับ:</p>
          <p className="font-mono text-[10px]">
            employeeCode, firstName, lastName, dateOfBirth (YYYY-MM-DD), email,
            phone, departmentName, positionName, branchCode, status, joinedAt
          </p>
          <p className="mt-1">
            คอลัมน์บังคับ: <span className="font-semibold">employeeCode, firstName, lastName, dateOfBirth</span>
            <br />
            status ที่รองรับ: ACTIVE, PROBATION, INACTIVE (ค่าเริ่มต้น ACTIVE)
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="rounded-full text-xs h-8 px-4"
          >
            <FileDown className="h-3.5 w-3.5 mr-1.5" />
            ดาวน์โหลดเทมเพลต
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-[#e3e8ee] overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#e3e8ee] bg-[#f6f9fc]">
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-[#0d253d]">
                  {result.totalRows}
                </div>
                <div className="text-[10px] text-[#64748d]">ทั้งหมด</div>
              </div>
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-emerald-600">
                  {result.successCount}
                </div>
                <div className="text-[10px] text-[#64748d]">สำเร็จ</div>
              </div>
              <div className="p-3 text-center">
                <div className="text-lg font-bold text-[#ea2261]">
                  {result.failedCount}
                </div>
                <div className="text-[10px] text-[#64748d]">ล้มเหลว</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border-t border-[#e3e8ee] bg-white">
                {result.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 border-b border-[#e3e8ee]/60 text-[11px] text-[#0d253d]"
                  >
                    <span className="font-mono text-[#64748d]">
                      แถวที่ {err.rowNumber}:
                    </span>{" "}
                    {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-3.5 mt-2">
          <label className="block cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#cbd5e1] rounded-2xl hover:border-[#533afd] hover:bg-[#f6f9fc] transition-colors">
              {file ? (
                <div className="flex items-center gap-2 text-xs text-[#0d253d]">
                  <FileSpreadsheet className="h-5 w-5 text-[#533afd]" />
                  <span className="font-semibold">{file.name}</span>
                  <span className="text-[#64748d]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="h-8 w-8 text-[#94a3b8]" />
                  <span className="text-xs text-[#64748d]">
                    คลิกเพื่อเลือกไฟล์ CSV
                  </span>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                setError(null);
                setResult(null);
              }}
            />
          </label>

          <DialogFooter className="pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isImporting}
              className="rounded-full text-xs h-9 px-4"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isImporting || !file}
              className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังนำเข้า...
                </>
              ) : (
                "นำเข้าข้อมูล"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}