"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  CreditCard,
  Users,
  Building,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  HelpCircle,
  FileText,
  Loader2,
  Headphones,
  Check,
  X,
  Send,
  History,
  Ban,
  Mail,
} from "lucide-react";
import {
  requestPlanUpgradeAction,
  cancelPlanUpgradeRequestAction,
} from "@/features/subscription/subscription-actions";
import { toast } from "@/components/ui/toast";
import { PlanUpgradeRequestStatus } from "@prisma/client";

export interface SerializedUpgradeRequest {
  id: string;
  targetPlanId: string;
  targetPlanName: string;
  targetPlanCode: string;
  currentPlanName: string | null;
  requestedSeats: number | null;
  billingCycle: string;
  notes: string | null;
  status: PlanUpgradeRequestStatus;
  requestedByName: string;
  reviewedByName: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

export interface SerializedSubscriptionData {
  company: {
    id: string;
    name: string;
    code: string;
    status: string;
    createdAt: string;
  };
  subscription: {
    id: string;
    status: "ACTIVE" | "TRIAL" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
    startDate: string;
    endDate: string | null;
    trialEndsAt: string | null;
    plan: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      maxEmployees: number;
      maxAdmins: number;
      priceMonthly: number;
      priceYearly: number;
      features: Record<string, any> | null;
    };
  } | null;
  usage: {
    employeesCount: number;
    adminsCount: number;
    branchesCount: number;
    departmentsCount: number;
    leaveRequestsCount: number;
    attachmentsCount: number;
  };
  availablePlans: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    maxEmployees: number;
    maxAdmins: number;
    priceMonthly: number;
    priceYearly: number;
    features: Record<string, any> | null;
  }>;
  upgradeRequests?: SerializedUpgradeRequest[];
}

interface CompanySubscriptionViewProps {
  data: SerializedSubscriptionData;
}

