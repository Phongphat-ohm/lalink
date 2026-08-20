"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Mail,
  Send,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  HelpCircle,
  CreditCard,
  Building,
  User,
  Shield,
  CornerDownRight,
  Paperclip,
  FileIcon,
  Download,
  X,
  FileText,
  ImageIcon,
} from "lucide-react";
import {
  createMessageThreadAction,
  replyMessageAction,
  getMessageAttachmentDownloadUrlAction,
  FileAttachmentPayload,
} from "@/features/messaging/message-actions";
import { toast } from "@/components/ui/toast";
import { MessageCategory, ThreadStatus } from "@prisma/client";

export interface SerializedAttachment {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface SerializedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  content: string;
  isInternalOnly: boolean;
  isRead: boolean;
  createdAt: string;
  attachments?: SerializedAttachment[];
}

export interface SerializedMessageThread {
  id: string;
  subject: string;
  category: MessageCategory;
  status: ThreadStatus;
  companyId: string | null;
  planUpgradeRequestId: string | null;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messagesCount: number;
  unreadCount: number;
  lastMessageSnippet: string;
  messages: SerializedMessage[];
}

interface MailboxViewProps {
  threads: SerializedMessageThread[];
  currentUserId: string;
}

const CATEGORY_LABELS: Record<MessageCategory, { label: string; icon: React.ReactNode; color: string }> = {
  GENERAL: { label: "ทั่วไป", icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-slate-100 text-slate-700" },
  UPGRADE_REQUEST: { label: "ปรับระดับแพ็กเกจ", icon: <Zap className="h-3.5 w-3.5" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
  BILLING: { label: "การเงิน/รอบบิล", icon: <CreditCard className="h-3.5 w-3.5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SUPPORT: { label: "ความช่วยเหลือ", icon: <HelpCircle className="h-3.5 w-3.5" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
  SYSTEM: { label: "ระบบอัตโนมัติ", icon: <Shield className="h-3.5 w-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
};

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function MailboxView({ threads, currentUserId }: MailboxViewProps) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    threads.length > 0 ? threads[0].id : null,
  );

  // Compose Modal
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [composeSubject, setComposeSubject] = React.useState("");
  const [composeCategory, setComposeCategory] = React.useState<MessageCategory>(MessageCategory.SUPPORT);
  const [composeContent, setComposeContent] = React.useState("");
  const [composeFile, setComposeFile] = React.useState<File | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const composeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reply state
  const [replyText, setReplyText] = React.useState("");
  const [replyFile, setReplyFile] = React.useState<File | null>(null);
  const [isReplying, setIsReplying] = React.useState(false);
  const replyFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleComposeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!composeSubject.trim() || !composeContent.trim()) return;

    setIsSending(true);

    try {
      let fileAttachment: FileAttachmentPayload | null = null;
      if (composeFile) {
        const base64 = await fileToBase64(composeFile);
        fileAttachment = {
          originalName: composeFile.name,
          base64,
          mimeType: composeFile.type || "application/octet-stream",
        };
      }

      const result = await createMessageThreadAction({
        subject: composeSubject,
        category: composeCategory,
        initialMessage: composeContent,
        fileAttachment,
      });
      setIsSending(false);

      if (result.success && result.data) {
        setIsComposeOpen(false);
        setComposeSubject("");
        setComposeContent("");
        setComposeFile(null);
        setActiveThreadId(result.data.threadId);
        toast.success(result.message || "ส่งข้อความเรียบร้อยแล้ว");
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการส่งข้อความ");
      }
    } catch (err: any) {
      setIsSending(false);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("Body exceeded") ||
        errMsg.includes("413") ||
        errMsg.includes("limit")
      ) {
        toast.error(
          "ขนาดไฟล์แนบเกินกำหนด (สูงสุด 10 MB) กรุณาลดขนาดไฟล์แล้วลองอัปโหลดใหม่อีกครั้ง",
        );
      } else {
        toast.error("เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง");
      }
    }
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || (!replyText.trim() && !replyFile)) return;

    setIsReplying(true);

    try {
      let fileAttachment: FileAttachmentPayload | null = null;
      if (replyFile) {
        const base64 = await fileToBase64(replyFile);
        fileAttachment = {
          originalName: replyFile.name,
          base64,
          mimeType: replyFile.type || "application/octet-stream",
        };
      }

      const result = await replyMessageAction({
        threadId: activeThread.id,
        content: replyText,
        fileAttachment,
      });
      setIsReplying(false);

      if (result.success) {
        setReplyText("");
        setReplyFile(null);
        toast.success("ส่งข้อความตอบกลับสำเร็จ");
        router.refresh();
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการตอบกลับ");
      }
    } catch (err: any) {
      setIsReplying(false);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes("Body exceeded") ||
        errMsg.includes("413") ||
        errMsg.includes("limit")
      ) {
        toast.error(
          "ขนาดไฟล์แนบเกินกำหนด (สูงสุด 10 MB) กรุณาลดขนาดไฟล์แล้วลองอัปโหลดใหม่อีกครั้ง",
        );
      } else {
        toast.error("เกิดข้อผิดพลาดในการตอบกลับ กรุณาลองใหม่อีกครั้ง");
      }
    }
  }

  async function handleDownloadAttachment(attachmentId: string) {
    const res = await getMessageAttachmentDownloadUrlAction(attachmentId);
    if (res.success && res.data?.url) {
      window.open(res.data.url, "_blank");
    } else {
      toast.error(res.message || "ไม่สามารถเปิดไฟล์แนบได้");
    }
  }

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastMessageSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.createdByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3e8ee] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#0d253d] tracking-tight">
              กล่องข้อความระบบ (Mailbox & Support)
            </h1>
            <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 text-[11px] font-semibold rounded-full">
              ศูนย์การสื่อสาร & ช่วยเหลือ
            </Badge>
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            ติดต่อสอบถามผู้ดูแลระบบส่วนกลาง, ส่งเอกสารแนบ และติดตามคำขอแพ็กเกจ
          </p>
        </div>

        <Button
          onClick={() => setIsComposeOpen(true)}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 px-4 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          เขียนข้อความใหม่
        </Button>
      </div>

      {/* Main Mailbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Threads List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Category Filter */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหาหัวข้อ หรือข้อความ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(["ALL", "SUPPORT", "UPGRADE_REQUEST", "BILLING", "GENERAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#533afd] text-white font-bold"
                        : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]"
                    }`}
                  >
                    {cat === "ALL" ? "ทั้งหมด" : CATEGORY_LABELS[cat]?.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Threads List Items */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredThreads.length === 0 ? (
              <Card className="border-[#e3e8ee] bg-white rounded-2xl p-8 text-center text-xs text-[#64748d]">
                <Mail className="h-8 w-8 text-[#94a3b8] mx-auto mb-2 opacity-50" />
                ไม่พบข้อความตามเงื่อนไขที่ค้นหา
              </Card>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                const catInfo = CATEGORY_LABELS[thread.category] || CATEGORY_LABELS.GENERAL;

                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? "border-[#533afd] bg-[#f8f7ff] shadow-xs ring-1 ring-[#533afd]/20"
                        : "border-[#e3e8ee] bg-white hover:border-[#533afd]/40 hover:bg-[#f6f9fc]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${catInfo.color}`}>
                          {catInfo.icon}
                          <span className="ml-1">{catInfo.label}</span>
                        </Badge>
                        {thread.status === "OPEN" && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] rounded-full">
                            เปิดอยู่
                          </Badge>
                        )}
                        {thread.status === "RESOLVED" && (
                          <Badge variant="outline" className="text-[10px] rounded-full text-[#64748d]">
                            เสร็จสิ้น
                          </Badge>
                        )}
                      </div>

                      <span className="text-[10px] text-[#94a3b8] font-mono tabular-nums whitespace-nowrap">
                        {new Date(thread.lastMessageAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#0d253d] line-clamp-1 mb-1">
                      {thread.subject}
                    </h4>

                    <p className="text-[11px] text-[#64748d] line-clamp-2 leading-relaxed">
                      {thread.lastMessageSnippet}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e3e8ee]/60 text-[10px] text-[#94a3b8]">
                      <span>โดย: {thread.createdByName}</span>
                      <span className="font-mono">{thread.messagesCount} ข้อความ</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Thread Discussion */}
        <div className="lg:col-span-7">
          {activeThread ? (
            <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
              {/* Thread Header */}
              <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_LABELS[activeThread.category]?.color}`}>
                      {CATEGORY_LABELS[activeThread.category]?.label}
                    </Badge>
                    <span className="text-[11px] text-[#64748d] font-mono">
                      #{activeThread.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <span className="text-[11px] text-[#64748d]">
                    เริ่มสนทนา: {new Date(activeThread.createdAt).toLocaleDateString("th-TH")}
                  </span>
                </div>

                <CardTitle className="text-base font-bold text-[#0d253d] mt-1.5">
                  {activeThread.subject}
                </CardTitle>
              </CardHeader>

              {/* Messages Chat Stream */}
              <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[480px]">
                {activeThread.messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const isSuperAdmin = msg.senderRole === "SYSTEM_ADMIN";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#64748d]">
                        <span className="font-semibold text-[#0d253d]">{msg.senderName}</span>
                        {isSuperAdmin && (
                          <Badge className="bg-[#533afd] text-white text-[9px] px-1.5 py-0 rounded-full">
                            เจ้าหน้าที่ LALINK
                          </Badge>
                        )}
                        <span className="text-[10px] text-[#94a3b8] font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-2 ${
                          isMe
                            ? "bg-[#533afd] text-white rounded-tr-xs shadow-xs"
                            : isSuperAdmin
                              ? "bg-[#f0f4ff] text-[#0d253d] border border-[#d0dcff] rounded-tl-xs"
                              : "bg-[#f6f9fc] text-[#0d253d] border border-[#e3e8ee] rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments rendering */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 border-t border-white/20 space-y-1.5">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                onClick={() => handleDownloadAttachment(att.id)}
                                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer ${
                                  isMe
                                    ? "bg-white/10 hover:bg-white/20 text-white"
                                    : "bg-white hover:bg-slate-50 border border-[#e3e8ee] text-[#0d253d]"
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {att.mimeType.startsWith("image/") ? (
                                    <ImageIcon className="h-4 w-4 shrink-0 text-blue-400" />
                                  ) : (
                                    <FileText className="h-4 w-4 shrink-0 text-amber-400" />
                                  )}
                                  <span className="font-medium text-[11px] truncate max-w-[180px]">
                                    {att.originalName}
                                  </span>
                                  <span className="text-[10px] opacity-70 font-mono">
                                    ({formatBytes(att.fileSize)})
                                  </span>
                                </div>
                                <Download className="h-3.5 w-3.5 shrink-0 ml-2" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>

              {/* Reply Form Footer */}
              <div className="p-4 border-t border-[#e3e8ee] bg-[#f6f9fc]/40">
                <form onSubmit={handleReplySubmit} className="space-y-2">
                  {/* File preview if selected */}
                  {replyFile && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e3e8ee] text-xs">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Paperclip className="h-3.5 w-3.5 text-[#533afd]" />
                        <span className="font-semibold text-[#0d253d] truncate max-w-[200px]">{replyFile.name}</span>
                        <span className="text-[10px] text-[#64748d] font-mono">({formatBytes(replyFile.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyFile(null)}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <Textarea
                    placeholder="พิมพ์ข้อความตอบกลับ..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[70px] text-xs rounded-xl bg-white resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (f.size > 10 * 1024 * 1024) {
                              toast.error(
                                `ขนาดไฟล์ "${f.name}" เกิน 10 MB กรุณาเลือกไฟล์ใหม่หรือลดขนาดไฟล์แล้วลองอัปโหลดอีกครั้ง`,
                              );
                              setReplyFile(null);
                              e.target.value = "";
                              return;
                            }
                            setReplyFile(f);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => replyFileInputRef.current?.click()}
                        className="h-7 text-xs rounded-full px-2.5 text-[#64748d] border-[#e3e8ee] hover:bg-[#f6f9fc] cursor-pointer"
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        แนบไฟล์
                      </Button>
                      <span className="text-[11px] text-[#94a3b8] hidden sm:inline">
                        (รองรับ PDF, รูปภาพ, เอกสาร)
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={isReplying || (!replyText.trim() && !replyFile)}
                      className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
                    >
                      {isReplying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                      ส่งข้อความ
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="border-[#e3e8ee] bg-white rounded-2xl p-12 text-center text-xs text-[#64748d]">
              <MessageSquare className="h-10 w-10 text-[#94a3b8] mx-auto mb-2 opacity-50" />
              เลือกหัวข้อสนทนาทางซ้ายมือเพื่อเปิดอ่านหรือตอบกลับ
            </Card>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#533afd]" />
              ส่งข้อความใหม่ถึงฝ่ายสนับสนุน (New Support Message)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ส่งคำถาม ข้อสงสัย แจ้งปัญหา หรือส่งเอกสารแนบไปยังทีมงาน LALINK
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleComposeSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                หมวดหมู่ข้อความ <span className="text-[#ea2261]">*</span>
              </label>
              <select
                value={composeCategory}
                onChange={(e) => setComposeCategory(e.target.value as MessageCategory)}
                required
                className="w-full h-9 rounded-xl border border-[#e3e8ee] px-3 text-xs bg-white text-[#0d253d] focus:outline-none focus:border-[#533afd]"
              >
                <option value={MessageCategory.SUPPORT}>ความช่วยเหลือทั่วไป (Support & Help)</option>
                <option value={MessageCategory.UPGRADE_REQUEST}>สอบถามเกี่ยวกับแพ็กเกจ (Plan Upgrade)</option>
                <option value={MessageCategory.BILLING}>การเงินและรอบบิล (Billing & Invoices)</option>
                <option value={MessageCategory.GENERAL}>เรื่องอื่นๆ (General Inquiries)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                หัวข้อข้อความ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น สอบถามเรื่องการขยายโควตาพนักงาน 100 คน"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                รายละเอียดข้อความ <span className="text-[#ea2261]">*</span>
              </label>
              <Textarea
                required
                placeholder="พิมพ์ข้อความและรายละเอียดที่ต้องการแจ้ง..."
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                className="min-h-[100px] text-xs rounded-xl"
              />
            </div>

            {/* File Attachment Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                แนบเอกสารหรือภาพประกอบ (ถ้ามี)
              </label>
              <input
                type="file"
                ref={composeFileInputRef}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 10 * 1024 * 1024) {
                      toast.error(
                        `ขนาดไฟล์ "${f.name}" เกิน 10 MB กรุณาเลือกไฟล์ใหม่หรือลดขนาดไฟล์แล้วลองอัปโหลดอีกครั้ง`,
                      );
                      setComposeFile(null);
                      e.target.value = "";
                      return;
                    }
                    setComposeFile(f);
                  }
                }}
                className="hidden"
              />
              {composeFile ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="h-4 w-4 text-[#533afd]" />
                    <span className="font-semibold text-[#0d253d] truncate max-w-[240px]">{composeFile.name}</span>
                    <span className="text-[10px] text-[#64748d] font-mono">({formatBytes(composeFile.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComposeFile(null)}
                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => composeFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 border border-dashed border-[#d0dcff] rounded-xl text-xs text-[#533afd] hover:bg-[#533afd]/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  คลิกเพื่อเลือกไฟล์แนบ (PDF, รูปภาพ, สลิป หรือเอกสาร)
                </button>
              )}
            </div>

            <DialogFooter className="mt-5 pt-3 border-t border-[#e3e8ee]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsComposeOpen(false)}
                className="rounded-full text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isSending || !composeSubject.trim() || !composeContent.trim()}
                className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 px-4"
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                ส่งข้อความ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
