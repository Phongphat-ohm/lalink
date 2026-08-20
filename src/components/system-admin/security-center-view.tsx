"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ShieldAlert,
  ShieldCheck,
  Search,
  Lock,
  Flame,
  Activity,
  Ban,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import {
  blockIpAddressAction,
  unblockIpAddressAction,
  BlockedIpRecord,
} from "@/features/company/security-actions";
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

export interface SerializedSecurityEvent {
  id: string;
  eventType: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  email: string | null;
  companyName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  createdAt: string;
}

interface SecurityCenterViewProps {
  events: SerializedSecurityEvent[];
  blockedIps: BlockedIpRecord[];
  stats: {
    totalEvents: number;
    failedLogins: number;
    rateLimitBlocks: number;
    activeFirewallStatus: string;
  };
}

export function SecurityCenterView({ events, blockedIps, stats }: SecurityCenterViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"events" | "blocklist">("events");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");

  // Pagination for events and blocklist
  const [eventsPage, setEventsPage] = React.useState(1);
  const [eventsPageSize, setEventsPageSize] = React.useState(10);
  const [blocklistPage, setBlocklistPage] = React.useState(1);
  const [blocklistPageSize, setBlocklistPageSize] = React.useState(10);

  // Block IP Modal
  const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
  const [ipToBlock, setIpToBlock] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("");
  const [isBlocking, setIsBlocking] = React.useState(false);
  const [blockError, setBlockError] = React.useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = React.useState<string | null>(null);
  const [isUnblocking, setIsUnblocking] = React.useState(false);

  function openBlockModal(defaultIp = "") {
    setIpToBlock(defaultIp);
    setBlockReason("");
    setBlockError(null);
    setIsBlockModalOpen(true);
  }

  async function handleBlockSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ipToBlock.trim()) return;

    setIsBlocking(true);
    setBlockError(null);

    const result = await blockIpAddressAction(ipToBlock, blockReason);
    setIsBlocking(false);

    if (result.success) {
      setIsBlockModalOpen(false);
      toast.success(result.message || "เพิ่ม IP ในรายการบล็อกเรียบร้อยแล้ว");
      router.refresh();
    } else {
      setBlockError(result.message || "ไม่สามารถบล็อก IP ได้");
    }
  }

  async function handleUnblockConfirm() {
    if (!unblockTarget) return;
    setIsUnblocking(true);
    const result = await unblockIpAddressAction(unblockTarget);
    setIsUnblocking(false);

    if (result.success) {
      setUnblockTarget(null);
      toast.success(result.message || "ปลดบล็อก IP Address เรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถปลดบล็อก IP ได้");
    }
  }

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      (ev.email && ev.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.ipAddress && ev.ipAddress.includes(searchTerm)) ||
      ev.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.companyName && ev.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = severityFilter === "ALL" || ev.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  const totalEventsPages = Math.ceil(filteredEvents.length / eventsPageSize) || 1;
  const paginatedEvents = filteredEvents.slice(
    (eventsPage - 1) * eventsPageSize,
    eventsPage * eventsPageSize,
  );

  const filteredBlockedIps = blockedIps.filter((b) => {
    return (
      b.ipAddress.includes(searchTerm) ||
      b.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalBlocklistPages = Math.ceil(filteredBlockedIps.length / blocklistPageSize) || 1;
  const paginatedBlockedIps = filteredBlockedIps.slice(
    (blocklistPage - 1) * blocklistPageSize,
    blocklistPage * blocklistPageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            ศูนย์ความปลอดภัยและป้องกันภัยคุกคาม (Security Center)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            มอนิเตอร์การล็อกอินล้มเหลว ตรวจจับ Brute-force และจัดการ IP Blocklist
          </p>
        </div>

        <Button
          onClick={() => openBlockModal()}
          className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Ban className="h-4 w-4 mr-1.5" /> บล็อก IP Address
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#533afd]/10 text-[#533afd]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748d]">เหตุการณ์ทั้งหมด (24 ชม.)</p>
            <p className="text-xl font-bold font-mono text-[#0d253d]">{stats.totalEvents}</p>
          </div>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe4e6] text-[#ea2261]">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748d]">ล็อกอินล้มเหลว (Failed)</p>
            <p className="text-xl font-bold font-mono text-[#ea2261]">{stats.failedLogins}</p>
          </div>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748d]">บล็อกโดย Rate Limiter</p>
            <p className="text-xl font-bold font-mono text-[#d97706]">{stats.rateLimitBlocks}</p>
          </div>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#64748d]">สถานะระบบป้องกัน (Firewall)</p>
            <p className="text-sm font-bold text-[#059669] flex items-center mt-0.5">
              <span className="h-2 w-2 rounded-full bg-[#059669] inline-block mr-1.5 animate-pulse" />
              {stats.activeFirewallStatus}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#e3e8ee] pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("events");
            setSearchTerm("");
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "events"
              ? "bg-[#533afd] text-white"
              : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]"
          }`}
        >
          เหตุการณ์ความปลอดภัย (Security Events) ({events.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("blocklist");
            setSearchTerm("");
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "blocklist"
              ? "bg-[#ea2261] text-white"
              : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]"
          }`}
        >
          บัญชีดำ IP (IP Blocklist) ({blockedIps.length})
        </button>
      </div>

      {activeTab === "events" ? (
        <>
          {/* Filter Bar */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหา IP, อีเมล, Event Type..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setEventsPage(1);
                  }}
                  className="pl-9 h-9 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#64748d]">ระดับความรุนแรง:</span>
                <Select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setEventsPage(1);
                  }}
                  className="h-9 rounded-xl text-xs w-36"
                >
                  <option value="ALL">ทุกระดับ (ทั้งหมด)</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Events Table */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                    <tr>
                      <th className="py-3.5 px-4 pl-5 font-semibold">วัน-เวลา</th>
                      <th className="py-3.5 px-4 font-semibold">ระดับ</th>
                      <th className="py-3.5 px-4 font-semibold">Event Type</th>
                      <th className="py-3.5 px-4 font-semibold">ผู้ใช้งาน / อีเมล</th>
                      <th className="py-3.5 px-4 font-semibold">IP Address</th>
                      <th className="py-3.5 px-4 font-semibold">รายละเอียด</th>
                      <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                    {paginatedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#64748d] font-sans">
                          ไม่พบบันทึกเหตุการณ์ความปลอดภัยตามเงื่อนไขที่ระบุ
                        </td>
                      </tr>
                    ) : (
                      paginatedEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                          <td className="py-3.5 px-4 pl-5 text-[#64748d] whitespace-nowrap tabular-nums">
                            {new Date(ev.createdAt).toLocaleString("th-TH")}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={
                                ev.severity === "CRITICAL" || ev.severity === "ERROR"
                                  ? "destructive"
                                  : ev.severity === "WARNING"
                                    ? "warning"
                                    : "outline"
                              }
                              className="text-[10px] rounded-full px-2"
                            >
                              {ev.severity}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0d253d]">{ev.eventType}</td>
                          <td className="py-3.5 px-4 font-sans text-[#64748d]">
                            {ev.email || "-"}
                            {ev.companyName && (
                              <span className="block text-[11px] text-[#533afd]">{ev.companyName}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#0d253d]">{ev.ipAddress || "-"}</td>
                          <td className="py-3.5 px-4 font-sans text-[#64748d] max-w-xs truncate">
                            {typeof ev.details === "object" ? JSON.stringify(ev.details) : String(ev.details || "-")}
                          </td>
                          <td className="py-3.5 px-4 pr-5 text-right font-sans">
                            {ev.ipAddress && !blockedIps.some((b) => b.ipAddress === ev.ipAddress) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openBlockModal(ev.ipAddress || "")}
                                className="h-6 text-[10px] rounded-full px-2 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6]"
                              >
                                บล็อก IP
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <DataTablePagination
                currentPage={eventsPage}
                totalPages={totalEventsPages}
                pageSize={eventsPageSize}
                totalItems={filteredEvents.length}
                onPageChange={setEventsPage}
                onPageSizeChange={setEventsPageSize}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        /* Blocklist Tab */
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 border-b border-[#e3e8ee]">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหา IP Address หรือเหตุผลที่บล็อก..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setBlocklistPage(1);
                  }}
                  className="pl-9 h-9 rounded-xl text-xs w-full"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3.5 px-4 pl-5 font-semibold">IP Address</th>
                    <th className="py-3.5 px-4 font-semibold">เหตุผลการบล็อก</th>
                    <th className="py-3.5 px-4 font-semibold">วันที่บล็อก</th>
                    <th className="py-3.5 px-4 pr-5 text-right font-semibold">ปลดบล็อก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                  {paginatedBlockedIps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#64748d] font-sans">
                        ยังไม่มี IP Address ในรายการบล็อก
                      </td>
                    </tr>
                  ) : (
                    paginatedBlockedIps.map((b) => (
                      <tr key={b.ipAddress} className="hover:bg-[#f6f9fc]/70 transition-colors">
                        <td className="py-3.5 px-4 pl-5 font-bold text-[#ea2261]">{b.ipAddress}</td>
                        <td className="py-3.5 px-4 font-sans text-[#0d253d]">{b.reason}</td>
                        <td className="py-3.5 px-4 text-[#64748d]">
                          {new Date(b.blockedAt).toLocaleString("th-TH")}
                        </td>
                        <td className="py-3.5 px-4 pr-5 text-right font-sans">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUnblockTarget(b.ipAddress)}
                            className="h-7 text-xs rounded-full px-3 text-[#059669] border-[#a7f3d0] hover:bg-[#ecfdf5] font-semibold cursor-pointer"
                          >
                            ปลดบล็อก
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <DataTablePagination
              currentPage={blocklistPage}
              totalPages={totalBlocklistPages}
              pageSize={blocklistPageSize}
              totalItems={filteredBlockedIps.length}
              onPageChange={setBlocklistPage}
              onPageSizeChange={setBlocklistPageSize}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal: Block IP */}
      <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
        <DialogContent onClose={() => setIsBlockModalOpen(false)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Ban className="h-5 w-5 text-[#ea2261] mr-2" />
              เพิ่ม IP Address ในระบบ Blocklist
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ระบบจะปฏิเสธทุก Request จาก IP นี้โดยอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          {blockError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {blockError}
            </div>
          )}

          <form onSubmit={handleBlockSubmit} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                IP Address <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={ipToBlock}
                onChange={(e) => setIpToBlock(e.target.value)}
                placeholder="เช่น 192.168.1.100 หรือ 203.0.113.1"
                required
                className="h-9 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เหตุผลในการบล็อก
              </label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="เช่น Brute force attack, Scanner bot"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBlockModalOpen(false)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isBlocking || !ipToBlock.trim()}
                className="h-9 rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs font-semibold px-4"
              >
                {isBlocking ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                ยืนยันการบล็อก IP
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog
        open={!!unblockTarget}
        onOpenChange={(open) => !open && setUnblockTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mr-2" />
              ยืนยันการปลดบล็อก IP Address?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการปลดบล็อก IP Address &ldquo;<span className="font-mono font-bold text-[#0d253d]">{unblockTarget}</span>&rdquo; ใช่หรือไม่? 
              อุปกรณ์ที่ใช้ IP นี้จะสามารถเข้าใช้งานระบบได้ตามปกติ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isUnblocking}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockConfirm}
              disabled={isUnblocking}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4"
            >
              {isUnblocking && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันปลดบล็อก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
