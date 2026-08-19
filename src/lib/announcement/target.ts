import type { Prisma } from "@prisma/client";

export interface AnnouncementTargetInput {
  companyId: string;
  branchId: string | null;
  departmentId: string | null;
  now?: Date;
}

/**
 * Builds the Prisma `where` filter for published announcements that target
 * the given employee. An announcement matches when:
 *   - it belongs to the employee's company, AND
 *   - targetGroup is ALL, or
 *   - targetGroup is BRANCH and the announcement's branchId matches the
 *     employee's branch, or
 *   - targetGroup is DEPARTMENT and the announcement's departmentId matches
 *     the employee's department.
 * Announcements past their expiresAt are excluded.
 */
export function buildEmployeeAnnouncementWhere(
  input: AnnouncementTargetInput,
): Prisma.AnnouncementWhereInput {
  const now = input.now ?? new Date();

  return {
    companyId: input.companyId,
    isPublished: true,
    AND: [
      {
        OR: [
          { targetGroup: "ALL" },
          {
            targetGroup: "BRANCH",
            branchId: input.branchId ?? undefined,
          },
          {
            targetGroup: "DEPARTMENT",
            departmentId: input.departmentId ?? undefined,
          },
        ],
      },
      { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
    ],
  };
}

/**
 * Serializes the order-by for the employee announcement list:
 * pinned first, then newest published first.
 */
export function buildEmployeeAnnouncementOrderBy(): Prisma.AnnouncementOrderByWithRelationInput[] {
  return [{ isPinned: "desc" }, { publishedAt: "desc" }];
}