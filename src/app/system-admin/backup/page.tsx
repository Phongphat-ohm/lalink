import { prisma } from "@/lib/database";
import {
  BackupView,
  SerializedBackupLog,
} from "@/components/system-admin/backup-view";

export const dynamic = "force-dynamic";

export default async function SystemAdminBackupPage() {
  const backups = await prisma.backupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const serializedBackups: SerializedBackupLog[] = backups.map((b) => ({
    id: b.id,
    filename: b.filename,
    sizeBytes: b.sizeBytes.toString(),
    status: b.status,
    triggerType: b.triggerType,
    checksum: b.checksum,
    completedAt: b.completedAt ? b.completedAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
  }));

  return <BackupView backups={serializedBackups} />;
}
