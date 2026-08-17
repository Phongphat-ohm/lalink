import { prisma } from "@/lib/database";
import {
  Employee,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  Holiday,
  LeaveRequestStatus,
  ActorType,
  Prisma,
} from "@prisma/client";

/**
 * Scoped Data Access Layer (DAL) for Employee operations.
 * Guaranteed to enforce companyId on every database interaction.
 */
export const scopedEmployee = {
  async findById(
    companyId: string,
    employeeId: string,
  ): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId, // Enforced Tenant Scope
      },
      include: {
        department: true,
        position: true,
      },
    });
  },

  async findByCode(
    companyId: string,
    employeeCode: string,
  ): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: {
        companyId_employeeCode: {
          companyId,
          employeeCode,
        },
      },
      include: {
        department: true,
        position: true,
      },
    });
  },

  async list(
    companyId: string,
    options: {
      skip?: number;
      take?: number;
      departmentId?: string;
      search?: string;
      status?: "ACTIVE" | "PROBATION" | "RESIGNED";
    } = {},
  ): Promise<{ items: Employee[]; total: number }> {
    const where: Prisma.EmployeeWhereInput = {
      companyId, // Enforced Tenant Scope
      ...(options.departmentId ? { departmentId: options.departmentId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            OR: [
              { firstName: { contains: options.search, mode: "insensitive" } },
              { lastName: { contains: options.search, mode: "insensitive" } },
              {
                employeeCode: { contains: options.search, mode: "insensitive" },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: options.skip ?? 0,
        take: options.take ?? 20,
        orderBy: { employeeCode: "asc" },
        include: {
          department: true,
          position: true,
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total };
  },
};

/**
 * Scoped Data Access Layer for Leave Request operations.
 */
export const scopedLeaveRequest = {
  async findById(
    companyId: string,
    leaveRequestId: string,
  ): Promise<LeaveRequest | null> {
    return prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        companyId, // Enforced Tenant Scope (Anti-IDOR)
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        leaveType: true,
        attachments: true,
      },
    });
  },

  async list(
    companyId: string,
    options: {
      employeeId?: string;
      status?: LeaveRequestStatus;
      startDate?: Date;
      endDate?: Date;
      skip?: number;
      take?: number;
    } = {},
  ): Promise<{ items: LeaveRequest[]; total: number }> {
    const where: Prisma.LeaveRequestWhereInput = {
      companyId, // Enforced Tenant Scope
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.startDate && options.endDate
        ? {
            startDate: { gte: options.startDate },
            endDate: { lte: options.endDate },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: options.skip ?? 0,
        take: options.take ?? 20,
        orderBy: { createdAt: "desc" },
        include: {
          employee: true,
          leaveType: true,
          attachments: true,
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Checks for overlapping leave dates within the same company and employee.
   */
  async checkOverlappingLeave(
    companyId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string,
  ): Promise<boolean> {
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        companyId,
        employeeId,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    return !!overlapping;
  },
};

/**
 * Scoped Data Access Layer for Leave Balances.
 */
export const scopedLeaveBalance = {
  async getByEmployeeAndType(
    companyId: string,
    employeeId: string,
    leaveTypeId: string,
    year: number,
  ): Promise<LeaveBalance | null> {
    return prisma.leaveBalance.findFirst({
      where: {
        companyId,
        employeeId,
        leaveTypeId,
        year,
      },
      include: {
        leaveType: true,
      },
    });
  },

  async listByEmployee(
    companyId: string,
    employeeId: string,
    year: number,
  ): Promise<LeaveBalance[]> {
    return prisma.leaveBalance.findMany({
      where: {
        companyId,
        employeeId,
        year,
      },
      include: {
        leaveType: true,
      },
      orderBy: { leaveType: { name: "asc" } },
    });
  },
};

/**
 * Scoped Data Access Layer for Leave Types.
 */
export const scopedLeaveType = {
  async list(companyId: string): Promise<LeaveType[]> {
    return prisma.leaveType.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async findById(
    companyId: string,
    leaveTypeId: string,
  ): Promise<LeaveType | null> {
    return prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        companyId,
      },
    });
  },
};

/**
 * Scoped Data Access Layer for Holidays.
 */
export const scopedHoliday = {
  async listByYear(companyId: string, year: number): Promise<Holiday[]> {
    return prisma.holiday.findMany({
      where: {
        companyId,
        year,
      },
      orderBy: { date: "asc" },
    });
  },
};

/**
 * Scoped Audit Logger for Security and Data Modification Events.
 */
export const scopedAudit = {
  async record(
    companyId: string | null,
    actor: { id?: string; type: ActorType },
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    reqInfo?: { ip?: string; ua?: string },
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          companyId,
          actorType: actor.type,
          actorId: actor.id,
          action,
          resource,
          resourceId,
          details: details as Prisma.InputJsonValue,
          ipAddress: reqInfo?.ip,
          userAgent: reqInfo?.ua,
        },
      });
    } catch (err) {
      console.error("Audit log failed to write:", err);
    }
  },
};
