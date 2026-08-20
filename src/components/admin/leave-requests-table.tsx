"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  approveLeaveRequestAction,
  rejectLeaveRequestAction,
} from "@/features/leave";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Loader2,
  Calendar,
  User,
  FileText,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface SerializedLeaveRequest {
  id: string;
  requestNumber: string;
  startDate: string;
  endDate: string;
  startPeriod: string;
  endPeriod: string;
  totalDays: number;
  reason: string;
  status: string;
  rejectionReason: string | null;
  approvedBy: string | null;
  createdAt: string;
  approvals: {
    id: string;
    stepOrder: number;
    roleCode: string | null;
    status: string;
    comment: string | null;
    approverId: string | null;
    actedAt: string | null;
  }[];
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
  };
  leaveType: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
  };
}

export interface AvailableLeaveEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export interface AvailableLeaveTypeOption {
  id: string;
  name: string;
  code: string;
}

interface LeaveRequestsTableProps {
  initialRequests: SerializedLeaveRequest[];
  availableEmployees?: AvailableLeaveEmployee[];
  availableLeaveTypes?: AvailableLeaveTypeOption[];
}

export function LeaveRequestsTable({
  initialRequests,
  availableEmployees = [],
  availableLeaveTypes = [],
}: LeaveRequestsTableProps) {
  const router = useRouter();
  const [requests, setRequests] = React.useState(initialRequests);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selected Request for Details Modal
  const [selectedRequest, setSelectedRequest] =
    React.useState<SerializedLeaveRequest | null>(null);

  // Approve Dialog State
  const [approveTarget, setApproveTarget] =
    React.useState<SerializedLeaveRequest | null>(null);
  const [isApproving, setIsApproving] = React.useState(false);

  // Reject Dialog State
  const [rejectTarget, setRejectTarget] =
    React.useState<SerializedLeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejectError, setRejectError] = React.useState<string | null>(null);
  const [isRejecting, setIsRejecting] = React.useState(false);

  // Revoke Dialog State
  const [revokeTarget, setRevokeTarget] =
    React.useState<SerializedLeaveRequest | null>(null);
  const [revokeReason, setRevokeReason] = React.useState("");
  const [revokeError, setRevokeError] = React.useState<string | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

  // HR Proxy Modal State
  const [isProxyModalOpen, setIsProxyModalOpen] = React.useState(false);
  const [proxyEmployeeId, setProxyEmployeeId] = React.useState(availableEmployees[0]?.id || "");
  const [proxyLeaveTypeId, setProxyLeaveTypeId] = React.useState(availableLeaveTypes[0]?.id || "");
  const [proxyStartDate, setProxyStartDate] = React.useState("");
  const [proxyEndDate, setProxyEndDate] = React.useState("");
  const [proxyReason, setProxyReason] = React.useState("");
  const [isSubmittingProxy, setIsSubmittingProxy] = React.useState(false);
  const [proxyError, setProxyError] = React.useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesLeaveType = leaveTypeFilter === "ALL" || req.leaveType.id === leaveTypeFilter;
    const matchesSearch =
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employee.employeeCode
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      req.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesLeaveType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Handle Approve with Loading
  async function handleConfirmApprove() {
    if (!approveTarget) return;

    setIsApproving(true);
    const result = await approveLeaveRequestAction(approveTarget.id);
    setIsApproving(false);

    if (result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === approveTarget.id ? { ...r, status: "APPROVED" } : r,
        ),
      );
      setApproveTarget(null);
      if (selectedRequest?.id === approveTarget.id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "APPROVED" } : null,
        );
      }
      router.refresh();
    }
  }

  // Handle Reject with Loading
  async function handleConfirmReject() {
    if (!rejectTarget) return;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      setRejectError("กรุณาระบุเหตุผลในการไม่อนุมัติ");
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    const result = await rejectLeaveRequestAction(
      rejectTarget.id,
      rejectionReason.trim(),
    );
    setIsRejecting(false);

    if (result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectTarget.id
            ? {
                ...r,
                status: "REJECTED",
                rejectionReason: rejectionReason.trim(),
              }
            : r,
        ),
      );
      setRejectTarget(null);
      setRejectionReason("");
      if (selectedRequest?.id === rejectTarget.id) {
        setSelectedRequest((prev) =>
          prev
            ? {
                ...prev,
                status: "REJECTED",
                rejectionReason: rejectionReason.trim(),
              }
            : null,
        );
      }
      router.refresh();
    } else {
      setRejectError(result.message || "เกิดข้อผิดพลาดในการไม่อนุมัติ");
    }
  }

  // Handle Proxy Leave Submission
  async function handleProxySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proxyEmployeeId || !proxyLeaveTypeId || !proxyStartDate || !proxyEndDate) {
      setProxyError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmittingProxy(true);
    setProxyError(null);

    const { createLeaveRequestByHrAction } = await import("@/features/leave");
    const result = await createLeaveRequestByHrAction(
      proxyEmployeeId,
      proxyLeaveTypeId,
      proxyStartDate,
      proxyEndDate,
      proxyReason,
    );

    setIsSubmittingProxy(false);

    if (result.success) {
      setIsProxyModalOpen(false);
      setProxyStartDate("");
      setProxyEndDate("");
      setProxyReason("");
      router.refresh();
    } else {
      setProxyError(result.message || "เกิดข้อผิดพลาดในการยื่นใบลา");
    }
  }

  // Handle Revoke Approved Leave
  async function handleConfirmRevoke() {
    if (!revokeTarget) return;
    if (!revokeReason || revokeReason.trim().length === 0) {
      setRevokeError("กรุณาระบุเหตุผลในการเพิกถอน");
      return;
    }

    setIsRevoking(true);
    setRevokeError(null);

    const { revokeApprovedLeaveAction } = await import("@/features/leave");
    const result = await revokeApprovedLeaveAction(revokeTarget.id, revokeReason.trim());
    setIsRevoking(false);

    if (result.success) {
      setRevokeTarget(null);
      setRevokeReason("");
      router.refresh();
    } else {
      setRevokeError(result.message || "เกิดข้อผิดพลาดในการเพิกถอน");
    }
  }

  const periodLabel = (period: string) => {
    switch (period) {
      case "HALF_DAY_AM":
        return "ครึ่งวันเช้า";
      case "HALF_DAY_PM":
        return "ครึ่งวันบ่าย";
      default:
        return "เต็มวัน";
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    MANAGER: "หัวหน้างาน",
    HR: "ฝ่ายบุคคล",
    HR_ADMIN: "ผู้บริหาร HR",
    COMPANY_ADMIN: "ผู้ดูแลระบบ",
    ADMIN: "ผู้ดูแลระบบ",
  };

  const APPROVAL_STATUS_LABELS: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    APPROVED: "อนุมัติ",
    REJECTED: "ไม่อนุมัติ",
    SKIPPED: "ข้ามขั้น",
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
            <Input
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, เลขที่ใบลา..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-10 rounded-full border-[#a8c3de]/60 focus-visible:border-[#533afd] text-xs"
            />
          </div>

          {availableLeaveTypes.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-[#64748d]">ประเภทการลา:</span>
              <select
                value={leaveTypeFilter}
                onChange={(e) => {
                  setLeaveTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl border border-[#e3e8ee] bg-white px-2.5 text-xs text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
              >
                <option value="ALL">ทุกประเภทการลา</option>
                {availableLeaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: "ทั้งหมด" },
            { key: "PENDING", label: "รออนุมัติ" },
            { key: "APPROVED", label: "อนุมัติแล้ว" },
            { key: "REJECTED", label: "ไม่อนุมัติ" },
            { key: "CANCELLED", label: "ยกเลิกแล้ว" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`h-8 text-xs font-semibold rounded-full px-3.5 ${
                statusFilter === tab.key
                  ? "bg-[#533afd] hover:bg-[#4434d4] text-white shadow-xs"
                  : "text-[#273951] border-[#e3e8ee] hover:border-[#533afd]"
              }`}
            >
              {tab.label}
            </Button>
          ))}

          <Button
            size="sm"
            onClick={() => setIsProxyModalOpen(true)}
            className="h-8 text-xs bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full px-3.5 ml-2"
          >
            + ยื่นใบลาแทนพนักงาน
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <FileCheck className="h-4 w-4 text-[#533afd] mr-2" />
            รายการคำขอลา ({filteredRequests.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="py-12 text-center text-[#64748d] text-xs">
              ไม่พบรายการคำขอลาที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3.5 px-4 pl-5 font-semibold">เลขที่</th>
                    <th className="py-3.5 px-4 font-semibold">พนักงาน</th>
                    <th className="py-3.5 px-4 font-semibold">ประเภทการลา</th>
                    <th className="py-3.5 px-4 font-semibold">ช่วงวันที่</th>
                    <th className="py-3.5 px-4 font-semibold">จำนวน</th>
                    <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                    <th className="py-3.5 px-4 pr-5 font-semibold text-right">
                      ดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {paginatedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-semibold text-[#533afd] tabular-nums">
                        {req.requestNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#0d253d]">
                          {req.employee.firstName} {req.employee.lastName}
                        </p>
                        <p className="text-[#64748d] text-[11px] font-mono">
                          {req.employee.employeeCode}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {req.leaveType.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {new Date(req.startDate).toLocaleDateString("th-TH")}{" "}
                        {req.startDate !== req.endDate &&
                          `- ${new Date(req.endDate).toLocaleDateString("th-TH")}`}
                        <span className="text-[11px] text-[#64748d] ml-1">
                          ({periodLabel(req.startPeriod)})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0d253d] tabular-nums">
                        {req.totalDays} วัน
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            req.status === "APPROVED"
                              ? "success"
                              : req.status === "PENDING"
                                ? "warning"
                                : req.status === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                          }
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {req.status === "APPROVED"
                            ? "อนุมัติแล้ว"
                            : req.status === "PENDING"
                              ? "รออนุมัติ"
                              : req.status === "REJECTED"
                                ? "ไม่อนุมัติ"
                                : "ยกเลิกแล้ว"}
                        </Badge>
                      </td>
                      <td
                        className="py-3.5 px-4 pr-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(req)}
                            className="h-7.5 text-xs rounded-full px-2.5 text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> รายละเอียด
                          </Button>

                          {req.status === "APPROVED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRevokeTarget(req);
                                setRevokeReason("");
                                setRevokeError(null);
                              }}
                              className="h-7.5 text-xs rounded-full px-2.5 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                            >
                              เพิกถอน
                            </Button>
                          )}

                          {req.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setApproveTarget(req)}
                                className="h-7.5 text-xs bg-[#059669] hover:bg-[#047857] text-white font-semibold shadow-xs rounded-full px-3"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{" "}
                                อนุมัติ
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectTarget(req);
                                  setRejectionReason("");
                                  setRejectError(null);
                                }}
                                className="h-7.5 text-xs text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] rounded-full px-3"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> ปฏิเสธ
                              </Button>
                            </>
                          )}
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
            totalItems={filteredRequests.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* 1. Modal: ดูรายละเอียดการลาแบบเต็ม (View Leave Details Modal) */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent
          className="max-w-xl p-6 rounded-2xl"
          onClose={() => setSelectedRequest(null)}
        >
          {selectedRequest && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <DialogTitle className="text-lg font-bold text-[#0d253d]">
                        รายละเอียดคำขอลางาน
                      </DialogTitle>
                      <Badge
                        variant={
                          selectedRequest.status === "APPROVED"
                            ? "success"
                            : selectedRequest.status === "PENDING"
                              ? "warning"
                              : selectedRequest.status === "REJECTED"
                                ? "destructive"
                                : "outline"
                        }
                        className="text-xs rounded-full px-2.5 py-0.5"
                      >
                        {selectedRequest.status === "APPROVED"
                          ? "อนุมัติแล้ว"
                          : selectedRequest.status === "PENDING"
                            ? "รออนุมัติ"
                            : selectedRequest.status === "REJECTED"
                              ? "ไม่อนุมัติ"
                              : "ยกเลิกแล้ว"}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-[#533afd] mt-1 font-semibold">
                      {selectedRequest.requestNumber}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* Employee Card */}
              <div className="rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] p-3.5 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-[#0d253d] font-bold">
                  <User className="h-4 w-4 text-[#533afd]" />
                  <span>
                    {selectedRequest.employee.firstName}{" "}
                    {selectedRequest.employee.lastName}
                  </span>
                  <span className="font-mono text-[#64748d] font-normal">
                    ({selectedRequest.employee.employeeCode})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#64748d] pt-1">
                  <p>
                    <span className="text-[#64748d]/70">แผนก:</span>{" "}
                    {selectedRequest.employee.department?.name || "-"}
                  </p>
                  <p>
                    <span className="text-[#64748d]/70">ตำแหน่ง:</span>{" "}
                    {selectedRequest.employee.position?.name || "-"}
                  </p>
                  {selectedRequest.employee.email && (
                    <p>
                      <span className="text-[#64748d]/70">อีเมล:</span>{" "}
                      {selectedRequest.employee.email}
                    </p>
                  )}
                  {selectedRequest.employee.phone && (
                    <p>
                      <span className="text-[#64748d]/70">โทร:</span>{" "}
                      {selectedRequest.employee.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-white">
                  <p className="text-[#64748d] font-semibold">ประเภทการลา</p>
                  <p className="font-bold text-[#0d253d] text-sm">
                    {selectedRequest.leaveType.name}
                  </p>
                  <Badge variant="outline" className="text-[10px] rounded-full">
                    {selectedRequest.leaveType.isPaid
                      ? "ได้รับค่าจ้าง"
                      : "ไม่ได้รับค่าจ้าง"}
                  </Badge>
                </div>

                <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-white">
                  <p className="text-[#64748d] font-semibold">
                    จำนวนวันลาสุทธิ
                  </p>
                  <p className="font-bold text-[#533afd] text-xl font-mono tabular-nums">
                    {selectedRequest.totalDays} วัน
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e3e8ee] p-3.5 text-xs space-y-2 bg-white">
                <div className="flex items-center space-x-2 text-[#0d253d] font-semibold">
                  <Calendar className="h-4 w-4 text-[#533afd]" />
                  <span>ระยะเวลาที่ขอลา</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#64748d]">
                  <p>
                    <span className="text-[#64748d]/70">เริ่ม:</span>{" "}
                    {new Date(selectedRequest.startDate).toLocaleDateString(
                      "th-TH",
                    )}{" "}
                    ({periodLabel(selectedRequest.startPeriod)})
                  </p>
                  <p>
                    <span className="text-[#64748d]/70">สิ้นสุด:</span>{" "}
                    {new Date(selectedRequest.endDate).toLocaleDateString(
                      "th-TH",
                    )}{" "}
                    ({periodLabel(selectedRequest.endPeriod)})
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="rounded-xl border border-[#e3e8ee] p-3.5 text-xs space-y-1 bg-white">
                <div className="flex items-center space-x-2 text-[#0d253d] font-semibold">
                  <FileText className="h-4 w-4 text-[#533afd]" />
                  <span>เหตุผลในการลา</span>
                </div>
                <p className="text-[#0d253d] bg-[#f6f9fc] p-2.5 rounded-lg">
                  {selectedRequest.reason || "ไม่ระบุเหตุผล"}
                </p>
              </div>

              {/* Approval Workflow Progress */}
              {selectedRequest.approvals.length > 0 && (
                <div className="rounded-xl border border-[#e3e8ee] p-3.5 text-xs space-y-2.5 bg-white">
                  <div className="flex items-center space-x-2 text-[#0d253d] font-semibold">
                    <FileCheck className="h-4 w-4 text-[#533afd]" />
                    <span>สายการอนุมัติ (หลายขั้นตอน)</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedRequest.approvals.map((approval) => {
                      const isApproved = approval.status === "APPROVED";
                      const isRejected = approval.status === "REJECTED";
                      const isPending = approval.status === "PENDING";
                      const isSkipped = approval.status === "SKIPPED";

                      return (
                        <div
                          key={approval.id}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                            isApproved
                              ? "border-[#a7f3d0] bg-[#ecfdf5]"
                              : isRejected
                                ? "border-[#fecdd3] bg-[#ffe4e6]"
                                : isSkipped
                                  ? "border-[#e3e8ee] bg-[#f6f9fc]"
                                  : "border-[#e2e8f0] bg-[#f8fafc]"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold font-mono shrink-0 ${
                                isApproved
                                  ? "bg-[#059669] text-white"
                                  : isRejected
                                    ? "bg-[#ea2261] text-white"
                                    : isSkipped
                                      ? "bg-[#94a3b8] text-white"
                                      : "bg-[#533afd] text-white"
                              }`}
                            >
                              {isApproved ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : isRejected ? (
                                <XCircle className="h-3.5 w-3.5" />
                              ) : (
                                approval.stepOrder
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#0d253d] truncate">
                                ขั้นตอนที่ {approval.stepOrder}:{" "}
                                {ROLE_LABELS[approval.roleCode ?? ""] ??
                                  approval.roleCode ??
                                  "-"}
                              </p>
                              {approval.comment && (
                                <p className="text-[11px] text-[#64748d] truncate">
                                  {approval.comment}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              isApproved
                                ? "success"
                                : isRejected
                                  ? "destructive"
                                  : isSkipped
                                    ? "outline"
                                    : "warning"
                            }
                            className="rounded-full text-[10px] py-0.5 shrink-0"
                          >
                            {APPROVAL_STATUS_LABELS[approval.status] ??
                              approval.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rejection Note if Rejected */}
              {selectedRequest.status === "REJECTED" &&
                selectedRequest.rejectionReason && (
                  <div className="rounded-xl border border-[#fecdd3] bg-[#ffe4e6] p-3.5 text-xs space-y-1">
                    <p className="font-bold text-[#ea2261]">
                      เหตุผลที่ไม่อนุมัติ:
                    </p>
                    <p className="text-[#ea2261]">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-[#e3e8ee]">
                {selectedRequest.status === "PENDING" ? (
                  <div className="flex w-full items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectTarget(selectedRequest);
                        setRejectionReason("");
                        setRejectError(null);
                      }}
                      className="rounded-full text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] text-xs h-9 px-4"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> ไม่อนุมัติ
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRequest(null)}
                        className="rounded-full text-xs h-9 px-4"
                      >
                        ปิด
                      </Button>
                      <Button
                        onClick={() => setApproveTarget(selectedRequest)}
                        className="rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold h-9 px-5 shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{" "}
                        อนุมัติคำขอลา
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-full w-full sm:w-auto text-xs h-9"
                  >
                    ปิดหน้าต่าง
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Alert Dialog: ยืนยันการอนุมัติ (Approve Confirmation) */}
      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <CheckCircle2 className="h-5 w-5 text-[#059669] mr-2" />
              ยืนยันการอนุมัติคำขอลางาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะอนุมัติคำขอลาเลขที่{" "}
              <strong className="text-[#0d253d]">
                {approveTarget?.requestNumber}
              </strong>{" "}
              ของ{" "}
              <strong className="text-[#0d253d]">
                {approveTarget?.employee.firstName}{" "}
                {approveTarget?.employee.lastName}
              </strong>{" "}
              (จำนวน {approveTarget?.totalDays} วัน) ระบบจะตัดยอดคงเหลือและส่ง
              Flex Message แจ้งเตือนพนักงานผ่าน LINE ทันที
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isApproving}
              className="rounded-full text-xs"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmApprove}
              disabled={isApproving}
              className="rounded-full bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังอนุมัติ...
                </>
              ) : (
                "ยืนยันการอนุมัติ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 3. Alert Dialog: ปฏิเสธคำขอลา (Reject Confirmation with Reason) */}
      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#ea2261] flex items-center">
              <XCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ระบุเหตุผลในการไม่อนุมัติคำขอลา
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              กรุณาระบุเหตุผลการไม่อนุมัติสำหรับใบลาเลขที่{" "}
              <strong className="text-[#0d253d]">
                {rejectTarget?.requestNumber}
              </strong>{" "}
              (ข้อมูลนี้จะถูกส่งแจ้งเตือนไปยังพนักงานทาง LINE)
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3 space-y-2">
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="เช่น ติดภารกิจด่วนของทีม, โควตาวันลาไม่เพียงพอ..."
              className="h-10 text-xs rounded-xl"
              required
            />
            {rejectError && (
              <p className="text-[11px] font-medium text-[#ea2261] flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {rejectError}
              </p>
            )}
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isRejecting}
              className="rounded-full text-xs"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              disabled={isRejecting}
              className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs font-semibold"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "ยืนยันการไม่อนุมัติ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 4. Alert Dialog: เพิกถอนใบลาที่อนุมัติแล้ว (Revoke Approved Leave) */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#ea2261] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการเพิกถอนใบลาที่อนุมัติแล้ว?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะเพิกถอนใบลาเลขที่ <strong className="text-[#0d253d]">{revokeTarget?.requestNumber}</strong> ของ{" "}
              <strong>{revokeTarget?.employee.firstName} {revokeTarget?.employee.lastName}</strong> (จำนวน {revokeTarget?.totalDays} วัน)
              ระบบจะ <strong className="text-[#059669]">คืนยอดวันลาใน Ledger ทันที</strong> และส่งข้อความแจ้งเตือนทาง LINE
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-3 space-y-2">
            <label className="text-xs font-semibold text-[#0d253d]">
              เหตุผลในการเพิกถอน <span className="text-[#ea2261]">*</span>
            </label>
            <Input
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="เช่น พนักงานขอยกเลิกเนื่องจากยกเลิกทริป..."
              className="h-10 text-xs rounded-xl"
              required
            />
            {revokeError && (
              <p className="text-[11px] font-medium text-[#ea2261] flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                {revokeError}
              </p>
            )}
          </div>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isRevoking} className="rounded-full text-xs">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={isRevoking}
              className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs font-semibold"
            >
              {isRevoking ? "กำลังเพิกถอน..." : "ยืนยันการเพิกถอนและคืนวันลา"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 5. Modal: ยื่นใบลาแทนพนักงาน (HR Proxy Leave Submission) */}
      <Dialog open={isProxyModalOpen} onOpenChange={setIsProxyModalOpen}>
        <DialogContent onClose={() => setIsProxyModalOpen(false)} className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <FileText className="h-5 w-5 text-[#533afd] mr-2" />
              ยื่นใบลาแทนพนักงาน (HR Proxy)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              สำหรับกรณีพนักงานเจ็บป่วยฉุกเฉิน หรือไม่สามารถใช้งาน LINE เพื่อยื่นใบลาได้
            </DialogDescription>
          </DialogHeader>

          {proxyError && (
            <div className="my-2 p-2.5 rounded-xl bg-[#ffe4e6] text-[#ea2261] text-xs">
              {proxyError}
            </div>
          )}

          <form onSubmit={handleProxySubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เลือกพนักงาน <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={proxyEmployeeId}
                onChange={(e) => setProxyEmployeeId(e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
              >
                <option value="">-- กรุณาเลือกพนักงาน --</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ประเภทการลา <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={proxyLeaveTypeId}
                onChange={(e) => setProxyLeaveTypeId(e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
              >
                <option value="">-- กรุณาเลือกประเภทการลา --</option>
                {availableLeaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name} ({lt.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ตั้งแต่วันที่ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  type="date"
                  value={proxyStartDate}
                  onChange={(e) => setProxyStartDate(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ถึงวันที่ <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  type="date"
                  value={proxyEndDate}
                  onChange={(e) => setProxyEndDate(e.target.value)}
                  required
                  className="h-9 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                เหตุผลการลา <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                value={proxyReason}
                onChange={(e) => setProxyReason(e.target.value)}
                placeholder="เช่น แอดมิทโรงพยาบาล, ผ่าตัดฉุกเฉิน..."
                required
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProxyModalOpen(false)}
                disabled={isSubmittingProxy}
                className="rounded-full text-xs h-9 px-4"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingProxy}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
              >
                {isSubmittingProxy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกและอนุมัติทันที"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
