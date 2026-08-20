# LALINK — Comprehensive Master Implementation Plan

> **Project**: ระบบลางานออนไลน์ Multi-Tenant SaaS ผ่าน LINE LIFF  
> **Last Updated**: 2026-08-20  
> **Scope**: Full Platform Audit, Architecture, System Admin, Company Admin, Employee LIFF, SaaS Subscription & Enterprise Operations

---

## 📑 สารบัญแผนงาน (Table of Contents)

1. [ภาพรวมสถาปัตยกรรมระบบ (Current Architecture)](#1-ภาพรวมสถาปัตยกรรมระบบ)
2. [สถานะฟีเจอร์ที่พัฒนาแล้ว (Completed Features 100%)](#2-สถานะฟีเจอร์ที่พัฒนาแล้ว)
3. [ช่องว่างและระบบ CRUD ที่ต้องพัฒนาเพิ่ม (Identified Gaps & Missing CRUDs)](#3-ช่องว่างและระบบ-crud-ที่ต้องพัฒนาเพิ่ม)
4. [ตารางแผนการดำเนินงาน 17 Phases (Implementation Roadmap)](#4-ตารางแผนการดำเนินงาน-17-phases)
5. [รายละเอียดแผนงาน Phases 14 - 17 (Next Execution Steps)](#5-รายละเอียดแผนงาน-phases-14---17)
6. [กฎเหล็กและกระบวนการตรวจสอบคุณภาพ (Quality Gate Protocol)](#6-กฎเหล็กและกระบวนการตรวจสอบคุณภาพ)

---

## 1. ภาพรวมสถาปัตยกรรมระบบ

- **Framework**: Next.js 16 (App Router + Turbopack) + React 19 + TypeScript (Strict Mode)
- **Database & ORM**: PostgreSQL + Prisma ORM v7 (`@prisma/adapter-pg`)
- **Authentication**: Secure Server-side Session Cookies (`jose` Signed JWT, `HttpOnly`, `Secure`, `SameSite=Lax`)
- **Password Security**: bcryptjs (10 salt rounds) + Brute-force Login Rate Limiting
- **LINE Integration**: `@line/liff` SDK v2.30 (`scanCodeV2` + Web fallback) + LINE Messaging API (Flex Messages)
- **Object Storage**: S3-Compatible Storage Abstraction (MinIO / Cloudflare R2 / AWS S3) with Pre-signed URLs
- **UI & Styling**: Tailwind CSS v4 + shadcn/ui + Lucide Icons (Theme: `#0D9488` / `#533AFD`)
- **Testing**: Vitest (22 test files, 189 tests passing 100%)
- **Deployment**: Multi-stage Dockerfile (`node:22-alpine`, non-root user) + `docker-compose.yml`

---

## 2. สถานะฟีเจอร์ที่พัฒนาแล้ว

### 🔹 พนักงาน (LINE LIFF Mobile App)
- [x] เชื่อมต่อบัญชีครั้งแรก (First-time Linking): Company Code + Employee Code + DOB + PDPA Consent
- [x] Employee Dashboard: บัตรสรุปยอดวันลาคงเหลือ, ปฏิทินวันลาและวันหยุด, ประกาศข่าวสาร
- [x] ยื่นใบลา (Leave Form): ลาเต็มวัน, ครึ่งวัน (เช้า/บ่าย), รายชั่วโมง, แนบไฟล์หลักฐาน (PDF/PNG/JPG)
- [x] Pre-submit Validation: ตรวจสอบโควตาวันลาคงเหลือ, ตรวจสอบการยื่นวันลาซ้อนทับ (Overlap Check)
- [x] ประวัติการลา (Leave History): รายการใบลาพร้อม Badge สถานะ, กดยกเลิกคำขอที่รออนุมัติ
- [x] โปรไฟล์พนักงาน (Profile View) และระบบแจ้งเตือน LINE Flex Message

### 🔹 ผู้ดูแลระดับบริษัทและ HR (Company Admin & HR Web Portal)
- [x] Admin Dashboard: Metrics สรุปพนักงาน, ใบลารออนุมัติ, พนักงานที่ลางานวันนี้, สถิติการลา
- [x] Organization Management: แผนก (`Department`), ตำแหน่ง (`Position`), สาขา (`Branch`), พนักงาน (`Employee`)
- [x] Employee CSV Import: นำเข้าพนักงานแบบกลุ่มพร้อมบันทึก `ImportLog`
- [x] Work Schedule & Shifts: ตารางเวลาทำงานและกะการทำงาน (Shift) รองรับการคำนวณวันลาตามวันทำงานจริง
- [x] Leave Types & Policies: กำหนดโควตาประจำปี, บังคับแนบเอกสาร, เงื่อนไขการลาล่วงหน้า
- [x] Multi-Level Approval Engine: ระบบอนุมัติหลายระดับ (Workflow Steps) ตัดยอด Balance ผ่าน Database Transactions
- [x] Calendar View & Holidays: ปฏิทินวันหยุดบริษัทและตารางวันลาของพนักงานทั้งหมด
- [x] Announcements: ประกาศข่าวสารแบบระบุกลุ่มเป้าหมาย (รายสาขา/รายแผนก) พร้อมปักหมุด
- [x] Reports & Export: รายงานสถิติการลาและส่งออก CSV (UTF-8 BOM ภาษาไทย)

### 🔹 ผู้ดูแลระบบส่วนกลาง (System Admin Platform Portal)
- [x] Overview Dashboard: สรุปภาพรวมจำนวน Tenants, Admins, Employees, Leave Requests
- [x] Tenant Management: ดูรายชื่อบริษัท, สุ่มรหัส Tenant Code, สร้างบริษัทใหม่, เปิด/ระงับการใช้งาน (`ACTIVE`/`SUSPENDED`)
- [x] User Management: ดูรายชื่อผู้ดูแลระบบทั้งหมดข้าม Tenant, รีเซ็ตรหัสผ่าน
- [x] Global Employees View: ดูรายชื่อพนักงานทั้งหมดและสถานะ LINE
- [x] Session Control: ดูรายการ Active Sessions และสั่ง Force Revoke จากส่วนกลาง
- [x] Security Center: มอนิเตอร์ `SecurityEvent` และ Failed Logins
- [x] API Keys Management: ออกและสั่งเพิกถอน API Keys (SHA-256 Hashed)

---

## 3. ช่องว่างและระบบ CRUD ที่ต้องพัฒนาเพิ่ม

### ⚠️ 1. System Admin (Super Admin)
1. **SaaS Plans & Subscription Management**:
   - ยังไม่มีหน้า UI จัดการแพ็กเกจ SaaS (`/system-admin/plans`)
   - ยังไม่มีหน้า UI จัดการรอบการสมัครของแต่ละบริษัท (`/system-admin/subscriptions`)
   - ขาด `EntitlementService` เพื่อตรวจจับและบล็อกการสร้างพนักงานหรือแอดมินเกินโควตาของ Plan
2. **Company CRUD Completion**:
   - ขาด Modal แก้ไขข้อมูลบริษัท (`updateCompanySuperAdminAction`)
   - ขาด Drawer ดูรายละเอียดเชิงลึกและสถิติราย Tenant
   - ขาดปุ่มลบหรือจัดเก็บประวัติบริษัท (Archive/Delete)
3. **Platform User CRUD**:
   - ขาดปุ่มสร้าง Admin ใหม่จาก Super Admin
   - ขาด Modal แก้ไขข้อมูลผู้ใช้และเปลี่ยนสังกัดบริษัท/Role/Status
4. **Cross-Tenant Employees Management**:
   - ขาดระบบ Search, Filter รายบริษัท, Pagination
   - ขาด Action ปลดการผูก LINE (`Unlink LINE`) จากส่วนกลาง
5. **Real Backup & Health**:
   - Backup ยังเป็นการสุ่มข้อมูล Mock -> ต้องเปลี่ยนเป็นการ Dump Schema & Data จริง พร้อมปุ่มดาวน์โหลดไฟล์
   - System Health Latency มีค่า Hardcoded -> ต้องเปลี่ยนเป็น Real Ping ไปยัง S3, LINE API, และ Memory/Load จริงของ Server
6. **Security IP Blocklist**:
   - ขาดระบบบล็อก/ปลดบล็อก IP Address ที่พยายามโจมตี Brute Force

### ⚠️ 2. Company Admin & HR
1. **HR Proxy Leave Actions**:
   - HR ยังไม่สามารถยื่นใบลาแทนพนักงานกรณีฉุกเฉินได้ (`createLeaveRequestByHrAction`)
   - ยังไม่มีปุ่มเพิกถอนใบลาที่อนุมัติไปแล้ว (`revokeApprovedLeaveAction`) พร้อมคืนยอด Balance ใน Ledger (`REVERSAL`)
2. **Holiday Management**:
   - ขาดปุ่มนำเข้าวันหยุดนักขัตฤกษ์ไทยประจำปีอัตโนมัติ (Import Thai Public Holidays)
3. **Leave Balance Batch Operations**:
   - ขาดระบบปรับปรุงยอดวันลาแบบกลุ่มรายแผนก (Batch Adjustment)

---

## 4. ตารางแผนการดำเนินงาน 17 Phases

| Phase | หัวข้อการดำเนินงาน | สถานะ | รายละเอียด |
| :---: | :--- | :---: | :--- |
| **Phase 1** | Project Foundation & Infrastructure | ✅ **Done** | Next.js 16, Tailwind CSS v4, shadcn/ui, Project Structure |
| **Phase 2** | Database Schema, Migration & Seeding | ✅ **Done** | PostgreSQL + Prisma 7 (17+ Models), Seeds |
| **Phase 3** | Authentication & Central RBAC Engine | ✅ **Done** | Server-side Sessions, bcryptjs, Central RBAC Matrix |
| **Phase 4** | Multi-Tenant Security & Isolation Engine | ✅ **Done** | Server-side Tenant Context Resolver, Scoped DAL |
| **Phase 5** | LINE LIFF Foundation & Account Linking | ✅ **Done** | LIFF SDK v2.30, `scanCodeV2`, Anti-Enumeration |
| **Phase 6** | Employee LIFF System & Leave Workflow | ✅ **Done** | Dashboard, Leave Form, Overlap Check, Profile, History |
| **Phase 7** | Admin Web Portal & Approval System | ✅ **Done** | Admin Dashboard, Org Structure, Multi-Level Approval |
| **Phase 8** | S3-Compatible Object Storage Subsystem | ✅ **Done** | Storage Abstraction, Magic Bytes Check, Pre-signed URLs |
| **Phase 9** | LINE Messaging Notification Engine | ✅ **Done** | Decoupled Notification Dispatcher, LINE Flex Templates |
| **Phase 10** | Reports, Analytics & Audit Logging | ✅ **Done** | Leave Reports, Thai CSV Export, Sanitized Audit Trail |
| **Phase 11** | Security Hardening, PDPA & Privacy | ✅ **Done** | Security Headers, CSP, PII Anonymization, Rate Limiter |
| **Phase 12** | Comprehensive Automated Testing Suite | ✅ **Done** | 22 Test Files / 189 Tests Passed 100% |
| **Phase 13** | Production Readiness, Docker & Deployment | ✅ **Done** | Multi-stage Dockerfile, docker-compose, Health Check, Docs |
| **Phase 14** | **System Admin Enterprise CRUDs & Subscriptions** | ⏳ **Next** | Plans CRUD, Subscriptions CRUD, Entitlement Guard, Company/User Edit, Super Admin Employee Actions |
| **Phase 15** | **System Admin Operations, Real Health & Security** | ⏳ **Next** | Real Database Snapshot Backup & Download, Real Health Checks (S3/LINE/Memory), IP Blocklist |
| **Phase 16** | **Company Admin & HR CRUD Enhancements** | ⏳ **Next** | HR Proxy Leave Submission & Revocation, Holiday Auto-Import, Batch Balance Adjustment |
| **Phase 17** | **Comprehensive Testing & Final Quality Gate** | ⏳ **Next** | Automated Test Suites for New CRUDs, 100% Quality Gate |

---

## 5. รายละเอียดแผนงาน Phases 14 - 17

### 📌 Phase 14: System Admin Enterprise CRUDs & Subscriptions
- **14.1 SaaS Plans & Pricing Management (`/system-admin/plans`)**:
  - สร้าง Server Actions: `createPlanAction`, `updatePlanAction`, `deletePlanAction`, `togglePlanActiveAction`
  - สร้างหน้า UI `/system-admin/plans` พร้อม Modal สร้าง/แก้ไข Plan (โควตา `maxEmployees`, `maxAdmins`, ราคา, Feature Flags)
- **14.2 Tenant Subscriptions & Entitlements Engine (`/system-admin/subscriptions`)**:
  - สร้าง Server Actions: `assignCompanyPlanAction`, `updateSubscriptionStatusAction`, `extendTrialAction`, `cancelSubscriptionAction`
  - สร้างหน้า UI `/system-admin/subscriptions` สำหรับดูและปรับสถานะรอบบิล
  - พัฒนา `EntitlementService` (`src/lib/subscription/entitlement.ts`) บังคับใช้โควตาตาม Plan
- **14.3 Full Tenant Company CRUD & Details View (`/system-admin/companies`)**:
  - เพิ่ม `updateCompanySuperAdminAction`, `deleteCompanySuperAdminAction`, `getCompanyDetailAction`
  - เพิ่ม Modal แก้ไขข้อมูลบริษัท และ Drawer ดูรายละเอียดเชิงลึกราย Tenant
- **14.4 Platform User & Admin CRUD (`/system-admin/users`)**:
  - เพิ่ม `createUserSuperAdminAction`, `updateUserSuperAdminAction`, `deleteUserSuperAdminAction`, `toggleUserStatusSuperAdminAction`
  - เพิ่ม Modal สร้าง Admin ใหม่ และ Modal แก้ไขข้อมูล/สิทธิ์
- **14.5 Cross-Tenant Employee Management (`/system-admin/employees`)**:
  - เพิ่มระบบ Search, Filter รายบริษัท, Pagination และปุ่มสั่ง Unlink LINE จากส่วนกลาง

### 📌 Phase 15: System Admin Operations, Real Health & Security
- **15.1 Real Database Snapshot Backup & Download Stream (`/system-admin/backup`)**:
  - เปลี่ยนจากการจำลอง Mock Size/Checksum เป็นการ Export Snapshot ข้อมูลจริง
  - เพิ่ม Endpoint `/api/system-admin/backup/[id]/download` และปุ่มดาวน์โหลดไฟล์ `.json.gz`
- **15.2 Real Infrastructure Health Checks & Metrics (`/system-admin/health`)**:
  - ทำ Real Ping ไปยัง S3 Bucket, LINE API, และ Database Pool
  - แสดง Memory Usage (`process.memoryUsage()`) และ Uptime จริงของระบบ
- **15.3 Security Center IP Blocklist & Live Rate Limiting (`/system-admin/security`)**:
  - เพิ่ม Server Actions บล็อก/ปลดบล็อก IP Address
  - ดึงสถิติ Rate Limit Blocks จากตาราง `RateLimitEntry` จริง

### 📌 Phase 16: Company Admin & HR CRUD Enhancements
- **16.1 HR Proxy Leave Request Submission & Revocation (`/admin/leave-requests`)**:
  - พัฒนา `createLeaveRequestByHrAction` ให้ HR ยื่นใบลาแทนพนักงาน
  - พัฒนา `revokeApprovedLeaveAction` ยกเลิกใบลาที่อนุมัติแล้วพร้อมคืนยอด Balance (`REVERSAL`) และแจ้งเตือน LINE
- **16.2 Holiday Bulk Import & Annual Calendar Automation (`/admin/holidays`)**:
  - พัฒนา `importOfficialHolidaysAction` ดึงวันหยุดนักขัตฤกษ์ไทยประจำปีเข้าปฏิทินบริษัทอัตโนมัติ
- **16.3 Batch Leave Balance Adjustment (`/admin/leave-balance`)**:
  - พัฒนา `batchAdjustLeaveBalanceAction` ปรับปรุงยอดวันลาแบบกลุ่มรายแผนก

### 📌 Phase 17: Comprehensive Automated Testing & Quality Gate
- **17.1 Automated Unit & Integration Tests**:
  - `tests/unit/super-admin-crud.test.ts` (Plan, Subscription, Company Edit, User CRUD)
  - `tests/unit/subscription-entitlement.test.ts` (Entitlement limits enforcement)
  - `tests/unit/hr-proxy-leave.test.ts` (Proxy leave & Approval revocation)
  - `tests/unit/real-health-backup.test.ts` (Backup generation & Health checks)
- **17.2 Final Quality Gate Protocol**:
  - `npm run lint` -> PASS
  - `npm run type-check` -> PASS
  - `npm run test` -> All Tests PASS
  - `npm run prisma:validate` -> PASS
  - `npx next build` -> PASS

---

## 6. กฎเหล็กและกระบวนการตรวจสอบคุณภาพ

```text
1. FORMAT      : npx prettier --write .
2. LINT        : npm run lint
3. TYPE CHECK  : npm run type-check
4. TEST        : npm run test
5. PRISMA      : npm run prisma:validate
6. BUILD       : npx next build
```

> **เกณฑ์การผ่านงาน**: ทุกขั้นตอนต้องได้ผลลัพธ์ **PASS 100%** โดยไม่มี Error หรือ Security Bypass ใดๆ
