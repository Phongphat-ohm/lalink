"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { cancelLeaveRequestAction } from "@/features/leave";
import {
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  XCircle,
  Loader2,
  Eye,
} from "lucide-react";

export interface SerializedEmployeeLeaveRequest {
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
  createdAt: string;
  leaveType: {
    name: string;
    code: string;
    isPaid: boolean;
  };
}

interface LeaveHistoryListProps {
  initialRequests: SerializedEmployeeLeaveRequest[];
}

export function LeaveHistoryList({ initialRequests }: LeaveHistoryListProps) {
  const router = useRouter();
  const [requests, setRequests] = React.useState(initialRequests);
  const [selectedRequest, setSelectedRequest] =
    React.useState<SerializedEmployeeLeaveRequest | null>(null);

  // Cancel Request Dialog State
  const [cancelTarget, setCancelTarget] =
    React.useState<SerializedEmployeeLeaveRequest | null>(null);
  const [isCancelling, setIsCancelling] = React.useState(false);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;

    setIsCancelling(true);
    const result = await cancelLeaveRequestAction(cancelTarget.id);
    setIsCancelling(false);

    if (result.success) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id ? { ...r, status: "CANCELLED" } : r,
        ),
      );
      setCancelTarget(null);
      if (selectedRequest?.id === cancelTarget.id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "CANCELLED" } : null,
        );
      }
      router.refresh();
    }
  }

  const periodText = (p: string) => {
    switch (p) {
      case "HALF_DAY_AM":
        return "ครึ่งวันเช้า";
      case "HALF_DAY_PM":
        return "ครึ่งวันบ่าย";
      default:
        return "เต็มวัน";
    }
  };

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e3e8ee] p-8 text-center bg-white shadow-xs">
          <Clock className="h-8 w-8 mx-auto text-[#64748d]/40 mb-2" />
          <p className="text-sm font-semibold text-[#0d253d]">
            ยังไม่มีประวัติการยื่นใบลา
          </p>
          <p className="text-xs text-[#64748d] mt-1">
            เมื่อคุณยื่นใบลา รายการจะแสดงที่นี่เพื่อติดตามสถานะ
          </p>
        </div>
      ) : (
        requests.map((req) => (
          <Card
            key={req.id}
            onClick={() => setSelectedRequest(req)}
            className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] hover:border-[#533afd]/50 transition-colors cursor-pointer rounded-2xl"
          >
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-[#0d253d]">
                    {req.leaveType.name}
                  </span>
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
                    className="text-[10px] rounded-full px-2.5 py-0.5"
                  >
                    {req.status === "APPROVED"
                      ? "อนุมัติแล้ว"
                      : req.status === "PENDING"
                        ? "รออนุมัติ"
                        : req.status === "REJECTED"
                          ? "ไม่อนุมัติ"
                          : "ยกเลิกแล้ว"}
                  </Badge>
                </div>
                <span className="font-mono text-[11px] text-[#533afd] font-semibold">
                  {req.requestNumber}
                </span>
              </div>

              <div className="rounded-xl bg-[#f6f9fc] p-3 text-xs text-[#64748d] space-y-1.5 border border-[#e3e8ee]/60">
                <div className="flex justify-between">
                  <span className="text-[#64748d]/80">ช่วงวันที่ลา:</span>
                  <span className="font-medium text-[#0d253d] tabular-nums">
                    {new Date(req.startDate).toLocaleDateString("th-TH")} -{" "}
                    {new Date(req.endDate).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748d]/80">จำนวนวันลา:</span>
                  <span className="font-bold text-[#533afd] tabular-nums font-mono">
                    {req.totalDays} วัน
                  </span>
                </div>
              </div>

              {/* Rejection Reason Alert if Rejected */}
              {req.status === "REJECTED" && req.rejectionReason && (
                <div className="rounded-xl border border-[#fecdd3] bg-[#ffe4e6] p-2.5 text-xs text-[#ea2261]">
                  <div className="flex items-start space-x-1.5">
                    <AlertCircle className="h-4 w-4 text-[#ea2261] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">เหตุผลที่ไม่อนุมัติ:</p>
                      <p className="mt-0.5 text-[#ea2261]">
                        {req.rejectionReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div
                className="flex items-center justify-between pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setSelectedRequest(req)}
                  className="text-xs text-[#533afd] font-semibold hover:underline flex items-center cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> ดูรายละเอียด
                </button>

                {req.status === "PENDING" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(req)}
                    className="h-7 text-xs text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] rounded-full px-3"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" /> ขอยกเลิกใบลา
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* 1. Details Modal (Mobile Full Detail Modal) */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent
          className="max-w-md p-5 rounded-2xl"
          onClose={() => setSelectedRequest(null)}
        >
          {selectedRequest && (
            <div className="space-y-4 text-xs">
              <DialogHeader>
                <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-2.5">
                  <DialogTitle className="text-base font-bold text-[#0d253d]">
                    รายละเอียดคำขอลา
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
                    className="text-[10px] rounded-full px-2.5 py-0.5"
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
              </DialogHeader>

              {/* Number and Leave Type */}
              <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-[#f6f9fc]">
                <p className="text-[#64748d] font-semibold">เลขที่ใบลา</p>
                <p className="font-mono font-bold text-[#533afd] text-sm">
                  {selectedRequest.requestNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-white">
                  <p className="text-[#64748d] font-semibold">ประเภทการลา</p>
                  <p className="font-bold text-[#0d253d] text-sm">
                    {selectedRequest.leaveType.name}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-white">
                  <p className="text-[#64748d] font-semibold">จำนวนวัน</p>
                  <p className="font-bold text-[#533afd] text-lg tabular-nums font-mono">
                    {selectedRequest.totalDays} วัน
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-2 bg-white">
                <div className="flex items-center space-x-1.5 font-semibold text-[#0d253d]">
                  <Calendar className="h-4 w-4 text-[#533afd]" />
                  <span>วันและเวลาที่ลา</span>
                </div>
                <div className="space-y-1 text-[#64748d] pl-5">
                  <p>
                    <span className="font-medium text-[#0d253d]">เริ่ม:</span>{" "}
                    {new Date(selectedRequest.startDate).toLocaleDateString(
                      "th-TH",
                    )}{" "}
                    ({periodText(selectedRequest.startPeriod)})
                  </p>
                  <p>
                    <span className="font-medium text-[#0d253d]">สิ้นสุด:</span>{" "}
                    {new Date(selectedRequest.endDate).toLocaleDateString(
                      "th-TH",
                    )}{" "}
                    ({periodText(selectedRequest.endPeriod)})
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="rounded-xl border border-[#e3e8ee] p-3 space-y-1 bg-white">
                <div className="flex items-center space-x-1.5 font-semibold text-[#0d253d]">
                  <FileText className="h-4 w-4 text-[#533afd]" />
                  <span>เหตุผลการลา</span>
                </div>
                <p className="text-[#0d253d] bg-[#f6f9fc] p-2.5 rounded-lg">
                  {selectedRequest.reason || "ไม่ระบุเหตุผล"}
                </p>
              </div>

              {/* Rejection Note if Rejected */}
              {selectedRequest.status === "REJECTED" &&
                selectedRequest.rejectionReason && (
                  <div className="rounded-xl border border-[#fecdd3] bg-[#ffe4e6] p-3 space-y-1 text-[#ea2261]">
                    <p className="font-bold">เหตุผลที่ไม่อนุมัติ:</p>
                    <p>{selectedRequest.rejectionReason}</p>
                  </div>
                )}

              <DialogFooter className="pt-2 flex flex-col gap-2">
                {selectedRequest.status === "PENDING" && (
                  <Button
                    variant="outline"
                    onClick={() => setCancelTarget(selectedRequest)}
                    className="rounded-full text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] text-xs h-9 w-full"
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> ขอยกเลิกคำขอนี้
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-full w-full text-xs h-9"
                >
                  ปิดหน้าต่าง
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 2. Alert Dialog: ยืนยันการยกเลิกใบลา */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#ea2261] flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการยกเลิกคำขอลางาน?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะยกเลิกคำขอลางานเลขที่{" "}
              <strong className="text-[#0d253d]">
                {cancelTarget?.requestNumber}
              </strong>{" "}
              (จำนวน {cancelTarget?.totalDays} วัน) เมื่อยกเลิกแล้ว
              โควตาวันลาที่รอการอนุมัติจะถูกคืนเข้าสู่ยอดคงเหลือของคุณ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isCancelling}
              className="rounded-full text-xs"
            >
              ย้อนกลับ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="rounded-full bg-[#ea2261] hover:bg-[#d01750] text-white text-xs font-semibold"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ยืนยันการยกเลิกใบลา"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
