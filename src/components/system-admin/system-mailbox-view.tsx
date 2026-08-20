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
  Check,
  X,
  Lock,
  Paperclip,
  FileIcon,
  Download,
  FileText,
  ImageIcon,
} from "lucide-react";
import {
  createMessageThreadAction,
  replyMessageAction,
  updateThreadStatusAction,
  searchCompaniesAction,
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

export interface SerializedSystemMessage {
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

export interface SerializedSystemMessageThread {
  id: string;
  subject: string;
  category: MessageCategory;
  status: ThreadStatus;
  companyId: string | null;
  companyName: string | null;
  companyCode: string | null;
  planUpgradeRequestId: string | null;
  createdByName: string;
  createdByEmail: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messagesCount: number;
  unreadCount: number;
  lastMessageSnippet: string;
  messages: SerializedSystemMessage[];
}

export interface SimpleCompanyOption {
  id: string;
  name: string;
  code: string;
}

interface SystemMailboxViewProps {
  threads: SerializedSystemMessageThread[];
  initialCompanies?: SimpleCompanyOption[];
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

export function SystemMailboxView({
  threads,
  initialCompanies = [],
  currentUserId,
}: SystemMailboxViewProps) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = React.useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(
    threads.length > 0 ? threads[0].id : null,
  );

  // Compose Modal with AutoSearch
  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [selectedCompany, setSelectedCompany] = React.useState<SimpleCompanyOption | null>(
    initialCompanies[0] || null,
  );
  const [companySearchQuery, setCompanySearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SimpleCompanyOption[]>(initialCompanies);
  const [isSearchingCompanies, setIsSearchingCompanies] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const [composeSubject, setComposeSubject] = React.useState("");
  const [composeCategory, setComposeCategory] = React.useState<MessageCategory>(MessageCategory.SUPPORT);
  const [composeContent, setComposeContent] = React.useState("");
  const [composeFile, setComposeFile] = React.useState<File | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const composeFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reply state
  const [replyText, setReplyText] = React.useState("");
  const [replyFile, setReplyFile] = React.useState<File | null>(null);
  const [isInternalOnly, setIsInternalOnly] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);
  const replyFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  // AutoSearch debounce effect
  React.useEffect(() => {
    if (!isComposeOpen) return;
    const timer = setTimeout(async () => {
      setIsSearchingCompanies(true);
      const res = await searchCompaniesAction(companySearchQuery);
      setIsSearchingCompanies(false);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [companySearchQuery, isComposeOpen]);

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
    if (!composeSubject.trim() || !composeContent.trim() || !selectedCompany) {
      toast.error("กรุณาเลือกองค์กรและกรอกหัวข้อ/ข้อความ");
      return;
    }

    setIsSending(true);

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
      companyId: selectedCompany.id,
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
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || (!replyText.trim() && !replyFile)) return;

    setIsReplying(true);

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
      isInternalOnly,
      fileAttachment,
    });
    setIsReplying(false);

    if (result.success) {
      setReplyText("");
      setReplyFile(null);
      setIsInternalOnly(false);
      toast.success("ส่งข้อความตอบกลับสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาดในการตอบกลับ");
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

  async function handleStatusChange(status: ThreadStatus) {
    if (!activeThread) return;
    const result = await updateThreadStatusAction(activeThread.id, status);
    if (result.success) {
      toast.success(result.message || "เปลี่ยนสถานะสำเร็จ");
      router.refresh();
    } else {
      toast.error(result.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  }

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lastMessageSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.companyName && t.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.companyCode && t.companyCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.createdByName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = selectedCompanyFilter === "ALL" || t.companyId === selectedCompanyFilter;
    const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "ALL" || t.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesCategory && matchesStatus;
  });

  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e3e8ee] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0d253d] tracking-tight">
              ศูนย์ข้อความ & ซัพพอร์ต (Support Mailbox)
            </h1>
            {totalUnread > 0 && (
              <Badge className="bg-amber-500 text-white text-[11px] font-semibold rounded-full px-2">
                {totalUnread} ข้อความใหม่
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#64748d] mt-1">
            จัดการการสื่อสาร, ตอบกลับคำถามลูกค้าพร้อมแนบไฟล์, ติดตามคำขอแพ็กเกจ และบันทึกข้อความภายใน
          </p>
        </div>

        <Button
          onClick={() => {
            setIsComposeOpen(true);
            setCompanySearchQuery("");
          }}
          className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-9 px-4 shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          ส่งข้อความหาองค์กร
        </Button>
      </div>

      {/* Main Mailbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Threads List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Status Filter */}
          <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl">
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อบริษัท, รหัส, หัวข้อ หรือข้อความ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 rounded-xl text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {(["ALL", "OPEN", "RESOLVED", "CLOSED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      selectedStatus === st
                        ? "bg-[#533afd] text-white font-bold"
                        : "bg-[#f6f9fc] text-[#64748d] hover:bg-[#e3e8ee]"
                    }`}
                  >
                    {st === "ALL"
                      ? "ทุกสถานะ"
                      : st === "OPEN"
                        ? "เปิดอยู่"
                        : st === "RESOLVED"
                          ? "แก้ไขแล้ว"
                          : "ปิดงาน"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Threads List Items */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
            {filteredThreads.length === 0 ? (
              <Card className="border-[#e3e8ee] bg-white rounded-2xl p-8 text-center text-xs text-[#64748d]">
                <Mail className="h-8 w-8 text-[#94a3b8] mx-auto mb-2 opacity-50" />
                ไม่พบบทสนทนาตามเงื่อนไขที่ระบุ
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
                        {thread.companyName ? (
                          <Badge className="bg-[#533afd]/10 text-[#533afd] border border-[#533afd]/20 text-[10px] rounded-full font-bold">
                            {thread.companyName} ({thread.companyCode})
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] rounded-full">
                            ส่วนกลาง
                          </Badge>
                        )}
                        <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${catInfo.color}`}>
                          {catInfo.label}
                        </Badge>
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
                      <span>ผู้เปิด: {thread.createdByName}</span>
                      <div className="flex items-center gap-2">
                        {thread.status === "OPEN" && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> เปิด
                          </span>
                        )}
                        {thread.status === "RESOLVED" && (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> แก้ไขแล้ว
                          </span>
                        )}
                        <span className="font-mono text-slate-400">· {thread.messagesCount} ข้อความ</span>
                      </div>
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
            <Card className="border-[#e3e8ee] bg-white shadow-xs rounded-2xl overflow-hidden flex flex-col min-h-[520px]">
              {/* Thread Header */}
              <CardHeader className="p-4 border-b border-[#e3e8ee] bg-[#f6f9fc]/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {activeThread.companyName && (
                        <Badge className="bg-[#533afd] text-white text-[10px] rounded-full font-bold">
                          {activeThread.companyName} ({activeThread.companyCode})
                        </Badge>
                      )}
                      <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_LABELS[activeThread.category]?.color}`}>
                        {CATEGORY_LABELS[activeThread.category]?.label}
                      </Badge>
                      <span className="text-[11px] text-[#64748d] font-mono">
                        #{activeThread.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <CardTitle className="text-base font-bold text-[#0d253d] mt-1.5">
                      {activeThread.subject}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {activeThread.status === "OPEN" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ThreadStatus.RESOLVED)}
                        className="h-7 text-xs rounded-full text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Check className="h-3 w-3 mr-1" /> ทำเครื่องหมายว่าแก้ไขแล้ว
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(ThreadStatus.OPEN)}
                        className="h-7 text-xs rounded-full text-[#533afd] border-[#533afd]/30 hover:bg-[#533afd]/10"
                      >
                        เปิดหัวข้อใหม่ (Reopen)
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages Chat Stream */}
              <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[460px]">
                {activeThread.messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  const isTenantUser = msg.senderRole !== "SYSTEM_ADMIN";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#64748d]">
                        <span className="font-semibold text-[#0d253d]">{msg.senderName}</span>
                        {isTenantUser && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-full">
                            ตัวแทนบริษัท
                          </Badge>
                        )}
                        {msg.isInternalOnly && (
                          <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0 rounded-full flex items-center gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> บันทึกภายใน
                          </Badge>
                        )}
                        <span className="text-[10px] text-[#94a3b8] font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-2 ${
                          msg.isInternalOnly
                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                            : isMe
                              ? "bg-[#533afd] text-white rounded-tr-xs shadow-xs"
                              : "bg-[#f6f9fc] text-[#0d253d] border border-[#e3e8ee] rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/40 space-y-1.5">
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
                    placeholder="พิมพ์ข้อความตอบกลับผู้เช่า..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[70px] text-xs rounded-xl bg-white resize-none"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReplyFile(e.target.files[0]);
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

                      <label className="flex items-center gap-1.5 text-xs text-[#64748d] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternalOnly}
                          onChange={(e) => setIsInternalOnly(e.target.checked)}
                          className="rounded border-[#e3e8ee] text-[#533afd] focus:ring-[#533afd]"
                        />
                        <span>บันทึกภายใน (Internal Note)</span>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isReplying || (!replyText.trim() && !replyFile)}
                      className="rounded-full bg-[#533afd] hover:bg-[#4434d4] text-white text-xs font-semibold h-8 px-4 cursor-pointer self-end sm:self-auto"
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

      {/* Compose Message Modal with AutoSearch */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0d253d] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#533afd]" />
              ส่งข้อความหาองค์กร / ลูกค้า (Direct Message to Tenant)
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748d]">
              ค้นหาองค์กรแบบ Realtime และส่งข้อความพร้อมเอกสารแนบ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleComposeSubmit} className="space-y-4 mt-3">
            {/* AutoSearch Combobox for Company Selection */}
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-[#0d253d]">
                ค้นหาและเลือกองค์กรเป้าหมาย (AutoSearch) <span className="text-[#ea2261]">*</span>
              </label>

              {selectedCompany ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#533afd]/5 border border-[#533afd]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-[#533afd]" />
                    <span className="font-bold text-[#0d253d]">{selectedCompany.name}</span>
                    <Badge className="bg-[#533afd] text-white text-[10px] rounded-full">
                      {selectedCompany.code}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCompany(null);
                      setIsDropdownOpen(true);
                    }}
                    className="h-6 text-[11px] text-[#533afd] hover:bg-[#533afd]/10 rounded-full px-2"
                  >
                    เปลี่ยนองค์กร
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d]" />
                  <Input
                    type="text"
                    placeholder="พิมพ์ชื่อบริษัท หรือรหัสย่อ เช่น ACME, DEMO..."
                    value={companySearchQuery}
                    onChange={(e) => {
                      setCompanySearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="pl-8 h-9 rounded-xl text-xs w-full"
                  />
                  {isSearchingCompanies && (
                    <Loader2 className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#533afd]" />
                  )}

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-10 z-50 bg-white border border-[#e3e8ee] rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 text-xs">
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-[#94a3b8] italic">
                          ไม่พบองค์กรที่ตรงกับคำค้นหา
                        </div>
                      ) : (
                        searchResults.map((comp) => (
                          <div
                            key={comp.id}
                            onClick={() => {
                              setSelectedCompany(comp);
                              setIsDropdownOpen(false);
                            }}
                            className="p-2 hover:bg-[#f6f9fc] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <span className="font-semibold text-[#0d253d]">{comp.name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {comp.code}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

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
                <option value={MessageCategory.SUPPORT}>การสนับสนุนและช่วยเหลือ (Support)</option>
                <option value={MessageCategory.UPGRADE_REQUEST}>ข้อเสนอแพ็กเกจ (Plan Proposal)</option>
                <option value={MessageCategory.BILLING}>การเงินและรอบบิล (Billing)</option>
                <option value={MessageCategory.GENERAL}>เรื่องทั่วไป (General)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                หัวข้อข้อความ <span className="text-[#ea2261]">*</span>
              </label>
              <Input
                required
                placeholder="เช่น การปรับปรุงแพ็กเกจและขยายโควตาพนักงาน"
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
                placeholder="พิมพ์ข้อความและรายละเอียดที่ต้องการส่งถึงองค์กร..."
                value={composeContent}
                onChange={(e) => setComposeContent(e.target.value)}
                className="min-h-[100px] text-xs rounded-xl"
              />
            </div>

            {/* File Attachment Upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0d253d]">
                แนบเอกสารหรือใบเสนอราคา (ถ้ามี)
              </label>
              <input
                type="file"
                ref={composeFileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setComposeFile(e.target.files[0]);
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
                  คลิกเพื่อเลือกไฟล์แนบ (PDF, ใบเสนอราคา, รูปภาพ, เอกสาร)
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
                disabled={isSending || !composeSubject.trim() || !composeContent.trim() || !selectedCompany}
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
