import { prisma } from "@/lib/database";
import * as crypto from "crypto";
import * as zlib from "zlib";
import * as fs from "fs/promises";
import * as path from "path";

export interface DatabaseSnapshot {
  version: string;
  exportedAt: string;
  metadata: {
    totalCompanies: number;
    totalEmployees: number;
    totalLeaveRequests: number;
    checksum: string;
  };
  tables: {
    companies: any[];
    roles: any[];
    users: any[];
    plans: any[];
    subscriptions: any[];
    departments: any[];
    positions: any[];
    shifts: any[];
    workSchedules: any[];
    employees: any[];
    leaveTypes: any[];
    leaveBalances: any[];
    leaveRequests: any[];
    leaveTransactions: any[];
    holidays: any[];
    announcements: any[];
    systemSettings: any[];
  };
}

export class BackupService {
  private static readonly BACKUP_DIR = path.join(process.cwd(), "storage", "backups");

  /**
   * Ensure backup directory exists
   */
  private static async ensureDir() {
    try {
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
    } catch {
      // already exists
    }
  }

  /**
   * Generate a complete JSON snapshot of all database tables, compress with gzip, and save to storage
   */
  static async createDatabaseBackup(triggerType: "MANUAL" | "SCHEDULED" = "MANUAL") {
    await this.ensureDir();

    const [
      companies,
      roles,
      users,
      plans,
      subscriptions,
      departments,
      positions,
      shifts,
      workSchedules,
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      leaveTransactions,
      holidays,
      announcements,
      systemSettings,
    ] = await Promise.all([
      prisma.company.findMany(),
      prisma.role.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, name: true, roleId: true, companyId: true, status: true, createdAt: true, updatedAt: true } }), // exclude passwords in backup dump
      prisma.plan.findMany(),
      prisma.subscription.findMany(),
      prisma.department.findMany(),
      prisma.position.findMany(),
      prisma.shift.findMany(),
      prisma.workSchedule.findMany(),
      prisma.employee.findMany(),
      prisma.leaveType.findMany(),
      prisma.leaveBalance.findMany(),
      prisma.leaveRequest.findMany(),
      prisma.leaveTransaction.findMany(),
      prisma.holiday.findMany(),
      prisma.announcement.findMany(),
      prisma.systemSetting.findMany(),
    ]);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rawFilename = `lalink_backup_${timestamp}.json`;
    const gzFilename = `${rawFilename}.gz`;

    const rawData: DatabaseSnapshot = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      metadata: {
        totalCompanies: companies.length,
        totalEmployees: employees.length,
        totalLeaveRequests: leaveRequests.length,
        checksum: "",
      },
      tables: {
        companies,
        roles,
        users,
        plans,
        subscriptions,
        departments,
        positions,
        shifts,
        workSchedules,
        employees,
        leaveTypes,
        leaveBalances,
        leaveRequests,
        leaveTransactions,
        holidays,
        announcements,
        systemSettings,
      },
    };

    const jsonString = JSON.stringify(rawData, null, 2);
    const checksum = crypto.createHash("sha256").update(jsonString).digest("hex");
    rawData.metadata.checksum = checksum;

    // Compress with gzip
    const gzippedBuffer = zlib.gzipSync(Buffer.from(JSON.stringify(rawData)));
    const targetPath = path.join(this.BACKUP_DIR, gzFilename);

    await fs.writeFile(targetPath, gzippedBuffer);

    // Save record to DB
    const backupLog = await prisma.backupLog.create({
      data: {
        filename: gzFilename,
        sizeBytes: BigInt(gzippedBuffer.length),
        status: "COMPLETED",
        triggerType,
        checksum,
        completedAt: new Date(),
      },
    });

    return {
      backupLog,
      filePath: targetPath,
      sizeBytes: gzippedBuffer.length,
      checksum,
    };
  }

  /**
   * Read backup file buffer for download
   */
  static async getBackupFile(filename: string): Promise<Buffer | null> {
    try {
      const filePath = path.join(this.BACKUP_DIR, path.basename(filename));
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }
}