export function CompanySubscriptionView({ data }: CompanySubscriptionViewProps) {
  const router = useRouter();
  const { company, subscription, usage, availablePlans, upgradeRequests = [] } = data;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState(false);
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("");
  const [billingCycle, setBillingCycle] = React.useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [requestedSeats, setRequestedSeats] = React.useState<string>("");
  const [upgradeNotes, setUpgradeNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Cancellation state
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);

  // Request Detail Modal state
  const [detailTarget, setDetailTarget] = React.useState<SerializedUpgradeRequest | null>(null);

  const activePlan = subscription?.plan;
  const isTrial = subscription?.status === "TRIAL";
  const isExpired = subscription?.status === "EXPIRED" || subscription?.status === "CANCELLED";

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (isTrial && subscription?.trialEndsAt) {
    const end = new Date(subscription.trialEndsAt).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  } else if (subscription?.endDate) {
    const end = new Date(subscription.endDate).getTime();
    const now = new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  // Quota percentages
  const maxEmployees = activePlan?.maxEmployees || 20;
  const employeeUsagePercent = Math.min(100, Math.round((usage.employeesCount / maxEmployees) * 100));

  const maxAdmins = activePlan?.maxAdmins || 2;
  const adminUsagePercent = Math.min(100, Math.round((usage.adminsCount / maxAdmins) * 100));

  function openUpgradeModal(planId?: string) {
    if (planId) {
      setSelectedPlanId(planId);
    } else {
      const nextPlan = availablePlans.find((p) => p.id !== activePlan?.id) || availablePlans[0];
      setSelectedPlanId(nextPlan?.id || "");
    }
    setBillingCycle("MONTHLY");
    setRequestedSeats("");
    setUpgradeNotes("");
    setIsUpgradeModalOpen(true);
  }

  async function handleUpgradeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlanId) return;

    setIsSubmitting(true);
    const seats = requestedSeats ? parseInt(requestedSeats, 10) : undefined;
    const res = await requestPlanUpgradeAction(selectedPlanId, seats, billingCycle, upgradeNotes);
    setIsSubmitting(false);

    if (res.success) {
      setIsUpgradeModalOpen(false);
      toast.success(res.message || "ส่งคำขอปรับระดับแพ็กเกจเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาดในการส่งคำขอ");
    }
  }

  async function handleCancelRequestConfirm() {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    const res = await cancelPlanUpgradeRequestAction(cancelTargetId);
    setIsCancelling(false);

    if (res.success) {
      setCancelTargetId(null);
      toast.success(res.message || "ยกเลิกคำขอเรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(res.message || "ไม่สามารถยกเลิกคำขอได้");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e3e8ee] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
              แพ็กเกจและการใช้งาน (Subscription & Quotas)
            </h1>
            <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 text-[11px] font-semibold rounded-full">
              {company.name} ({company.code})
            </Badge>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            ตรวจสอบข้อมูลแพ็กเกจปัจจุบัน, ขีดจำกัดการใช้งานโควตาพนักงาน, สิทธิ์โมดูล และส่งคำขออัปเกรด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => openUpgradeModal()}
            className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 px-4 shadow-xs"
          >
            <Zap className="h-4 w-4 mr-1.5" />
            ขออัปเกรด / เพิ่มโควตา
          </Button>
        </div>
      </div>

      {/* Trial / Expiry Banner Warning */}
      {isTrial && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                คุณกำลังใช้งานอยู่ในช่วงทดลองใช้งานฟรี (Trial Mode)
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {daysRemaining !== null
                  ? `ระยะเวลาทดลองจะสิ้นสุดในอีก ${daysRemaining} วัน (วันที่ ${new Date(subscription!.trialEndsAt!).toLocaleDateString("th-TH")})`
                  : "กรุณาเลือกแพ็กเกจเพื่อใช้งานอย่างต่อเนื่อง"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => openUpgradeModal()}
            className="rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 font-semibold"
          >
            เลือกแพ็กเกจหลัก
          </Button>
        </div>
      )}

      {isExpired && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900">
                แพ็กเกจของคุณหมดอายุหรือถูกระงับการใช้งาน
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                โปรดติดต่อผู้ดูแลระบบหรือส่งคำขอต่ออายุเพื่อปลดล็อกฟังก์ชันการใช้งานเต็มรูปแบบ
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => openUpgradeModal()}
            className="rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-3 font-semibold"
          >
            ต่ออายุแพ็กเกจ
          </Button>
        </div>
      )}

      {/* Main Grid: Active Plan Card & Quota Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Plan Overview */}
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/60">
              <div className="flex items-center justify-between">
                <Badge className="bg-[#533afd] text-white text-[10px] font-semibold rounded-full px-2.5">
                  แพ็กเกจปัจจุบัน
                </Badge>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {subscription?.status === "ACTIVE" && (
                    <span className="flex items-center text-emerald-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> เปิดใช้งานปกติ
                    </span>
                  )}
                  {isTrial && (
                    <span className="flex items-center text-amber-600 font-medium">
                      <Clock className="h-3.5 w-3.5 mr-1" /> ทดลองใช้งาน
                    </span>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-[#0d253d] mt-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#533afd]" />
                {activePlan?.name || "Free Tier Plan"}
              </CardTitle>
              <CardDescription className="text-xs text-[#64748d] mt-1">
                {activePlan?.description || "แพ็กเกจมาตรฐานสำหรับธุรกิจและองค์กร"}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0d253d] font-mono tracking-tight">
                  ฿{activePlan ? Number(activePlan.priceMonthly).toLocaleString() : "0"}
                </span>
                <span className="text-xs text-[#64748d]">/ เดือน</span>
              </div>

              <div className="pt-3 border-t border-[#e3e8ee] space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#64748d]">
                  <span>เริ่มใช้งานเมื่อ:</span>
                  <span className="font-semibold text-[#0d253d]">
                    {subscription ? new Date(subscription.startDate).toLocaleDateString("th-TH") : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#64748d]">
                  <span>รอบบิลสิ้นสุด:</span>
                  <span className="font-semibold text-[#0d253d]">
                    {subscription?.endDate
                      ? new Date(subscription.endDate).toLocaleDateString("th-TH")
                      : "ต่ออายุอัตโนมัติ"}
                  </span>
                </div>
                {daysRemaining !== null && (
                  <div className="flex justify-between items-center text-[#64748d]">
                    <span>ระยะเวลาคงเหลือ:</span>
                    <Badge variant="outline" className="text-[10px] font-mono rounded-full font-bold text-[#533afd]">
                      {daysRemaining} วัน
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </div>

          <CardFooter className="p-5 pt-0">
            <Button
              variant="outline"
              onClick={() => openUpgradeModal()}
              className="w-full rounded-full text-xs font-semibold text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 h-9"
            >
              เปลี่ยนเป็นแพ็กเกจอื่น
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardFooter>
        </Card>

        {/* Quota & Resource Usage Gauges */}
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/60">
            <CardTitle className="text-sm font-bold text-[#0d253d] flex items-center">
              <Layers className="h-4 w-4 text-[#533afd] mr-2" />
              การใช้งานโควตาและทรัพยากร (Resource Quotas)
            </CardTitle>
            <CardDescription className="text-xs text-[#64748d]">
              ติดตามการใช้งานจำนวนพนักงานและที่นั่งผู้ดูแลระบบตามข้อจำกัดของแพ็กเกจ
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            {/* Employee Quota Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0d253d] flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#533afd]" />
                  โควตาพนักงานในระบบ (Active Employees)
                </span>
                <span className="font-mono text-xs font-bold text-[#0d253d]">
                  {usage.employeesCount} / {maxEmployees} คน ({employeeUsagePercent}%)
                </span>
              </div>
              <div className="h-3 w-full bg-[#f0f4ff] rounded-full overflow-hidden p-0.5 border border-[#e3e8ee]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    employeeUsagePercent >= 90
                      ? "bg-rose-500"
                      : employeeUsagePercent >= 75
                        ? "bg-amber-500"
                        : "bg-[#533afd]"
                  }`}
                  style={{ width: `${employeeUsagePercent}%` }}
                />
              </div>
              {employeeUsagePercent >= 90 && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  โควตาพนักงานใกล้เต็มแล้ว กรุณาอัปเกรดเพื่อเพิ่มจำนวนพนักงานที่รองรับ
                </p>
              )}
            </div>

            {/* Admin Seats Quota Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0d253d] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  ที่นั่งผู้ดูแลระบบ (Admin Seats)
                </span>
                <span className="font-mono text-xs font-bold text-[#0d253d]">
                  {usage.adminsCount} / {maxAdmins} ที่นั่ง ({adminUsagePercent}%)
                </span>
              </div>
              <div className="h-3 w-full bg-[#f0f4ff] rounded-full overflow-hidden p-0.5 border border-[#e3e8ee]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    adminUsagePercent >= 90
                      ? "bg-rose-500"
                      : adminUsagePercent >= 75
                        ? "bg-amber-500"
                        : "bg-emerald-600"
                  }`}
                  style={{ width: `${adminUsagePercent}%` }}
                />
              </div>
            </div>

            {/* Sub-resource Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]">
                <span className="text-[11px] text-[#64748d] block">สาขาที่เปิดใช้งาน</span>
                <span className="text-base font-bold text-[#0d253d] font-mono mt-0.5 block">
                  {usage.branchesCount} สาขา
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]">
                <span className="text-[11px] text-[#64748d] block">แผนกในองค์กร</span>
                <span className="text-base font-bold text-[#0d253d] font-mono mt-0.5 block">
                  {usage.departmentsCount} แผนก
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]">
                <span className="text-[11px] text-[#64748d] block">คำขอลาทั้งหมด</span>
                <span className="text-base font-bold text-[#0d253d] font-mono mt-0.5 block">
                  {usage.leaveRequestsCount} รายการ
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee]">
                <span className="text-[11px] text-[#64748d] block">เอกสารแนบ S3</span>
                <span className="text-base font-bold text-[#0d253d] font-mono mt-0.5 block">
                  {usage.attachmentsCount} ไฟล์
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Requests & History Table */}
      {upgradeRequests.length > 0 && (
        <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/60 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-[#0d253d] flex items-center">
                <History className="h-4 w-4 text-[#533afd] mr-2" />
                ประวัติคำขอปรับระดับแพ็กเกจ (Upgrade Requests & History)
              </CardTitle>
              <CardDescription className="text-xs text-[#64748d]">
                ติดตามสถานะคำขอที่ส่งไปยังผู้ดูแลระบบส่วนกลาง
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3 px-4 pl-5 font-semibold">วันที่ส่งคำขอ</th>
                    <th className="py-3 px-4 font-semibold">แพ็กเกจที่ขอ</th>
                    <th className="py-3 px-4 font-semibold">รอบบิล</th>
                    <th className="py-3 px-4 font-semibold">โควตาเพิ่มเติม</th>
                    <th className="py-3 px-4 font-semibold">ผู้ส่งคำขอ</th>
                    <th className="py-3 px-4 font-semibold">สถานะ</th>
                    <th className="py-3 px-4 font-semibold">ข้อความตอบกลับ</th>
                    <th className="py-3 px-4 pr-5 text-right font-semibold">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {upgradeRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#f6f9fc]/50 transition-colors">
                      <td className="py-3.5 px-4 pl-5 text-[#64748d] font-mono tabular-nums">
                        {new Date(req.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0d253d]">
                        {req.targetPlanName}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569]">
                        {req.billingCycle === "YEARLY" ? "รายปี (Yearly)" : "รายเดือน (Monthly)"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0d253d]">
                        {req.requestedSeats ? `+${req.requestedSeats} คน` : "ตามแพ็กเกจ"}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {req.requestedByName}
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
                      <td className="py-3.5 px-4 text-[#64748d] text-[11px]">
                        {req.adminNotes || req.notes || "-"}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDetailTarget(req)}
                            className="h-7 text-[11px] rounded-full text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 font-medium cursor-pointer"
                          >
                            ดูรายละเอียด
                          </Button>
                          {req.status === "PENDING" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCancelTargetId(req.id)}
                              className="h-7 text-[11px] rounded-full text-rose-600 border-rose-200 hover:bg-rose-50 font-medium cursor-pointer"
                            >
                              ยกเลิกคำขอ
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans Comparison Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0d253d]">
            แพ็กเกจทั้งหมดที่สามารถเลือกใช้งานได้ (Available Plans)
          </h2>
          <p className="text-xs text-[#64748d] mt-0.5">
            เลือกแพ็กเกจที่เหมาะสมกับขนาดและความต้องการขององค์กรท่าน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = activePlan?.id === plan.id;
            return (
              <Card
                key={plan.id}
                className={`border rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                  isCurrent
                    ? "border-[#533afd] ring-2 ring-[#533afd]/20 bg-white shadow-md"
                    : "border-[#e3e8ee] bg-white hover:border-[#533afd]/40 shadow-xs"
                }`}
              >
                <div>
                  <CardHeader className="p-5 border-b border-[#e3e8ee]/70">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#533afd] font-mono tracking-wide">
                        {plan.code}
                      </span>
                      {isCurrent && (
                        <Badge className="bg-[#533afd] text-white text-[10px] font-semibold rounded-full px-2">
                          แพ็กเกจปัจจุบัน
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-bold text-[#0d253d] mt-1">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#64748d] min-h-[32px] line-clamp-2">
                      {plan.description || "ฟีเจอร์ครบครันสำหรับองค์กร"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-[#0d253d] font-mono">
                        ฿{Number(plan.priceMonthly).toLocaleString()}
                      </span>
                      <span className="text-xs text-[#64748d]">/ เดือน</span>
                    </div>

                    <div className="space-y-2.5 pt-2 text-xs">
                      <div className="flex items-center gap-2 text-[#0d253d]">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>รองรับพนักงานสูงสุด <strong>{plan.maxEmployees}</strong> คน</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#0d253d]">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>ผู้ดูแลระบบ <strong>{plan.maxAdmins}</strong> ที่นั่ง</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#0d253d]">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>แจ้งเตือนคำขอลาผ่าน LINE Messaging</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#0d253d]">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>ระบบอนุมัติหลายระดับ (Multi-level)</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-5 pt-0">
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full rounded-full bg-[#f6f9fc] text-[#64748d] border border-[#e3e8ee] text-xs h-9"
                    >
                      ใช้งานอยู่ขณะนี้
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openUpgradeModal(plan.id)}
                      className="w-full rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 shadow-xs"
                    >
                      เลือกแพ็กเกจนี้
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upgrade Request Modal */}
      <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#533afd]" />
              ส่งคำขอปรับระดับแพ็กเกจ / เพิ่มโควตา
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรุณาระบุแพ็กเกจและรายละเอียดที่ต้องการ ผู้ดูแลระบบส่วนกลางจะตรวจสอบและอนุมัติให้โดยเร็ว
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpgradeSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                เลือกแพ็กเกจที่ต้องการ <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                {availablePlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — สูงสุด {p.maxEmployees} พนักงาน — ฿{Number(p.priceMonthly).toLocaleString()}/ด.
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                รอบการชำระเงิน
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingCycle("MONTHLY")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    billingCycle === "MONTHLY"
                      ? "border-[#533afd] bg-[#533afd]/10 text-[#533afd]"
                      : "border-[#e3e8ee] bg-white text-[#64748d] hover:bg-[#f6f9fc]"
                  }`}
                >
                  รายเดือน (Monthly)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("YEARLY")}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    billingCycle === "YEARLY"
                      ? "border-[#533afd] bg-[#533afd]/10 text-[#533afd]"
                      : "border-[#e3e8ee] bg-white text-[#64748d] hover:bg-[#f6f9fc]"
                  }`}
                >
                  รายปี (Yearly - รับส่วนลดพิเศษ)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ต้องการโควตาพนักงานเพิ่มเติม (ถ้ามี)
              </label>
              <Input
                type="number"
                placeholder="เช่น +50 คน"
                value={requestedSeats}
                onChange={(e) => setRequestedSeats(e.target.value)}
                className="h-9 rounded-xl text-xs"
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                ข้อความหรือความต้องการเพิ่มเติม
              </label>
              <Textarea
                placeholder="ระบุความต้องการเพิ่มเติม เช่น ต้องการใบเสนอราคา, วันที่ต้องการเริ่มใช้งาน..."
                value={upgradeNotes}
                onChange={(e) => setUpgradeNotes(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedPlanId}
                className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 px-4"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                ส่งคำขออัปเกรด
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Confirmation Dialog */}
      <AlertDialog
        open={!!cancelTargetId}
        onOpenChange={(open) => !open && setCancelTargetId(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Ban className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการยกเลิกคำขอปรับระดับแพ็กเกจ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณต้องการยกเลิกคำขอปรับระดับแพ็กเกจนี้ใช่หรือไม่? เมื่อยกเลิกแล้วคุณสามารถส่งคำขอใหม่ได้ตลอดเวลา
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => setCancelTargetId(null)}
              disabled={isCancelling}
              className="rounded-full text-xs h-9"
            >
              กลับ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRequestConfirm}
              disabled={isCancelling}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isCancelling && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันยกเลิกคำขอ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Details Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#533afd]" />
              รายละเอียดคำขอปรับระดับแพ็กเกจ
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ข้อมูลสรุปคำขอและสถานะการพิจารณาจากผู้ดูแลระบบ
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
                  <span className="text-[#64748d]">แพ็กเกจที่ขอ:</span>
                  <span className="font-bold text-[#533afd]">{detailTarget.targetPlanName} ({detailTarget.targetPlanCode})</span>
                </div>

                {detailTarget.currentPlanName && (
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">แพ็กเกจเดิม:</span>
                    <span className="font-medium text-[#0d253d]">{detailTarget.currentPlanName}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#64748d]">รอบบิลที่เลือก:</span>
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
                  <span className="text-[#0d253d] font-medium">{detailTarget.requestedByName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#64748d]">วันที่ส่งคำขอ:</span>
                  <span className="text-[#0d253d] font-mono">{new Date(detailTarget.createdAt).toLocaleString("th-TH")}</span>
                </div>

                {detailTarget.notes && (
                  <div className="pt-2 border-t border-[#e3e8ee]">
                    <span className="text-[#64748d] block mb-1">หมายเหตุที่คุณระบุ:</span>
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
                    router.push("/admin/messages");
                  }}
                  className="rounded-full text-xs text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10 h-9 px-4"
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  ส่งข้อความสอบถามในกล่องข้อความ
                </Button>

                <Button
                  type="button"
                  onClick={() => setDetailTarget(null)}
                  className="rounded-full bg-[#0d253d] text-white text-xs h-9 px-4"
                >
                  ปิดหน้าต่าง
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
