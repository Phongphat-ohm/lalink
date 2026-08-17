import { requireTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const tenant = await requireTenantContext();

  const auditLogs = await prisma.auditLog.findMany({
    where: { companyId: tenant.companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  function getActionBadgeVariant(action: string) {
    if (action.includes("APPROVE") || action.includes("CREATE"))
      return "success";
    if (action.includes("REJECT") || action.includes("DELETE"))
      return "destructive";
    if (action.includes("CANCEL") || action.includes("UPDATE"))
      return "warning";
    return "outline";
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
          <ShieldAlert className="h-6 w-6 mr-2 text-teal-600" />
          บันทึกประวัติการทำงาน (Audit Trail)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          บันทึกกิจกรรมและความปลอดภัยของระบบแบบไม่สามารถแก้ไขได้เพื่อความโปร่งใสและการตรวจสอบย้อนหลัง
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            รายการบันทึกกิจกรรมล่าสุด (50 รายการล่าสุด)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th className="p-3.5">วัน/เวลา</th>
                  <th className="p-3.5">ผู้กระทำ (Actor)</th>
                  <th className="p-3.5">กิจกรรม (Action)</th>
                  <th className="p-3.5">ทรัพยากร (Resource)</th>
                  <th className="p-3.5">รายละเอียด (Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      ยังไม่มีบันทึกกิจกรรมในระบบ
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {log.createdAt.toLocaleString("th-TH")}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono"
                          >
                            {log.actorType}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant={getActionBadgeVariant(log.action)}
                          className="text-[10px] font-mono"
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-slate-700 whitespace-nowrap font-mono">
                        {log.resource}{" "}
                        {log.resourceId
                          ? `(${log.resourceId.slice(0, 8)}...)`
                          : ""}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs font-mono text-[11px] truncate">
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
