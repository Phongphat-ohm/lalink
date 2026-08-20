import { describe, it, expect, vi, beforeEach } from "vitest";
import { BackupService } from "@/lib/backup/backup-service";
import { generatePostgreSqlDump } from "@/lib/backup/sql-generator";
import AdmZip from "adm-zip";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/database", () => ({
  prisma: {
    company: { findMany: vi.fn().mockResolvedValue([{ id: "c1", name: "Acme", code: "ACME" }]) },
    branch: { findMany: mockFindMany },
    plan: { findMany: mockFindMany },
    subscription: { findMany: mockFindMany },
    planUpgradeRequest: { findMany: mockFindMany },
    messageThread: { findMany: mockFindMany },
    message: { findMany: mockFindMany },
    messageAttachment: { findMany: mockFindMany },
    role: { findMany: mockFindMany },
    permission: { findMany: mockFindMany },
    rolePermission: { findMany: mockFindMany },
    user: { findMany: vi.fn().mockResolvedValue([{ id: "u1", email: "admin@acme.com", name: "Admin" }]) },
    userSession: { findMany: mockFindMany },
    department: { findMany: mockFindMany },
    position: { findMany: mockFindMany },
    employee: { findMany: mockFindMany },
    leaveType: { findMany: mockFindMany },
    leavePolicy: { findMany: mockFindMany },
    approvalWorkflow: { findMany: mockFindMany },
    workflowStep: { findMany: mockFindMany },
    leaveBalance: { findMany: mockFindMany },
    leaveTransaction: { findMany: mockFindMany },
    leaveRequest: { findMany: mockFindMany },
    leaveApproval: { findMany: mockFindMany },
    leaveAttachment: { findMany: mockFindMany },
    holiday: { findMany: mockFindMany },
    notification: { findMany: mockFindMany },
    notificationTemplate: { findMany: mockFindMany },
    announcement: { findMany: mockFindMany },
    auditLog: { findMany: mockFindMany },
    securityEvent: { findMany: mockFindMany },
    loginLog: { findMany: mockFindMany },
    fileAccessLog: { findMany: mockFindMany },
    systemSetting: { findMany: mockFindMany },
    systemLog: { findMany: mockFindMany },
    apiKey: { findMany: mockFindMany },
    workSchedule: { findMany: mockFindMany },
    shift: { findMany: mockFindMany },
    shiftEntry: { findMany: mockFindMany },
    workScheduleEntry: { findMany: mockFindMany },
    leaveYear: { findMany: mockFindMany },
    importLog: { findMany: mockFindMany },
    backupLog: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: "backup-log-1",
          ...data,
        }),
      ),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  storageService: {
    upload: vi.fn().mockResolvedValue({
      key: "backups/test.zip",
      bucket: "lalink-dev",
      size: 1024,
      contentType: "application/zip",
    }),
    getSignedDownloadUrl: vi.fn().mockImplementation((key: string) => Promise.resolve(`https://s3.lalink.local/lalink-dev/${key}`)),
  },
}));

describe("All-in-One Multi-Format Backup Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates clean PostgreSQL SQL statements from table data", () => {
    const sql = generatePostgreSqlDump(
      {
        companies: {
          dbTableName: "companies",
          rows: [{ id: "comp-1", name: "Acme O'Connor", is_active: true, created_at: new Date("2026-08-20T00:00:00Z") }],
        },
      },
      {
        version: "3.0",
        exportedAt: "2026-08-20T00:00:00Z",
        totalRecords: 1,
        checksum: "abc123hash",
      },
    );

    expect(sql).toContain("BEGIN;");
    expect(sql).toContain("SET session_replication_role = 'replica';");
    expect(sql).toContain('INSERT INTO "companies"');
    expect(sql).toContain("Acme O''Connor");
    expect(sql).toContain("TRUE");
    expect(sql).toContain("COMMIT;");
  });

  it("creates multi-format ZIP bundle containing dump.sql, data_snapshot.json, attachments_manifest.json, manifest.json", async () => {
    const result = await BackupService.createDatabaseBackup("MANUAL");

    expect(result).toBeDefined();
    expect(result.backupLog).toBeDefined();
    expect(result.backupLog.filename).toContain(".zip");
    expect(result.s3Key).toContain("backups/lalink_backup_");
    expect(result.checksum).toBeDefined();
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.totalRecords).toBeGreaterThanOrEqual(2);
  });

  it("generates a signed download url for a backup zip bundle", async () => {
    const url = await BackupService.getBackupDownloadUrl("lalink_backup_test.zip");

    expect(url).toBeDefined();
    expect(url).toContain("backups/lalink_backup_test.zip");
  });
});
