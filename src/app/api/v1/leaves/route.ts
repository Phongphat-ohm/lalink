import { prisma } from '@/lib/database';
import { apiKeyAuth, hasApiScope } from '@/lib/middleware/apiKeyAuth';
import { dispatchEvent } from '@/lib/webhook';
import { NextResponse, NextRequest } from 'next/server';
import { LeaveRequestStatus, LeavePeriod, ActorType } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/leaves
 * List leave requests for the authenticated company.
 * Required scope: `leaves:read` or `*`
 */
export async function GET(req: NextRequest) {
  const authResult = await apiKeyAuth(req);
  if (authResult) return authResult;

  if (!hasApiScope(req as any, 'leaves:read')) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Missing required scope leaves:read' },
      { status: 403 },
    );
  }

  const companyId = req.headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'API key is not bound to a company' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const status = searchParams.get('status') as LeaveRequestStatus | null;
  const employeeId = searchParams.get('employeeId');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  const whereClause: any = { companyId };

  if (status) {
    whereClause.status = status;
  }

  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  if (startDateStr || endDateStr) {
    whereClause.startDate = {};
    if (startDateStr) whereClause.startDate.gte = new Date(startDateStr);
    if (endDateStr) whereClause.startDate.lte = new Date(endDateStr);
  }

  const [total, leaveRequests] = await Promise.all([
    prisma.leaveRequest.count({ where: whereClause }),
    prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            size: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serialized = leaveRequests.map((lr) => ({
    id: lr.id,
    requestNumber: lr.requestNumber,
    employee: {
      id: lr.employee.id,
      employeeCode: lr.employee.employeeCode,
      name: `${lr.employee.firstName} ${lr.employee.lastName}`.trim(),
      email: lr.employee.email,
    },
    leaveType: {
      id: lr.leaveType.id,
      name: lr.leaveType.name,
      code: lr.leaveType.code,
    },
    period: lr.startPeriod,
    startDate: lr.startDate.toISOString(),
    endDate: lr.endDate.toISOString(),
    totalDays: Number(lr.totalDays),
    hours: lr.hours ? Number(lr.hours) : null,
    reason: lr.reason,
    status: lr.status,
    attachments: lr.attachments.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
    })),
    createdAt: lr.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data: {
      leaveRequests: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}

/**
 * POST /api/v1/leaves
 * Submit a leave request on behalf of an employee.
 * Required scope: `leaves:write` or `*`
 */
export async function POST(req: NextRequest) {
  const authResult = await apiKeyAuth(req);
  if (authResult) return authResult;

  if (!hasApiScope(req as any, 'leaves:write')) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Missing required scope leaves:write' },
      { status: 403 },
    );
  }

  const companyId = req.headers.get('x-company-id');
  if (!companyId) {
    return NextResponse.json(
      { success: false, error: 'API key is not bound to a company' },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const {
      employeeId,
      leaveTypeId,
      period = 'FULL_DAY',
      startDate,
      endDate,
      hours,
      reason,
    } = body;

    if (!employeeId || !leaveTypeId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: employeeId, leaveTypeId, startDate, endDate, reason',
        },
        { status: 400 },
      );
    }

    // 1. Verify Employee belongs to this company
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found in this company' },
        { status: 404 },
      );
    }

    // 2. Verify LeaveType belongs to this company
    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, companyId, isActive: true },
    });
    if (!leaveType) {
      return NextResponse.json(
        { success: false, error: 'Leave type not found or inactive' },
        { status: 404 },
      );
    }

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format (use YYYY-MM-DD)' },
        { status: 400 },
      );
    }

    if (startObj > endObj) {
      return NextResponse.json(
        { success: false, error: 'startDate must be before or equal to endDate' },
        { status: 400 },
      );
    }

    // Calculate duration in days
    let totalLeaveDays = 1.0;
    if (period === 'FIRST_HALF' || period === 'SECOND_HALF') {
      totalLeaveDays = 0.5;
    } else if (period === 'HOURLY' && hours) {
      totalLeaveDays = Number(hours) / 8.0;
    } else {
      const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      totalLeaveDays = diffDays;
    }

    // Check balance for paid leave
    const currentYear = startObj.getFullYear();
    const balance = await prisma.leaveBalance.findFirst({
      where: {
        companyId,
        employeeId,
        leaveTypeId,
        year: currentYear,
      },
    });

    if (leaveType.isPaid && balance) {
      const remaining = Number(balance.remainingDays);
      if (remaining < totalLeaveDays) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient leave balance quota (remaining: ${remaining}, requested: ${totalLeaveDays})`,
          },
          { status: 400 },
        );
      }
    }

    // Generate Sequential Request Number
    const countThisMonth = await prisma.leaveRequest.count({
      where: {
        companyId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const monthStr = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const seqStr = String(countThisMonth + 1).padStart(4, '0');
    const requestNumber = `LR-${monthStr}-${seqStr}`;

    const createdRequest = await prisma.$transaction(async (tx) => {
      const lr = await tx.leaveRequest.create({
        data: {
          companyId,
          employeeId,
          leaveTypeId,
          requestNumber,
          startDate: startObj,
          endDate: endObj,
          startPeriod: period as LeavePeriod,
          endPeriod: period as LeavePeriod,
          totalDays: totalLeaveDays,
          hours: hours ? Number(hours) : null,
          reason,
          status: LeaveRequestStatus.PENDING,
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { increment: totalLeaveDays },
            remainingDays: { decrement: totalLeaveDays },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          companyId,
          actorType: ActorType.SYSTEM,
          actorId: (req as any).headers.get('x-api-key-id') || 'API_KEY',
          action: 'CREATE_LEAVE_API',
          resource: 'LeaveRequest',
          resourceId: lr.id,
          details: {
            requestNumber,
            employeeId,
            leaveTypeId,
            totalDays: totalLeaveDays,
            startDate: startObj.toISOString(),
            endDate: endObj.toISOString(),
          },
        },
      });

      return lr;
    });

    // Dispatch Webhook Event `leave.created`
    dispatchEvent('leave.created', {
      leaveRequestId: createdRequest.id,
      requestNumber: createdRequest.requestNumber,
      companyId,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      startDate: startObj.toISOString(),
      endDate: endObj.toISOString(),
      totalDays: totalLeaveDays,
      reason,
      status: createdRequest.status,
      createdAt: createdRequest.createdAt.toISOString(),
    }).catch((err) => console.error('Failed to dispatch webhook:', err));

    return NextResponse.json(
      {
        success: true,
        data: {
          leaveRequestId: createdRequest.id,
          requestNumber: createdRequest.requestNumber,
          status: createdRequest.status,
          daysUsed: totalLeaveDays,
          currentApprovalStep: 1,
          createdAt: createdRequest.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('API POST Leaves Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
