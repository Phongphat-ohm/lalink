import { prisma } from "@/lib/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, CheckCircle2, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemAdminEmployeesPage() {
  const employees = await prisma.employee.findMany({
    include: {
      company: { select: { name: true, code: true } },
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
          รายชื่อพนักงานทั้งหมดในระบบ (LIFF Users)
        </h1>
        <p className="text-xs text-[#64748d] mt-0.5">
          ภาพรวมพนักงานทั้งหมดข้ามทุกองค์กร และสถานะการผูกบัญชี LINE Messaging
          API
        </p>
      </div>

      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">
                    รหัสพนักงาน
                  </th>
                  <th className="py-3.5 px-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 font-semibold">องค์กรต้นสังกัด</th>
                  <th className="py-3.5 px-4 font-semibold">แผนก / ตำแหน่ง</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ LINE</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะพนักงาน</th>
                  <th className="py-3.5 px-4 pr-5 font-semibold">สร้างเมื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ยังไม่มีข้อมูลพนักงานในระบบ
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-mono font-bold text-[#533afd] tabular-nums">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#0d253d]">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-[#0d253d]">
                            {emp.company.name}
                          </span>
                          <span className="font-mono text-[10px] text-[#533afd] bg-[#533afd]/10 px-1.5 py-0.5 rounded-full">
                            {emp.company.code}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d]">
                        {emp.department?.name || "-"} /{" "}
                        {emp.position?.name || "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.lineUserId ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                            เชื่อมต่อแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-[#64748d] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-full">
                            ยังไม่เชื่อมต่อ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            emp.status === "ACTIVE" ? "success" : "destructive"
                          }
                          className="text-[10px] rounded-full px-2 py-0.5"
                        >
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-[#64748d] tabular-nums">
                        {new Date(emp.createdAt).toLocaleDateString("th-TH")}
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
