"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Globe,
  Zap,
  Clock,
  Search,
  Power,
  PowerOff,
} from "lucide-react";
import {
  createWebhookSubscriptionAction,
  deleteWebhookSubscriptionAction,
  toggleWebhookSubscriptionAction,
} from "@/features/company/admin-api-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedWebhookSubscription {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  eventLogCount: number;
}

interface AdminWebhooksViewProps {
  subscriptions: SerializedWebhookSubscription[];
  isWebhookEnabled?: boolean;
}

const AVAILABLE_EVENTS = [
  "leave.created",
  "leave.approved",
  "leave.rejected",
  "leave.cancelled",
  "employee.created",
  "employee.updated",
  "employee.deleted",
  "employee.status_changed",
  "attendance.checkin",
  "attendance.checkout",
  "announcement.created",
];

export function AdminWebhooksView({
  subscriptions,
  isWebhookEnabled = false,
}: AdminWebhooksViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SerializedWebhookSubscription | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isWebhookEnabled) {
      toast.error("องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน Webhook กรุณาติดต่อ System Administrator");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("กรุณาเลือกอย่างน้อย 1 event");
      return;
    }
    setIsLoading(true);

    const result = await createWebhookSubscriptionAction(url, selectedEvents);
    setIsLoading(false);

    if (result.success && result.data) {
      setCreatedSecret((result.data as any).secret);
      setUrl("");
      setSelectedEvents([]);
      toast.success("สร้าง Webhook สำเร็จ กรุณาคัดลอก Secret เก็บไว้");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการสร้าง Webhook");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteWebhookSubscriptionAction(deleteTarget.id);
    setIsDeleting(false);

    if (result.success) {
      setDeleteTarget(null);
      toast.success(result.message || "ลบ Webhook เรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถลบ Webhook ได้");
    }
  }

  async function handleToggle(sub: SerializedWebhookSubscription) {
    const result = await toggleWebhookSubscriptionAction(sub.id, !sub.isActive);
    if (result.success) {
      toast.success(result.message || "อัปเดตสถานะเรียบร้อย");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  }

  function handleCopySecret() {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  }

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      s.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.events.some((e) => e.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && s.isActive) ||
      (statusFilter === "INACTIVE" && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubs.length / pageSize) || 1;
  const paginatedSubs = filteredSubs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            การจัดการ Webhooks
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            สร้างและจัดการ Webhook Subscriptions สำหรับรับการแจ้งเตือนเหตุการณ์ของบริษัทคุณ
          </p>
        </div>

        <Button
          onClick={() => {
            if (!isWebhookEnabled) {
              toast.error("องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน Webhook กรุณาติดต่อ System Administrator");
              return;
            }
            setCreatedSecret(null);
            setUrl("");
            setSelectedEvents([]);
            setIsCreateOpen(true);
          }}
          disabled={!isWebhookEnabled}
          className={`rounded-full px-4 h-9 text-xs font-semibold shadow-xs ${
            isWebhookEnabled
              ? "bg-[#533afd] hover:bg-[#4434d4] text-white cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          สร้าง Webhook ใหม่
        </Button>
      </div>

      {/* Disabled Permission Banner */}
      {!isWebhookEnabled && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 shadow-xs rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0d253d]">
                ฟังก์ชัน Webhooks ถูกปิดใช้งานสำหรับองค์กรของคุณ
              </h2>
              <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
                ปัจจุบันองค์กรของคุณยังไม่ได้รับอนุญาตให้ใช้งานระบบ Webhook Subscription หากต้องการรับข้อมูล Event อัตโนมัติ กรุณาติดต่อผู้ดูแลระบบสูงสุด (System Administrator) เพื่อขอเปิดสิทธิ์การใช้งาน
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหา URL หรือ Event..."
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

      {/* Subscriptions List */}
      <div className="space-y-3">
        {paginatedSubs.length === 0 ? (
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-10 text-center">
              <Globe className="h-10 w-10 mx-auto text-[#64748d]/40 mb-3" />
              <p className="text-sm text-[#64748d]">ไม่พบ Webhook Subscription</p>
            </CardContent>
          </Card>
        ) : (
          paginatedSubs.map((s) => (
            <Card key={s.id} className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="h-4 w-4 text-[#533afd] shrink-0" />
                      <span className="font-mono text-xs text-[#0d253d] break-all">
                        {s.url}
                      </span>
                      <Badge
                        className={`text-[10px] rounded-full px-2 ${
                          s.isActive
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {s.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#64748d]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(s.createdAt).toLocaleDateString("th-TH")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {s.eventLogCount} การส่ง
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.events.map((ev) => (
                        <Badge
                          key={ev}
                          variant="outline"
                          className="text-[10px] rounded-full px-2 border-[#e3e8ee] text-[#64748d]"
                        >
                          <Zap className="h-2.5 w-2.5 mr-0.5" />
                          {ev}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(s)}
                      className={`rounded-full text-xs h-8 ${
                        s.isActive
                          ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      }`}
                    >
                      {s.isActive ? (
                        <>
                          <PowerOff className="h-3.5 w-3.5 mr-1" />
                          ปิด
                        </>
                      ) : (
                        <>
                          <Power className="h-3.5 w-3.5 mr-1" />
                          เปิด
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(s)}
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-full text-xs h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      ลบ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredSubs.length > pageSize && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredSubs.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0d253d]">
              สร้าง Webhook ใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ระบุ URL ปลายทางและเลือก Events ที่ต้องการรับการแจ้งเตือน
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    คัดลอก Signing Secret นี้ทันที - จะไม่แสดงอีก!
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 mb-2">
                  ใช้ Secret นี้เพื่อตรวจสอบ HMAC signature ของ Webhook payload ที่ส่งมา
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] bg-white border border-amber-200 rounded-lg p-2 font-mono break-all">
                    {createdSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySecret}
                    className="rounded-full h-8"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreatedSecret(null);
                  }}
                  className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white"
                >
                  เสร็จสิ้น
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div>
                <label className="text-xs font-medium text-[#0d253d]">
                  Webhook URL
                </label>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  required
                  className="mt-1.5 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#0d253d] block mb-2">
                  เลือก Events ที่ต้องการรับ
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors border cursor-pointer ${
                        selectedEvents.includes(ev)
                          ? "bg-[#533afd] text-white border-[#533afd]"
                          : "bg-[#f6f9fc] text-[#64748d] border-[#e3e8ee] hover:bg-[#e3e8ee]/80"
                      }`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
                {selectedEvents.length > 0 && (
                  <p className="text-[11px] text-[#533afd] mt-1.5">
                    เลือกแล้ว {selectedEvents.length} events
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !url.trim() || selectedEvents.length === 0}
                  className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  สร้าง Webhook
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#0d253d]">
              ยืนยันลบ Webhook
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              เมื่อลบแล้ว Webhook ไปยัง &quot;{deleteTarget?.url}&quot; จะหยุดรับการแจ้งเตือนทันที
              ข้อมูลประวัติการส่งจะถูกลบไปด้วย
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              ลบ Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
