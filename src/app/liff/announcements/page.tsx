import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import {
  buildEmployeeAnnouncementWhere,
  buildEmployeeAnnouncementOrderBy,
} from "@/lib/announcement/target";
import { LiffNav, LiffAnnouncementList } from "@/components/liff";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BellRing } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LiffAnnouncementsPage() {
  const session = await getSession();

  if (!session || session.type !== "EMPLOYEE" || !session.employeeId) {
    redirect("/liff/connect");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.employeeId },
    select: { branchId: true, departmentId: true },
  });

  if (!employee) {
    redirect("/liff/connect");
  }

  const announcements = await prisma.announcement.findMany({
    where: buildEmployeeAnnouncementWhere({
      companyId: session.companyId!,
      branchId: employee.branchId,
      departmentId: employee.departmentId,
    }),
    orderBy: buildEmployeeAnnouncementOrderBy(),
    include: {
      branch: { select: { name: true } },
      department: { select: { name: true } },
    },
  });

  const serialized = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    targetGroup: a.targetGroup,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt.toISOString(),
    branchName: a.branch?.name ?? null,
    departmentName: a.department?.name ?? null,
  }));

  return (
    <div className="min-h-screen bg-[#f6f9fc] p-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center space-x-3 py-3 border-b border-[#e3e8ee]">
        <Link href="/liff/dashboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#64748d] hover:text-[#0d253d] rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-base font-bold text-[#0d253d] flex items-center">
            <BellRing className="h-4 w-4 text-[#533afd] mr-1.5" />
            ประกาศจากองค์กร
          </h1>
          <p className="text-[11px] text-[#64748d]">
            ข่าวสารและประกาศที่เกี่ยวข้องกับคุณ
          </p>
        </div>
      </div>

      <div className="mt-4">
        <LiffAnnouncementList announcements={serialized} />
      </div>

      {/* Bottom Nav */}
      <LiffNav />
    </div>
  );
}