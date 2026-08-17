import { prisma } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  ShieldCheck,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Server,
  Database,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SystemAdminOverviewPage() {
  const [
    companies,
    totalUsers,
    totalEmployees,
    totalLeaveRequests,
    recentCompanies,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.company.findMany({
      include: {
        _count: {
          select: { employees: true, users: true, leaveRequests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
    prisma.employee.count(),
    prisma.leaveRequest.count(),
    prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { employees: true, users: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeCompanies = companies.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Light Mesh Gradient */}
      <div className="rounded-2xl mesh-gradient p-6 sm:p-7 text-[#0d253d] shadow-[0_1px_3px_rgba(0,55,112,0.06)] border border-[#e3e8ee] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 shadow-xs px-3 py-1 text-xs font-semibold text-[#533afd] mb-2.5 border border-[#e3e8ee]">
            <Server className="h-3.5 w-3.5 text-[#533afd]" /> LALINK Cloud
            Engine (Multi-Tenant)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0d253d] display-title">
            ศูนย์กลางควบคุมระบบ Super Admin
          </h1>
          <p className="text-xs sm:text-sm text-[#64748d] mt-1">
            ภาพรวมองค์กรทั้งหมด ข้อมูลระบบคลาวด์ และสถานะความปลอดภัยระดับ
            Infrastructure
          </p>
        </div>
        <Link href="/system-admin/companies">
          <Button className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] px-4 text-xs font-semibold shadow-sm">
            <Building2 className="h-4 w-4 mr-1.5" /> จัดการองค์กรทั้งหมด
          </Button>
        </Link>
      </div>

      {/* Top Platform Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              องค์กรทั้งหมด (Tenants)
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {companies.length}{" "}
              <span className="text-xs font-normal text-[#64748d]">บริษัท</span>
            </div>
            <p className="text-xs text-[#059669] font-medium mt-1">
              {activeCompanies} บริษัทเปิดใช้งานปกติ
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              ผู้ดูแลระบบทั้งหมด
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {totalUsers}{" "}
              <span className="text-xs font-normal text-[#64748d]">บัญชี</span>
            </div>
            <p className="text-xs text-[#64748d] mt-1">Admin / HR / Manager</p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              พนักงานทั้งหมด (LINE LIFF)
            </CardTitle>
            <div className="p-2 rounded-full bg-[#ecfdf5] text-[#059669]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0d253d] tabular-nums font-mono">
              {totalEmployees}{" "}
              <span className="text-xs font-normal text-[#64748d]">คน</span>
            </div>
            <p className="text-xs text-[#64748d] mt-1">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748d] uppercase tracking-wider">
              คำขอลาทั้งหมดในระบบ
            </CardTitle>
            <div className="p-2 rounded-full bg-[#533afd]/10 text-[#533afd]">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#533afd] tabular-nums font-mono">
              {totalLeaveRequests}{" "}
              <span className="text-xs font-normal text-[#64748d]">รายการ</span>
            </div>
            <p className="text-xs text-[#64748d] mt-1">Total leave processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Recent Companies and Platform Audit Trail */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Companies */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-[#533afd]" />
              องค์กรล่าสุดในระบบ
            </CardTitle>
            <Link href="/system-admin/companies">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-full border-[#e3e8ee] text-[#533afd] hover:bg-[#533afd]/10 font-semibold px-3"
              >
                ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#e3e8ee]/70 text-xs">
              {recentCompanies.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between hover:bg-[#f6f9fc]/70 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#0d253d]">{c.name}</span>
                      <span className="font-mono text-[11px] font-semibold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full">
                        {c.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748d]">
                      {c._count.employees} พนักงาน • {c._count.users} แอดมิน
                    </p>
                  </div>
                  <Badge
                    variant={c.status === "ACTIVE" ? "success" : "destructive"}
                    className="text-[10px] rounded-full px-2.5 py-0.5"
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Audit Trail */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
              <Database className="h-4 w-4 mr-2 text-[#533afd]" />
              ความเคลื่อนไหวระดับแพลตฟอร์ม (Audit Logs)
            </CardTitle>
            <Link href="/system-admin/audit-logs">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-full border-[#e3e8ee] text-[#533afd] hover:bg-[#533afd]/10 font-semibold px-3"
              >
                ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[#e3e8ee]/70 text-xs">
              {recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#f6f9fc]/70 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-[#533afd]">
                        {log.action}
                      </span>
                      <span className="text-[#64748d] text-[11px]">
                        on {log.resource}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748d] font-mono">
                      Actor: {log.actorType} (
                      {log.actorId ? log.actorId.slice(-8) : "SYSTEM"})
                    </p>
                  </div>
                  <span className="text-[11px] text-[#64748d] tabular-nums">
                    {new Date(log.createdAt).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
