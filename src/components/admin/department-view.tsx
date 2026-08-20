"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Building, Plus, Briefcase, Loader2, Users, Pencil, Search } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface DepartmentViewProps {
  departments: {
    id: string;
    code: string | null;
    name: string;
    _count: { employees: number };
  }[];
  positions: {
    id: string;
    code: string | null;
    name: string;
    _count: { employees: number };
  }[];
  onAddDepartment: (
    name: string,
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onAddPosition: (
    name: string,
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onUpdateDepartment: (
    id: string,
    name: string,
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
  onUpdatePosition: (
    id: string,
    name: string,
    code: string,
  ) => Promise<{ success: boolean; message?: string }>;
}

export function DepartmentView({
  departments,
  positions,
  onAddDepartment,
  onAddPosition,
  onUpdateDepartment,
  onUpdatePosition,
}: DepartmentViewProps) {
  const router = useRouter();

  // Search & Pagination States
  const [deptSearch, setDeptSearch] = React.useState("");
  const [deptPage, setDeptPage] = React.useState(1);
  const [deptPageSize, setDeptPageSize] = React.useState(5);

  const [posSearch, setPosSearch] = React.useState("");
  const [posPage, setPosPage] = React.useState(1);
  const [posPageSize, setPosPageSize] = React.useState(5);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = React.useState(false);
  const [deptCode, setDeptCode] = React.useState("");
  const [deptName, setDeptName] = React.useState("");
  const [isAddingDept, setIsAddingDept] = React.useState(false);

  // Position Modal State
  const [isPosModalOpen, setIsPosModalOpen] = React.useState(false);
  const [posCode, setPosCode] = React.useState("");
  const [posName, setPosName] = React.useState("");
  const [isAddingPos, setIsAddingPos] = React.useState(false);

  // Edit Department State
  const [editDept, setEditDept] = React.useState<{
    id: string;
    code: string | null;
    name: string;
  } | null>(null);
  const [editDeptCode, setEditDeptCode] = React.useState("");
  const [editDeptName, setEditDeptName] = React.useState("");
  const [isUpdatingDept, setIsUpdatingDept] = React.useState(false);

  // Edit Position State
  const [editPos, setEditPos] = React.useState<{
    id: string;
    code: string | null;
    name: string;
  } | null>(null);
  const [editPosCode, setEditPosCode] = React.useState("");
  const [editPosName, setEditPosName] = React.useState("");
  const [isUpdatingPos, setIsUpdatingPos] = React.useState(false);

  async function handleCreateDept(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    setIsAddingDept(true);
    const res = await onAddDepartment(deptName, deptCode);
    setIsAddingDept(false);
    if (res.success) {
      setDeptCode("");
      setDeptName("");
      setIsDeptModalOpen(false);
      router.refresh();
    }
  }

  async function handleCreatePos(e: React.FormEvent) {
    e.preventDefault();
    if (!posName || !posCode) return;
    setIsAddingPos(true);
    const res = await onAddPosition(posName, posCode);
    setIsAddingPos(false);
    if (res.success) {
      setPosCode("");
      setPosName("");
      setIsPosModalOpen(false);
      router.refresh();
    }
  }

  function openEditDept(d: {
    id: string;
    code: string | null;
    name: string;
  }) {
    setEditDept(d);
    setEditDeptCode(d.code || "");
    setEditDeptName(d.name);
  }

  async function handleUpdateDept(e: React.FormEvent) {
    e.preventDefault();
    if (!editDept || !editDeptName || !editDeptCode) return;
    setIsUpdatingDept(true);
    const res = await onUpdateDepartment(editDept.id, editDeptName, editDeptCode);
    setIsUpdatingDept(false);
    if (res.success) {
      setEditDept(null);
      router.refresh();
    }
  }

  function openEditPos(p: {
    id: string;
    code: string | null;
    name: string;
  }) {
    setEditPos(p);
    setEditPosCode(p.code || "");
    setEditPosName(p.name);
  }

  async function handleUpdatePos(e: React.FormEvent) {
    e.preventDefault();
    if (!editPos || !editPosName || !editPosCode) return;
    setIsUpdatingPos(true);
    const res = await onUpdatePosition(editPos.id, editPosName, editPosCode);
    setIsUpdatingPos(false);
    if (res.success) {
      setEditPos(null);
      router.refresh();
    }
  }

  const filteredDepts = departments.filter((d) => {
    return (
      d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(deptSearch.toLowerCase()))
    );
  });
  const totalDeptPages = Math.ceil(filteredDepts.length / deptPageSize) || 1;
  const paginatedDepts = filteredDepts.slice(
    (deptPage - 1) * deptPageSize,
    deptPage * deptPageSize,
  );

  const filteredPositions = positions.filter((p) => {
    return (
      p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(posSearch.toLowerCase()))
    );
  });
  const totalPosPages = Math.ceil(filteredPositions.length / posPageSize) || 1;
  const paginatedPositions = filteredPositions.slice(
    (posPage - 1) * posPageSize,
    posPage * posPageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            แผนกและตำแหน่งงาน (Departments & Positions)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            จัดการโครงสร้างองค์กร แผนก และตำแหน่งงานสำหรับบุคลากรในบริษัท
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsDeptModalOpen(true)}
            className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] h-9 text-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มแผนก
          </Button>
          <Button
            onClick={() => setIsPosModalOpen(true)}
            variant="outline"
            className="rounded-full border-[#533afd] text-[#533afd] hover:bg-[#f6f9fc] h-9 text-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            เพิ่มตำแหน่ง
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Departments Table Card */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Building className="h-4 w-4 text-[#533afd] mr-2" />
                แผนกทั้งหมด ({departments.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeptModalOpen(true)}
                className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
              >
                + เพิ่ม
              </Button>
            </CardHeader>

            <div className="p-3 border-b border-[#e3e8ee]">
              <div className="relative w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  placeholder="ค้นหาชื่อแผนกหรือรหัส..."
                  value={deptSearch}
                  onChange={(e) => {
                    setDeptSearch(e.target.value);
                    setDeptPage(1);
                  }}
                  className="pl-8.5 h-8 text-xs rounded-xl"
                />
              </div>
            </div>

            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">รหัส</th>
                    <th className="py-3 px-4 font-semibold">ชื่อแผนก</th>
                    <th className="py-3 px-4 font-semibold text-right">
                      จำนวนพนักงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {paginatedDepts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#64748d]">
                        ไม่พบข้อมูลแผนก
                      </td>
                    </tr>
                  ) : (
                    paginatedDepts.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-[#f6f9fc]/70 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#533afd] tabular-nums">
                          {d.code || "-"}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0d253d]">
                          {d.name}
                        </td>
                        <td className="py-3 px-4 text-right text-[#64748d] tabular-nums font-mono">
                          <div className="flex items-center justify-end space-x-1.5">
                            <span className="inline-flex items-center text-[11px] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-full">
                              <Users className="h-3 w-3 mr-1 text-[#64748d]" />
                              {d._count.employees} คน
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDept(d)}
                              className="h-7 px-2 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                              title="แก้ไขแผนก"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </div>

          <DataTablePagination
            currentPage={deptPage}
            totalPages={totalDeptPages}
            pageSize={deptPageSize}
            pageSizeOptions={[5, 10, 20]}
            totalItems={filteredDepts.length}
            onPageChange={setDeptPage}
            onPageSizeChange={setDeptPageSize}
          />
        </Card>

        {/* Positions Table Card */}
        <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
                <Briefcase className="h-4 w-4 text-[#533afd] mr-2" />
                ตำแหน่งงานทั้งหมด ({positions.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPosModalOpen(true)}
                className="h-7 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2.5"
              >
                + เพิ่ม
              </Button>
            </CardHeader>

            <div className="p-3 border-b border-[#e3e8ee]">
              <div className="relative w-full">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  placeholder="ค้นหาชื่อตำแหน่งหรือรหัส..."
                  value={posSearch}
                  onChange={(e) => {
                    setPosSearch(e.target.value);
                    setPosPage(1);
                  }}
                  className="pl-8.5 h-8 text-xs rounded-xl"
                />
              </div>
            </div>

            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">รหัส</th>
                    <th className="py-3 px-4 font-semibold">ชื่อตำแหน่ง</th>
                    <th className="py-3 px-4 font-semibold text-right">
                      จำนวนพนักงาน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e3e8ee]/70">
                  {paginatedPositions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#64748d]">
                        ไม่พบข้อมูลตำแหน่ง
                      </td>
                    </tr>
                  ) : (
                    paginatedPositions.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[#f6f9fc]/70 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#533afd] tabular-nums">
                          {p.code || "-"}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#0d253d]">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-right text-[#64748d] tabular-nums font-mono">
                          <div className="flex items-center justify-end space-x-1.5">
                            <span className="inline-flex items-center text-[11px] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-full">
                              <Users className="h-3 w-3 mr-1 text-[#64748d]" />
                              {p._count.employees} คน
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPos(p)}
                              className="h-7 px-2 text-xs text-[#533afd] hover:bg-[#533afd]/10 rounded-full"
                              title="แก้ไขตำแหน่ง"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </div>

          <DataTablePagination
            currentPage={posPage}
            totalPages={totalPosPages}
            pageSize={posPageSize}
            pageSizeOptions={[5, 10, 20]}
            totalItems={filteredPositions.length}
            onPageChange={setPosPage}
            onPageSizeChange={setPosPageSize}
          />
        </Card>
      </div>

      {/* Modal 1: Add Department */}
      <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
        <DialogContent onClose={() => setIsDeptModalOpen(false)} className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              เพิ่มแผนกใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกข้อมูลเพื่อสร้างแผนกใหม่ในองค์กร
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDept} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสแผนก <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น IT, HR, MKT"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="h-9 rounded-xl text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อแผนก <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น เทคโนโลยีสารสนเทศ"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeptModalOpen(false)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isAddingDept || !deptName || !deptCode}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isAddingDept && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                บันทึกแผนก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Add Position */}
      <Dialog open={isPosModalOpen} onOpenChange={setIsPosModalOpen}>
        <DialogContent onClose={() => setIsPosModalOpen(false)} className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              เพิ่มตำแหน่งงานใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กรอกข้อมูลเพื่อสร้างตำแหน่งงานใหม่ในองค์กร
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePos} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสตำแหน่ง <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น DEV, DEV-SR, MKT-SPEC"
                value={posCode}
                onChange={(e) => setPosCode(e.target.value)}
                className="h-9 rounded-xl text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อตำแหน่ง <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น นักพัฒนาระบบอาวุโส"
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPosModalOpen(false)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isAddingPos || !posName || !posCode}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isAddingPos && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                บันทึกตำแหน่ง
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Department */}
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent onClose={() => setEditDept(null)} className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              แก้ไขข้อมูลแผนก
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ปรับปรุงรหัสและชื่อแผนกในองค์กร
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDept} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสแผนก <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                value={editDeptCode}
                onChange={(e) => setEditDeptCode(e.target.value)}
                className="h-9 rounded-xl text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อแผนก <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDept(null)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingDept || !editDeptName || !editDeptCode}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isUpdatingDept && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                บันทึกการแก้ไข
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Edit Position */}
      <Dialog open={!!editPos} onOpenChange={(open) => !open && setEditPos(null)}>
        <DialogContent onClose={() => setEditPos(null)} className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d]">
              แก้ไขข้อมูลตำแหน่ง
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ปรับปรุงรหัสและชื่อตำแหน่งงานในองค์กร
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePos} className="space-y-3 mt-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                รหัสตำแหน่ง <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                value={editPosCode}
                onChange={(e) => setEditPosCode(e.target.value)}
                className="h-9 rounded-xl text-xs uppercase"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0d253d]">
                ชื่อตำแหน่ง <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                value={editPosName}
                onChange={(e) => setEditPosName(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditPos(null)}
                className="h-9 rounded-full text-xs"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPos || !editPosName || !editPosCode}
                className="h-9 rounded-full bg-[#533afd] text-white text-xs font-semibold px-4"
              >
                {isUpdatingPos && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                บันทึกการแก้ไข
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
