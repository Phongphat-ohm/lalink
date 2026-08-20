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
  Plus,
  Ban,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  blockIpAddressAction,
  unblockIpAddressAction,
  BlockedIpRecord,
} from "@/features/company/security-actions";

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

  // Block IP Modal
  const [isBlockModalOpen, setIsBlockModalOpen] = React.useState(false);
  const [ipToBlock, setIpToBlock] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("");
  const [isBlocking, setIsBlocking] = React.useState(false);
  const [blockError, setBlockError] = React.useState<string | null>(null);

  function openBlockModal(defaultIp = "") {
    setIpToBlock(defaultIp);
    setBlockReason("");
    setBlockError(null);
    setIsBlockModalOpen(true);
  }

  async function handleBlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsBlocking(true);
    setBlockError(null);

    const result = await blockIpAddressAction(ipToBlock, blockReason);
    setIsBlocking(false);

    if (result.success) {
      setIsBlockModalOpen(false);
      router.refresh();
    } else {
      setBlockError(result.message || "เกิดข้อผิดพลาดในการบล็อก IP");
    }
  }

  async function handleUnblock(ip: string) {
    const result = await unblockIpAddressAction(ip);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถปลดบล็อกได้");
    }
  }

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      (ev.email && ev.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.ipAddress && ev.ipAddress.includes(searchTerm)) ||
      ev.eventType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === "ALL" || ev.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            ศูนย์ความปลอดภัยระบบ (Security Center)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            มอนิเตอร์ภัยคุกคาม Failed Logins, Rate Limiting และจัดการ IP Blocklist ทั่วทั้งระบบ
          </p>
        </div>

        <Button
          onClick={() => openBlockModal()}
          className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white px-4 h-9 text-xs font-semibold shadow-sm"
        >
          <Ban className="h-4 w-4 mr-1.5" /> เพิ่ม IP ใน Blocklist
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">สถานะระบบป้องกัน</span>
            <ShieldCheck className="h-5 w-5 text-[#059669]" />
          </div>
          <div className="mt-2 flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-sm font-bold text-[#059669]">ACTIVE & PROTECTED</span>
          </div>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">Failed Logins</span>
            <Lock className="h-5 w-5 text-[#ea2261]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#0d253d] mt-1">{stats.failedLogins}</p>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">Rate Limit Entries</span>
            <Flame className="h-5 w-5 text-[#d97706]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#0d253d] mt-1">{stats.rateLimitBlocks}</p>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748d]">IP ที่ถูกบล็อก</span>
            <Ban className="h-5 w-5 text-[#ea2261]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#ea2261] mt-1">{blockedIps.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#e3e8ee] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("events")}
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
          onClick={() => setActiveTab("blocklist")}
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#64748d]">ระดับความรุนแรง:</span>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
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
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#64748d] font-sans">
                          ไม่พบบันทึกเหตุการณ์ความปลอดภัย
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((ev) => (
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
                                    : "secondary"
                              }
                              className="text-[10px] rounded-full px-2"
                            >
                              {ev.severity}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0d253d]">{ev.eventType}</td>
                          <td className="py-3.5 px-4 text-[#64748d] font-sans">
                            {ev.email || <span className="italic">Anonymous</span>}
                          </td>
                          <td className="py-3.5 px-4 text-[#533afd] font-semibold">
                            {ev.ipAddress || "127.0.0.1"}
                          </td>
                          <td className="py-3.5 px-4 text-[#64748d] max-w-xs truncate font-sans text-[11px]">
                            {ev.details ? JSON.stringify(ev.details) : "-"}
                          </td>
                          <td className="py-3.5 px-4 pr-5 text-right font-sans">
                            {ev.ipAddress && (
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
            </CardContent>
          </Card>
        </>
      ) : (
        /* Blocklist Tab */
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="p-0">
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
                  {blockedIps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-[#64748d] font-sans">
                        ยังไม่มี IP Address ในรายการบล็อก
                      </td>
                    </tr>
                  ) : (
                    blockedIps.map((b) => (
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
                            onClick={() => handleUnblock(b.ipAddress)}
                            className="h-7 text-xs rounded-full px-3 text-[#059669] border-[#a7f3d0] hover:bg-[#ecfdf5] font-semibold"
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
              <label className="text-xs font-semibold text-[#0d253d]">เหตุผลการบล็อก</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="เช่น Brute force password guessing"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBlockModalOpen(false)}
                disabled={isBlocking}
                className="rounded-full text-xs h-8 px-3"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isBlocking}
                className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs h-8 px-4 font-semibold"
              >
                {isBlocking ? "กำลังบันทึก..." : "ยืนยันบล็อก IP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
