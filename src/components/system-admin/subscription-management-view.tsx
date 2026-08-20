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
  Building2,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Calendar,
  Sparkles,
  Loader2,
  Users,
  Pencil,
} from "lucide-react";
import {
  assignCompanySubscriptionAction,
  updateSubscriptionStatusAction,
  extendTrialAction,
} from "@/features/subscription";
import { SubscriptionStatus } from "@prisma/client";

export interface SerializedCompanySubscription {
  companyId: string;
  companyName: string;
  companyCode: string;
  employeesCount: number;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string | null;
    trialEndsAt: string | null;
    plan: {
      id: string;
      code: string;
      name: string;
      maxEmployees: number;
      maxAdmins: number;
    };
  } | null;
}

export interface AvailablePlan {
  id: string;
  code: string;
  name: string;
  maxEmployees: number;
}

interface SubscriptionManagementViewProps {
  companies: SerializedCompanySubscription[];
  availablePlans: AvailablePlan[];
}

export function SubscriptionManagementView({
  companies,
  availablePlans,
}: SubscriptionManagementViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");

  // Assign / Change Plan Modal
  const [targetCompany, setTargetCompany] = React.useState<SerializedCompanySubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("");
  const [selectedStatus, setSelectedStatus] = React.useState<SubscriptionStatus>(SubscriptionStatus.ACTIVE);
  const [durationMonths, setDurationMonths] = React.useState<string>("12");
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Extend Trial Modal
  const [trialTarget, setTrialTarget] = React.useState<SerializedCompanySubscription | null>(null);
  const [extraDays, setExtraDays] = React.useState("14");
  const [isExtending, setIsExtending] = React.useState(false);

  function openAssignModal(comp: SerializedCompanySubscription) {
    setTargetCompany(comp);
    setSelectedPlanId(comp.subscription?.plan.id || availablePlans[0]?.id || "");
    setSelectedStatus(comp.subscription?.status || SubscriptionStatus.ACTIVE);
    setDurationMonths("12");
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetCompany || !selectedPlanId) return;

    setIsAssigning(true);
    const result = await assignCompanySubscriptionAction(
      targetCompany.companyId,
      selectedPlanId,
      selectedStatus,
      parseInt(durationMonths, 10),
    );
    setIsAssigning(false);

    if (result.success) {
      setTargetCompany(null);
      router.refresh();
    } else {
      alert(result.message || "เกิดข้อผิดพลาดในการกำหนดแพ็กเกจ");
    }
  }

  async function handleExtendTrial(e: React.FormEvent) {
    e.preventDefault();
    if (!trialTarget || !trialTarget.subscription) return;

    setIsExtending(true);
    const result = await extendTrialAction(trialTarget.subscription.id, parseInt(extraDays, 10));
    setIsExtending(false);

    if (result.success) {
      setTrialTarget(null);
      router.refresh();
    } else {
      alert(result.message || "เกิดข้อผิดพลาดในการขยายเวลาทดลอง");
    }
  }

  async function handleQuickStatusChange(subscriptionId: string, status: SubscriptionStatus) {
    const result = await updateSubscriptionStatusAction(subscriptionId, status);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  }

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subscription?.plan.name && c.subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "NONE" && !c.subscription) ||
      c.subscription?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          จัดการการสมัครสมาชิกองค์กร (Tenant Subscriptions)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ผูกและปรับเปลี่ยนระดับแพ็กเกจ SaaS, ตรวจสอบโควตาพนักงาน และขยายเวลาทดลองใช้งาน (Trial)
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, รหัส, แพ็กเกจ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#64748d] whitespace-nowrap">สถานะ:</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl text-xs w-44"
            >
              <option value="ALL">ทั้งหมด</option>
              <option value="ACTIVE">ACTIVE (ใช้งานได้)</option>
              <option value="TRIAL">TRIAL (ทดลองใช้)</option>
              <option value="EXPIRED">EXPIRED (หมดอายุ)</option>
              <option value="CANCELLED">CANCELLED (ยกเลิก)</option>
              <option value="NONE">ยังไม่ได้ผูก Plan</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">องค์กร (Tenant)</th>
                  <th className="py-3.5 px-4 font-semibold">แพ็กเกจปัจจุบัน</th>
                  <th className="py-3.5 px-4 font-semibold">การใช้โควตาพนักงาน</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะรอบบิล</th>
                  <th className="py-3.5 px-4 font-semibold">หมดอายุ / สิ้นสุด</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#64748d]">
                      ไม่พบข้อมูลองค์กรตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((c) => {
                    const sub = c.subscription;
                    const maxEmp = sub ? sub.plan.maxEmployees : 20;
                    const isExceeded = c.employeesCount > maxEmp;

                    return (
                      <tr key={c.companyId} className="hover:bg-[#f6f9fc]/70 transition-colors">
                        <td className="py-3.5 px-4 pl-5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-[#0d253d]">{c.companyName}</span>
                            <span className="font-mono text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full">
                              {c.companyCode}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {sub ? (
                            <span className="font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full text-[11px]">
                              {sub.plan.name} ({sub.plan.code})
                            </span>
                          ) : (
                            <span className="text-[#ea2261] font-semibold bg-[#ffe4e6] px-2 py-0.5 rounded-full text-[10px]">
                              ยังไม่มี Plan
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-mono font-bold ${
                                isExceeded ? "text-[#ea2261]" : "text-[#0d253d]"
                              }`}
                            >
                              {c.employeesCount} / {maxEmp} คน
                            </span>
                            {isExceeded && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                                เกินโควตา
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {sub ? (
                            <Badge
                              variant={
                                sub.status === "ACTIVE"
                                  ? "success"
                                  : sub.status === "TRIAL"
                                    ? "warning"
                                    : "destructive"
                              }
                              className="text-[10px] rounded-full px-2"
                            >
                              {sub.status}
                            </Badge>
                          ) : (
                            <span className="text-[#64748d]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                          {sub?.trialEndsAt ? (
                            <span>
                              Trial ถึง: {new Date(sub.trialEndsAt).toLocaleDateString("th-TH")}
                            </span>
                          ) : sub?.endDate ? (
                            <span>ถึง: {new Date(sub.endDate).toLocaleDateString("th-TH")}</span>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-3.5 px-4 pr-5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignModal(c)}
                              className="h-7 text-xs rounded-full px-2.5 text-[#533afd] border-[#e3e8ee] hover:bg-[#533afd]/10 font-semibold"
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              {sub ? "เปลี่ยน Plan" : "กำหนด Plan"}
                            </Button>

                            {sub?.status === "TRIAL" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTrialTarget(c);
                                  setExtraDays("14");
                                }}
                                className="h-7 text-xs rounded-full px-2 text-[#d97706] border-[#fde68a] hover:bg-[#fef3c7] font-semibold"
                              >
                                <Clock className="h-3 w-3 mr-1" /> ขยายเวลา
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Modal: Assign / Change Plan */}
      <Dialog open={!!targetCompany} onOpenChange={(open) => !open && setTargetCompany(null)}>
        <DialogContent onClose={() => setTargetCompany(null)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CreditCard className="h-5 w-5 text-[#533afd] mr-2" />
              กำหนดแพ็กเกจ SaaS ให้องค์กร
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              บริษัท: <strong className="text-[#0d253d]">{targetCompany?.companyName}</strong> (
              {targetCompany?.companyCode})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-3.5 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">เลือกแพ็กเกจ (Plan)</label>
              <Select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="h-9 rounded-xl text-xs w-full"
              >
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — สูงสุด {p.maxEmployees} พนักงาน
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">สถานะการสมัคร</label>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
                  className="h-9 rounded-xl text-xs w-full"
                >
                  <option value="ACTIVE">ACTIVE (ชำระแล้ว)</option>
                  <option value="TRIAL">TRIAL (ทดลองใช้งาน 14 วัน)</option>
                  <option value="EXPIRED">EXPIRED (หมดอายุ)</option>
                  <option value="CANCELLED">CANCELLED (ยกเลิก)</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">ระยะเวลาใช้งาน (เดือน)</label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="h-9 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTargetCompany(null)}
                disabled={isAssigning}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isAssigning}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isAssigning ? "กำลังบันทึก..." : "บันทึกการกำหนด Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Extend Trial */}
      <Dialog open={!!trialTarget} onOpenChange={(open) => !open && setTrialTarget(null)}>
        <DialogContent onClose={() => setTrialTarget(null)} className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Clock className="h-5 w-5 text-[#d97706] mr-2" />
              ขยายเวลาทดลองใช้งาน (Extend Trial)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              เพิ่มจำนวนวันทดลองใช้ฟรีให้กับ <strong>{trialTarget?.companyName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExtendTrial} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">จำนวนวันที่ต้องการเพิ่ม (วัน)</label>
              <Input
                type="number"
                min={1}
                max={90}
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
                required
                className="h-9 rounded-xl font-mono text-xs"
              />
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrialTarget(null)}
                disabled={isExtending}
                className="rounded-full text-xs h-8 px-3"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isExtending}
                className="rounded-full bg-[#d97706] hover:bg-[#b45309] text-white text-xs h-8 px-4 font-semibold"
              >
                {isExtending ? "กำลังขยายเวลา..." : "ยืนยันขยายเวลา"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
