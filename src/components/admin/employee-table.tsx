"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  createEmployeeAdminAction,
  unlinkLineEmployeeAction,
  anonymizeEmployeeAction,
} from "@/features/employee";
import {
  UserPlus,
  Link2,
  Unlink,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Shield,
} from "lucide-react";

export interface SerializedEmployee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  status: string;
  lineUserId: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
}

interface EmployeeTableProps {
  initialEmployees: SerializedEmployee[];
  departments: { id: string; name: string }[];
  positions: { id: string; name: string }[];
}

export function EmployeeTable({
  initialEmployees,
  departments,
  positions,
}: EmployeeTableProps) {
  const router = useRouter();
  const [employees, setEmployees] = React.useState(initialEmployees);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createMessage, setCreateMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // View / Manage Employee Modal State
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<SerializedEmployee | null>(null);

  // Unlink Dialog State
  const [unlinkTarget, setUnlinkTarget] =
    React.useState<SerializedEmployee | null>(null);
  const [isUnlinking, setIsUnlinking] = React.useState(false);

  // PDPA Anonymize Dialog State
  const [anonymizeTarget, setAnonymizeTarget] =
    React.useState<SerializedEmployee | null>(null);
  const [isAnonymizing, setIsAnonymizing] = React.useState(false);

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.employeeCode.toLowerCase().includes(term) ||
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      (emp.email && emp.email.toLowerCase().includes(term)) ||
      (emp.department && emp.department.name.toLowerCase().includes(term))
    );
  });

  async function handleCreateEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setCreateMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await createEmployeeAdminAction(null, formData);

    setIsCreating(false);

    if (result.success) {
      setCreateMessage({
        type: "success",
        text: result.message || "เพิ่มพนักงานสำเร็จ",
      });
      form.reset();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setCreateMessage(null);
      }, 1200);
      router.refresh();
    } else {
      setCreateMessage({
        type: "error",
        text: result.message || "เกิดข้อผิดพลาดในการเพิ่มพนักงาน",
      });
    }
  }

  async function handleConfirmUnlink() {
    if (!unlinkTarget) return;

    setIsUnlinking(true);
    const result = await unlinkLineEmployeeAction(unlinkTarget.id);
    setIsUnlinking(false);

    if (result.success) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === unlinkTarget.id ? { ...e, lineUserId: null } : e,
        ),
      );
      if (selectedEmployee?.id === unlinkTarget.id) {
        setSelectedEmployee((prev) =>
          prev ? { ...prev, lineUserId: null } : null,
        );
      }
      setUnlinkTarget(null);
      router.refresh();
    }
  }

  async function handleConfirmAnonymize() {
    if (!anonymizeTarget) return;

    setIsAnonymizing(true);
    const result = await anonymizeEmployeeAction(anonymizeTarget.id);
    setIsAnonymizing(false);

    if (result.success) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === anonymizeTarget.id
            ? {
                ...e,
                firstName: "อดีตพนักงาน",
                lastName: `(รหัส ${e.employeeCode})`,
                email: null,
                phone: null,
                lineUserId: null,
                status: "RESIGNED",
              }
            : e,
        ),
      );
      setAnonymizeTarget(null);
      setSelectedEmployee(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
          <Input
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-full border-[#a8c3de]/60 focus-visible:border-[#533afd]"
          />
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] shadow-xs px-5 font-semibold text-xs sm:text-sm h-10"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          เพิ่มพนักงานใหม่
        </Button>
      </div>

      {/* Main Employee Table Card */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-5 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-[#0d253d]">
              รายชื่อพนักงานทั้งหมด ({filteredEmployees.length} คน)
            </CardTitle>
            <p className="text-xs text-[#64748d] mt-0.5">
              จัดการข้อมูลส่วนบุคคล การผูกบัญชี LINE และโควตาวันลา
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f6f9fc] text-[#64748d] font-semibold border-b border-[#e3e8ee]">
                <tr>
                  <th className="p-3.5 pl-5">รหัสพนักงาน</th>
                  <th className="p-3.5">ชื่อ-นามสกุล</th>
                  <th className="p-3.5">แผนก / ตำแหน่ง</th>
                  <th className="p-3.5">สถานะ LINE</th>
                  <th className="p-3.5">สถานะพนักงาน</th>
                  <th className="p-3.5 text-right pr-5">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-[#64748d] bg-white"
                    >
                      {searchTerm
                        ? "ไม่พบข้อมูลพนักงานที่ตรงกับคำค้นหา"
                        : "ยังไม่มีข้อมูลพนักงานในระบบ กรุณากดปุ่มเพิ่มพนักงานใหม่"}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isLinked = !!emp.lineUserId;

                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-[#f6f9fc]/80 transition-colors"
                      >
                        <td className="p-3.5 pl-5 font-mono font-medium text-[#0d253d] tabular-nums">
                          {emp.employeeCode}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-[#0d253d]">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-[11px] text-[#64748d]">
                            {emp.email || "-"}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="text-[#0d253d] font-medium">
                            {emp.department?.name || "-"}
                          </div>
                          <div className="text-[11px] text-[#64748d]">
                            {emp.position?.name || "-"}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {isLinked ? (
                            <Badge
                              variant="success"
                              className="rounded-full text-[10px] py-0.5"
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              เชื่อมต่อแล้ว
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="rounded-full text-[10px] py-0.5 text-[#64748d]"
                            >
                              ยังไม่เชื่อมต่อ
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant={
                              emp.status === "ACTIVE"
                                ? "success"
                                : emp.status === "PROBATION"
                                  ? "warning"
                                  : "destructive"
                            }
                            className="rounded-full text-[10px] py-0.5"
                          >
                            {emp.status === "ACTIVE"
                              ? "ปฏิบัติงานปกติ"
                              : emp.status === "PROBATION"
                                ? "ทดลองงาน"
                                : "พ้นสภาพ"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEmployee(emp)}
                              className="h-7.5 px-2.5 text-xs rounded-full border-[#e3e8ee] hover:border-[#533afd] hover:text-[#533afd]"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              ดูข้อมูล
                            </Button>

                            {isLinked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUnlinkTarget(emp)}
                                className="h-7.5 px-2.5 text-xs rounded-full text-[#ea2261] hover:bg-[#ffe4e6]"
                              >
                                <Unlink className="h-3.5 w-3.5 mr-1" />
                                ปลด LINE
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal 1: Add Employee Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-xl rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <UserPlus className="h-5 w-5 text-[#533afd] mr-2" />
              เพิ่มพนักงานใหม่เข้าสู่ระบบ
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกข้อมูลพนักงานเพื่อบันทึกเข้าสู่องค์กรและสร้างโควตาวันลาเริ่มต้นอัตโนมัติ
            </DialogDescription>
          </DialogHeader>

          {createMessage && (
            <div
              className={`my-3 rounded-xl p-3 text-xs font-medium flex items-center ${
                createMessage.type === "success"
                  ? "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]"
                  : "bg-[#ffe4e6] text-[#ea2261] border border-[#fecdd3]"
              }`}
            >
              {createMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
              )}
              <span>{createMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleCreateEmployee} className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Employee Code */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  รหัสพนักงาน <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  name="employeeCode"
                  placeholder="เช่น EMP001"
                  required
                  className="h-10 uppercase rounded-xl"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  วัน/เดือน/ปี เกิด <span className="text-[#ea2261]">*</span>
                </label>
                <div className="relative w-full min-w-0">
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    className="date-input-fixed block w-full rounded-xl border border-[#a8c3de]/60 bg-white px-3.5 py-2 text-xs text-[#0d253d] focus:border-[#533afd] focus:outline-none focus:ring-2 focus:ring-[#533afd]/20"
                  />
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อจริง <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  name="firstName"
                  placeholder="เช่น สมชาย"
                  required
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  นามสกุล <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  name="lastName"
                  placeholder="เช่น ใจดี"
                  required
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  แผนก
                </label>
                <Select name="departmentId" className="h-10 rounded-xl">
                  <option value="">-- ไม่ระบุแผนก --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Position */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ตำแหน่ง
                </label>
                <Select name="positionId" className="h-10 rounded-xl">
                  <option value="">-- ไม่ระบุตำแหน่ง --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  อีเมล
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="somchai@company.com"
                  className="h-10 rounded-xl"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  เบอร์โทรศัพท์
                </label>
                <Input
                  name="phone"
                  placeholder="081-234-5678"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full h-9 px-4 text-xs font-medium"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 px-5 text-xs font-semibold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกข้อมูลพนักงาน"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Employee Details & Management Dialog */}
      {selectedEmployee && (
        <Dialog
          open={!!selectedEmployee}
          onOpenChange={(open) => !open && setSelectedEmployee(null)}
        >
          <DialogContent
            onClose={() => setSelectedEmployee(null)}
            className="max-w-lg rounded-2xl p-6"
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-[#0d253d]">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </DialogTitle>
                  <p className="text-xs font-mono text-[#64748d] mt-0.5">
                    รหัสพนักงาน: {selectedEmployee.employeeCode}
                  </p>
                </div>
                <Badge
                  variant={
                    selectedEmployee.status === "ACTIVE"
                      ? "success"
                      : "destructive"
                  }
                  className="rounded-full"
                >
                  {selectedEmployee.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-4 divide-y divide-[#e3e8ee]">
              {/* Personal Details */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <span className="text-[#64748d]">แผนก:</span>
                  <p className="font-semibold text-[#0d253d] mt-0.5">
                    {selectedEmployee.department?.name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748d]">ตำแหน่ง:</span>
                  <p className="font-semibold text-[#0d253d] mt-0.5">
                    {selectedEmployee.position?.name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748d]">อีเมล:</span>
                  <p className="font-semibold text-[#0d253d] mt-0.5">
                    {selectedEmployee.email || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[#64748d]">เบอร์โทรศัพท์:</span>
                  <p className="font-semibold text-[#0d253d] mt-0.5">
                    {selectedEmployee.phone || "-"}
                  </p>
                </div>
              </div>

              {/* LINE Connection Info */}
              <div className="pt-3">
                <span className="text-xs font-semibold text-[#0d253d] block mb-2">
                  สถานะการเชื่อมต่อ LINE
                </span>
                {selectedEmployee.lineUserId ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] p-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <Link2 className="h-4 w-4 text-[#059669]" />
                      <span className="font-semibold text-[#059669]">
                        เชื่อมต่อกับ LINE Account แล้ว
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnlinkTarget(selectedEmployee)}
                      className="h-7 px-2.5 text-xs text-[#ea2261] hover:bg-[#ffe4e6] rounded-full"
                    >
                      ปลดการเชื่อมต่อ
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] p-3 text-xs text-[#64748d]">
                    ยังไม่มีการเชื่อมต่อกับ LINE LIFF
                    (พนักงานสามารถเชื่อมต่อผ่าน LINE App)
                  </div>
                )}
              </div>

              {/* PDPA & Data Governance */}
              <div className="pt-3">
                <span className="text-xs font-semibold text-[#0d253d] block mb-1">
                  การจัดการข้อมูลตาม PDPA
                </span>
                <p className="text-[11px] text-[#64748d] mb-2">
                  หากพนักงานลาออกหรือร้องขอลบข้อมูล สามารถทำการ Anonymize
                  ข้อมูลส่วนบุคคลได้
                </p>
                {selectedEmployee.status !== "RESIGNED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAnonymizeTarget(selectedEmployee)}
                    className="h-8 px-3 text-xs text-[#ea2261] border-[#ea2261]/30 hover:bg-[#ffe4e6] rounded-full"
                  >
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    ลบข้อมูลส่วนบุคคล (PDPA Erasure)
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedEmployee(null)}
                className="rounded-full w-full sm:w-auto h-9 text-xs"
              >
                ปิดหน้าต่าง
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Alert Dialog: Unlink Confirmation */}
      <AlertDialog
        open={!!unlinkTarget}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d]">
              ยืนยันการยกเลิกการเชื่อมต่อ LINE?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะยกเลิกการเชื่อมต่อ LINE ของคุณ{" "}
              <strong className="text-[#0d253d]">
                {unlinkTarget?.firstName} {unlinkTarget?.lastName}
              </strong>{" "}
              พนักงานจะไม่ได้รับการแจ้งเตือนทาง LINE
              และจะต้องยืนยันตัวตนใหม่เมื่อเปิดใช้งาน LIFF
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isUnlinking}
              className="rounded-full text-xs"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnlink}
              disabled={isUnlinking}
              className="rounded-full bg-[#ea2261] text-white hover:bg-[#d01750] text-xs font-semibold"
            >
              {isUnlinking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ยืนยันการปลดการเชื่อมต่อ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog: PDPA Anonymize Confirmation */}
      <AlertDialog
        open={!!anonymizeTarget}
        onOpenChange={(open) => !open && setAnonymizeTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#ea2261] flex items-center">
              <Shield className="h-5 w-5 mr-2 text-[#ea2261]" />
              ยืนยันการลบข้อมูลส่วนบุคคล (PDPA Erasure)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              ข้อมูลส่วนบุคคล (ชื่อจริง, นามสกุล, อีเมล, เบอร์โทรศัพท์, วันเกิด,
              LINE User ID) ของ{" "}
              <strong className="text-[#0d253d]">
                {anonymizeTarget?.firstName} {anonymizeTarget?.lastName}
              </strong>{" "}
              จะถูกทำให้เป็นนิรนาม (Anonymized) ทันทีเพื่อปฏิบัติตาม พ.ร.บ.
              คุ้มครองข้อมูลส่วนบุคคล (PDPA)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isAnonymizing}
              className="rounded-full text-xs"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAnonymize}
              disabled={isAnonymizing}
              className="rounded-full bg-[#ea2261] text-white hover:bg-[#d01750] text-xs font-semibold"
            >
              {isAnonymizing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                "ยืนยันการลบข้อมูลส่วนบุคคล"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
