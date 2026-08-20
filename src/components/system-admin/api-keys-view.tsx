"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Key,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Shield,
  Clock,
  Search,
  Building2,
  Globe,
  Filter,
} from "lucide-react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/features/company/super-admin-ops-actions";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { toast } from "@/components/ui/toast";

export interface SerializedApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
  company: { id: string; name: string; code: string } | null;
}

export interface AvailableCompany {
  id: string;
  name: string;
  code: string;
}

interface ApiKeysViewProps {
  apiKeys: SerializedApiKey[];
  availableCompanies: AvailableCompany[];
}

export function ApiKeysView({ apiKeys, availableCompanies }: ApiKeysViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");
  const [companyFilter, setCompanyFilter] = React.useState<string>("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("PLATFORM");
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [revokeTarget, setRevokeTarget] = React.useState<SerializedApiKey | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const targetCompanyId = selectedCompanyId === "PLATFORM" ? null : selectedCompanyId;
    const result = await createApiKeyAction(name, ["*"], targetCompanyId);
    setIsLoading(false);

    if (result.success && result.data) {
      setCreatedSecret((result.data as any).fullApiKey);
      setName("");
      setSelectedCompanyId("PLATFORM");
      toast.success("สร้าง API Key สำเร็จ กรุณาคัดลอกเก็บไว้");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการสร้าง API Key");
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setIsRevoking(true);
    const result = await revokeApiKeyAction(revokeTarget.id);
    setIsRevoking(false);

    if (result.success) {
      setRevokeTarget(null);
      toast.success(result.message || "เพิกถอน API Key เรียบร้อยแล้ว");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถเพิกถอน Key ได้");
    }
  }

  function handleCopySecret() {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const filteredApiKeys = apiKeys.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (k.company?.code.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !k.isRevoked) ||
      (statusFilter === "REVOKED" && k.isRevoked);

    const matchesCompany =
      companyFilter === "ALL" ||
      (companyFilter === "PLATFORM" && !k.company) ||
      (k.company?.id === companyFilter);

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const totalPages = Math.ceil(filteredApiKeys.length / pageSize) || 1;
  const paginatedApiKeys = filteredApiKeys.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            การจัดการ API Keys ทั่วทั้งระบบ
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            สร้าง จัดการ และตรวจสอบ API Keys ระดับ Platform และของทุกบริษัทในระบบ
          </p>
        </div>

        <Button
          onClick={() => {
            setCreatedSecret(null);
            setName("");
            setSelectedCompanyId("PLATFORM");
            setIsCreateOpen(true);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-4 h-9 text-xs font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          สร้าง API Key ใหม่
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
              <Input
                type="text"
                placeholder="ค้นหาชื่อ Key, Prefix, บริษัท..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 rounded-xl text-xs w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Building2 className="h-4 w-4 text-[#64748d] shrink-0" />
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 text-xs rounded-xl border border-[#e3e8ee] bg-white px-3 text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd] w-full sm:w-48"
              >
                <option value="ALL">ทุกลักษณะองค์กร</option>
                <option value="PLATFORM">🌐 Platform Key เท่านั้น</option>
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 self-start md:self-auto">
            {(["ALL", "ACTIVE", "REVOKED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-[#533afd] text-white font-semibold"
                    : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]/80"
                }`}
              >
                {st === "ALL"
                  ? "ทั้งหมด"
                  : st === "ACTIVE"
                    ? "ใช้งานได้"
                    : "เพิกถอนแล้ว"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/50">
          <CardTitle className="text-sm font-semibold text-[#0d253d] flex items-center">
            <Key className="h-4 w-4 text-[#533afd] mr-2" />
            รายการ API Keys ทั้งหมด ({filteredApiKeys.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อระบบ / Key Name</th>
                  <th className="py-3.5 px-4 font-semibold">ขอบเขต / บริษัท</th>
                  <th className="py-3.5 px-4 font-semibold">Key Prefix</th>
                  <th className="py-3.5 px-4 font-semibold">สิทธิ์ (Scopes)</th>
                  <th className="py-3.5 px-4 font-semibold">สร้างเมื่อ</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {paginatedApiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#64748d]">
                      ไม่พบ API Key ตามเงื่อนไขที่ระบุ
                    </td>
                  </tr>
                ) : (
                  paginatedApiKeys.map((k) => (
                    <tr
                      key={k.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-bold text-[#0d253d]">
                        {k.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {k.company ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2 font-medium"
                            >
                              <Building2 className="h-2.5 w-2.5 mr-1" />
                              {k.company.code} - {k.company.name}
                            </Badge>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 rounded-full px-2 font-medium"
                          >
                            <Globe className="h-2.5 w-2.5 mr-1" />
                            Platform System Key
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#533afd]">
                        {k.keyPrefix}••••••••
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.permissions.map((p, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[10px] font-mono rounded-full bg-[#f6f9fc] border border-[#e3e8ee]"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] font-mono text-[11px]">
                        {new Date(k.createdAt).toLocaleDateString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        {k.isRevoked ? (
                          <Badge
                            className="text-[10px] rounded-full bg-red-100 text-red-700 border-red-200"
                          >
                            เพิกถอนแล้ว
                          </Badge>
                        ) : (
                          <Badge
                            className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 border-emerald-200"
                          >
                            ใช้งานได้
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        {!k.isRevoked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRevokeTarget(k)}
                            className="h-7 text-xs rounded-full px-3 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            เพิกถอน
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredApiKeys.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Key className="h-5 w-5 text-[#533afd] mr-2" />
              สร้าง API Key ใหม่ (System Admin)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดชื่อและเลือกว่าต้องการสร้างสำหรับระบบกลาง (Platform) หรือเฉพาะบริษัท
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 my-2">
              <div className="p-3 bg-[#f6f9fc] border border-[#e3e8ee] rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-[#0d253d]">
                  API Key ของคุณ (แสดงเพียงครั้งเดียว):
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={createdSecret}
                    className="font-mono text-xs h-8 bg-white select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySecret}
                    className="h-8 shrink-0 text-xs rounded-lg"
                  >
                    {copied ? (
                      <span className="text-[#059669] flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> คัดลอกแล้ว
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Copy className="h-3.5 w-3.5 mr-1" /> คัดลอก
                      </span>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-[#ea2261] flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  โปรดบันทึก Key นี้ในที่ปลอดภัย ระบบจะไม่สามารถแสดง Key นี้ซ้ำได้อีก
                </p>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full rounded-full bg-[#533afd] text-white text-xs h-9"
                >
                  ปิดหน้าต่าง
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 my-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อ API Key <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  required
                  placeholder="เช่น Platform Sync System, Billing Microservice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ขอบเขตการใช้งาน (Scope) <span className="text-[#ea2261]">*</span>
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-[#e3e8ee] bg-white px-3 text-[#0d253d] focus:outline-none focus:ring-1 focus:ring-[#533afd]"
                >
                  <option value="PLATFORM">🌐 Platform System Key (สิทธิ์ระดับระบบทั้งหมด)</option>
                  <optgroup label="เฉพาะบริษัท (Company Scoped)">
                    {availableCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        🏢 {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <DialogFooter className="mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full text-xs h-9"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs h-9 px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  สร้าง Key
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <AlertCircle className="h-5 w-5 text-[#ea2261] mr-2" />
              ยืนยันการเพิกถอน API Key?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              คุณกำลังจะเพิกถอน Key &ldquo;{revokeTarget?.name}&rdquo; ({revokeTarget?.keyPrefix}••••••••) 
              ระบบที่เชื่อมต่ออยู่จะไม่สามารถเข้าถึง API ได้อีกต่อไป
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isRevoking}
              className="rounded-full text-xs h-9"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={isRevoking}
              className="rounded-full bg-[#ea2261] hover:bg-[#d91452] text-white text-xs h-9 px-4"
            >
              {isRevoking && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              ยืนยันเพิกถอน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
