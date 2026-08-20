# 📋 MASTER IMPLEMENTATION PLAN (PLANS.md)

## ระบบลางานออนไลน์ Multi-Tenant SaaS ผ่าน LINE LIFF

> **เป้าหมายของแผนงาน**:  
> วางแผนการพัฒนาระบบลางานออนไลน์ Multi-Tenant SaaS แบบ Production Ready 100% ตามข้อกำหนดและมาตรฐานใน [PROMPT.md](file:///d:/.PHONGPHAT/lalink/PROMPT.md) ครอบคลุมตั้งแต่สถาปัตยกรรม, ความปลอดภัย (Security & PDPA), Multi-tenant Isolation, LINE LIFF, S3 Storage, Test Automation จนถึง Production Deployment บน Docker และ Coolify

---

## 📑 สารบัญแผนงาน (Table of Contents)

- [1. ภาพรวมและมาตรฐานสถาปัตยกรรม (Architecture & Standards)](#1-ภาพรวมและมาตรฐานสถาปัตยกรรม)
- [2. กฎเหล็กและกระบวนการตรวจสอบคุณภาพ (Quality Gate & Protocol)](#2-กฎเหล็กและกระบวนการตรวจสอบคุณภาพ)
- [3. แผนการดำเนินงาน 13 Phases (Phase-by-Phase Roadmap)](#3-แผนการดำเนินงาน-13-phases)
  - [Phase 1: Project Foundation & Core Infrastructure](#phase-1-project-foundation--core-infrastructure)
  - [Phase 2: Database Schema, Migration & Seeding](#phase-2-database-schema-migration--seeding)
  - [Phase 3: Authentication & Central RBAC Engine](#phase-3-authentication--central-rbac-engine)
  - [Phase 4: Multi-Tenant Security & Isolation Engine](#phase-4-multi-tenant-security--isolation-engine)
  - [Phase 5: LINE LIFF Foundation & Account Linking](#phase-5-line-liff-foundation--account-linking)
  - [Phase 6: Employee LIFF System & Leave Workflow](#phase-6-employee-liff-system--leave-workflow)
  - [Phase 7: Admin Web Portal & Approval System](#phase-7-admin-web-portal--approval-system)
  - [Phase 8: S3-Compatible Object Storage Subsystem](#phase-8-s3-compatible-object-storage-subsystem)
  - [Phase 9: LINE Messaging Notification Engine](#phase-9-line-messaging-notification-engine)
  - [Phase 10: Reports, Analytics & Audit Logging](#phase-10-reports-analytics--audit-logging)
  - [Phase 11: Security Hardening, PDPA & Privacy](#phase-11-security-hardening-pdpa--privacy)
  - [Phase 12: Comprehensive Automated Testing Suite](#phase-12-comprehensive-automated-testing-suite)
  - [Phase 13: Production Readiness, Docker & Deployment](#phase-13-production-readiness-docker--deployment)
- [4. แบบฟอร์มรายงานสรุปผลหลังจบแต่ละ Task (Reporting Template)](#4-แบบฟอร์มรายงานสรุปผลหลังจบแต่ละ-task)

---

## 1. ภาพรวมและมาตรฐานสถาปัตยกรรม

### 🛠️ Core Technology Stack

- **Core Framework**: Next.js (App Router, Stable ล่าสุด), React, TypeScript (Strict Mode)
- **Database & ORM**: PostgreSQL, Prisma ORM (Latest Stable)
- **UI & Design**: Tailwind CSS, shadcn/ui, Lucide Icons (ธีมสี: **Teal/Cyan-Green + White** `#0D9488`)
- **Validation**: Zod (100% Strict Schema Validation)
- **LINE Platform**: LINE LIFF SDK, LINE Login, LINE Messaging API
- **Authentication**: Secure Server-side Session, Argon2id / bcrypt Password Hashing
- **Object Storage**: S3-Compatible Storage Abstraction (MinIO / Cloudflare R2 / AWS S3)
- **Testing**: Vitest / Jest, React Testing Library, Playwright (E2E)
- **Deployment**: Docker Multi-stage Build, Coolify PaaS

### 🏛️ สถาปัตยกรรมการแยกส่วน (Separation of Concerns)

```text
Client (LINE LIFF / Web Browser)
  ↓ [HTTPS / Secure Cookies]
Reverse Proxy / Cloudflare
  ↓
Next.js App Runtime
  ├── Route Handlers / Server Actions (Validation & Auth Gate)
  ├── Features Modules (Pure Business Logic)
  │   ├── Auth / RBAC Service
  │   ├── Tenant Context & Isolation Service
  │   ├── Leave & Balance Ledger Engine
  │   ├── Storage Service (S3 Abstraction)
  │   └── Notification Service (LINE Messaging)
  └── Lib / Database (Prisma ORM Client)
        ↓
      PostgreSQL
```

---

## 2. กฎเหล็กและกระบวนการตรวจสอบคุณภาพ

> [!IMPORTANT]
> **Quality Gate Protocol**: ห้ามข้ามขั้นตอนเด็ดขาด หลังจบแต่ละ Phase หรือเมื่อมีการแก้ไข Source Code ต้องผ่านขั้นตอน:
>
> ```text
> 1. FORMAT      : npx prettier --write .
> 2. LINT        : npm run lint
> 3. TYPE CHECK  : npx tsc --noEmit
> 4. TEST        : npm run test
> 5. PRISMA      : npx prisma validate
> 6. BUILD       : npm run build
> ```
>
> **เกณฑ์การผ่านงาน**: `Lint: PASS`, `Type Check: PASS`, `Tests: PASS`, `Build: PASS`

---

## 3. แผนการดำเนินงาน 13 Phases

---

### Phase 1: Project Foundation & Core Infrastructure

**เป้าหมาย**: วางรากฐานโปรเจกต์ Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma และโครงสร้างโฟลเดอร์ตามมาตรฐาน

- [x] **1.1 สร้าง Environment & Base Configuration**
  - [x] กำหนด `.nvmrc` ระบุ Node.js LTS Version
  - [x] กำหนด Lockfile ชัดเจน (เลือก Single Package Manager เช่น `npm`)
  - [x] สร้างไฟล์ `.env.example` ครบทุกตัวแปร (`DATABASE_URL`, `AUTH_SECRET`, `LINE_*`, `S3_*`)
  - [x] กำหนด `.gitignore` ครอบคลุม `.env*`, `.next`, `node_modules`, `coverage`, `logs`
- [x] **1.2 ติดตั้ง UI Foundation & Design System**
  - [x] ตั้งค่า Tailwind CSS และ Color Palette: **Teal/Cyan-Green + White** (`#0D9488`, `#0F766E`, `#F0FDFA`)
  - [x] ติดตั้งและตั้งค่า shadcn/ui Base Components (`button`, `input`, `dialog`, `card`, `table`, `badge`, `tabs`, ฯลฯ)
  - [x] ติดตั้ง Lucide Icons
- [x] **1.3 วาง Folder Structure ตามแบบแผน**
  - [x] สร้างโครงสร้าง `app/(public)`, `app/(auth)`, `app/liff`, `app/admin`, `app/system-admin`, `app/api`
  - [x] สร้างโครงสร้าง `components/ui`, `components/liff`, `components/admin`, `components/shared`
  - [x] สร้างโครงสร้าง `features/`, `lib/`, `docs/`, `tests/`
- [x] **1.4 ตรวจสอบคุณภาพ Phase 1**
  - [x] ทดสอบรัน Lint, Type Check, Build ผ่าน 100%

---

### Phase 2: Database Schema, Migration & Seeding

**เป้าหมาย**: ออกแบบและ Migrate PostgreSQL Database Schema ครบ 17+ Models ด้วย Prisma ORM พร้อม Seed ข้อมูลทดสอบ

- [x] **2.1 สร้าง Prisma Schema (`prisma/schema.prisma`)**
  - [x] Model `Company` (Tenant หลัก: `id`, `code` UNIQUE, `name`, `taxId`, `status`)
  - [x] Model `User` (Admin/HR/Manager: `id`, `companyId`, `email`, `passwordHash`, `roleId`)
  - [x] Model `Employee` (พนักงาน: `id`, `companyId`, `employeeCode`, `dateOfBirth`, `lineUserId`, @@unique(`[companyId, employeeCode]`))
  - [x] Model `Department` & `Position` (โครงสร้างองค์กร)
  - [x] Model `Role`, `Permission`, `RolePermission` (RBAC Models)
  - [x] Model `LeaveType` (ประเภทการลา & นโยบายเฉพาะบริษัท)
  - [x] Model `LeaveBalance` & `LeaveTransaction` (ยอดคงเหลือและ Ledger ประวัติการเคลื่อนไหวยอดลา)
  - [x] Model `LeaveRequest` & `LeaveAttachment` (คำขอลาและ Metadata ไฟล์แนบ)
  - [x] Model `Holiday` (ปฏิทินวันหยุดประจำปีของแต่ละ Tenant)
  - [x] Model `Notification` & `AuditLog` (ประวัติการแจ้งเตือนและบันทึก Audit Trail)
  - [x] Model `Plan` & `Subscription` (SaaS Subscription Management)
- [x] **2.2 จัดการ Database Indexing & Constraints**
  - [x] เพิ่ม Indexes บน Foreign Keys และฟิลด์ค้นหาหลัก (`companyId`, `employeeId`, `status`, `createdAt`)
  - [x] ตรวจสอบ Foreign Key Cascade / Restrict Rules
- [x] **2.3 รัน Migration & Data Seeding**
  - [x] เตรียม Initial Schema และ Migration Configuration ด้วย Prisma 7
  - [x] เขียน `prisma/seed.ts` สร้าง Demo Company, Admin User, Demo Employees, Leave Types, Holidays
- [x] **2.4 ตรวจสอบคุณภาพ Phase 2**
  - [x] รัน `npx prisma validate` และ `npm run test`

---

### Phase 3: Authentication & Central RBAC Engine

**เป้าหมาย**: สร้างระบบยืนยันตัวตน Web Admin ด้วย Server-side Session, Password Hashing และ Central RBAC Engine

- [x] **3.1 ระบบ Password Hashing & Credentials Authentication**
  - [x] พัฒนา Password Service ด้วย `bcryptjs`
  - [x] พัฒนา Server Action สำหรับ Admin Login (`/admin/login`) และ Logout
  - [x] ระบบ Brute Force Protection & Login Rate Limiting
- [x] **3.2 Server-side Session Management**
  - [x] สร้าง Secure Session Cookie (Flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age`)
  - [x] Middleware ตรวจสอบ Session และ Redirect ตามสิทธิ์
- [x] **3.3 Central RBAC & Authorization Layer**
  - [x] สร้าง Permission Engine ตรวจสอบ Roles (`SYSTEM_ADMIN`, `COMPANY_ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`)
  - [x] ฟังก์ชัน `hasPermission()` กลาง ไม่กระจาย Logic ใน UI
- [x] **3.4 ตรวจสอบคุณภาพ Phase 3**
  - [x] Unit Test สำหรับ Password Hashing, Session Expiration, RBAC Gate

---

### Phase 4: Multi-Tenant Security & Isolation Engine

**เป้าหมาย**: วางกลไกการแยก Tenant ในระดับ Database Query ทุกจุด และป้องกันช่องโหว่ IDOR และ Cross-Tenant Leakage

- [x] **4.1 Server-side Tenant Context Resolver**
  - [x] ดึง `companyId` จาก Server Session เท่านั้น (ห้ามรับหรือเชื่อถือจาก Client Request Body/Header)
  - [x] สร้าง Tenant Context Helper สำหรับ Route Handlers และ Server Actions
- [x] **4.2 Scoped Database Query Enforcement**
  - [x] วางมาตรฐาน Data Access Layer บังคับใส่ `WHERE companyId = session.companyId`
  - [x] ป้องกัน IDOR: ตรวจสอบความเป็นเจ้าของ Resource ก่อนทำ Create/Read/Update/Delete
- [x] **4.3 Automated Multi-Tenant Security Tests**
  - [x] เขียน Integration Test: Company A เรียกดูข้อมูล Company A = **PASS**
  - [x] เขียน Integration Test: Company A พยายามเข้าถึง ID ของ Company B = **DENY (403/404)**
- [x] **4.4 ตรวจสอบคุณภาพ Phase 4**
  - [x] ทดสอบความปลอดภัย Tenant Isolation Test Suite

---

### Phase 5: LINE LIFF Foundation & Account Linking

**เป้าหมาย**: พัฒนาระบบ LINE LIFF Authentication และ Flow การเชื่อมต่อบัญชีพนักงานครั้งแรก (First-time Linking)

- [x] **5.1 LINE LIFF SDK Integration**
  - [x] ติดตั้งและสร้าง LIFF Provider (`/liff`) รองรับ LIFF Initialization บน Mobile Browser & LINE App
  - [x] ดึง LINE ID Token / Access Token และส่งยืนยันตัวตนกับ Server
- [x] **5.2 Server-side LINE Token Verification**
  - [x] Verify LINE Token กับ LINE API เพื่อดึง `lineUserId` ที่แท้จริง
  - [x] ค้นหาในฐานข้อมูลว่า `lineUserId` นี้เคยผูกกับ Employee ในระบบแล้วหรือไม่
- [x] **5.3 First-time Account Linking Workflow (`/liff/connect`)**
  - [x] หน้าฟอร์มกรอก: รหัสบริษัท (`Company Code`) + รหัสพนักงาน (`Employee Code`) + วันเกิด (`Date of Birth`)
  - [x] Server-side Verification: ตรวจสอบความถูกต้องของ 3 ข้อมูลร่วมกัน
  - [x] จัดการข้อความ Error กลาง: _"ไม่สามารถเชื่อมต่อบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง"_ (ไม่บอกว่าช่องใดผิด)
  - [x] ผูก `lineUserId` และสร้าง Employee Server-side Session
- [x] **5.4 Account Linking Security**
  - [x] บันทึก Failed Attempt Counter และ Rate Limiting ต่อ IP/LINE User
  - [x] Temporary Lockout เมื่อกรอกข้อมูลผิดเกินจำนวนครั้งที่กำหนด
- [x] **5.5 ตรวจสอบคุณภาพ Phase 5**
  - [x] Unit & Integration Test สำหรับ Account Linking Flow และ Security Rate Limits

---

### Phase 6: Employee LIFF System & Leave Workflow

**เป้าหมาย**: พัฒนาระบบฝั่งพนักงานบน LINE LIFF (Mobile-First UI) ครบทั้ง Dashboard, Form ยื่นใบลา, ประวัติการลา และ Profile

- [x] **6.1 Employee Dashboard (`/liff/dashboard`)**
  - [x] แสดงข้อมูลต้อนรับ: ชื่อพนักงาน, บริษัท, รหัสพนักงาน
  - [x] การ์ดสรุปยอดวันลาคงเหลือ (ลาพักร้อน, ลาป่วย, ลากิจ)
  - [x] เมนูด่วน: ยื่นใบลา, ประวัติการลา, โปรไฟล์
- [x] **6.2 Leave Form (`/liff/leave`) & Validation**
  - [x] ฟอร์มเลือกประเภทการลา, วันที่เริ่ม-สิ้นสุด, เต็มวัน/ครึ่งวัน, เหตุผล, แนบไฟล์
  - [x] ตรวจสอบโควตาคงเหลือ (Balance Check)
  - [x] ตรวจสอบการยื่นวันลาซ้อนทับ (Overlapping Date Check)
  - [x] ตรวจสอบเงื่อนไข Leave Policy (เช่น บังคับแนบใบรับรองแพทย์เมื่อลาเกินกำหนด)
- [x] **6.3 Leave History & Cancellation (`/liff/history`)**
  - [x] รายการประวัติใบลาพร้อม Badge สถานะ: รออนุมัติ, อนุมัติ, ไม่อนุมัติ, ยกเลิก
  - [x] ฟังก์ชันขอยกเลิกใบลา (เฉพาะใบลาที่ยังรออนุมัติ)
- [x] **6.4 Employee Profile (`/liff/profile`)**
  - [x] แสดงข้อมูลสังกัด แผนก ตำแหน่ง วันเริ่มงาน และสถานะบัญชี
- [x] **6.5 ตรวจสอบคุณภาพ Phase 6**
  - [x] ทดสอบ UI บน Responsive Mobile Viewports และรัน Test Suite

---

### Phase 7: Admin Web Portal & Approval System

**เป้าหมาย**: พัฒนาระบบ Web Application สำหรับ Company Admin และ HR ในการจัดการองค์กร, นโยบายวันลา และการอนุมัติใบลา

- [x] **7.1 Admin Dashboard (`/admin/dashboard`)**
  - [x] สรุป Metrics: จำนวนพนักงาน, ใบลารออนุมัติ, พนักงานที่ลางานวันนี้, สถิติประจำเดือน
  - [x] ตารางใบลารออนุมัติล่าสุดพร้อม Server-side Pagination
- [x] **7.2 Organization Management**
  - [x] จัดการพนักงาน (`/admin/employees`): เพิ่ม, แก้ไข, ระงับสถานะ, ดูสถานะ LINE Linking
  - [x] จัดการแผนก (`/admin/departments`) และตำแหน่ง (`/admin/positions`)
- [x] **7.3 Leave Types, Policies & Holidays**
  - [x] จัดการประเภทการลา (`/admin/leave-types`): กำหนดโควตาต่อปี, เงื่อนไขครึ่งวัน, การบังคับแนบไฟล์
  - [x] จัดการปฏิทินวันหยุดบริษัท (`/admin/holidays`)
- [x] **7.4 Leave Approval Workflow (`/admin/leave-requests`)**
  - [x] ตรวจสอบรายละเอียดใบลา, ประวัติพนักงาน, เอกสารแนบ
  - [x] ปุ่ม **อนุมัติ (Approve)**: ตัดยอดวันลาใน `LeaveBalance` และบันทึก `LeaveTransaction (DEBIT)`
  - [x] ปุ่ม **ไม่อนุมัติ (Reject)**: **บังคับกรอกเหตุผลในการไม่อนุมัติ**
  - [x] ป้องกัน Race Condition ด้วย Database Transactions (`prisma.$transaction`)
- [x] **7.5 System Admin Portal (`/system-admin`)**
  - [x] หน้าจัดการ Tenant Companies, การเปิด/ปิดสถานะบริษัท, ดู System Health
- [x] **7.6 ตรวจสอบคุณภาพ Phase 7**
  - [x] ทดสอบ Approval Workflow, Transaction Locking และ RBAC Permission Guard

---

### Phase 8: S3-Compatible Object Storage Subsystem

**เป้าหมาย**: พัฒนาระบบจัดเก็บไฟล์แนบใน Private S3-Compatible Storage พร้อม Abstraction Layer และ Temporary Pre-signed URLs

- [x] **8.1 Storage Abstraction (`StorageService`)**
  - [x] พัฒนา Service Interface: `upload()`, `download()`, `delete()`, `createSignedUrl()`
  - [x] เชื่อมต่อกับ S3 SDK รองรับ MinIO / Cloudflare R2 / AWS S3
- [x] **8.2 Secure File Upload Pipeline**
  - [x] Upload Validation: ตรวจสอบ File Size (< 5MB), MIME Type, File Signature (Magic Bytes)
  - [x] อนุญาตเฉพาะไฟล์เอกสารและรูปภาพที่ปลอดภัย (PDF, PNG, JPG, JPEG)
  - [x] บันทึกเฉพาะ File Metadata ลงในตาราง `LeaveAttachment` ใน PostgreSQL
- [x] **8.3 Tenant Partitioning & Pre-signed URLs**
  - [x] กำหนด Object Key แยก Tenant: `companies/{companyId}/employees/{employeeId}/leave/{leaveRequestId}/{fileId}.{ext}`
  - [x] สิทธิ์การดาวน์โหลด: ตรวจสอบ Tenant + User Permission ก่อน Generate Pre-signed URL (อายุ 5-15 นาที)
  - [x] ป้องกัน Direct Public Access ไปยัง S3 Bucket
- [x] **8.4 ตรวจสอบคุณภาพ Phase 8**
  - [x] Unit & Integration Test สำหรับ Upload, File Validation และ Pre-signed URL Generation

---

### Phase 9: LINE Messaging Notification Engine

**เป้าหมาย**: พัฒนาระบบแจ้งเตือนอัตโนมัติผ่าน LINE Messaging API แบบ Decoupled Service

- [x] **9.1 Decoupled Notification Service**
  - [x] พัฒนา `NotificationService` แยกขาดจาก UI และ Business Logic
  - [x] ออกแบบ Template ข้อความ (LINE Flex Messages) ด้วยโทนสีเขียวฟ้า Teal สะอาดตา
- [x] **9.2 Notification Triggers**
  - [x] เมื่อพนักงานยื่นใบลา -> ส่งแจ้งเตือนพนักงาน (สถานะ: รออนุมัติ) และแจ้งเตือน HR
  - [x] เมื่อ HR อนุมัติใบลา -> ส่งแจ้งเตือนพนักงาน ("ใบลาของคุณได้รับการอนุมัติ")
  - [x] เมื่อ HR ไม่อนุมัติใบลา -> ส่งแจ้งเตือนพนักงาน ("ใบลาของคุณไม่ได้รับการอนุมัติ พร้อมระบุเหตุผล")
  - [x] เมื่อมีการยกเลิกใบลา -> อัปเดตสถานะและแจ้งเตือนผู้เกี่ยวข้อง
- [x] **9.3 Resilience & Error Handling**
  - [x] จัดการ Fallback เมื่อ LINE API ภายนอก Error ไม่ให้กระทบ Transaction หลักของระบบ
  - [x] บันทึกประวัติการส่งลงในตาราง `Notification`
- [x] **9.4 ตรวจสอบคุณภาพ Phase 9**
  - [x] Mock LINE API Test สำหรับทุก Notification Trigger (ผ่านการทดสอบ 100%)

---

### Phase 10: Reports, Analytics & Audit Logging

**เป้าหมาย**: สร้างระบบรายงานสถิติการลา สรุปข้อมูลสำหรับผู้บริหาร/HR และระบบบันทึก Audit Trail สำหรับตรวจสอบย้อนหลัง

- [x] **10.1 Leave Statistics & Reports (`/admin/reports`)**
  - [x] รายงานสถิติการลาจำแนกตามแผนก, ประเภทการลา, ช่วงเวลา
  - [x] รายงานสรุปวันลาคงเหลือประจำปีของพนักงาน
  - [x] ฟังก์ชัน Export ข้อมูลในรูปแบบ CSV / Excel (UTF-8 BOM Thai support)
- [x] **10.2 Comprehensive Audit Logging**
  - [x] บันทึก Events สำคัญ: `LOGIN`, `LOGIN_FAILED`, `LINK_LINE`, `CREATE_LEAVE`, `APPROVE_LEAVE`, `REJECT_LEAVE`, `UPLOAD_ATTACHMENT`
  - [x] กฎการป้องกันข้อมูลรั่วไหล: **ห้าม Log Password, Token, OTP, Secret หรือ Sensitive Personal Data** (Sanitizer Redaction)
- [x] **10.3 ตรวจสอบคุณภาพ Phase 10**
  - [x] Test Data Aggregation, Pagination และ Audit Log Sanitization (ผ่านการทดสอบ 100%)

---

### Phase 11: Security Hardening, PDPA & Privacy

**เป้าหมาย**: ตรวจสอบและยกระดับความปลอดภัยทุกจุด รองรับมาตรฐาน PDPA และ Security Headers

- [x] **11.1 Security Headers & CSRF/XSS Protection**
  - [x] ตั้งค่า HTTP Security Headers (`Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`)
  - [x] ทดสอบความเข้ากันได้ของ CSP กับ LINE LIFF SDK บน In-App Browser
- [x] **11.2 PDPA & Privacy Compliance**
  - [x] กำหนดนโยบายความเป็นส่วนตัว (Privacy Policy Consent) ตอนผูกบัญชี LINE
  - [x] ฟังก์ชัน Data Minimization & Retention: รองรับการลบ/Anonymize ข้อมูลเมื่อพนักงานพ้นสภาพ (`anonymizeEmployeePII`)
  - [x] สิทธิ์การเข้าถึงข้อมูลส่วนบุคคลตามบทบาท (Need-to-know Basis)
- [x] **11.3 Rate Limiting & Abuse Prevention**
  - [x] ติดตั้ง Rate Limiter ทั่วทั้ง API Endpoints, Login และ Account Linking
- [x] **11.4 ตรวจสอบคุณภาพ Phase 11**
  - [x] รัน Security Audit Checklist และ Unit Tests สำหรับ PDPA & Rate Limiter (ผ่านการทดสอบ 100%)

---

### Phase 12: Comprehensive Automated Testing Suite

**เป้าหมาย**: จัดทำชุดการทดสอบอัตโนมัติครอบคลุม Unit, Integration, Concurrency และ E2E Tests

- [x] **12.1 Unit & Integration Tests**
  - [x] Authentication & Session Expiry Tests
  - [x] Account Linking & Rate Limit Tests
  - [x] Tenant Isolation & Cross-tenant Access Tests
  - [x] Leave Calculation & Calendar Policy Tests
  - [x] File Upload & MIME Validation Tests
- [x] **12.2 Concurrency & Ledger Race Condition Tests**
  - [x] ทดสอบการยื่นใบลาและตัดยอด Balance พร้อมกันหลาย Request (Double Spending Prevention & Locking Verification)
- [x] **12.3 E2E Tests & Lifecycle Integration**
  - [x] E2E Workflow: พนักงานผูกบัญชี -> คำนวณวันลา -> อัปโหลดไฟล์แนบ -> ยื่นใบลา -> แจ้งเตือน LINE Flex -> อนุมัติ -> บันทึก Audit Log -> สรุปรายงาน CSV
- [x] **12.4 ตรวจสอบคุณภาพ Phase 12**
  - [x] Test Coverage ผ่านเกณฑ์และ Test Suite ทุกตัวรันผ่าน 100% (82/82 tests passed)

---

### Phase 13: Production Readiness, Docker & Deployment

**เป้าหมาย**: เตรียม Production Multi-stage Dockerfile, คู่มือการ Deploy บน Coolify, กลยุทธ์ Backup และ Health Monitoring

- [x] **13.1 Production Dockerfile (Multi-stage Build)**
  - [x] Stage 1: `dependencies` (ติดตั้ง Production & Dev Deps)
  - [x] Stage 2: `builder` (Compile TypeScript, Prisma Client, Next.js Standalone Build)
  - [x] Stage 3: `runner` (Minimal Alpine/Distroless Image, Non-root User)
- [x] **13.2 Coolify Deployment Setup & Automation**
  - [x] กำหนด Build Command (`npm run build`) และ Start Command (`node server.js` / `next start`)
  - [x] Automation Script รัน `prisma migrate deploy` ก่อนเริ่ม Container (`docker/entrypoint.sh`)
  - [x] ตั้งค่า Health Check Endpoint `/api/health`
- [x] **13.3 Backup & Disaster Recovery Plan**
  - [x] แผนสำรองข้อมูล PostgreSQL Daily/Weekly Backup Strategy
  - [x] คู่มือการกู้คืนข้อมูล (Restore Procedure Documentation)
- [x] **13.4 Final Technical Documentation**
  - [x] อัปเดต `README.md` ฉบับสมบูรณ์ (Setup Guide, Env Guide, CLI Commands)
  - [x] จัดทำเอกสารใน `docs/` (Architecture, Database ERD, Security, Deployment)
- [x] **13.5 Final Production Verification Gate**
  - [x] รัน Lint, Type Check, All Tests, Prisma Validate และ Production Build ผ่าน 100%

---


## 4. แบบฟอร์มรายงานสรุปผลหลังจบแต่ละ Task

ทุกครั้งที่จบงานในแต่ละ Subtask หรือ Phase ให้สรุปผลตามเทมเพลตมาตรฐานดังนี้:

```markdown
## Completed

- [สรุปรายละเอียดฟีเจอร์หรือการแก้ไขที่ดำเนินการเสร็จสิ้น]
- Files ที่เพิ่ม / แก้ไข
- การเปลี่ยนแปลงใน Database (Migrations / Schema Changes)
- การปรับปรุงด้าน Security & Isolation
- Tests ที่เพิ่มและผลการรัน

## Validation

- Lint: PASS / FAIL
- Type Check: PASS / FAIL
- Tests: PASS / FAIL
- Prisma Validate: PASS / FAIL
- Build: PASS / FAIL

## Key Files

- [ระบุ Path ไฟล์สำคัญที่มีการแก้ไขหรือสร้างใหม่]

## Next Step

- [ระบุขั้นตอนหรือ Phase ถัดไปตาม PLANS.md]
```

---

> [!IMPORTANT]
> **สรุปสัจจะสำคัญ**:  
> ทุกขั้นตอนต้องยึดตาม [PROMPT.md](file:///d:/.PHONGPHAT/lalink/PROMPT.md) 100% โดยไม่ตัดทอนข้อกำหนดด้านความปลอดภัย การทดสอบ และความเสถียรของระบบ Multi-Tenant SaaS
