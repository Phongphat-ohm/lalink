import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import {
  buildEmployeeAnnouncementWhere,
  buildEmployeeAnnouncementOrderBy,
} from "@/lib/announcement/target";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LiffNav,
  LiffGreetingHeader,
  LiffLeaveCalendar,
  SerializedCalendarLeave,
  SerializedCalendarHoliday,
} from "@/components/liff";
import { PlusCircle, ChevronRight, BellRing } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LiffDashboardPage() {
  const session = await getSession();

  if (!session || session.type !== "EMPLOYEE" || !session.employeeId) {
    redirect("/liff/connect");
  }

  const currentYear = new Date().getFullYear();

  // Fetch Employee details, Balances, Leave Requests, and Company Holidays
  const [employee, calendarLeaves, holidays] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: session.employeeId },
      include: {
        company: {
          select: {
            name: true,
            code: true,
          },
        },
        department: true,
        position: true,
        leaveBalances: {
          where: { year: currentYear },
          include: { leaveType: true },
          orderBy: { leaveType: { name: "asc" } },
        },
        leaveRequests: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: { leaveType: true },
        },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId: session.employeeId,
        status: { in: ["APPROVED", "PENDING"] },
      },
      include: { leaveType: true },
      orderBy: { startDate: "asc" },
    }),
    prisma.holiday.findMany({
      where: {
        companyId: session.companyId!,
        year: currentYear,
      },
      orderBy: { date: "asc" },
    }),
  ]);

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
    take: 3,
    select: { id: true, title: true, isPinned: true, publishedAt: true },
  });

  const serializedCalendarLeaves: SerializedCalendarLeave[] =
    calendarLeaves.map((l) => ({
      id: l.id,
      requestNumber: l.requestNumber,
      startDate: l.startDate.toISOString(),
      endDate: l.endDate.toISOString(),
      startPeriod: l.startPeriod,
      endPeriod: l.endPeriod,
      status: l.status,
      totalDays: Number(l.totalDays),
      leaveType: {
        name: l.leaveType.name,
        code: l.leaveType.code,
      },
    }));

  const serializedHolidays: SerializedCalendarHoliday[] = holidays.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    name: h.name,
  }));

  return (
    <div className="min-h-screen bg-[#f6f9fc] p-4 pb-24 space-y-5">
      {/* 1. Employee Greeting Header with Live LINE Profile Avatar */}
      <LiffGreetingHeader
        employee={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeCode: employee.employeeCode,
          avatarUrl: employee.avatarUrl,
          company: employee.company,
        }}
      />

      {/* 1.5. Announcements Preview */}
      {announcements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              ประกาศล่าสุด
            </h2>
            <Link
              href="/liff/announcements"
              className="text-xs font-semibold text-[#533afd] hover:underline flex items-center"
            >
              ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {announcements.map((a) => (
              <Link key={a.id} href="/liff/announcements" className="block">
                <div
                  className={`rounded-2xl border bg-white p-3.5 shadow-[0_1px_3px_rgba(0,55,112,0.06)] flex items-center justify-between ${
                    a.isPinned ? "border-[#533afd]/40" : "border-[#e3e8ee]"
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                        a.isPinned
                          ? "bg-[#533afd]/10 text-[#533afd]"
                          : "bg-[#f6f9fc] text-[#64748d]"
                      }`}
                    >
                      <BellRing className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0d253d] truncate">
                        {a.isPinned ? "📌 " : ""}
                        {a.title}
                      </p>
                      <p className="text-[10px] text-[#64748d] mt-0.5">
                        {new Date(a.publishedAt).toLocaleDateString("th-TH")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#94a3b8] shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Leave Balances Summary */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
            วันลาคงเหลือประจำปี {currentYear}
          </h2>
          <span className="text-[11px] text-[#64748d]">หน่วย: วัน</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {employee.leaveBalances.map((b) => (
            <Card
              key={b.id}
              className="border-[#e3e8ee] bg-white hover:border-[#533afd]/50 transition-colors shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl"
            >
              <CardHeader className="p-3.5 pb-1">
                <CardTitle className="text-xs text-[#0d253d] font-semibold truncate">
                  {b.leaveType.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-[#533afd] tabular-nums font-mono">
                    {Number(b.remainingDays)}
                  </span>
                  <span className="text-xs text-[#64748d] tabular-nums font-mono">
                    / {Number(b.allocatedDays)}
                  </span>
                </div>
                {Number(b.pendingDays) > 0 && (
                  <p className="text-[10px] text-[#d97706] font-medium mt-0.5 tabular-nums">
                    (รออนุมัติ {Number(b.pendingDays)} วัน)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Quick Action Button: ยื่นใบลา */}
      <div>
        <Link href="/liff/leave" className="block">
          <Button className="w-full bg-[#533afd] hover:bg-[#4434d4] h-12 text-sm font-semibold shadow-md rounded-full text-white">
            <PlusCircle className="mr-2 h-5 w-5" /> ยื่นใบลาออนไลน์
          </Button>
        </Link>
      </div>

      {/* 4. Interactive Leave & Holiday Calendar */}
      <div>
        <LiffLeaveCalendar
          leaveRequests={serializedCalendarLeaves}
          holidays={serializedHolidays}
        />
      </div>

      {/* 5. Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
            รายการลาล่าสุด
          </h2>
          <Link
            href="/liff/history"
            className="text-xs font-semibold text-[#533afd] hover:underline flex items-center"
          >
            ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </div>

        {employee.leaveRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e3e8ee] p-6 text-center text-[#64748d] text-xs bg-white shadow-xs">
            ยังไม่มีประวัติการยื่นใบลา
          </div>
        ) : (
          <div className="space-y-2.5">
            {employee.leaveRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-[#e3e8ee] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,55,112,0.06)] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-[#0d253d]">
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
                  </div>
                  <p className="text-[11px] text-[#64748d] mt-1 tabular-nums">
                    {req.startDate.toLocaleDateString("th-TH")} -{" "}
                    {req.endDate.toLocaleDateString("th-TH")} (
                    <span className="font-mono font-semibold text-[#0d253d]">
                      {Number(req.totalDays)} วัน
                    </span>
                    )
                  </p>
                </div>
                <span className="text-[10px] font-mono font-medium text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full">
                  {req.requestNumber}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <LiffNav />
    </div>
  );
}
