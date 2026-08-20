"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  Zap,
  Check,
  X,
  History,
  Send,
  Mail,
} from "lucide-react";
import {
  assignCompanySubscriptionAction,
  updateSubscriptionStatusAction,
  extendTrialAction,
  approvePlanUpgradeRequestAction,
  rejectPlanUpgradeRequestAction,
} from "@/features/subscription";
import { SubscriptionStatus, PlanUpgradeRequestStatus } from "@prisma/client";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

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

export interface SerializedGlobalPlanUpgradeRequest {
  id: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  targetPlanId: string;
  targetPlanName: string;
  targetPlanCode: string;
  currentPlanName: string | null;
  requestedSeats: number | null;
  billingCycle: string;
  notes: string | null;
  status: PlanUpgradeRequestStatus;
  requestedByName: string;
  requestedByEmail: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

interface SubscriptionManagementViewProps {
  companies: SerializedCompanySubscription[];
  availablePlans: AvailablePlan[];
  upgradeRequests?: SerializedGlobalPlanUpgradeRequest[];
}

export function SubscriptionManagementView({
  companies,
  availablePlans,
  upgradeRequests = [],
}: SubscriptionManagementViewProps) {
  const router = useRouter();

  // Active Tab: "SUBSCRIPTIONS" | "REQUESTS"
  const [activeTab, setActiveTab] = React.useState<"SUBSCRIPTIONS" | "REQUESTS">("SUBSCRIPTIONS");

  // Subscriptions Table State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Upgrade Requests Table State
  const [reqSearchTerm, setReqSearchTerm] = React.useState("");
  const [reqStatusFilter, setReqStatusFilter] = React.useState<string>("ALL");
  const [reqCurrentPage, setReqCurrentPage] = React.useState(1);
  const [reqPageSize, setReqPageSize] = React.useState(10);

  // Assign / Change Plan Modal
  const [targetCompany, setTargetCompany] = React.useState<SerializedCompanySubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<SubscriptionStatus>(SubscriptionStatus.ACTIVE);
  const [durationMonths, setDurationMonths] = React.useState("12");
  const [isAssigning, setIsAssigning] = React.useState(false);

  // Trial Extension Modal
  const [trialTarget, setTrialTarget] = React.useState<SerializedCompanySubscription | null>(null);
  const [extraDays, setExtraDays] = React.useState("14");
  const [isExtending, setIsExtending] = React.useState(false);

  // Status Change Modal
  const [statusTarget, setStatusTarget] = React.useState<SerializedCompanySubscription | null>(null);
  const [newStatus, setNewStatus] = React.useState<SubscriptionStatus>(SubscriptionStatus.ACTIVE);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Approve Request Modal
  const [approveTarget, setApproveTarget] = React.useState<SerializedGlobalPlanUpgradeRequest | null>(null);
  const [approveDurationMonths, setApproveDurationMonths] = React.useState("12");
  const [approveAdminNotes, setApproveAdminNotes] = React.useState("");
  const [isApproving, setIsApproving] = React.useState(false);

  // Reject Request Modal
  const [rejectTarget, setRejectTarget] = React.useState<SerializedGlobalPlanUpgradeRequest | null>(null);
  const [rejectAdminNotes, setRejectAdminNotes] = React.useState("");
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Request Detail Modal
  const [detailTarget, setDetailTarget] = React.useState<SerializedGlobalPlanUpgradeRequest | null>(null);

  const pendingRequestsCount = upgradeRequests.filter((r) => r.status === "PENDING").length;

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
      toast.success(result.message || "กำหนดแพ็กเกจเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการกำหนดแพ็กเกจ");
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
      toast.success(result.message || "ขยายเวลาทดลองสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการขยายเวลาทดลอง");
    }
  }

  async function handleQuickStatusChange(subscriptionId: string, status: SubscriptionStatus) {
    const result = await updateSubscriptionStatusAction(subscriptionId, status);
    if (result.success) {
      toast.success(result.message || "เปลี่ยนสถานะสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  }

  async function handleApproveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!approveTarget) return;

    setIsApproving(true);
    const result = await approvePlanUpgradeRequestAction(
      approveTarget.id,
      parseInt(approveDurationMonths, 10),
      approveAdminNotes,
    );
    setIsApproving(false);

    if (result.success) {
      setApproveTarget(null);
      toast.success(result.message || "อนุมัติคำขอสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการอนุมัติคำขอ");
    }
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;

    if (!rejectAdminNotes.trim()) {
      toast.error("กรุณาระบุเหตุผลในการปฏิเสธคำขอ");
      return;
    }

    setIsRejecting(true);
    const result = await rejectPlanUpgradeRequestAction(rejectTarget.id, rejectAdminNotes);
    setIsRejecting(false);

    if (result.success) {
      setRejectTarget(null);
      toast.success(result.message || "ปฏิเสธคำขอเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการปฏิเสธคำขอ");
    }
  }

  // Filter Subscriptions
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subscription?.plan.name && c.subscription.plan.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "NONE" && !c.subscription) ||
      (c.subscription && c.subscription.status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter Upgrade Requests
  const filteredRequests = upgradeRequests.filter((r) => {
    const matchesSearch =
      r.companyName.toLowerCase().includes(reqSearchTerm.toLowerCase()) ||
      r.companyCode.toLowerCase().includes(reqSearchTerm.toLowerCase()) ||
      r.targetPlanName.toLowerCase().includes(reqSearchTerm.toLowerCase()) ||
      r.requestedByName.toLowerCase().includes(reqSearchTerm.toLowerCase());

    const matchesStatus = reqStatusFilter === "ALL" || r.status === reqStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalReqPages = Math.ceil(filteredRequests.length / reqPageSize) || 1;
  const paginatedRequests = filteredRequests.slice((reqCurrentPage - 1) * reqPageSize, reqCurrentPage * reqPageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            การจัดการ Subscription & คำขออัปเกรด (SaaS Management)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            กำหนดแพ็กเกจ, ควบคุมรอบบิล, จัดการสถานะ Trial และพิจารณาคำขออัปเกรดแพ็กเกจจากผู้เช่า
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-[#e3e8ee] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("SUBSCRIPTIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "SUBSCRIPTIONS"
              ? "bg-[#533afd] text-white shadow-xs"
              : "bg-white text-[#64748d] hover:bg-[#f6f9fc] border border-[#e3e8ee]"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          ภาพรวมแพ็กเกจองค์กร ({companies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "REQUESTS"
              ? "bg-[#533afd] text-white shadow-xs"
              : "bg-white text-[#64748d] hover:bg-[#f6f9fc] border border-[#e3e8ee]"
          }`}
        >
          <Zap className="h-4 w-4" />
          คำขอปรับระดับแพ็กเกจ ({upgradeRequests.length})
          {pendingRequestsCount > 0 && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {pendingRequestsCount} รอตรวจสอบ
            </Badge>
          )}
        </button>
      </div>

      {activeTab === "SUBSCRIPTIONS" ? (
        <>
          {/* Search & Filter Bar */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อบริษัท, รหัส หรือชื่อแพ็กเกจ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-9 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto max-w-full pb-1 sm:pb-0">
                {(["ALL", "ACTIVE", "TRIAL", "EXPIRED", "CANCELLED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? "bg-[#533afd] text-white font-semibold"
                        : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                    }`}
                  >
                    {st === "ALL"
                      ? "ทั้งหมด"
                      : st === "ACTIVE"
                        ? "ใช้งานอยู่"
                        : st === "TRIAL"
                          ? "ทดลองใช้"
                          : st === "EXPIRED"
                            ? "หมดอายุ"
                            : "ยกเลิกแล้ว"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Building2 className="h-4 w-4 text-[#533afd] mr-2" />
                รายการบริษัทและการสมัครสมาชิก ({filteredCompanies.length} องค์กร)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                    <tr>
                      <th className="py-3.5 px-4 pl-5 font-semibold">บริษัท / รหัส</th>
                      <th className="py-3.5 px-4 font-semibold">แพ็กเกจปัจจุบัน</th>
                      <th className="py-3.5 px-4 font-semibold">การใช้โควตา (คน)</th>
                      <th className="py-3.5 px-4 font-semibold">สถานะ Subscription</th>
                      <th className="py-3.5 px-4 font-semibold">วันหมดอายุ / Trial</th>
                      <th className="py-3.5 px-4 pr-5 text-right font-semibold">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e8ee]/70">
                    {paginatedCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#64748d]">
                          ไม่พบข้อมูลบริษัทตามเงื่อนไขที่ระบุ
                        </td>
                      </tr>
                    ) : (
                      paginatedCompanies.map((c) => {
                        const sub = c.subscription;
                        const plan = sub?.plan;
                        const maxEmp = plan?.maxEmployees || 0;
                        const isFull = maxEmp > 0 && c.employeesCount >= maxEmp;

                        return (
                          <tr key={c.companyId} className="hover:bg-[#f6f9fc]/70 transition-colors">
                            <td className="py-3.5 px-4 pl-5">
                              <p className="font-bold text-[#0d253d]">{c.companyName}</p>
                              <span className="font-mono text-[11px] text-[#533afd]">{c.companyCode}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              {plan ? (
                                <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 rounded-full font-bold text-[11px]">
                                  {plan.name} ({plan.code})
                                </Badge>
                              ) : (
                                <span className="text-[#94a3b8] italic">ยังไม่มีแพ็กเกจ</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <span className={`font-semibold ${isFull ? "text-[#ea2261]" : "text-[#0d253d]"}`}>
                                {c.employeesCount}
                              </span>
                              <span className="text-[#64748d]"> / {maxEmp > 0 ? maxEmp : "ไม่จำกัด"}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              {sub?.status === "ACTIVE" && (
                                <Badge variant="success" className="text-[10px] rounded-full">
                                  ใช้งานอยู่ (Active)
                                </Badge>
                              )}
                              {sub?.status === "TRIAL" && (
                                <Badge variant="warning" className="text-[10px] rounded-full">
                                  ทดลองใช้ (Trial)
                                </Badge>
                              )}
                              {sub?.status === "CANCELLED" && (
                                <Badge variant="secondary" className="text-[10px] rounded-full">
                                  ยกเลิกแล้ว (Cancelled)
                                </Badge>
                              )}
                              {sub?.status === "EXPIRED" && (
                                <Badge variant="destructive" className="text-[10px] rounded-full">
                                  หมดอายุ (Expired)
                                </Badge>
                              )}
                              {!sub && <span className="text-[#94a3b8] text-[11px]">ไม่มีข้อมูล</span>}
                            </td>
                            <td className="py-3.5 px-4 text-[#64748d] font-mono text-[11px]">
                              {sub?.trialEndsAt && sub.status === "TRIAL"
                                ? `Trial: ${new Date(sub.trialEndsAt).toLocaleDateString("th-TH")}`
                                : sub?.endDate
                                  ? new Date(sub.endDate).toLocaleDateString("th-TH")
                                  : "-"}
                            </td>
                            <td className="py-3.5 px-4 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openAssignModal(c)}
                                  className="h-7 text-xs rounded-full px-3 text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 font-semibold cursor-pointer"
                                >
                                  กำหนดแพ็กเกจ
                                </Button>
                                {sub?.status === "TRIAL" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setTrialTarget(c);
                                      setExtraDays("14");
                                    }}
                                    className="h-7 text-xs rounded-full px-3 text-amber-700 border-amber-300 hover:bg-amber-50 font-semibold cursor-pointer"
                                  >
                                    ขยาย Trial
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

              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredCompanies.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Search & Filter Bar for Upgrade Requests */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อบริษัท, รหัส, แพ็กเกจ หรือผู้ส่งคำขอ..."
                  value={reqSearchTerm}
                  onChange={(e) => {
                    setReqSearchTerm(e.target.value);
                    setReqCurrentPage(1);
                  }}
                  className="pl-9 h-9 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center space-x-1.5 self-start sm:self-auto overflow-x-auto max-w-full pb-1 sm:pb-0">
                {(["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setReqStatusFilter(st);
                      setReqCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      reqStatusFilter === st
                        ? "bg-[#533afd] text-white font-semibold"
                        : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                    }`}
                  >
                    {st === "ALL"
                      ? "ทั้งหมด"
                      : st === "PENDING"
                        ? `รอตรวจสอบ (${pendingRequestsCount})`
                        : st === "APPROVED"
                          ? "อนุมัติแล้ว"
                          : st === "REJECTED"
                            ? "ปฏิเสธ"
                            : "ยกเลิก"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
            <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Zap className="h-4 w-4 text-[#533afd] mr-2" />
                รายการคำขอปรับระดับแพ็กเกจทั้งหมด ({filteredRequests.length} รายการ)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                    <tr>
                      <th className="py-3.5 px-4 pl-5 font-semibold">บริษัท / รหัส</th>
                      <th className="py-3.5 px-4 font-semibold">แพ็กเกจที่ขอ</th>
                      <th className="py-3.5 px-4 font-semibold">รอบบิล / โควตาเพิ่ม</th>
                      <th className="py-3.5 px-4 font-semibold">ผู้ส่งคำขอ</th>
                      <th className="py-3.5 px-4 font-semibold">วันที่ส่ง</th>
                      <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                      <th className="py-3.5 px-4 pr-5 text-right font-semibold">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e8ee]/70">
                    {paginatedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#64748d]">
                          ไม่พบรายการคำขอปรับระดับแพ็กเกจ
                        </td>
                      </tr>
                    ) : (
                      paginatedRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-[#f6f9fc]/70 transition-colors">
                          <td className="py-3.5 px-4 pl-5">
                            <p className="font-bold text-[#0d253d]">{req.companyName}</p>
                            <span className="font-mono text-[11px] text-[#533afd]">{req.companyCode}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 rounded-full font-bold text-[11px]">
                              {req.targetPlanName} ({req.targetPlanCode})
                            </Badge>
                            {req.currentPlanName && (
                              <p className="text-[10px] text-[#64748d] mt-0.5">
                                ปัจจุบัน: {req.currentPlanName}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-[#0d253d]">
                              {req.billingCycle === "YEARLY" ? "รายปี (Yearly)" : "รายเดือน (Monthly)"}
                            </p>
                            <p className="text-[11px] text-[#64748d] font-mono">
                              {req.requestedSeats ? `+${req.requestedSeats} พนักงาน` : "ตามโควตาแพ็กเกจ"}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748d]">
                            <p className="font-medium text-[#0d253d]">{req.requestedByName}</p>
                            <span className="text-[11px] text-[#64748d]">{req.requestedByEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#64748d] font-mono tabular-nums">
                            {new Date(req.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="py-3.5 px-4">
                            {req.status === "PENDING" && (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px]">
                                <Clock className="h-3 w-3 mr-1" /> รอการตรวจสอบ
                              </Badge>
                            )}
                            {req.status === "APPROVED" && (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> อนุมัติแล้ว
                              </Badge>
                            )}
                            {req.status === "REJECTED" && (
                              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px]">
                                <X className="h-3 w-3 mr-1" /> ปฏิเสธ
                              </Badge>
                            )}
                            {req.status === "CANCELLED" && (
                              <Badge variant="secondary" className="rounded-full text-[10px]">
                                ยกเลิกแล้ว
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailTarget(req)}
                                className="h-7 text-xs rounded-full px-2.5 text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 font-semibold cursor-pointer"
                              >
                                ดูรายละเอียด
                              </Button>
                              {req.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setApproveTarget(req);
                                      setApproveDurationMonths(req.billingCycle === "YEARLY" ? "12" : "1");
                                      setApproveAdminNotes("");
                                    }}
                                    className="h-7 text-xs rounded-full px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold cursor-pointer"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" /> อนุมัติ
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setRejectTarget(req);
                                      setRejectAdminNotes("");
                                    }}
                                    className="h-7 text-xs rounded-full px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" /> ปฏิเสธ
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <DataTablePagination
                currentPage={reqCurrentPage}
                totalPages={totalReqPages}
                pageSize={reqPageSize}
                totalItems={filteredRequests.length}
                onPageChange={setReqCurrentPage}
                onPageSizeChange={setReqPageSize}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Assign / Change Plan Modal */}
      <Dialog open={!!targetCompany} onOpenChange={(open) => !open && setTargetCompany(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CreditCard className="h-5 w-5 text-[#533afd] mr-2" />
              กำหนดแพ็กเกจให้ {targetCompany?.companyName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              เลือกระดับแพ็กเกจ, สถานะ Subscription และกำหนดระยะเวลารอบบิล
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ระดับแพ็กเกจ <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — สูงสุด {p.maxEmployees} พนักงาน
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                สถานะการใช้งาน
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                <option value={SubscriptionStatus.ACTIVE}>ACTIVE (เปิดใช้งานปกติ)</option>
                <option value={SubscriptionStatus.TRIAL}>TRIAL (ทดลองใช้งาน 14 วัน)</option>
                <option value={SubscriptionStatus.EXPIRED}>EXPIRED (หมดอายุ)</option>
                <option value={SubscriptionStatus.CANCELLED}>CANCELLED (ยกเลิก)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ระยะเวลาสัญญา (เดือน)
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                <option value="1">1 เดือน (Monthly)</option>
                <option value="3">3 เดือน (Quarterly)</option>
                <option value="6">6 เดือน (Semi-annual)</option>
                <option value="12">12 เดือน (1 ปี)</option>
                <option value="24">24 เดือน (2 ปี)</option>
              </select>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTargetCompany(null)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isAssigning}
                className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs h-9 px-4 font-semibold"
              >
                {isAssigning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                บันทึกแพ็กเกจ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Trial Extension Modal */}
      <Dialog open={!!trialTarget} onOpenChange={(open) => !open && setTrialTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              ขยายเวลาทดลองใช้งาน (Extend Trial)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              เพิ่มจำนวนวันทดลองใช้งานให้บริษัท {trialTarget?.companyName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExtendTrial} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                จำนวนวันที่ต้องการขยาย
              </label>
              <select
                value={extraDays}
                onChange={(e) => setExtraDays(e.target.value)}
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                <option value="7">+7 วัน</option>
                <option value="14">+14 วัน (2 สัปดาห์)</option>
                <option value="30">+30 วัน (1 เดือน)</option>
                <option value="60">+60 วัน (2 เดือน)</option>
              </select>
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrialTarget(null)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isExtending}
                className="rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-4 font-semibold"
              >
                {isExtending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                ยืนยันการขยายเวลา
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Approve Plan Upgrade Modal */}
      <Dialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2" />
              อนุมัติคำขอปรับระดับแพ็กเกจ
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              อนุมัติและเปิดใช้งานแพ็กเกจ &ldquo;{approveTarget?.targetPlanName}&rdquo; ให้กับ {approveTarget?.companyName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApproveSubmit} className="space-y-4 my-2">
            <div className="p-3 bg-[#f6f9fc] rounded-xl border border-[#e3e8ee] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#64748d]">
                <span>บริษัท:</span>
                <span className="font-bold text-[#0d253d]">{approveTarget?.companyName} ({approveTarget?.companyCode})</span>
              </div>
              <div className="flex justify-between text-[#64748d]">
                <span>แพ็กเกจเป้าหมาย:</span>
                <span className="font-bold text-[#533afd]">{approveTarget?.targetPlanName}</span>
              </div>
              <div className="flex justify-between text-[#64748d]">
                <span>รอบบิลที่ขอ:</span>
                <span className="font-semibold text-[#0d253d]">
                  {approveTarget?.billingCycle === "YEARLY" ? "รายปี (Yearly)" : "รายเดือน (Monthly)"}
                </span>
              </div>
              {approveTarget?.requestedSeats && (
                <div className="flex justify-between text-[#64748d]">
                  <span>โควตาพนักงานเพิ่มเติม:</span>
                  <span className="font-mono font-bold text-[#0d253d]">+{approveTarget.requestedSeats} คน</span>
                </div>
              )}
              {approveTarget?.notes && (
                <div className="pt-1.5 border-t border-[#e3e8ee] text-[#64748d]">
                  <span>หมายเหตุจากผู้เช่า:</span>
                  <p className="text-[#0d253d] italic mt-0.5">{approveTarget.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ระยะเวลารอบบิลที่อนุมัติ (เดือน) <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={approveDurationMonths}
                onChange={(e) => setApproveDurationMonths(e.target.value)}
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                <option value="1">1 เดือน (Monthly)</option>
                <option value="3">3 เดือน (Quarterly)</option>
                <option value="6">6 เดือน (Semi-annual)</option>
                <option value="12">12 เดือน (1 ปี - ค่าเริ่มต้น)</option>
                <option value="24">24 เดือน (2 ปี)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ข้อความตอบกลับหรือคำแนะนำถึงผู้เช่า (Admin Notes)
              </label>
              <Textarea
                placeholder="เช่น อนุมัติแพ็กเกจเรียบร้อยแล้ว ใบแจ้งหนี้จะจัดส่งทางอีเมลภายใน 24 ชม."
                value={approveAdminNotes}
                onChange={(e) => setApproveAdminNotes(e.target.value)}
                className="rounded-xl text-xs min-h-[60px]"
              />
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApproveTarget(null)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isApproving}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 font-semibold"
              >
                {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                ยืนยันการอนุมัติ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Plan Upgrade Modal */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Ban className="h-5 w-5 text-[#ea2261] mr-2" />
              ปฏิเสธคำขอปรับระดับแพ็กเกจ
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ระบุเหตุผลในการปฏิเสธคำขอปรับระดับแพ็กเกจของ {rejectTarget?.companyName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                เหตุผลในการปฏิเสธคำขอ <span className="text-[#ea2261]">*</span>
              </label>
              <Textarea
                required
                placeholder="เช่น ข้อมูลการชำระเงินไม่ถูกต้อง หรือ ขอให้ติดต่อฝ่ายขายเพื่อรับข้อเสนอองค์กรพิเศษ..."
                value={rejectAdminNotes}
                onChange={(e) => setRejectAdminNotes(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>

            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isRejecting || !rejectAdminNotes.trim()}
                className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4 font-semibold"
              >
                {isRejecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                ยืนยันการปฏิเสธ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#533afd]" />
              รายละเอียดคำขอปรับระดับแพ็กเกจ
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ข้อมูลสรุปคำขอและสถานะการพิจารณาสำหรับองค์กร {detailTarget?.companyName}
            </DialogDescription>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4 my-2 text-xs">
              <div className="p-4 bg-[#f6f9fc] rounded-2xl border border-[#e3e8ee] space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-[#e3e8ee]">
                  <span className="text-[#64748d]">สถานะคำขอ:</span>
                  <div>
                    {detailTarget.status === "PENDING" && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px]">
                        <Clock className="h-3 w-3 mr-1" /> รอการตรวจสอบ
                      </Badge>
                    )}
                    {detailTarget.status === "APPROVED" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> อนุมัติแล้ว
                      </Badge>
                    )}
                    {detailTarget.status === "REJECTED" && (
                      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px]">
                        <X className="h-3 w-3 mr-1" /> ปฏิเสธ
                      </Badge>
                    )}
                    {detailTarget.status === "CANCELLED" && (
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        ยกเลิกแล้ว
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">องค์กร:</span>
                  <span className="font-bold text-[#0d253d]">{detailTarget.companyName} ({detailTarget.companyCode})</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">แพ็กเกจเป้าหมาย:</span>
                  <span className="font-bold text-[#533afd]">{detailTarget.targetPlanName} ({detailTarget.targetPlanCode})</span>
                </div>

                {detailTarget.currentPlanName && (
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">แพ็กเกจปัจจุบัน:</span>
                    <span className="font-medium text-[#0d253d]">{detailTarget.currentPlanName}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#64748d]">รอบบิลที่ขอ:</span>
                  <span className="font-semibold text-[#0d253d]">
                    {detailTarget.billingCycle === "YEARLY" ? "รายปี (Yearly)" : "รายเดือน (Monthly)"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">โควตาพนักงานเพิ่มเติม:</span>
                  <span className="font-mono font-bold text-[#0d253d]">
                    {detailTarget.requestedSeats ? `+${detailTarget.requestedSeats} คน` : "ตามโควตาปกติของแพ็กเกจ"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">ผู้ส่งคำขอ:</span>
                  <span className="text-[#0d253d] font-medium">{detailTarget.requestedByName} ({detailTarget.requestedByEmail})</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">วันที่ส่งคำขอ:</span>
                  <span className="text-[#0d253d] font-mono">{new Date(detailTarget.createdAt).toLocaleString("th-TH")}</span>
                </div>

                {detailTarget.notes && (
                  <div className="pt-2 border-t border-[#e3e8ee]">
                    <span className="text-[#64748d] block mb-1">หมายเหตุจากผู้เช่า:</span>
                    <p className="p-2 bg-white rounded-xl border border-[#e3e8ee] text-[#0d253d] italic">
                      {detailTarget.notes}
                    </p>
                  </div>
                )}

                {detailTarget.adminNotes && (
                  <div className="pt-2 border-t border-[#e3e8ee]">
                    <span className="text-[#64748d] block mb-1">ข้อความตอบกลับจากผู้ดูแลระบบ:</span>
                    <p className="p-2 bg-white rounded-xl border border-[#e3e8ee] text-[#0d253d] font-medium">
                      {detailTarget.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDetailTarget(null);
                    router.push("/system-admin/messages");
                  }}
                  className="rounded-full text-xs text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 h-9 px-4"
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  เปิดศูนย์ข้อความ & ซัพพอร์ต
                </Button>

                <div className="flex items-center gap-2">
                  {detailTarget.status === "PENDING" && (
                    <Button
                      type="button"
                      onClick={() => {
                        const target = detailTarget;
                        setDetailTarget(null);
                        setApproveTarget(target);
                        setApproveDurationMonths(target.billingCycle === "YEARLY" ? "12" : "1");
                        setApproveAdminNotes("");
                      }}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3.5 font-semibold"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      ดำเนินการอนุมัติ
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => setDetailTarget(null)}
                    className="rounded-full bg-[#0d253d] text-white text-xs h-9 px-4"
                  >
                    ปิดหน้าต่าง
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
