import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  CalendarCheck,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "USER") {
    redirect("/admin/login");
  }

  if (session.role === "SYSTEM_ADMIN") {
    redirect("/system-admin");
  }

  const companyId = session.companyId!;

  // Fetch real metrics in parallel
  const [
    company,
    totalEmployees,
    pendingLeaves,
    todayLeaves,
    recentPendingRequests,
  ] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.employee.count({
      where: { companyId, status: "ACTIVE" },
    }),
    prisma.leaveRequest.count({
      where: { companyId, status: "PENDING" },
    }),
    prisma.leaveRequest.count({
      where: {
        companyId,
        status: "APPROVED",
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { companyId, status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          include: { department: true, position: true },
        },
        leaveType: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Atmospheric Light Mesh Gradient */}
      <div className="rounded-2xl mesh-gradient p-6 sm:p-7 text-[#0d253d] shadow-[0_1px_3px_rgba(0,55,112,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#e3e8ee]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 shadow-xs px-3 py-1 text-xs font-semibold text-[#533afd] mb-2.5 border border-[#e3e8ee]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#533afd]" /> Tenant:{" "}
            {company?.code} ({company?.name})
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0d253d] display-title">
            สวัสดี, {session.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748d] mt-1">
            ยินดีต้อนรับสู่ระบบบริหารจัดการวันลาและสิทธิ์การอนุมัติองค์กร LALINK
          </p>
        </div>
        <Badge className="bg-[#533afd] text-white border-0 px-3.5 py-1.5 text-xs rounded-full shadow-sm">
          สิทธิ์การใช้งาน: {session.role}
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              พนักงานทั้งหมด
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {totalEmployees}
            </div>
            <p className="text-xs text-[#64748d] mt-1">สถานะ Active ในระบบ</p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              ใบลารอการอนุมัติ
            </CardTitle>
            <div className="p-2 rounded-full bg-[#fde68a]/40 text-[#d97706]">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706] tabular-nums font-mono">
              {pendingLeaves}
            </div>
            <p className="text-xs text-[#64748d] mt-1">รอการพิจารณาตรวจสอบ</p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              พนักงานลางานวันนี้
            </CardTitle>
            <div className="p-2 rounded-full bg-[#ecfdf5] text-[#059669]">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {todayLeaves}
            </div>
            <p className="text-xs text-[#64748d] mt-1">อนุมัติแล้ว</p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              สถานะระบบองค์กร
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-[#059669] flex items-center">
              <span className="h-2 w-2 rounded-full bg-[#059669] mr-1.5 animate-pulse" />
              Active (Enterprise)
            </div>
            <p className="text-xs text-[#64748d] mt-1">SaaS Multi-Tenant</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval List Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[#0d253d]">
              รายการใบลารอการอนุมัติล่าสุด
            </CardTitle>
            <p className="text-xs text-[#64748d] mt-0.5">
              คลิกเพื่อตรวจสอบรายละเอียดและดำเนินการอนุมัติ/ไม่อนุมัติ
            </p>
          </div>
          <Link href="/admin/leave-requests">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full border-[#e3e8ee] text-[#533afd] hover:bg-[#533afd]/10 font-semibold px-3.5 h-8"
            >
              ดูทั้งหมด ({pendingLeaves}){" "}
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {recentPendingRequests.length === 0 ? (
            <div className="py-10 text-center text-[#64748d] text-xs">
              ไม่มีรายการใบลารออนุมัติในขณะนี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3.5 px-4 pl-5 font-semibold">
                      เลขที่ใบลา
                    </th>
                    <th className="py-3.5 px-4 font-semibold">พนักงาน</th>
                    <th className="py-3.5 px-4 font-semibold">แผนก</th>
                    <th className="py-3.5 px-4 font-semibold">ประเภทการลา</th>
                    <th className="py-3.5 px-4 font-semibold">ช่วงวันที่</th>
                    <th className="py-3.5 px-4 font-semibold">จำนวนวัน</th>
                    <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                      ดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {recentPendingRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-semibold text-[#533afd] tabular-nums">
                        {req.requestNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {req.employee.firstName} {req.employee.lastName}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {req.employee.department?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-[#0d253d] font-medium">
                        {req.leaveType.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {req.startDate.toLocaleDateString("th-TH")} -{" "}
                        {req.endDate.toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#0d253d] tabular-nums font-mono">
                        {Number(req.totalDays)} วัน
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        <Link href={`/admin/leave-requests`}>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full px-3"
                          >
                            พิจารณา
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
