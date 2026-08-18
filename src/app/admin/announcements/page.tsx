import { prisma } from "@/lib/database";
import { requireAdminPermission } from "@/lib/permissions/admin-access";
import { PERMISSIONS } from "@/lib/permissions/rbac";
import {
  AnnouncementView,
  SerializedAnnouncement,
  BranchOption,
  DepartmentOption,
} from "@/components/admin/announcement-view";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const { companyId } = await requireAdminPermission(
    PERMISSIONS.ANNOUNCEMENT_MANAGE,
  );

  const [announcements, branches, departments] = await Promise.all([
    prisma.announcement.findMany({
      where: { companyId },
      include: {
        branch: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.branch.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedAnnouncements: SerializedAnnouncement[] = announcements.map(
    (a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      targetGroup: a.targetGroup,
      branchName: a.branch?.name || null,
      departmentName: a.department?.name || null,
      isPublished: a.isPublished,
      publishedAt: a.publishedAt.toISOString(),
    }),
  );

  const serializedBranches: BranchOption[] = branches.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  const serializedDepartments: DepartmentOption[] = departments.map((d) => ({
    id: d.id,
    name: d.name,
  }));

  return (
    <AnnouncementView
      announcements={serializedAnnouncements}
      branches={serializedBranches}
      departments={serializedDepartments}
    />
  );
}
