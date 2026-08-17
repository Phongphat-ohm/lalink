import "dotenv/config";
import {
  PrismaClient,
  CompanyStatus,
  UserStatus,
  EmployeeStatus,
  LeavePeriod,
  LeaveRequestStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set in environment variables.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.info("🌱 Starting Database Seeding (Complete SaaS Foundation)...");

  // 1. Create SaaS Plans
  console.info("📦 Seeding SaaS Plans...");
  const freePlan = await prisma.plan.upsert({
    where: { code: "FREE" },
    update: {},
    create: {
      code: "FREE",
      name: "Starter Free Plan",
      description: "สำหรับธุรกิจขนาดเล็ก ไม่เกิน 20 พนักงาน",
      maxEmployees: 20,
      maxAdmins: 2,
      priceMonthly: 0,
      priceYearly: 0,
      features: { liff: true, leaveApproval: true, s3Storage: true },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { code: "PRO" },
    update: {},
    create: {
      code: "PRO",
      name: "Professional Plan",
      description:
        "สำหรับองค์กรขนาดกลาง ไม่เกิน 100 พนักงาน พร้อมระบบออกรายงานและนโยบายปรับแต่ง",
      maxEmployees: 100,
      maxAdmins: 5,
      priceMonthly: 990,
      priceYearly: 9900,
      features: {
        liff: true,
        leaveApproval: true,
        s3Storage: true,
        advancedReports: true,
        customPolicies: true,
      },
    },
  });

  // 2. Create Permissions
  console.info("🔐 Seeding Permissions...");
  const permissionsList = [
    { code: "company:manage", name: "จัดการข้อมูลบริษัท", module: "COMPANY" },
    { code: "user:manage", name: "จัดการผู้ใช้งานระบบ", module: "USER" },
    { code: "employee:read", name: "ดูข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "employee:create", name: "เพิ่มพนักงาน", module: "EMPLOYEE" },
    { code: "employee:update", name: "แก้ไขข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "employee:delete", name: "ลบ/ระงับพนักงาน", module: "EMPLOYEE" },
    { code: "leave:read", name: "ดูรายการใบลา", module: "LEAVE" },
    { code: "leave:create", name: "ยื่นใบลา", module: "LEAVE" },
    { code: "leave:approve", name: "อนุมัติ/ไม่อนุมัติใบลา", module: "LEAVE" },
    { code: "leave:cancel", name: "ยกเลิกใบลา", module: "LEAVE" },
    {
      code: "policy:manage",
      name: "จัดการนโยบายวันลาและโควตา",
      module: "POLICY",
    },
    {
      code: "holiday:manage",
      name: "จัดการปฏิทินวันหยุดบริษัท",
      module: "HOLIDAY",
    },
    { code: "report:read", name: "ดูรายงานและสถิติ", module: "REPORT" },
    { code: "audit:read", name: "ดูบันทึก Audit Log", module: "AUDIT" },
  ];

  const createdPermissions: Record<string, string> = {};
  for (const perm of permissionsList) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    });
    createdPermissions[perm.code] = p.id;
  }

  // 3. Create Global System Roles
  console.info("👥 Seeding Global Roles...");
  let systemAdminRole = await prisma.role.findFirst({
    where: { companyId: null, code: "SYSTEM_ADMIN" },
  });

  if (!systemAdminRole) {
    systemAdminRole = await prisma.role.create({
      data: {
        code: "SYSTEM_ADMIN",
        name: "ผู้ดูแลระบบแพลตฟอร์ม (Platform Super Admin)",
        description: "สิทธิ์สูงสุดระดับระบบดูแลทุกบริษัทและ Tenant",
        isSystem: true,
      },
    });
  }

  // 4. Create Demo Tenant Company
  console.info("🏢 Seeding Demo Company (Tenant: DEMO)...");
  const demoCompany = await prisma.company.upsert({
    where: { code: "DEMO" },
    update: {},
    create: {
      code: "DEMO",
      name: "บริษัท เดโม ดิจิทัล โซลูชั่น จำกัด",
      taxId: "0105559998881",
      email: "contact@demo.co.th",
      phone: "02-123-4567",
      address: "123 อาคารนวัตกรรม ชั้น 15 ถนนสุขุมวิท กรุงเทพมหานคร 10110",
      status: CompanyStatus.ACTIVE,
    },
  });

  // Create Subscription for Demo Company
  await prisma.subscription.upsert({
    where: { companyId: demoCompany.id },
    update: {},
    create: {
      companyId: demoCompany.id,
      planId: proPlan.id,
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  // 5. Create Company-Level Roles for Demo Company
  const companyAdminRole = await prisma.role.upsert({
    where: {
      companyId_code: { companyId: demoCompany.id, code: "COMPANY_ADMIN" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      code: "COMPANY_ADMIN",
      name: "ผู้ดูแลระบบบริษัท (Company Admin)",
      description: "จัดการข้อมูลทั้งหมดภายในบริษัท",
      isSystem: true,
    },
  });

  const hrRole = await prisma.role.upsert({
    where: { companyId_code: { companyId: demoCompany.id, code: "HR" } },
    update: {},
    create: {
      companyId: demoCompany.id,
      code: "HR",
      name: "เจ้าหน้าที่ฝ่ายบุคคล (HR)",
      description: "จัดการพนักงาน โควตาวันลา และอนุมัติใบลา",
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { companyId_code: { companyId: demoCompany.id, code: "MANAGER" } },
    update: {},
    create: {
      companyId: demoCompany.id,
      code: "MANAGER",
      name: "หัวหน้างาน (Manager)",
      description: "อนุมัติใบลาของลูกทีมในแผนก",
      isSystem: true,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { companyId_code: { companyId: demoCompany.id, code: "EMPLOYEE" } },
    update: {},
    create: {
      companyId: demoCompany.id,
      code: "EMPLOYEE",
      name: "พนักงาน (Employee)",
      description: "ยื่นใบลาและดูประวัติของตนเองผ่าน LINE LIFF",
      isSystem: true,
    },
  });

  // Link Permissions to Roles
  for (const permCode of Object.keys(createdPermissions)) {
    const permId = createdPermissions[permCode];

    // Company Admin gets all company-level permissions
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: companyAdminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: companyAdminRole.id,
        permissionId: permId,
      },
    });

    // HR gets HR-specific permissions
    if (
      [
        "employee:read",
        "employee:create",
        "employee:update",
        "leave:read",
        "leave:approve",
        "leave:cancel",
        "policy:manage",
        "holiday:manage",
        "report:read",
        "audit:read",
      ].includes(permCode)
    ) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: hrRole.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: hrRole.id,
          permissionId: permId,
        },
      });
    }
  }

  // 6. Create Default Passwords & Users
  console.info("👤 Seeding Platform & Tenant Users...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin@123456", salt);

  // Platform Super Admin
  await prisma.user.upsert({
    where: { email: "superadmin@platform.com" },
    update: { passwordHash },
    create: {
      companyId: null,
      email: "superadmin@platform.com",
      passwordHash,
      name: "Platform Super Admin",
      status: UserStatus.ACTIVE,
      roleId: systemAdminRole.id,
    },
  });

  // Demo Company Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { passwordHash },
    create: {
      companyId: demoCompany.id,
      email: "admin@demo.com",
      passwordHash,
      name: "ผู้ดูแลระบบ เดโม",
      status: UserStatus.ACTIVE,
      roleId: companyAdminRole.id,
    },
  });

  // Demo HR User
  await prisma.user.upsert({
    where: { email: "hr@demo.com" },
    update: { passwordHash },
    create: {
      companyId: demoCompany.id,
      email: "hr@demo.com",
      passwordHash,
      name: "วิภาดา ทรัพยากรบุคคล",
      status: UserStatus.ACTIVE,
      roleId: hrRole.id,
    },
  });

  // 7. Create Departments & Positions
  console.info("🏛️ Seeding Departments & Positions...");
  const devDept = await prisma.department.upsert({
    where: {
      companyId_name: { companyId: demoCompany.id, name: "Engineering" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "Engineering",
      code: "ENG",
    },
  });

  const hrDept = await prisma.department.upsert({
    where: {
      companyId_name: { companyId: demoCompany.id, name: "Human Resources" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "Human Resources",
      code: "HR",
    },
  });

  const salesDept = await prisma.department.upsert({
    where: {
      companyId_name: { companyId: demoCompany.id, name: "Sales & Marketing" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "Sales & Marketing",
      code: "SALES",
    },
  });

  const devPos = await prisma.position.upsert({
    where: {
      companyId_name: {
        companyId: demoCompany.id,
        name: "Senior Software Engineer",
      },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "Senior Software Engineer",
      code: "SR-DEV",
    },
  });

  const hrPos = await prisma.position.upsert({
    where: {
      companyId_name: { companyId: demoCompany.id, name: "HR Specialist" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "HR Specialist",
      code: "HR-SPEC",
    },
  });

  const salesPos = await prisma.position.upsert({
    where: {
      companyId_name: { companyId: demoCompany.id, name: "Sales Executive" },
    },
    update: {},
    create: {
      companyId: demoCompany.id,
      name: "Sales Executive",
      code: "SALES-EXEC",
    },
  });

  // 8. Create Leave Types
  console.info("📝 Seeding Standard Leave Types...");
  const leaveTypesData = [
    {
      code: "SICK",
      name: "ลาป่วย (Sick Leave)",
      description: "ลาหยุดเนื่องจากอาการเจ็บป่วยหรือรักษาตัว",
      defaultDays: 30,
      allowHalfDay: true,
      requireAttachment: true,
      attachmentRequiredDays: 3,
      requireReason: true,
      isPaid: true,
    },
    {
      code: "PERSONAL",
      name: "ลากิจธุระ (Personal Leave)",
      description: "ลาเพื่อทำธุระส่วนตัวที่จำเป็น",
      defaultDays: 6,
      allowHalfDay: true,
      requireAttachment: false,
      requireReason: true,
      isPaid: true,
    },
    {
      code: "ANNUAL",
      name: "ลาพักร้อนประจำปี (Annual Leave)",
      description: "วันหยุดพักผ่อนประจำปีตามสิทธิ์",
      defaultDays: 6,
      allowHalfDay: true,
      requireAttachment: false,
      requireReason: false,
      isPaid: true,
    },
    {
      code: "MATERNITY",
      name: "ลาคลอดบุตร (Maternity Leave)",
      description: "ลาเพื่อการคลอดบุตรและดูแลบุตรแรกเกิด",
      defaultDays: 98,
      allowHalfDay: false,
      requireAttachment: true,
      attachmentRequiredDays: 1,
      requireReason: true,
      isPaid: true,
    },
    {
      code: "WITHOUT_PAY",
      name: "ลาโดยไม่รับค่าจ้าง (Leave Without Pay)",
      description: "ลาหยุดเกินสิทธิ์โดยไม่รับค่าจ้าง",
      defaultDays: 0,
      allowHalfDay: true,
      requireAttachment: false,
      requireReason: true,
      isPaid: false,
    },
  ];

  const createdLeaveTypes = [];
  for (const lt of leaveTypesData) {
    const item = await prisma.leaveType.upsert({
      where: { companyId_code: { companyId: demoCompany.id, code: lt.code } },
      update: lt,
      create: {
        ...lt,
        companyId: demoCompany.id,
      },
    });
    createdLeaveTypes.push(item);
  }

  // 9. Create Demo Employees
  console.info("👨‍💼 Seeding Demo Employees & Leave Balances...");
  const employeesData = [
    {
      employeeCode: "EMP-001",
      firstName: "สมชาย",
      lastName: "สายฟ้า",
      dateOfBirth: new Date("1995-05-15"),
      email: "somchai@demo.co.th",
      phone: "081-111-2222",
      departmentId: devDept.id,
      positionId: devPos.id,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeCode: "EMP-002",
      firstName: "สมหญิง",
      lastName: "ยิ่งเจริญ",
      dateOfBirth: new Date("1998-08-20"),
      email: "somying@demo.co.th",
      phone: "082-333-4444",
      departmentId: hrDept.id,
      positionId: hrPos.id,
      status: EmployeeStatus.ACTIVE,
    },
    {
      employeeCode: "EMP-003",
      firstName: "มานะ",
      lastName: "มีใจ",
      dateOfBirth: new Date("1992-12-01"),
      email: "mana@demo.co.th",
      phone: "083-555-6666",
      departmentId: salesDept.id,
      positionId: salesPos.id,
      status: EmployeeStatus.ACTIVE,
    },
  ];

  const currentYear = new Date().getFullYear();
  const createdEmployees = [];

  for (const empData of employeesData) {
    const employee = await prisma.employee.upsert({
      where: {
        companyId_employeeCode: {
          companyId: demoCompany.id,
          employeeCode: empData.employeeCode,
        },
      },
      update: empData,
      create: {
        ...empData,
        companyId: demoCompany.id,
      },
    });
    createdEmployees.push(employee);

    // 10. Allocate Leave Balances & Initial Ledger
    for (const lt of createdLeaveTypes) {
      const allocated = Number(lt.defaultDays);
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          companyId: demoCompany.id,
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocatedDays: allocated,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: allocated,
          carriedForwardDays: 0,
        },
      });
    }
  }

  // 11. Create Demo Leave Requests for EMP-001 (For testing dashboard & approval)
  console.info("📋 Seeding Demo Leave Requests...");
  const emp1 = createdEmployees[0];
  const annualLeaveType = createdLeaveTypes.find((t) => t.code === "ANNUAL");
  const sickLeaveType = createdLeaveTypes.find((t) => t.code === "SICK");

  if (emp1 && annualLeaveType) {
    // Pending Leave Request
    await prisma.leaveRequest.upsert({
      where: {
        companyId_requestNumber: {
          companyId: demoCompany.id,
          requestNumber: "LR-202608-0001",
        },
      },
      update: {},
      create: {
        companyId: demoCompany.id,
        employeeId: emp1.id,
        leaveTypeId: annualLeaveType.id,
        requestNumber: "LR-202608-0001",
        startDate: new Date(`${currentYear}-09-10`),
        endDate: new Date(`${currentYear}-09-11`),
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        totalDays: 2.0,
        reason: "ไปทำธุระครอบครัวต่างจังหวัด",
        status: LeaveRequestStatus.PENDING,
      },
    });
  }

  if (emp1 && sickLeaveType) {
    // Approved Leave Request
    await prisma.leaveRequest.upsert({
      where: {
        companyId_requestNumber: {
          companyId: demoCompany.id,
          requestNumber: "LR-202608-0002",
        },
      },
      update: {},
      create: {
        companyId: demoCompany.id,
        employeeId: emp1.id,
        leaveTypeId: sickLeaveType.id,
        requestNumber: "LR-202608-0002",
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear}-08-01`),
        startPeriod: LeavePeriod.FULL_DAY,
        endPeriod: LeavePeriod.FULL_DAY,
        totalDays: 1.0,
        reason: "มีไข้และปวดศีรษะ",
        status: LeaveRequestStatus.APPROVED,
        approvedBy: adminUser.id,
        approvedAt: new Date(),
      },
    });
  }

  // 12. Create Company Holidays
  console.info("🎉 Seeding Company Holidays...");
  const holidaysData = [
    {
      name: "วันขึ้นปีใหม่",
      date: new Date(`${currentYear}-01-01`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันสงกรานต์",
      date: new Date(`${currentYear}-04-13`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันสงกรานต์",
      date: new Date(`${currentYear}-04-14`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันสงกรานต์",
      date: new Date(`${currentYear}-04-15`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันแรงงานแห่งชาติ",
      date: new Date(`${currentYear}-05-01`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว",
      date: new Date(`${currentYear}-07-28`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันแม่แห่งชาติ",
      date: new Date(`${currentYear}-08-12`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันคล้ายวันสวรรคต ร.9",
      date: new Date(`${currentYear}-10-13`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันปิยมหาราช",
      date: new Date(`${currentYear}-10-23`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันพ่อแห่งชาติ / วันชาติ",
      date: new Date(`${currentYear}-12-05`),
      year: currentYear,
      isRecurring: true,
    },
    {
      name: "วันสิ้นปี",
      date: new Date(`${currentYear}-12-31`),
      year: currentYear,
      isRecurring: true,
    },
  ];

  for (const holiday of holidaysData) {
    await prisma.holiday.upsert({
      where: {
        companyId_date: { companyId: demoCompany.id, date: holiday.date },
      },
      update: holiday,
      create: {
        ...holiday,
        companyId: demoCompany.id,
      },
    });
  }

  console.info("✅ Database Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
