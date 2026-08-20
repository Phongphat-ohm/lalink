# 📋 MASTER IMPLEMENTATION PLAN (PLANS.md)

## ระบบลางานออนไลน์ Multi-Tenant SaaS ผ่าน LINE LIFF

> **เป้าหมายของแผนงาน**:  
> วางแผนการพัฒนาระบบลางานออนไลน์ Multi-Tenant SaaS แบบ Production Ready 100% ตามข้อกำหนดและมาตรฐานใน [PROMPT.md](file:///d:/.PHONGPHAT/lalink/PROMPT.md) ครอบคลุมตั้งแต่สถาปัตยกรรม, ความปลอดภัย (Security & PDPA), Multi-tenant Isolation, LINE LIFF, S3 Storage, Test Automation จนถึง Production Deployment บน Docker และ Coolify

---

## 📑 สารบัญแผนงาน (Table of Contents)

- [1. ภาพรวมและมาตรฐานสถาปัตยกรรม (Architecture & Standards)](#1-ภาพรวมและมาตรฐานสถาปัตยกรรม)
- [2. กฎเหล็กและกระบวนการตรวจสอบคุณภาพ (Quality Gate & Protocol)](#2-กฎเหล็กและกระบวนการตรวจสอบคุณภาพ)
- [3. แผนการดำเนินงาน 17 Phases (Phase-by-Phase Roadmap)](#3-แผนการดำเนินงาน-17-phases)
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
  - [Phase 14: System Admin Enterprise CRUDs & Subscriptions](#phase-14-system-admin-enterprise-cruds--subscriptions)
  - [Phase 15: System Admin Operations, Real Health & Security](#phase-15-system-admin-operations-real-health--security)
  - [Phase 16: Company Admin & HR CRUD Enhancements](#phase-16-company-admin--hr-crud-enhancements)
  - [Phase 17: Comprehensive Automated Testing & Quality Gate](#phase-17-comprehensive-automated-testing--quality-gate)
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

### Phase 14: System Admin Enterprise CRUDs & Subscriptions

**เป้าหมาย**: พัฒนาระบบ CRUD และการจัดการองค์กร/ผู้ดูแลระดับ Super Admin ให้ครบถ้วนสมบูรณ์ พร้อมระบบจัดการ SaaS Plans & Subscriptions

- [x] **14.1 SaaS Plans & Pricing Management (`/system-admin/plans`)**
  - [x] พัฒนา Server Actions: `createPlanAction`, `updatePlanAction`, `deletePlanAction`, `togglePlanStatusAction`
  - [x] พัฒนาหน้า UI `/system-admin/plans` พร้อม Modal สร้าง/แก้ไข Plan (กำหนดชื่อ, โควตา `maxEmployees`, `maxAdmins`, ราคาต่อเดือน/ปี, Feature flags)
- [x] **14.2 Tenant Subscriptions & Entitlements Engine (`/system-admin/subscriptions`)**
  - [x] พัฒนา Server Actions: `assignCompanySubscriptionAction`, `updateSubscriptionStatusAction`, `extendTrialAction`
  - [x] พัฒนาหน้า UI `/system-admin/subscriptions` ดูและจัดการสถานะการสมัครของทุกบริษัท
  - [x] พัฒนา `EntitlementService` (`src/lib/subscription/entitlement.ts`) ตรวจสอบโควตาพนักงาน/แอดมินก่อนสร้าง
- [x] **14.3 Full Tenant Company CRUD & Details View (`/system-admin/companies`)**
  - [x] พัฒนา Server Actions: `updateCompanySuperAdminAction`, `deleteCompanySuperAdminAction`, `getCompanyDetailAction`
  - [x] พัฒนา Modal แก้ไขข้อมูลบริษัท (ชื่อ, เลขผู้เสียภาษี, ข้อมูลติดต่อ, ที่อยู่)
  - [x] พัฒนา Drawer/Modal ดูรายละเอียดบริษัทเชิงลึก (Tenant Overview, สถิติการใช้งาน, แผนก, Subscription)
- [x] **14.4 Platform User & Admin CRUD (`/system-admin/users`)**
  - [x] พัฒนา Server Actions: `createUserSuperAdminAction`, `updateUserSuperAdminAction`, `deleteUserSuperAdminAction`, `toggleUserStatusSuperAdminAction`
  - [x] พัฒนา Modal สร้าง Admin บัญชีใหม่ และ Modal แก้ไขข้อมูล/เปลี่ยน Role/เปลี่ยนสถานะ
- [x] **14.5 Cross-Tenant Employee Management (`/system-admin/employees`)**
  - [x] เพิ่มระบบค้นหา (Search), กรองตามบริษัท (Company Filter), กรองตามสถานะ, และ Pagination
  - [x] พัฒนา Action ปุ่ม "ปลดการผูก LINE (Unlink LINE)" จากส่วนกลางเมื่อพนักงานผูกผิดบัญชี

---

### Phase 15: System Admin Operations, Real Health & Security

**เป้าหมาย**: เปลี่ยนระบบจำลอง (Mock) ใน Super Admin ให้เป็นระบบที่ทำงานจริง 100%

- [x] **15.1 Real Database Snapshot Backup & Download Stream (`/system-admin/backup`)**
  - [x] เปลี่ยนจาก Simulated Random Bytes เป็นการรัน JSON/SQL Snapshot Export ฐานข้อมูลจริง (`src/lib/backup/backup-service.ts`)
  - [x] พัฒนา Endpoint `/api/system-admin/backup/[id]/download` สำหรับดาวน์โหลดไฟล์สำรอง `.json.gz`
  - [x] เพิ่มปุ่ม "ดาวน์โหลดไฟล์สำรอง" บนหน้า UI `/system-admin/backup`
- [x] **15.2 Real Infrastructure Health Checks & Metrics (`/system-admin/health`)**
  - [x] เปลี่ยนค่า Latency ที่ Hardcoded เป็น Real Ping: ตรวจสอบ S3 Bucket Storage, LINE API Endpoint, และ Database Pool
  - [x] แสดงข้อมูล Server Load & Memory Usage จริง (`process.memoryUsage()`, Node.js Process Uptime)
- [x] **15.3 Security Center IP Blocklist & Live Rate Limiting (`/system-admin/security`)**
  - [x] พัฒนา Server Actions: `blockIpAddressAction`, `unblockIpAddressAction`, `getBlockedIpsAction`
  - [x] เพิ่ม UI จัดการ IP Blocklist และดึงสถิติ Rate Limit Blocks จากตาราง `RateLimitEntry` จริง

---

### Phase 16: Company Admin & HR CRUD Enhancements

**เป้าหมาย**: เพิ่มฟังก์ชัน CRUD และ Action สำคัญสำหรับ Company Admin และ HR

- [x] **16.1 HR Proxy Leave Request Submission & Revocation (`/admin/leave-requests`)**
  - [x] พัฒนา Server Action `createLeaveRequestByHrAction` ให้ HR ยื่นใบลาแทนพนักงานกรณีฉุกเฉิน
  - [x] พัฒนา Server Action `revokeApprovedLeaveAction` ยกเลิกใบลาที่อนุมัติแล้ว พร้อมคืนยอด Balance (`REVERSAL`) และแจ้งเตือน LINE
  - [x] เพิ่มปุ่ม "ยื่นใบลาแทนพนักงาน" และปุ่ม "เพิกถอนใบลา" บนหน้า `/admin/leave-requests`
- [x] **16.2 Holiday Bulk Import & Annual Calendar Automation (`/admin/holidays`)**
  - [x] พัฒนา Server Action `importOfficialHolidaysAction` ดึงวันหยุดนักขัตฤกษ์ไทยประจำปีเข้าสู่ปฏิทินบริษัทอัตโนมัติ
  - [x] เพิ่มปุ่ม "โหลดวันหยุดนักขัตฤกษ์ไทยอัตโนมัติ" บนหน้า `/admin/holidays`
- [x] **16.3 Batch Leave Balance Adjustment (`/admin/leave-balance`)**
  - [x] พัฒนา Server Action `batchAdjustLeaveBalanceAction` ปรับปรุงยอดวันลาแบบกลุ่มรายแผนกหรือทั้งบริษัท
  - [x] เพิ่ม Modal ปรับยอดวันลาแบบกลุ่มบนหน้า `/admin/leave-balance`

---

### Phase 17: Comprehensive Automated Testing & Quality Gate

**เป้าหมาย**: เขียนชุดทดสอบครอบคลุมทุก CRUD และฟังก์ชันใหม่ พร้อมรัน Quality Gate ผ่าน 100%

- [x] **17.1 Automated Unit & Integration Tests**
  - [x] ทดสอบ Plan & Subscription CRUD และ Entitlement Limits (`tests/unit/super-admin-crud.test.ts`)
  - [x] ทดสอบ Company & User Edit/Delete Actions
  - [x] ทดสอบ Real Backup Export & Download Endpoint
  - [x] ทดสอบ HR Proxy Leave Submission & Approved Leave Revocation (`tests/unit/hr-proxy-leave.test.ts`)
- [x] **17.2 Final Quality Gate**
  - [x] `npm run lint` — PASS 100%
  - [x] `npm run type-check` — PASS 100%
  - [x] `npm run test` — All 24 Test Suites (206 Tests) PASS 100%
  - [x] `npx prisma validate` — PASS 100%
  - [x] `npx next build` — PASS 100% (46/46 routes)

---

### Phase 18: System Admin UX, Sidebar Categorization & Platform-wide Filter & Pagination (100% Complete)

**เป้าหมาย**: เพิ่ม UX Scroll อิสระใน System Admin, จัดกลุ่มเมนู Sidebar 5 หมวดหมู่, สร้างคอมโพเนนต์กลาง `DataTablePagination` และใส่ Search, Multi-Criteria Filter และ Pagination ในทุกตาราง (23 ตาราง)

- [x] **18.1 System Admin Independent Scroll Container**
  - [x] แก้ไข `src/app/system-admin/layout.tsx` ให้มี `h-[100dvh] overflow-hidden` พร้อม `main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full"`
- [x] **18.2 System Admin Sidebar Categorized Navigation**
  - [x] จัดหมวดหมู่เมนูใน `src/components/system-admin/system-admin-sidebar.tsx` เป็น 5 หมวดหมู่ (ภาพรวมระบบ, จัดการผู้เช่า & SaaS, ผู้ใช้งาน & ไดเรกทอรี, ความปลอดภัย & ตรวจสอบ, โครงสร้างพื้นฐาน & บำรุงรักษา)
- [x] **18.3 Reusable DataTablePagination Component**
  - [x] สร้าง `src/components/ui/data-table-pagination.tsx` รองรับ Page size selection `[10, 20, 50, 100]`, dynamic ellipsis pagination, item range summary
- [x] **18.4 Filter & Pagination Across All Tables (23/23 Tables Completed)**
  - [x] System Admin (10/10): Companies, Plans, Subscriptions, Users, Employees, Sessions, Security Events, Audit Logs, Backup, API Keys
  - [x] Company Admin / HR (13/13): Employees, Leave Requests, Leave Balances, Departments, Positions, Branches, Users, Shifts, Work Schedules, Holidays, Announcements, Audit Logs, Line Accounts
- [x] **18.5 Final Quality Gate & Production Build Verification**
  - [x] `npm run lint` — PASS 100%
  - [x] `npm run type-check` — PASS 100%
  - [x] `npm run test` — PASS 100% (24 suites, 206 tests)
  - [x] `npx prisma validate` — PASS 100%
  - [x] `npx next build` — PASS 100% (All routes compiled)

---

### Phase 19: Company Admin SaaS Subscription & Quotas Management (100% Complete)

**เป้าหมาย**: เพิ่มหน้าระบบ Subscription สำหรับ Company Admin (`/admin/subscription`) พร้อมแสดงโควตาการใช้งาน, สถิติทรัพยากร, รายการฟีเจอร์ตามแพ็กเกจ, ตารางเปรียบเทียบทุกแพ็กเกจ และระบบส่งคำขออัปเกรด

- [x] **19.1 Company Subscription Page & Visual Gauges (`/admin/subscription`)**
  - [x] สร้าง `src/components/admin/company-subscription-view.tsx` แสดงข้อมูลแพ็กเกจปัจจุบัน, สถานะรอบบิล, นับถอยหลังวันหมดอายุ/Trial
  - [x] เกจวัดโควตาพนักงาน (`Employees Quota`) และที่นั่งผู้ดูแลระบบ (`Admin Seats`) พร้อม Progress Bar และแจ้งเตือนเมื่อเกินโควตา
  - [x] สรุปสถิติทรัพยากร: สาขา, แผนก, รายการคำขอลา, ไฟล์เอกสารแนบบน Cloud Storage
  - [x] ตารางสิทธิ์การใช้งานฟังก์ชัน (Features & Modules Matrix)
  - [x] ตารางเปรียบเทียบระดับแพ็กเกจทั้งหมด (Available Plans Comparison)
- [x] **19.2 Plan Upgrade Request Action**
  - [x] พัฒนา Server Action `requestPlanUpgradeAction` ใน `src/features/subscription/subscription-actions.ts` พร้อมบันทึก Immutable Audit Trail
  - [x] เพิ่ม Modal ขออัปเกรดแพ็กเกจ / ขยายโควตา
- [x] **19.3 Navigation & Quick Widget**
  - [x] เพิ่มเมนู `แพ็กเกจและการใช้งาน` บน Company Admin Sidebar (`src/components/admin/admin-sidebar.tsx`)
  - [x] เพิ่ม Quick Widget ในหน้าตั้งค่าองค์กร (`src/components/admin/admin-settings-view.tsx`)
- [x] **19.4 Quality Gate & Tests**
  - [x] สร้างชุดทดสอบ `tests/unit/company-subscription.test.ts`
  - [x] `npm run lint` — PASS 100%
  - [x] `npm run type-check` — PASS 100%
  - [x] `npm run test` — All 25 Test Suites (210 Tests) PASS 100%
  - [x] `npx prisma validate` — PASS 100%
  - [x] `npx next build` — PASS 100% (47 routes compiled)

---

### Phase 20: Native Dialog Replacement (Toasts & Accessible Alert Dialogs)

**เป้าหมาย**: ตรวจสอบและแทนที่การใช้งาน Browser `alert("")`, `confirm("")`, `prompt("")` ทั้งหมดในระบบ ด้วยโมเดิร์น UI Toasts และ Accessible `AlertDialog` Modals

- [x] **20.1 พัฒนาระบบ Toast Notification**
  - [x] สร้าง `src/components/ui/toast.tsx` พร้อม singleton `toast.success`, `toast.error`, `toast.warning`, `toast.info` และคอมโพเนนต์ `<Toaster />`
  - [x] ติดตั้ง `<Toaster />` ใน Root Layout (`src/app/layout.tsx`)
- [x] **20.2 ปรับปรุงการแจ้งเตือนและยืนยันในทุกโมดูล**
  - [x] แทนที่ `alert()` และ `confirm()` ในฝั่ง Company Admin (Announcements, Branches, Holidays, Leave Years, LINE Accounts, Positions, Shifts, Users, Work Schedules, Workflows)
  - [x] แทนที่ `alert()` และ `confirm()` ในฝั่ง System Admin (API Keys, Backups, Companies, Plans, Security Center, Sessions, Subscriptions, Users, Super Admin Employees)
- [x] **20.3 Quality Gate Verification**
  - [x] `grep_search` ตรวจสอบทั้ง repo: `alert()`, `confirm()`, `prompt()` เหลือ 0 รายการ
  - [x] `npm run lint` — PASS 100%
  - [x] `npm run type-check` — PASS 100%
  - [x] `npm run test` — All 25 Test Suites (210 Tests) PASS 100%
  - [x] `npx prisma validate` — PASS 100%
  - [x] `npx next build` — PASS 100% (47 routes compiled)

---

### Phase 21: End-to-End SaaS Plan Upgrade Request & Approval System

**เป้าหมาย**: พัฒนาระบบขอปรับระดับแพ็กเกจ (Plan Upgrade Request) และการพิจารณาอนุมัติ/ปฏิเสธคำขอจากฝั่ง System Admin แบบครบวงจร

- [x] **21.1 Database Schema & Migration**
  - [x] เพิ่ม Enum `PlanUpgradeRequestStatus` (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`) ใน `prisma/schema.prisma`
  - [x] เพิ่ม Model `PlanUpgradeRequest` พร้อม Relations (`Company`, `Plan`, `User`)
  - [x] ดำเนินการสร้างและรัน Migration `20260820085831_add_plan_upgrade_request` บน PostgreSQL
- [x] **21.2 Server Actions**
  - [x] `requestPlanUpgradeAction`: ส่งคำขอปรับระดับแพ็กเกจ เลือกรอบบิล (Monthly/Yearly) และระบุโควตาพนักงานเพิ่มเติม
  - [x] `cancelPlanUpgradeRequestAction`: บริษัทสามารถยกเลิกคำขอที่อยู่ระหว่างรอตรวจสอบได้
  - [x] `approvePlanUpgradeRequestAction`: Super Admin อนุมัติคำขอ เลือกระยะเวลารอบบิล (1-24 เดือน) และเปิดใช้งาน Subscription อัตโนมัติใน Database Transaction
  - [x] `rejectPlanUpgradeRequestAction`: Super Admin ปฏิเสธคำขอพร้อมระบุเหตุผล/คำแนะนำ
- [x] **21.3 Company Admin Subscription View (`/admin/subscription`)**
  - [x] เพิ่มตารางประวัติคำขอ (Upgrade Requests History) แสดงสถานะ, รอบบิล, ข้อความตอบกลับ และปุ่มยกเลิกคำขอ
  - [x] อัปเกรด Modal ขอปรับระดับแพ็กเกจ รองรับการเลือกประเภทการชำระเงิน (รายเดือน/รายปี) และขยายโควตาพนักงาน
- [x] **21.4 System Admin Subscription View (`/system-admin/subscriptions`)**
  - [x] เพิ่มแท็บ "คำขอปรับระดับแพ็กเกจ" พร้อม Badge นับจำนวนคำขอที่รอตรวจสอบ (Pending Counter)
  - [x] เพิ่ม Modal อนุมัติคำขอ (Approve Modal) เลือกระยะเวลารอบบิล และระบุ Admin Notes
  - [x] เพิ่ม Modal ปฏิเสธคำขอ (Reject Modal) ระบุเหตุผล
  - [x] เพิ่มระบบค้นหา, ฟิลเตอร์สถานะ และ Pagination
- [x] **21.5 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/company-subscription.test.ts` (214/214 tests pass)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 47 routes)

---

### Phase 22: In-App Mailbox & Support Messaging System + Request Detail Dialogs

**เป้าหมาย**: พัฒนาระบบกล่องข้อความภายใน (Mailbox / Threaded Messaging) สำหรับส่งและตอบกลับข้อความระหว่าง Company Admin และ System Admin พร้อม Modal ดูรายละเอียดคำขอแพ็กเกจอย่างละเอียด

- [x] **22.1 Database Schema & Migration**
  - [x] เพิ่ม Enum `MessageCategory` (`GENERAL`, `UPGRADE_REQUEST`, `BILLING`, `SUPPORT`, `SYSTEM`)
  - [x] เพิ่ม Enum `ThreadStatus` (`OPEN`, `CLOSED`, `RESOLVED`)
  - [x] เพิ่ม Model `MessageThread` และ `Message` พร้อม Relations (`Company`, `User`, `PlanUpgradeRequest`)
  - [x] ดำเนินการสร้างและรัน Migration `20260820090813_add_messaging_system` บน PostgreSQL
- [x] **22.2 Server Actions (`src/features/messaging/message-actions.ts`)**
  - [x] `createMessageThreadAction`: สร้างหัวข้อสนทนาและข้อความเริ่มต้น
  - [x] `replyMessageAction`: ตอบกลับข้อความในหัวข้อสนทนา (รองรับ Internal Note สำหรับ Super Admin)
  - [x] `updateThreadStatusAction`: เปลี่ยนสถานะหัวข้อ (OPEN, RESOLVED, CLOSED)
  - [x] `getThreadMessagesAction`: ดึงข้อความใน Thread และอัปเดตสถานะการอ่าน
- [x] **22.3 Company Admin Mailbox (`/admin/messages`) & Request Detail Dialog**
  - [x] พัฒนาหน้า `/admin/messages` ด้วยคอมโพเนนต์ `MailboxView` (Master-Detail layout, ฟิลเตอร์หมวดหมู่, ค้นหา, ส่งข้อความใหม่, ตอบกลับ)
  - [x] เพิ่ม Modal "ดูรายละเอียดคำขอ" ใน `/admin/subscription` แสดงสรุปข้อมูลคำขอครบถ้วน และปุ่มเปิดกล่องข้อความ
  - [x] เพิ่มเมนู "กล่องข้อความระบบ" บน Admin Sidebar
- [x] **22.4 System Admin Support Mailbox (`/system-admin/messages`) & Request Detail Dialog**
  - [x] พัฒนาหน้า `/system-admin/messages` ด้วยคอมโพเนนต์ `SystemMailboxView` (จัดการข้อความข้ามองค์กร, ฟิลเตอร์บริษัท/สถานะ, ตอบกลับ, บันทึกภายใน, ปรับสถานะ)
  - [x] เพิ่ม Modal "ดูรายละเอียดคำขอ" ใน `/system-admin/subscriptions` พร้อมปุ่มเปิดศูนย์ข้อความ และปุ่มอนุมัติ/ปฏิเสธทันที
  - [x] เพิ่มเมนู "ศูนย์ข้อความ & ซัพพอร์ต (Mailbox)" บน System Admin Sidebar
- [x] **22.5 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/messaging-system.test.ts` (220/220 tests pass across 26 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 23: Dynamic AutoSearch Combobox & S3 File Attachments for Messaging System

**เป้าหมาย**: ปรับปรุงระบบกล่องข้อความให้ใช้ AutoSearch Combobox ในการค้นหาองค์กรแทนการโหลดใส่ `<select>` ทั้งหมด และเพิ่มระบบแนบไฟล์เอกสาร/ภาพประกอบ (File Attachments) ทั้งในการส่งข้อความและตอบกลับ

- [x] **23.1 Database Schema & Migration**
  - [x] เพิ่ม Model `MessageAttachment` พร้อม Relations (`Message`) และบันทึก Metadata (originalName, fileName, fileSize, mimeType, objectKey)
  - [x] ดำเนินการสร้างและรัน Migration `20260820091654_add_message_attachments` บน PostgreSQL
- [x] **23.2 Storage & Server Actions**
  - [x] เพิ่ม `generateMessageAttachmentKey` ใน `src/lib/storage/partition.ts` เพื่อการแยกข้อมูลระดับองค์กร (Tenant Isolation)
  - [x] `searchCompaniesAction`: ระบบ AutoSearch ค้นหาองค์กรแบบ Dynamic Debounce (จำกัด 10 รายการต่อการค้นหา)
  - [x] `createMessageThreadAction` & `replyMessageAction`: รองรับการส่งและประมวลผลไฟล์แนบ (Base64 -> Buffer -> S3 upload -> DB record)
  - [x] `getMessageAttachmentDownloadUrlAction`: สร้าง Signed Download URL สำหรับเปิด/ดาวน์โหลดไฟล์แนบอย่างปลอดภัย
- [x] **23.3 UI Components Enhancements**
  - [x] `SystemMailboxView`: แทนที่ `<select>` ด้วย **AutoSearch Combobox** (Input + Realtime Suggestions Popover)
  - [x] `MailboxView` & `SystemMailboxView`: เพิ่มปุ่มแนบไฟล์ (Paperclip), Badge พรีวิวไฟล์แนบพร้อมขนาดไฟล์ (Size) และปุ่มลบไฟล์
  - [x] การแสดงผลไฟล์แนบในกล่องแชท: กล่องการ์ดไฟล์แนบพร้อมประเภทไฟล์ (PDF/Image/Document), ขนาดไฟล์ และปุ่มดาวน์โหลด
- [x] **23.4 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/messaging-system.test.ts` (221/221 tests pass across 26 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 24: Fix Context-Aware Auto Dismissal for AlertDialogCancel & Cancel Upgrade Request Modal

**เป้าหมาย**: แก้ไขการทำงานของปุ่ม "กลับ" ใน Modal ยืนยันการยกเลิกคำขอปรับระดับแพ็กเกจ และปรับปรุง `AlertDialogCancel` ให้รองรับ Context-aware auto-dismissal ทั่วทั้งแอป

- [x] **24.1 Context-Aware AlertDialog System (`src/components/ui/alert-dialog.tsx`)**
  - [x] สร้าง `AlertDialogContext` เพื่อส่งต่อ `onOpenChange` ไปยังคอมโพเนนต์ลูก
  - [x] ปรับแต่ง `AlertDialogCancel` ให้เรียก `onOpenChange(false)` อัตโนมัติเมื่อกดปุ่มยกเลิก/กลับ แม้ไม่ได้ระบุ `onClick` โดยตรง
- [x] **24.2 Fix Company Subscription View (`src/components/admin/company-subscription-view.tsx`)**
  - [x] เพิ่ม `onClick={() => setCancelTargetId(null)}` ให้กับ `AlertDialogCancel` ใน Modal ยกเลิกคำขอ
- [x] **24.3 Quality Gate Verification**
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run test` — PASS (221/221 tests across 26 test files)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 25: Fix S3 Bucket Resolution & Storage Configuration for Object Uploads

**เป้าหมาย**: แก้ไขปัญหาการเชื่อมต่อและการอัปโหลดไฟล์ขึ้น S3 / SeaweedFS โดยให้รองรับตัวแปร `S3_BUCKET` จาก `.env` อย่างถูกต้อง

- [x] **25.1 Storage Service (`src/lib/storage/service.ts`)**
  - [x] ปรับแต่ง `this.bucketName` ใน `S3StorageService` ให้ตรวจสอบ `process.env.S3_BUCKET` ร่วมกับ `process.env.S3_BUCKET_NAME`
  - [x] รองรับการชี้ไปยัง Bucket `lalink-dev` ตามที่กำหนดไว้ใน `.env`
- [x] **25.2 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/storage.test.ts` (222/222 tests pass across 26 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 26: S3-Compatible Off-Site Database Backup Storage & Download URLs

**เป้าหมาย**: ปรับปรุงระบบสำรองฐานข้อมูล (Database Backup) ให้อัปโหลดไฟล์ Snapshot Gzip ขึ้น S3 Storage เพื่อความปลอดภัยระดับ Disaster Recovery และสร้าง Pre-signed Download URL

- [x] **26.1 Backup Service S3 Integration (`src/lib/backup/backup-service.ts`)**
  - [x] อัปโหลดไฟล์ Snapshot (`.json.gz`) ขึ้น S3 Storage ที่ Key `backups/<filename>` ทันทีที่มีการ Trigger Backup
  - [x] เพิ่มเมธอด `getBackupDownloadUrl` สำหรับสร้าง Pre-signed URL ดาวน์โหลดตรงจาก S3
  - [x] เก็บสำรองไฟล์ใน Local Directory เป็น Fallback Cache
- [x] **26.2 Secure Backup Download Route (`src/app/api/system-admin/backup/[id]/download/route.ts`)**
  - [x] ปรับแต่งให้ Redirect ไปยัง S3 Pre-signed URL อัตโนมัติ (พร้อม Local Stream Fallback)
- [x] **26.3 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/backup.test.ts` (224/224 tests pass across 27 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 27: Comprehensive 42-Table Full Database Snapshot & Metadata Breakdown

**เป้าหมาย**: ขยายระบบสำรองฐานข้อมูลให้ครอบคลุมครบทุก 42 ตารางใน PostgreSQL พร้อมสรุป Metadata จำนวนข้อมูลรายตารางอย่างละเอียด

- [x] **27.1 Full 42-Table Snapshot Query (`src/lib/backup/backup-service.ts`)**
  - [x] เพิ่มการ Query ทุกตารางในฐานข้อมูลครบถ้วน 42 ตาราง (รวม Branches, Workflows, Approvals, Attachments, Messages, Threads, Logs, Settings, Years, API Keys ฯลฯ)
  - [x] คำนวณ `totalRecords` และ `tableCounts` บันทึกลงใน JSON Snapshot Metadata
  - [x] กรองข้อมูลด้านความปลอดภัย (ตัด Password Hash)
- [x] **27.2 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/backup.test.ts` (224/224 tests pass across 27 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

---

### Phase 28: Enterprise All-in-One Multi-Format Backup Bundle (SQL + JSON + S3 Manifest + Metadata)

**เป้าหมาย**: ยกระดับระบบสำรองฐานข้อมูลให้สร้างชุด Backup แบบ All-in-One Multi-Format ZIP Bundle ซึ่งประกอบด้วยไฟล์ SQL Dump, JSON Snapshot, S3 Attachments Manifest และ Manifest ข้อมูลสรุป

- [x] **28.1 PostgreSQL SQL Generator (`src/lib/backup/sql-generator.ts`)**
  - [x] พัฒนาตัวแปลงข้อมูลเป็น SQL `INSERT` statements สำหรับทุก 42 ตาราง
  - [x] จัดการ Foreign Keys (`SET session_replication_role = 'replica';`), Type formatting (Date, Booleans, Nulls, JSON, BigInt)
- [x] **28.2 Multi-Format ZIP Bundle Package (`src/lib/backup/backup-service.ts`)**
  - [x] รวมไฟล์ 4 ชิ้นเข้าไว้ใน `.zip`:
    - `dump.sql` (PostgreSQL raw dump สำหรับ restore ทันที)
    - `data_snapshot.json` (Structured JSON snapshot)
    - `attachments_manifest.json` (S3 object storage inventory)
    - `manifest.json` (SHA-256 Checksum, table record counts, system version)
  - [x] อัปโหลด `.zip` ขึ้น S3 Storage และบันทึก local cache
- [x] **28.3 Quality Gate Verification**
  - [x] Unit Tests: `tests/unit/backup.test.ts` (225/225 tests pass across 27 test suites)
  - [x] `npm run lint` — PASS (0 Errors)
  - [x] `npm run type-check` — PASS (0 Errors)
  - [x] `npm run prisma:validate` — Valid
  - [x] `npx next build` — PASS (100% compiled across all 49 routes)

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
