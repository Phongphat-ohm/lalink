import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { LeaveForm } from "@/components/liff/leave-form";
import { LiffNav } from "@/components/liff/liff-nav";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function LiffLeavePage() {
  const session = await getSession();

  if (!session || session.type !== "EMPLOYEE" || !session.employeeId) {
    redirect("/liff/connect");
  }

  const currentYear = new Date().getFullYear();

  // Fetch real active leave types & balances for the employee
  const [leaveTypes, balances] = await Promise.all([
    prisma.leaveType.findMany({
      where: {
        companyId: session.companyId!,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.leaveBalance.findMany({
      where: {
        employeeId: session.employeeId,
        companyId: session.companyId!,
        year: currentYear,
      },
    }),
  ]);

  const balanceMap = new Map(
    balances.map((b) => [b.leaveTypeId, Number(b.remainingDays)]),
  );

  const serializedTypes = leaveTypes.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    defaultDays: Number(t.defaultDays),
    allowHalfDay: t.allowHalfDay,
    requireReason: t.requireReason,
    requireAttachment: t.requireAttachment,
    attachmentRequiredDays: t.attachmentRequiredDays
      ? Number(t.attachmentRequiredDays)
      : null,
    isPaid: t.isPaid,
    remainingDays: balanceMap.get(t.id) ?? Number(t.defaultDays),
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 max-w-md mx-auto">
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
        <h1 className="text-base font-bold text-slate-900">ยื่นใบลาออนไลน์</h1>
      </div>

      <div className="mt-4">
        <LeaveForm leaveTypes={serializedTypes} />
      </div>

      {/* Bottom Nav */}
      <LiffNav />
    </div>
  );
}
