import "dotenv/config";
import { PrismaClient, UserStatus } from "@prisma/client";
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

const SUPERADMIN_EMAIL =
  process.env.SEED_SUPERADMIN_EMAIL || "superadmin@platform.com";
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD || "Admin@123456";
const SUPERADMIN_NAME =
  process.env.SEED_SUPERADMIN_NAME || "Platform Super Admin";

async function main() {
  console.info("🌱 Starting Database Seeding (Platform Foundation)...");

  // 1. Seed SaaS Plans (reference data)
  console.info("📦 Seeding SaaS Plans...");
  await prisma.plan.upsert({
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

  await prisma.plan.upsert({
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

  // 2. Seed Permissions (reference catalog for the RBAC matrix)
  console.info("🔐 Seeding Permissions...");
  const permissionsList = [
    { code: "company:manage", name: "จัดการข้อมูลบริษัท", module: "COMPANY" },
    { code: "company:view", name: "ดูข้อมูลบริษัท", module: "COMPANY" },
    { code: "company:update", name: "แก้ไขข้อมูลบริษัท", module: "COMPANY" },
    { code: "user:manage", name: "จัดการผู้ใช้งานระบบ", module: "USER" },
    { code: "role:manage", name: "จัดการบทบาทและสิทธิ์", module: "USER" },
    { code: "organization:manage", name: "จัดการโครงสร้างองค์กร", module: "ORGANIZATION" },
    { code: "branch:manage", name: "จัดการสาขา", module: "ORGANIZATION" },
    { code: "department:manage", name: "จัดการแผนก", module: "ORGANIZATION" },
    { code: "position:manage", name: "จัดการตำแหน่งงาน", module: "ORGANIZATION" },
    { code: "employee:read", name: "ดูข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "employee:create", name: "เพิ่มพนักงาน", module: "EMPLOYEE" },
    { code: "employee:update", name: "แก้ไขข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "employee:delete", name: "ลบ/ระงับพนักงาน", module: "EMPLOYEE" },
    { code: "employee:import", name: "นำเข้าข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "employee:export", name: "ส่งออกข้อมูลพนักงาน", module: "EMPLOYEE" },
    { code: "leave:read", name: "ดูรายการใบลา", module: "LEAVE" },
    { code: "leave:create", name: "ยื่นใบลา", module: "LEAVE" },
    { code: "leave:approve", name: "อนุมัติใบลา", module: "LEAVE" },
    { code: "leave:reject", name: "ไม่อนุมัติใบลา", module: "LEAVE" },
    { code: "leave:cancel", name: "ยกเลิกใบลา", module: "LEAVE" },
    { code: "leave:adjust", name: "ปรับยอดวันลา", module: "LEAVE" },
    { code: "policy:manage", name: "จัดการนโยบายวันลาและโควตา", module: "POLICY" },
    { code: "workflow:manage", name: "จัดการสายการอนุมัติ", module: "POLICY" },
    { code: "holiday:manage", name: "จัดการปฏิทินวันหยุดบริษัท", module: "HOLIDAY" },
    { code: "line:manage", name: "จัดการบัญชี LINE", module: "LINE" },
    { code: "announcement:manage", name: "จัดการประกาศ", module: "LINE" },
    { code: "report:read", name: "ดูรายงานและสถิติ", module: "REPORT" },
    { code: "report:export", name: "ส่งออกรายงาน", module: "REPORT" },
    { code: "audit:read", name: "ดูบันทึก Audit Log", module: "AUDIT" },
    { code: "security:manage", name: "จัดการศูนย์ความปลอดภัย", module: "SYSTEM" },
    { code: "session:manage", name: "จัดการเซสชัน", module: "SYSTEM" },
    { code: "system:settings", name: "จัดการการตั้งค่าระบบ", module: "SYSTEM" },
    { code: "system:health", name: "ดูสถานะระบบ", module: "SYSTEM" },
    { code: "system:logs", name: "ดู Log ระบบ", module: "SYSTEM" },
    { code: "system:backup", name: "จัดการสำรองข้อมูล", module: "SYSTEM" },
    { code: "system:apikey", name: "จัดการ API Key", module: "SYSTEM" },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    });
  }

  // 3. Create Global System Admin Role
  console.info("👥 Seeding Global System Admin Role...");
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

  // 4. Create Platform Super Admin User
  console.info("👤 Seeding Platform Super Admin User...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, salt);

  await prisma.user.upsert({
    where: { email: SUPERADMIN_EMAIL },
    update: { passwordHash, name: SUPERADMIN_NAME, status: UserStatus.ACTIVE },
    create: {
      companyId: null,
      email: SUPERADMIN_EMAIL,
      passwordHash,
      name: SUPERADMIN_NAME,
      status: UserStatus.ACTIVE,
      roleId: systemAdminRole.id,
    },
  });

  console.info("✅ Database Seeding completed successfully!");
  console.info(`   Super Admin: ${SUPERADMIN_EMAIL}`);
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