import { prisma } from "@/lib/database";
import { storageService } from "@/lib/storage";
import { generatePostgreSqlDump } from "./sql-generator";
import AdmZip from "adm-zip";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

export interface DatabaseSnapshot {
  version: string;
  system: string;
  exportedAt: string;
  metadata: {
    totalTables: number;
    totalRecords: number;
    tableCounts: Record<string, number>;
    checksum: string;
  };
  tables: Record<string, any[]>;
}

export class BackupService {
  private static readonly BACKUP_DIR = path.join(process.cwd(), "storage", "backups");

  /**
   * Ensure backup directory exists for local cache/fallback
   */
  private static async ensureDir() {
    try {
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
    } catch {
      // already exists
    }
  }

  /**
   * Generate an All-in-One Multi-Format Backup Bundle (.zip)
   * Containing:
   *   1. dump.sql (PostgreSQL SQL script ready for complete DB restore)
   *   2. data_snapshot.json (Structured JSON snapshot of all 42 tables)
   *   3. attachments_manifest.json (S3 attachments inventory & checksums)
   *   4. manifest.json (Archive metadata, record counts, and integrity hash)
   */
  static async createDatabaseBackup(triggerType: "MANUAL" | "SCHEDULED" = "MANUAL") {
    await this.ensureDir();

    const [
      companies,
      branches,
      plans,
      subscriptions,
      planUpgradeRequests,
      messageThreads,
      messages,
      messageAttachments,
      roles,
      permissions,
      rolePermissions,
      users,
      userSessions,
      departments,
      positions,
      employees,
      leaveTypes,
      leavePolicies,
      approvalWorkflows,
      workflowSteps,
      leaveBalances,
      leaveTransactions,
      leaveRequests,
      leaveApprovals,
      leaveAttachments,
      holidays,
      notifications,
      notificationTemplates,
      announcements,
      auditLogs,
      securityEvents,
      loginLogs,
      fileAccessLogs,
      systemSettings,
      systemLogs,
      apiKeys,
      workSchedules,
      shifts,
      shiftEntries,
      workScheduleEntries,
      leaveYears,
      importLogs,
    ] = await Promise.all([
      prisma.company.findMany(),
      prisma.branch.findMany(),
      prisma.plan.findMany(),
      prisma.subscription.findMany(),
      prisma.planUpgradeRequest.findMany(),
      prisma.messageThread.findMany(),
      prisma.message.findMany(),
      prisma.messageAttachment.findMany(),
      prisma.role.findMany(),
      prisma.permission.findMany(),
      prisma.rolePermission.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, name: true, roleId: true, companyId: true, status: true, createdAt: true, updatedAt: true } }), // exclude passwords in backup dump
      prisma.userSession.findMany({ select: { id: true, userId: true, isRevoked: true, createdAt: true, expiresAt: true, ipAddress: true, userAgent: true } }),
      prisma.department.findMany(),
      prisma.position.findMany(),
      prisma.employee.findMany(),
      prisma.leaveType.findMany(),
      prisma.leavePolicy.findMany(),
      prisma.approvalWorkflow.findMany(),
      prisma.workflowStep.findMany(),
      prisma.leaveBalance.findMany(),
      prisma.leaveTransaction.findMany(),
      prisma.leaveRequest.findMany(),
      prisma.leaveApproval.findMany(),
      prisma.leaveAttachment.findMany(),
      prisma.holiday.findMany(),
      prisma.notification.findMany(),
      prisma.notificationTemplate.findMany(),
      prisma.announcement.findMany(),
      prisma.auditLog.findMany(),
      prisma.securityEvent.findMany(),
      prisma.loginLog.findMany(),
      prisma.fileAccessLog.findMany(),
      prisma.systemSetting.findMany(),
      prisma.systemLog.findMany(),
      prisma.apiKey.findMany({ select: { id: true, name: true, keyPrefix: true, isRevoked: true, createdAt: true, lastUsedAt: true, expiresAt: true } }),
      prisma.workSchedule.findMany(),
      prisma.shift.findMany(),
      prisma.shiftEntry.findMany(),
      prisma.workScheduleEntry.findMany(),
      prisma.leaveYear.findMany(),
      prisma.importLog.findMany(),
    ]);

    const tableMapping: Record<string, { dbTableName: string; rows: any[] }> = {
      companies: { dbTableName: "companies", rows: companies },
      branches: { dbTableName: "branches", rows: branches },
      plans: { dbTableName: "plans", rows: plans },
      subscriptions: { dbTableName: "subscriptions", rows: subscriptions },
      planUpgradeRequests: { dbTableName: "plan_upgrade_requests", rows: planUpgradeRequests },
      messageThreads: { dbTableName: "message_threads", rows: messageThreads },
      messages: { dbTableName: "messages", rows: messages },
      messageAttachments: { dbTableName: "message_attachments", rows: messageAttachments },
      roles: { dbTableName: "roles", rows: roles },
      permissions: { dbTableName: "permissions", rows: permissions },
      rolePermissions: { dbTableName: "role_permissions", rows: rolePermissions },
      users: { dbTableName: "users", rows: users },
      userSessions: { dbTableName: "user_sessions", rows: userSessions },
      departments: { dbTableName: "departments", rows: departments },
      positions: { dbTableName: "positions", rows: positions },
      employees: { dbTableName: "employees", rows: employees },
      leaveTypes: { dbTableName: "leave_types", rows: leaveTypes },
      leavePolicies: { dbTableName: "leave_policies", rows: leavePolicies },
      approvalWorkflows: { dbTableName: "approval_workflows", rows: approvalWorkflows },
      workflowSteps: { dbTableName: "workflow_steps", rows: workflowSteps },
      leaveBalances: { dbTableName: "leave_balances", rows: leaveBalances },
      leaveTransactions: { dbTableName: "leave_transactions", rows: leaveTransactions },
      leaveRequests: { dbTableName: "leave_requests", rows: leaveRequests },
      leaveApprovals: { dbTableName: "leave_approvals", rows: leaveApprovals },
      leaveAttachments: { dbTableName: "leave_attachments", rows: leaveAttachments },
      holidays: { dbTableName: "holidays", rows: holidays },
      notifications: { dbTableName: "notifications", rows: notifications },
      notificationTemplates: { dbTableName: "notification_templates", rows: notificationTemplates },
      announcements: { dbTableName: "announcements", rows: announcements },
      auditLogs: { dbTableName: "audit_logs", rows: auditLogs },
      securityEvents: { dbTableName: "security_events", rows: securityEvents },
      loginLogs: { dbTableName: "login_logs", rows: loginLogs },
      fileAccessLogs: { dbTableName: "file_access_logs", rows: fileAccessLogs },
      systemSettings: { dbTableName: "system_settings", rows: systemSettings },
      systemLogs: { dbTableName: "system_logs", rows: systemLogs },
      apiKeys: { dbTableName: "api_keys", rows: apiKeys },
      workSchedules: { dbTableName: "work_schedules", rows: workSchedules },
      shifts: { dbTableName: "shifts", rows: shifts },
      shiftEntries: { dbTableName: "shift_entries", rows: shiftEntries },
      workScheduleEntries: { dbTableName: "work_schedule_entries", rows: workScheduleEntries },
      leaveYears: { dbTableName: "leave_years", rows: leaveYears },
      importLogs: { dbTableName: "import_logs", rows: importLogs },
    };

    const tableCounts: Record<string, number> = {};
    const tablesJson: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const [key, info] of Object.entries(tableMapping)) {
      tableCounts[key] = info.rows.length;
      tablesJson[key] = info.rows;
      totalRecords += info.rows.length;
    }

    const exportedAt = new Date().toISOString();
    const timestamp = exportedAt.replace(/[:.]/g, "-");
    const zipFilename = `lalink_backup_${timestamp}.zip`;

    // 1. JSON Snapshot
    const rawData: DatabaseSnapshot = {
      version: "3.0",
      system: "LALINK Multi-Tenant SaaS",
      exportedAt,
      metadata: {
        totalTables: Object.keys(tableMapping).length,
        totalRecords,
        tableCounts,
        checksum: "",
      },
      tables: tablesJson,
    };

    const jsonString = JSON.stringify(rawData, null, 2);
    const checksum = crypto.createHash("sha256").update(jsonString).digest("hex");
    rawData.metadata.checksum = checksum;
    const finalJsonString = JSON.stringify(rawData, null, 2);

    // 2. SQL Dump
    const sqlDumpString = generatePostgreSqlDump(tableMapping, {
      version: "3.0",
      exportedAt,
      totalRecords,
      checksum,
    });

    // 3. Attachments Manifest (S3 Files Inventory)
    const attachmentsManifest = {
      exportedAt,
      totalLeaveAttachments: leaveAttachments.length,
      totalMessageAttachments: messageAttachments.length,
      leaveAttachments: leaveAttachments.map((a: any) => ({
        id: a.id,
        companyId: a.companyId,
        leaveRequestId: a.leaveRequestId,
        originalName: a.originalName,
        objectKey: a.objectKey,
        size: a.size,
        mimeType: a.mimeType,
        checksum: a.checksum,
        createdAt: a.createdAt,
      })),
      messageAttachments: messageAttachments.map((m: any) => ({
        id: m.id,
        messageId: m.messageId,
        originalName: m.originalName,
        fileName: m.fileName,
        objectKey: m.objectKey,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        createdAt: m.createdAt,
      })),
    };
    const attachmentsManifestString = JSON.stringify(attachmentsManifest, null, 2);

    // 4. Manifest File
    const manifest = {
      archiveName: zipFilename,
      system: "LALINK Multi-Tenant SaaS",
      version: "3.0",
      exportedAt,
      triggerType,
      sha256Checksum: checksum,
      summary: {
        totalTables: Object.keys(tableMapping).length,
        totalRecords,
        totalAttachments: leaveAttachments.length + messageAttachments.length,
      },
      tableCounts,
      contents: [
        { file: "dump.sql", format: "SQL", description: "Executable PostgreSQL dump for complete database restore" },
        { file: "data_snapshot.json", format: "JSON", description: "Structured JSON snapshot of all database tables" },
        { file: "attachments_manifest.json", format: "JSON", description: "S3 Object Storage file inventory & metadata" },
        { file: "manifest.json", format: "JSON", description: "System metadata and checksum verification" },
      ],
    };
    const manifestString = JSON.stringify(manifest, null, 2);

    // 5. Package into Multi-Format ZIP Bundle
    const zip = new AdmZip();
    zip.addFile("dump.sql", Buffer.from(sqlDumpString, "utf-8"), "PostgreSQL SQL Dump");
    zip.addFile("data_snapshot.json", Buffer.from(finalJsonString, "utf-8"), "JSON Data Snapshot");
    zip.addFile("attachments_manifest.json", Buffer.from(attachmentsManifestString, "utf-8"), "S3 Attachments Manifest");
    zip.addFile("manifest.json", Buffer.from(manifestString, "utf-8"), "System Backup Manifest");

    const zipBuffer = zip.toBuffer();
    const targetPath = path.join(this.BACKUP_DIR, zipFilename);

    // Save to local cache
    try {
      await fs.writeFile(targetPath, zipBuffer);
    } catch (err) {
      console.warn("Failed to write local backup cache:", err);
    }

    // Upload to S3 Object Storage
    const s3Key = `backups/${zipFilename}`;
    try {
      await storageService.upload({
        key: s3Key,
        buffer: zipBuffer,
        contentType: "application/zip",
        metadata: {
          checksum,
          version: "3.0",
          triggerType,
          totalRecords: String(totalRecords),
        },
      });
    } catch (err) {
      console.error("Failed to upload backup to S3:", err);
    }

    // Save record to DB
    const backupLog = await prisma.backupLog.create({
      data: {
        filename: zipFilename,
        sizeBytes: BigInt(zipBuffer.length),
        status: "COMPLETED",
        triggerType,
        checksum,
        completedAt: new Date(),
      },
    });

    return {
      backupLog,
      filePath: targetPath,
      s3Key,
      sizeBytes: zipBuffer.length,
      checksum,
      totalRecords,
      tableCounts,
    };
  }

  /**
   * Get Pre-signed Download URL from S3 Storage (default 15 minutes)
   */
  static async getBackupDownloadUrl(filename: string, expiresInSeconds: number = 900): Promise<string> {
    const cleanName = path.basename(filename);
    const s3Key = `backups/${cleanName}`;
    return await storageService.getSignedDownloadUrl(s3Key, expiresInSeconds);
  }

  /**
   * Read backup file buffer for direct download (local disk with S3 fetch fallback)
   */
  static async getBackupFile(filename: string): Promise<Buffer | null> {
    const cleanName = path.basename(filename);
    try {
      const filePath = path.join(this.BACKUP_DIR, cleanName);
      return await fs.readFile(filePath);
    } catch {
      // Fetch from S3 Storage if not present on local disk
      try {
        const s3Key = `backups/${cleanName}`;
        return await storageService.getObject(s3Key);
      } catch (err) {
        console.error("Failed to fetch backup buffer from S3:", err);
        return null;
      }
    }
  }
}
