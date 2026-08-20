import { prisma } from '@/lib/database';
import { apiKeyAuth, hasApiScope } from '@/lib/middleware/apiKeyAuth';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/employees
 * List employees with pagination and filtering for the authenticated company.
 * Required scope: `employees:read` or `*`
 */
export async function GET(req: NextRequest) {
  const authResult = await apiKeyAuth(req);
  if (authResult) return authResult;

  if (!hasApiScope(req as any, 'employees:read')) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Missing required scope employees:read' },
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
  const search = searchParams.get('search')?.trim();
  const departmentId = searchParams.get('departmentId');
  const status = searchParams.get('status');

  const whereClause: any = { companyId };

  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { employeeCode: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where: whereClause }),
    prisma.employee.findMany({
      where: whereClause,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        lineUserId: true,
        department: { select: { id: true, name: true, code: true } },
        position: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { employeeCode: 'asc' },
    }),
  ]);

  const serialized = employees.map((emp) => ({
    id: emp.id,
    employeeCode: emp.employeeCode,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    department: emp.department?.name || null,
    departmentCode: emp.department?.code || null,
    position: emp.position?.name || null,
    positionCode: emp.position?.code || null,
    branch: emp.branch?.name || null,
    isLineConnected: !!emp.lineUserId,
    status: emp.status,
  }));

  return NextResponse.json({
    success: true,
    data: {
      employees: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
}
