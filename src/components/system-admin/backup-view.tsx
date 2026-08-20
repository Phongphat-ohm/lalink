"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Calendar,
  ShieldCheck,
  Search,
} from "lucide-react";
import { triggerDatabaseBackupAction } from "@/features/company/super-admin-ops-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedBackupLog {
  id: string;
  filename: string;
  sizeBytes: string;
  status: string;
  triggerType: string;
  checksum: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface BackupViewProps {
  backups: SerializedBackupLog[];
}

export function BackupView({ backups }: BackupViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "MANUAL" | "SCHEDULED">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [isLoading, setIsLoading] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleTriggerBackup() {
    setIsLoading(true);
    setSuccessMessage(null);

    const result = await triggerDatabaseBackupAction();
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message || "สร้างสำรองฐานข้อมูลสำเร็จ!");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการสำรองข้อมูล");
    }
  }

  function formatBytes(bytesStr: string) {
    const bytes = Number(bytesStr);
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const filteredBackups = backups.filter((b) => {
    const matchesSearch =
      b.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.checksum && b.checksum.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || b.triggerType === typeFilter;

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredBackups.length / pageSize) || 1;
  const paginatedBackups = filteredBackups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            สำรองและกู้คืนฐานข้อมูล (Backup & Recovery)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            จัดการการสำรองข้อมูลอัตโนมัติและสั่ง Trigger สร้าง Snapshot
            สำรองฐานข้อมูลแบบ Manual
          </p>
        </div>

        <Button
          onClick={handleTriggerBackup}
          disabled={isLoading}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              กำลังสำรองข้อมูล...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-1.5" /> สำรองข้อมูลทันที (Backup Now)
            </>
          )}
        </Button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-xs font-semibold flex items-center shadow-xs">
          <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อไฟล์สำรอง, Checksum..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(["ALL", "MANUAL", "SCHEDULED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setTypeFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "MANUAL"
                    ? "สร้างด้วยตนเอง (Manual)"
                    : "ระบบอัตโนมัติ (Auto)"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backups Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">
                    ชื่อไฟล์สำรอง (Backup File)
                  </th>
                  <th className="py-3.5 px-4 font-semibold">ขนาดไฟล์</th>
                  <th className="py-3.5 px-4 font-semibold">ประเภท</th>
                  <th className="py-3.5 px-4 font-semibold">
                    Checksum (SHA256)
                  </th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 font-semibold">วัน-เวลาที่สร้าง</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">ดาวน์โหลด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                {paginatedBackups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748d] font-sans"
                    >
                      ไม่พบประวัติการสำรองฐานข้อมูลตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedBackups.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-bold text-[#0d253d] font-sans">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="h-4 w-4 text-[#533afd] shrink-0" />
                          <span className="font-mono text-xs">{b.filename}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {formatBytes(b.sizeBytes)}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <Badge
                          variant={
                            b.triggerType === "MANUAL" ? "default" : "secondary"
                          }
                          className="text-[10px] rounded-full px-2"
                        >
                          {b.triggerType}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] text-[11px] truncate max-w-[120px]">
                        {b.checksum || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <Badge
                          variant={
                            b.status === "COMPLETED" ? "success" : "destructive"
                          }
                          className="text-[10px] rounded-full px-2"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums whitespace-nowrap text-xs">
                        {new Date(b.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right font-sans">
                        <a
                          href={`/api/system-admin/backup/${b.id}/download`}
                          download={b.filename}
                          className="inline-flex items-center justify-center h-7 px-3 text-xs font-semibold rounded-full bg-[#533afd]/10 text-[#533afd] hover:bg-[#533afd] hover:text-white transition-colors"
                        >
                          <Download className="h-3 w-3 mr-1" /> ดาวน์โหลด
                        </a>
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
            totalItems={filteredBackups.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
