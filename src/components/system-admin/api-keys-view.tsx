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
  Key,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Shield,
  Clock,
} from "lucide-react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/features/company/super-admin-ops-actions";

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

interface ApiKeysViewProps {
  apiKeys: SerializedApiKey[];
}

export function ApiKeysView({ apiKeys }: ApiKeysViewProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const result = await createApiKeyAction(name, ["*"]);
    setIsLoading(false);

    if (result.success && result.data) {
      setCreatedSecret((result.data as any).fullApiKey);
      setName("");
      router.refresh();
    } else {
      alert(result.message || "เกิดข้อผิดพลาดในการสร้าง API Key");
    }
  }

  async function handleRevoke(id: string) {
    if (
      !confirm(
        "คุณต้องการเพิกถอน API Key นี้ใช่หรือไม่? ระบบที่เชื่อมต่ออยู่จะไม่สามารถใช้งานได้อีกต่อไป",
      )
    ) {
      return;
    }
    const result = await revokeApiKeyAction(id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.message || "ไม่สามารถเพิกถอน Key ได้");
    }
  }

  function handleCopySecret() {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
            จัดการกุญแจเชื่อมต่อภายนอก (API Keys)
          </h1>
          <p className="text-xs text-[#64748d] mt-0.5">
            ออกและควบคุมสิทธิ์ API Key สำหรับเชื่อมต่อ Third-Party Integration
            และระบบภายนอก
          </p>
        </div>

        <Button
          onClick={() => {
            setIsCreateOpen(true);
            setCreatedSecret(null);
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white px-5 h-9 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1.5" /> สร้าง API Key ใหม่
        </Button>
      </div>

      {/* API Keys Table */}
      <Card className="border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.06)] rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-[#e3e8ee] text-[#64748d] uppercase bg-[#f6f9fc]">
                <tr>
                  <th className="py-3.5 px-4 pl-5 font-semibold">ชื่อ Key</th>
                  <th className="py-3.5 px-4 font-semibold">Prefix</th>
                  <th className="py-3.5 px-4 font-semibold">สิทธิ์ (Scopes)</th>
                  <th className="py-3.5 px-4 font-semibold">ใช้งานล่าสุด</th>
                  <th className="py-3.5 px-4 font-semibold">สถานะ</th>
                  <th className="py-3.5 px-4 pr-5 text-right font-semibold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]/70">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#64748d]"
                    >
                      ยังไม่มี API Key ในระบบ
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr
                      key={k.id}
                      className="hover:bg-[#f6f9fc]/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 pl-5 font-bold text-[#0d253d]">
                        {k.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#533afd] font-semibold">
                        {k.keyPrefix}...
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] bg-[#f6f9fc] border border-[#e3e8ee] px-2 py-0.5 rounded-md">
                          {k.permissions.join(", ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748d] tabular-nums">
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleDateString("th-TH")
                          : "ยังไม่เคยใช้งาน"}
                      </td>
                      <td className="py-3.5 px-4">
                        {k.isRevoked ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] rounded-full px-2"
                          >
                            เพิกถอนแล้ว
                          </Badge>
                        ) : (
                          <Badge
                            variant="success"
                            className="text-[10px] rounded-full px-2"
                          >
                            ใช้งานได้ (Active)
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 pr-5 text-right">
                        {!k.isRevoked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevoke(k.id)}
                            className="h-7 text-xs rounded-full px-3 text-[#ea2261] border-[#fecdd3] hover:bg-[#ffe4e6] font-semibold"
                          >
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
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent
          onClose={() => setIsCreateOpen(false)}
          className="max-w-md rounded-2xl p-6"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center">
              <Key className="h-5 w-5 text-[#533afd] mr-2" />
              สร้าง API Key ใหม่
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              กำหนดชื่อเพื่อระบุระบบภายนอกที่จะใช้งาน Key นี้
            </DialogDescription>
          </DialogHeader>

          {createdSecret ? (
            <div className="space-y-4 my-2">
              <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl text-[#059669] text-xs font-semibold flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
                สร้าง API Key สำเร็จ! กรุณาคัดลอกไว้ทันที
                (ระบบจะไม่แสดงคีย์นี้อีก)
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  Secret API Key:
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={createdSecret}
                    readOnly
                    className="h-10 rounded-xl font-mono text-xs text-[#533afd] bg-[#f6f9fc]"
                  />
                  <Button
                    type="button"
                    onClick={handleCopySecret}
                    className="rounded-xl h-10 px-4 bg-[#533afd] text-white"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {copied ? "คัดลอกแล้ว!" : "คัดลอก"}
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-[#e3e8ee]">
                <Button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full text-xs h-9 px-5 bg-[#0d253d] text-white"
                >
                  เสร็จสิ้น
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3.5 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#0d253d]">
                  ชื่อกุญแจ (Key Name) <span className="text-[#ea2261]">*</span>
                </label>
                <Input
                  placeholder="เช่น Payroll System, ERP Integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-9 rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="mt-6 pt-3 border-t border-[#e3e8ee] flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isLoading}
                  className="rounded-full text-xs h-9 px-4"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full bg-[#533afd] text-white hover:bg-[#4434d4] text-xs h-9 px-5 font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      กำลังสร้าง...
                    </>
                  ) : (
                    "สร้าง API Key"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
