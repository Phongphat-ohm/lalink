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
} from "lucide-react";
import {
  createCompanyApiKeyAction,
  revokeCompanyApiKeyAction,
} from "@/features/company/admin-api-actions";
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
}

interface AdminApiKeysViewProps {
  apiKeys: SerializedApiKey[];
  isApiEnabled?: boolean;
}

export function AdminApiKeysView({
  apiKeys,
  isApiEnabled = false,
}: AdminApiKeysViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "REVOKED">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [revokeTarget, setRevokeTarget] = React.useState<SerializedApiKey | null>(null);
  const [isRevoking, setIsRevoking] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isApiEnabled) {
      toast.error("องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน REST API กรุณาติดต่อ System Administrator");
      return;
    }
    setIsLoading(true);

    const result = await createCompanyApiKeyAction(name, ["*"]);
    setIsLoading(false);

    if (result.success && result.data) {
      setCreatedSecret((result.data as any).fullApiKey);
      setName("");
      toast.success("สร้าง API Key สำเร็จ กรุณาคัดลอกเก็บไว้");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการสร้าง API Key");
    }
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    setIsRevoking(true);
    const result = await revokeCompanyApiKeyAction(revokeTarget.id);
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
      k.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && !k.isRevoked) ||
      (statusFilter === "REVOKED" && k.isRevoked);

    return matchesSearch && matchesStatus;
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
            การจัดการ API Keys
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            สร้างและจัดการ API Key สำหรับเชื่อมต่อระบบภายนอกของบริษัทคุณ
          </p>
        </div>

        <Button
          onClick={() => {
            if (!isApiEnabled) {
              toast.error("องค์กรของคุณยังไม่ได้รับสิทธิ์การใช้งาน REST API กรุณาติดต่อ System Administrator");
              return;
            }
            setCreatedSecret(null);
            setName("");
            setIsCreateOpen(true);
          }}
          disabled={!isApiEnabled}
          className={`rounded-full px-4 h-9 text-xs font-semibold shadow-xs ${
            isApiEnabled
              ? "bg-[#533afd] hover:bg-[#4434d4] text-white cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          สร้าง API Key ใหม่
        </Button>
      </div>

      {/* Disabled Permission Banner */}
      {!isApiEnabled && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 shadow-xs rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0d253d]">
                ฟังก์ชัน REST API ถูกปิดใช้งานสำหรับองค์กรของคุณ
              </h2>
              <p className="text-xs text-[#64748d] mt-1 leading-relaxed">
                ปัจจุบันองค์กรของคุณยังไม่ได้รับอนุญาตให้ใช้งานระบบ API Key หากต้องการเชื่อมต่อระบบภายนอกหรือระบบอัตโนมัติ กรุณาติดต่อผู้ดูแลระบบสูงสุด (System Administrator) เพื่อขอเปิดสิทธิ์การใช้งาน
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ Key หรือ Prefix..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 rounded-xl text-xs w-full"
            />
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
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

      {/* Keys List */}
      <div className="space-y-3">
        {paginatedApiKeys.length === 0 ? (
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-10 text-center">
              <Key className="h-10 w-10 mx-auto text-[#64748d]/40 mb-3" />
              <p className="text-sm text-[#64748d]">ไม่พบ API Key</p>
            </CardContent>
          </Card>
        ) : (
          paginatedApiKeys.map((k) => (
            <Card key={k.id} className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-[#533afd]" />
                      <span className="font-semibold text-sm text-[#0d253d]">
                        {k.name}
                      </span>
                      <Badge
                        variant={k.isRevoked ? "destructive" : "default"}
                        className={`text-[10px] rounded-full px-2 ${
                          k.isRevoked
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {k.isRevoked ? "เพิกถอนแล้ว" : "ใช้งานได้"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[#64748d]">
                      <span className="font-mono bg-[#f6f9fc] px-2 py-0.5 rounded">
                        {k.keyPrefix}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(k.createdAt).toLocaleDateString("th-TH")}
                      </span>
                      {k.expiresAt && (
                        <span>
                          หมดอายุ: {new Date(k.expiresAt).toLocaleDateString("th-TH")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {k.permissions.map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[10px] rounded-full px-2 border-[#e3e8ee] text-[#64748d]"
                        >
                          <Shield className="h-2.5 w-2.5 mr-0.5" />
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {!k.isRevoked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeTarget(k)}
                      className="text-red-600 border-red-200 hover:bg-red-50 rounded-full text-xs h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      เพิกถอน
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredApiKeys.length > pageSize && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredApiKeys.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0d253d]">
              สร้าง API Key ใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              API Key จะถูกสร้างสำหรับบริษัทของคุณ ใช้สำหรับเชื่อมต่อระบบภายนอก
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    คัดลอก Key นี้ทันที - จะไม่แสดงอีก!
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] bg-white border border-amber-200 rounded-lg p-2 font-mono break-all">
                    {createdSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySecret}
                    className="rounded-full h-8"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreatedSecret(null);
                  }}
                  className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white"
                >
                  เสร็จสิ้น
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div>
                <label className="text-xs font-medium text-[#0d253d]">
                  ชื่อ API Key
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น Production API, Webhook Server"
                  required
                  className="mt-1.5 rounded-xl text-xs"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  สร้าง API Key
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirm Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#0d253d]">
              ยืนยันเพิกถอน API Key
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#64748d]">
              เมื่อเพิกถอนแล้ว Key &quot;{revokeTarget?.name}&quot; จะไม่สามารถใช้งานได้อีก
              การเชื่อมต่อที่ใช้ Key นี้จะหยุดทำงานทันที
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={isRevoking}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isRevoking && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              เพิกถอน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
