import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMessageThreadAction,
  replyMessageAction,
  updateThreadStatusAction,
  getThreadMessagesAction,
  searchCompaniesAction,
  getMessageAttachmentDownloadUrlAction,
} from "@/features/messaging/message-actions";
import { MessageCategory, ThreadStatus } from "@prisma/client";

vi.mock("@/lib/database", () => ({
  prisma: {
    company: {
      findMany: vi.fn().mockResolvedValue([
        { id: "comp-1", name: "Acme Corp", code: "ACME" },
        { id: "comp-2", name: "Beta Tech", code: "BETA" },
      ]),
    },
    messageThread: {
      create: vi.fn().mockResolvedValue({
        id: "thread-101",
        subject: "สอบถามการขอเพิ่มโควตา",
        category: "SUPPORT",
        status: "OPEN",
        companyId: "comp-123",
        messages: [{ id: "msg-1" }],
      }),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === "thread-101") {
          return Promise.resolve({
            id: "thread-101",
            subject: "สอบถามการขอเพิ่มโควตา",
            category: "SUPPORT",
            status: "OPEN",
            companyId: "comp-123",
            createdBy: { name: "HR Manager", email: "hr@acme.com", role: { code: "HR_ADMIN" } },
            messages: [
              {
                id: "msg-1",
                threadId: "thread-101",
                senderId: "user-123",
                content: "ต้องการสอบถามรายละเอียดเพิ่มเติมครับ",
                isRead: false,
                createdAt: new Date(),
                sender: { id: "user-123", name: "HR Manager", email: "hr@acme.com", role: { code: "HR_ADMIN", name: "HR" } },
                attachments: [],
              },
            ],
          });
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockResolvedValue({
        id: "thread-101",
        status: "RESOLVED",
      }),
    },
    message: {
      create: vi.fn().mockResolvedValue({
        id: "msg-2",
        threadId: "thread-101",
        senderId: "superadmin-1",
        content: "ทีมงานได้รับข้อมูลแล้วครับ",
        isRead: false,
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messageAttachment: {
      create: vi.fn().mockResolvedValue({
        id: "att-1",
        messageId: "msg-1",
        originalName: "invoice.pdf",
        fileName: "invoice.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        objectKey: "companies/comp-123/messages/thread-101/att-1.pdf",
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: "att-1",
        originalName: "invoice.pdf",
        mimeType: "application/pdf",
        objectKey: "companies/comp-123/messages/thread-101/att-1.pdf",
        message: {
          thread: { companyId: "comp-123" },
        },
      }),
    },
    $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
  },
}));

vi.mock("@/lib/storage", () => ({
  storageService: {
    putObject: vi.fn().mockResolvedValue({ etag: "mock-etag" }),
    getSignedDownloadUrl: vi.fn().mockResolvedValue("https://s3.mock.com/download/invoice.pdf"),
  },
  validateUploadFile: vi.fn().mockReturnValue({
    isValid: true,
    extension: "pdf",
    detectedMime: "application/pdf",
  }),
  sanitizeFilename: vi.fn().mockReturnValue("invoice.pdf"),
}));

let mockSession = {
  userId: "user-123",
  companyId: "comp-123",
  role: "COMPANY_ADMIN",
  type: "USER",
};

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}));

vi.mock("@/lib/audit", () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Messaging & Mailbox Support Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      userId: "user-123",
      companyId: "comp-123",
      role: "COMPANY_ADMIN",
      type: "USER",
    };
  });

  describe("searchCompaniesAction (AutoSearch)", () => {
    it("successfully searches companies dynamically for System Admin", async () => {
      mockSession.role = "SYSTEM_ADMIN";
      mockSession.companyId = "";

      const result = await searchCompaniesAction("acme");

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.[0].code).toBe("ACME");
    });
  });

  describe("createMessageThreadAction with File Attachment", () => {
    it("successfully creates a new thread with file attachment", async () => {
      const result = await createMessageThreadAction({
        subject: "สอบถามการขอเพิ่มโควตา",
        category: MessageCategory.SUPPORT,
        initialMessage: "ต้องการสอบถามเรื่องขยายโควตาพนักงาน 50 คนครับ",
        fileAttachment: {
          originalName: "invoice.pdf",
          base64: "JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFI",
          mimeType: "application/pdf",
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("ส่งข้อความเรียบร้อยแล้ว");
      expect(result.data?.threadId).toBe("thread-101");
    });

    it("fails when subject or message is empty", async () => {
      const result = await createMessageThreadAction({
        subject: "",
        initialMessage: "",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("กรุณาระบุหัวข้อ");
    });
  });

  describe("replyMessageAction with File Attachment", () => {
    it("successfully posts a reply message with file attachment", async () => {
      const result = await replyMessageAction({
        threadId: "thread-101",
        content: "ขอบคุณสำหรับข้อมูลครับ",
        fileAttachment: {
          originalName: "receipt.png",
          base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          mimeType: "image/png",
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("ส่งข้อความตอบกลับเรียบร้อยแล้ว");
    });
  });

  describe("getMessageAttachmentDownloadUrlAction", () => {
    it("generates presigned download url for attachment", async () => {
      const result = await getMessageAttachmentDownloadUrlAction("att-1");

      expect(result.success).toBe(true);
      expect(result.data?.url).toContain("https://s3.mock.com/download/invoice.pdf");
      expect(result.data?.originalName).toBe("invoice.pdf");
    });
  });

  describe("updateThreadStatusAction", () => {
    it("successfully updates thread status to RESOLVED", async () => {
      const result = await updateThreadStatusAction("thread-101", ThreadStatus.RESOLVED);

      expect(result.success).toBe(true);
      expect(result.message).toContain("แก้ไขแล้ว");
    });
  });

  describe("getThreadMessagesAction", () => {
    it("fetches thread messages and marks unread as read", async () => {
      mockSession.userId = "superadmin-1";
      mockSession.role = "SYSTEM_ADMIN";

      const result = await getThreadMessagesAction("thread-101");

      expect(result.success).toBe(true);
      expect(result.data?.messages.length).toBe(1);
    });
  });
});
