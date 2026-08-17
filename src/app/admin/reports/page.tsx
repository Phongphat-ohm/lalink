import { requireTenantContext } from "@/lib/tenant";
import { getLeaveSummaryReportAction } from "@/features/report";
import { ReportView } from "@/components/admin/report-view";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const tenant = await requireTenantContext();
  const currentYear = new Date().getFullYear();

  const reportResult = await getLeaveSummaryReportAction(currentYear);

  const initialData =
    reportResult.success && reportResult.data
      ? reportResult.data
      : {
          totalLeaveDays: 0,
          approvedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          totalEmployees: 0,
          departmentStats: [],
          leaveTypeStats: [],
        };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2 text-teal-600" />
          รายงานและสถิติการลา
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          สรุปภาพรวมสถิติการลาประจำปีของบริษัทและส่งออกรายงานสำหรับฝ่ายบุคคลและผู้บริหาร
        </p>
      </div>

      <ReportView initialData={initialData} year={currentYear} />
    </div>
  );
}
