import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { LeaveHistoryList } from "@/components/liff/leave-history-list";
import { LiffNav } from "@/components/liff/liff-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function LiffHistoryPage() {
  const session = await getSession();

  if (!session || session.type !== "EMPLOYEE" || !session.employeeId) {
    redirect("/liff/connect");
  }

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: session.employeeId,
      companyId: session.companyId!,
    },
    orderBy: { createdAt: "desc" },
    include: {
      leaveType: true,
      leaveApprovals: {
        orderBy: { stepOrder: "asc" },
        include: { approver: { select: { name: true } } },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  const serializedRequests = leaveRequests.map((req) => ({
    id: req.id,
    requestNumber: req.requestNumber,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
    startPeriod: req.startPeriod,
    endPeriod: req.endPeriod,
    totalDays: Number(req.totalDays),
    reason: req.reason,
    status: req.status,
    rejectionReason: req.rejectionReason,
    createdAt: req.createdAt.toISOString(),
    attachments: req.attachments.map((att) => ({
      id: att.id,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      createdAt: att.createdAt.toISOString(),
    })),
    leaveType: {
      name: req.leaveType.name,
      code: req.leaveType.code,
      isPaid: req.leaveType.isPaid,
    },
    approvals: req.leaveApprovals.map((a) => ({
      id: a.id,
      stepOrder: a.stepOrder,
      roleCode: a.roleCode,
      status: a.status,
      comment: a.comment,
      actedAt: a.actedAt?.toISOString() ?? null,
      approverName: a.approver?.name ?? null,
    })),
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center space-x-3 py-3 border-b border-slate-200">
        <Link href="/liff/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-base font-bold text-slate-900">ประวัติการลางาน</h1>
      </div>

      <div className="mt-4">
        <LeaveHistoryList initialRequests={serializedRequests} />
      </div>

      {/* Bottom Nav */}
      <LiffNav />
    </div>
  );
}
