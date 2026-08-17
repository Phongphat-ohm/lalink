import { prisma } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Database, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemAdminAuditLogsPage() {
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      company: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          บันทึกกิจกรรมระดับแพลตฟอร์ม (Platform Audit Logs)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ประวัติการกระทำ การเปลี่ยนแปลงสิทธิ์
          และธุรกรรมสำคัญทั้งหมดในระดับโครงสร้างพื้นฐาน
        </p>
      </div>

      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">วัน-เวลา</th>
                  <th className="py-3.5 px-4 font-semibold">ประเภท Action</th>
                  <th className="py-3.5 px-4 font-semibold">Resource</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กร</th>
                  <th className="py-3.5 px-4 font-semibold">
                    ผู้กระทำ (Actor)
                  </th>
                  <th className="py-3.5 px-4 pr-5 font-semibold">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#64748d] font-sans"
                    >
                      ยังไม่มีบันทึก Audit Logs ในระบบ
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 text-[#64748d] tabular-nums whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#533afd] bg-[#533afd]/10 px-2 py-0.5 rounded-full text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#0d253d] font-semibold">
                        {log.resource}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {log.company ? (
                          <div className="flex items-center space-x-1">
                            <span className="font-semibold text-[#0d253d]">
                              {log.company.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#533afd]">
                              ({log.company.code})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#64748d] italic font-mono text-[11px]">
                            PLATFORM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] text-[11px]">
                        {log.actorType} (
                        {log.actorId ? log.actorId.slice(-6) : "SYSTEM"})
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-[#64748d] text-[11px] max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
