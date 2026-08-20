import { prisma } from '@/lib/database';
import { apiKeyAuth, hasApiScope } from '@/lib/middleware/apiKeyAuth';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/leave-balances
 * Query employee leave balances / quotas.
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
  const employeeId = searchParams.get('employeeId');
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

  const whereClause: any = {
    companyId,
    year,
  };

  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  const balances = await prisma.leaveBalance.findMany({
    where: whereClause,
    include: {
      employee: {
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
        },
      },
      leaveType: {
        select: {
          id: true,
          name: true,
          code: true,
          isPaid: true,
        },
      },
    },
    orderBy: [{ employeeId: 'asc' }, { leaveTypeId: 'asc' }],
  });

  const serialized = balances.map((b) => ({
    id: b.id,
    year: b.year,
    employee: {
      id: b.employee.id,
      employeeCode: b.employee.employeeCode,
      name: `${b.employee.firstName} ${b.employee.lastName}`.trim(),
    },
    leaveType: {
      id: b.leaveType.id,
      name: b.leaveType.name,
      code: b.leaveType.code,
      isPaid: b.leaveType.isPaid,
    },
    quotaDays: Number(b.allocatedDays),
    carriedOverDays: Number(b.carriedForwardDays),
    usedDays: Number(b.usedDays),
    pendingDays: Number(b.pendingDays),
    remainingDays: Number(b.remainingDays),
  }));

  return NextResponse.json({
    success: true,
    data: {
      year,
      leaveBalances: serialized,
    },
  });
}
