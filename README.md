# 🌿 LALINK (ลาลิ้งค์) — ระบบบริหารจัดการวันลาผ่าน LINE สำหรับองค์กรยุคใหม่

<p align="center">
  <img src="public/icon.png" alt="LALINK Logo" width="100" />
</p>

<p align="center">
  <b>Enterprise Multi-Tenant SaaS Leave & Workforce Management Platform seamlessly integrated with LINE LIFF & LINE Messaging API</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.1-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/LINE_LIFF-v2.30-06C755?style=flat-square&logo=line" alt="LINE LIFF" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-ORM_v7-3982CE?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Multi--Tenant-336791?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Storage-S3_Compatible-orange?style=flat-square&logo=amazons3" alt="S3 Storage" />
  <img src="https://img.shields.io/badge/Tests-225%20Passed-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/PDPA-Compliant-emerald?style=flat-square" alt="PDPA" />
</p>

---

## 📌 สารบัญ (Table of Contents)

1. [เกี่ยวกับโครงการ (About Project)](#-เกี่ยวกับโครงการ-about-project)
2. [ภาพรวมสถาปัตยกรรม (System Architecture)](#-ภาพรวมสถาปัตยกรรม-system-architecture)
3. [ฟีเจอร์เด่นของระบบ (Key Features)](#-ฟีเจอร์เด่นของระบบ-key-features)
   - [1. LINE LIFF สำหรับพนักงาน (Mobile Experience)](#1-line-liff-สำหรับพนักงาน-mobile-experience)
   - [2. HR & Company Admin Portal (ระบบหลังบ้านสำหรับบริษัท)](#2-hr--company-admin-portal-ระบบหลังบ้านสำหรับบริษัท)
   - [3. SaaS Subscription & Plan Upgrade Lifecycle](#3-saas-subscription--plan-upgrade-lifecycle)
   - [4. ระบบกล่องข้อความ & ซัพพอร์ตภายใน (In-App Mailbox & Support)](#4-ระบบกล่องข้อความ--ซัพพอร์ตภายใน-in-app-mailbox--support)
   - [5. ระบบสำรองฐานข้อมูล All-in-One Multi-Format Backup (S3 Disaster Recovery)](#5-ระบบสำรองฐานข้อมูล-all-in-one-multi-format-backup-s3-disaster-recovery)
   - [6. Super Admin & Platform Control Plane](#6-super-admin--platform-control-plane)
4. [ความปลอดภัยและ PDPA (Security & Compliance)](#-ความปลอดภัยและ-pdpa-security--compliance)
5. [เทคโนโลยีและเครื่องมือ (Tech Stack)](#-เทคโนโลยีและเครื่องมือ-tech-stack)
6. [การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)](#-การติดตั้งและเริ่มต้นใช้งาน-installation--setup)
7. [การตั้งค่า Environment Variables (`.env`)](#-การตั้งค่า-environment-variables-env)
8. [คำสั่งที่ใช้บ่อย (Useful Commands)](#-คำสั่งที่ใช้บ่อย-useful-commands)
9. [โครงสร้างโปรเจกต์ (Project Directory Structure)](#-โครงสร้างโปรเจกต์-project-directory-structure)

---

## 📖 เกี่ยวกับโครงการ (About Project)

**LALINK (ลาลิ้งค์)** คือแพลตฟอร์มบริหารจัดการทรัพยากรบุคคล, วันลา, กะการทำงาน และสิทธิประโยชน์พนักงานแบบ **Multi-Tenant SaaS** ระดับองค์กร ที่ผสานการทำงานเข้ากับ **LINE Official Account (LINE OA)** และ **LINE Front-end Framework (LIFF)** อย่างไร้รอยต่อ

ช่วยให้พนักงานสามารถยื่นใบลา ตรวจสอบสิทธิ์วันลา สแกน QR Code ผูกบัญชี และรับข้อความแจ้งเตือนผลการอนุมัติแบบ Real-time ผ่าน LINE บนมือถือ พร้อมระบบบริหารจัดการสำหรับฝ่ายบุคคล (HR), ผู้บริหาร และ Super Admin โดยมีการแยกข้อมูลของแต่ละบริษัทออกจากกันอย่างเด็ดขาด (**Strict Multi-Tenant Isolation**)

---

## 🏗️ ภาพรวมสถาปัตยกรรม (System Architecture)

```mermaid
graph TD
    subgraph Client Layer
        A[LINE App / LIFF on Mobile]
        B[Web Browser / HR & Company Admin]
        C[Web Browser / Super Admin]
    end

    subgraph Application Layer [Next.js 16 App Router & Server Actions]
        D[Authentication & Session Guard]
        E[Scoped Data Access Layer - Tenant Context]
        F[LINE Messaging & Flex Template Engine]
        G[RBAC & Permissions Engine]
        H[Multi-Format Backup Service]
        I[In-App Messaging & Mailbox]
    end

    subgraph Data & Storage Layer
        J[(PostgreSQL 42 Tables + Prisma ORM)]
        K[S3-Compatible Object Storage / SeaweedFS]
        L[LINE Platform API & LIFF SDK]
    end

    A -->|LIFF SDK v2.30| D
    B -->|Company Admin Session| D
    C -->|Super Admin Session| D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    E --> J
    H --> K
    I --> K
    F --> L
```

---

## ✨ ฟีเจอร์เด่นของระบบ (Key Features)

### 1. LINE LIFF สำหรับพนักงาน (Mobile Experience)
- 📲 **เชื่อมต่อบัญชีสะดวกรวดเร็ว (Seamless Account Linking)**:
  - สแกน QR Code ประจำบริษัทผ่านกล้องของ LINE ด้วย `liff.scanCodeV2()` หรือเปิดผ่าน Direct Web Link
  - ตรวจสอบชื่อบริษัทและยืนยันข้อมูลก่อนผูกบัญชีด้วยรหัสพนักงานและวันเกิด (รองรับทั้ง ค.ศ. และ พ.ศ.)
- 📝 **ยื่นใบลาง่ายในไม่กี่วินาที (Leave Request Submission)**:
  - รองรับการลาเต็มวัน, ครึ่งวัน (เช้า/บ่าย), หรือลารายชั่วโมง
  - แนบไฟล์หลักฐาน (ใบรับรองแพทย์/สลิป) จัดเก็บขึ้น S3 Storage อย่างปลอดภัย
- 📊 **แดชบอร์ดแสดงโควตาและประวัติ (Balance & History)**:
  - ตรวจสอบวันลาคงเหลือแบบเรียลไทม์ (ลาพักร้อน, ลากิจ, ลาป่วย ฯลฯ)
  - ปฏิทินแสดงวันหยุดประจำปีและวันลาของตนเอง
- 🔔 **LINE Push Notifications (Flex Message)**:
  - รับข้อความแจ้งเตือนสถานะทันทีเมื่อคำขอลาได้รับการอนุมัติ ปฏิเสธ หรือมีการยกเลิกคำขอ

### 2. HR & Company Admin Portal (ระบบหลังบ้านสำหรับบริษัท)
- 📈 **แดชบอร์ดภาพรวมองค์กร (HR Analytics Dashboard)**:
  - สรุปสถิติการลาประจำวัน/เดือน อัตราการลาจำแนกตามแผนก และคำขอที่รอการพิจารณา
- 📅 **ปฏิทินวันลาและวันหยุดบริษัท (Company Calendar & Holiday Planner)**:
  - จัดการวันหยุดนักขัตฤกษ์และวันหยุดพิเศษประจำปี
  - ดูภาพรวมตารางการลาของพนักงานทั้งองค์กรแบบ Calendar / Gantt View
- 👥 **จัดการโครงสร้างองค์กรและพนักงาน (Organization & Employees)**:
  - กำหนดสาขา (Branches), แผนก (Departments), ตำแหน่ง (Positions)
  - นำเข้า/ส่งออกข้อมูลพนักงาน (CSV / Excel) และจัดการสิทธิ์ผู้ใช้งาน (RBAC)
  - ตรวจสอบสถานะการเชื่อมต่อ LINE ของพนักงานแต่ละคน
- ⏰ **จัดการกะและตารางการทำงาน (Shifts & Work Schedules)**:
  - กำหนดกะเวลาทำงาน (Normal Shift, Night Shift ฯลฯ) และมอบหมายตารางงานให้พนักงาน
- 🔀 **สายการอนุมัติแบบหลายระดับ (Multi-Level Approval Workflows)**:
  - ตั้งค่า Approval Flow ตามลำดับขั้น (หัวหน้างาน -> ฝ่ายบุคคล -> ผู้บริหาร)
- 🖨️ **ระบบ Company QR Code อัจฉริยะ**:
  - สร้าง QR Code ประจำบริษัททั้งแบบ Plain Text และ Web URL
  - ดาวน์โหลดการ์ดความละเอียดสูง (PNG 800x1050px) และพิมพ์โปสเตอร์ประกาศขนาด A4 ได้ทันที

### 3. SaaS Subscription & Plan Upgrade Lifecycle
- 💳 **ระบบสมาชิกและการจำกัดโควตา (Subscription Management)**:
  - ควบคุมโควตาพนักงานสูงสุด (Seat Limits), ประเภทรอบบิล (Monthly / Yearly), และวันหมดอายุ Subscription
  - หน้า `/admin/subscription` สำหรับตรวจสอบการใช้งานโควตา, วันคงเหลือ, และประวัติคำขอ
- 🚀 **วงจรการขอปรับระดับแพ็กเกจ (Plan Upgrade Request Lifecycle)**:
  - บริษัทสามารถส่งคำขออัปเกรดแพ็กเกจ (Standard, Enterprise), เลือกรอบบิล และขอเพิ่มโควตาพนักงานพิเศษได้
  - ติดตามสถานะคำขอ (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`) พร้อม Modal ดูรายละเอียดคำขอฉบับเต็ม
  - ระบบตรวจสอบคำขอซ้ำซ้อนและปุ่มยกเลิกคำขอที่รอการพิจารณา

### 4. ระบบกล่องข้อความ & ซัพพอร์ตภายใน (In-App Mailbox & Support)
- 📬 **กล่องข้อความระบบสำหรับบริษัท (`/admin/messages`)**:
  - ติดต่อสอบถามทีมงานส่วนกลาง, สอบถามแพ็กเกจ, ปัญหาการใช้งาน หรือการเงิน
  - ฟิลเตอร์หมวดหมู่: `ความช่วยเหลือ`, `แพ็กเกจ`, `การเงิน/รอบบิล`, `ทั่วไป`
  - รองรับการแนบไฟล์ (PDF, เอกสาร, ภาพประกอบ, สลิป)
- 🏢 **ศูนย์ข้อความ & ซัพพอร์ตสำหรับ Super Admin (`/system-admin/messages`)**:
  - จัดการข้อความข้ามองค์กร พร้อมฟิลเตอร์เลือกดูตามบริษัทและสถานะงาน
  - **AutoSearch Combobox**: ค้นหาองค์กรแบบ Dynamic Realtime Debounce (ไม่ดึงทั้งหมดมาใส่ select เพื่อรองรับระบบขนาดใหญ่)
  - รองรับการบันทึกข้อความภายในเฉพาะแอดมิน (`Internal Note`)
  - ปุ่มปรับสถานะบทสนทนา (`เปิดอยู่`, `แก้ไขแล้ว`, `ปิดงาน`)

### 5. ระบบสำรองฐานข้อมูล All-in-One Multi-Format Backup (S3 Disaster Recovery)
- 📦 **Multi-Format Archive (`.zip`)**:
  - 📄 `dump.sql`: สคริปต์ SQL ของ PostgreSQL พร้อมคำสั่ง INSERT ข้อมูลครบทั้ง **42 ตาราง** กู้คืนได้ 100% ทันที
  - 📊 `data_snapshot.json`: Structured JSON Snapshot อ่านง่าย เหมาะสำหรับ Audit & Analytics
  - 📎 `attachments_manifest.json`: บัญชีสรุปรายการไฟล์แนบและ Metadata ใน S3 Storage
  - 📋 `manifest.json`: รายงานสถิติ, SHA-256 Checksum, ยอดรวม Record รายตาราง
- ☁️ **S3-Compatible Off-Site Storage**:
  - อัปโหลดไฟล์สำรองขึ้น S3 / SeaweedFS อัตโนมัติ ปลอดภัยกรณีเซิร์ฟเวอร์หลักเกิดความเสียหาย
  - ดาวน์โหลดผ่าน Pre-signed URL ที่ปลอดภัยและรวดเร็ว

### 6. Super Admin & Platform Control Plane
- 🏢 **จัดการบริษัททั้งหมดในระบบ (Multi-Tenant Management)**:
  - เพิ่ม/ระงับ/แก้ไขบริษัท, มอบหมาย Subscription, ขยายระยะเวลาทดลองใช้งาน
- 🔒 **Security Center & Active Sessions**:
  - ตรวจสอบประวัติการล็อกอิน, เพิกถอน Session ผู้ใช้ที่น่าสงสัย (Force Revoke Session)
  - จัดการ API Keys สำหรับการเชื่อมต่อภายนอก
- 💾 **System Health & Audit Logs**:
  - ตรวจสอบสุขภาพของ Database, Storage และ Global Audit Trail

---

## 🛡️ ความปลอดภัยและ PDPA (Security & Compliance)

- **Strict Tenant Isolation**: แยกข้อมูลของแต่ละบริษัทอย่างเคร่งครัดผ่าน Tenant Context และ Scoped Data Access Layer
- **PDPA Compliance**:
  - ระบบยินยอมรับเงื่อนไขการประมวลผลข้อมูลส่วนบุคคล (Consent Collection)
  - ระบบลบและทำลายข้อมูลอัตลักษณ์ (Data Anonymization / Right to Erasure) สำหรับพนักงานที่พ้นสภาพ
- **Data Protection & Sanitization**:
  - กรองและตัด Password Hash ออกจากไฟล์ Backup Dump เสมอ
  - ตรวจสอบความถูกต้องของไฟล์แนบด้วย Magic Bytes Verification และ Tenant-partitioned S3 Keys
- **HTTP Security & Rate Limiting**:
  - ตั้งค่า `Content-Security-Policy`, `Permissions-Policy: camera=*` สำหรับสแกน QR ผ่าน LINE
  - ป้องกันการ Brute-force รหัสผ่านด้วย Rate Limiter

---

## 💻 เทคโนโลยีและเครื่องมือ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ |
|---|---|
| **Frontend Framework** | [Next.js 16.3.1 (Turbopack, App Router)](https://nextjs.org/) + [React 19](https://react.dev/) |
| **Language** | [TypeScript 5 (Strict Mode)](https://www.typescriptlang.org/) |
| **Styling & Icons** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) (42 Tables) + [Prisma ORM v7](https://www.prisma.io/) |
| **Object Storage** | S3-Compatible Storage ([SeaweedFS](https://github.com/seaweedfs/seaweedfs) / [AWS S3](https://aws.amazon.com/s3/) / [Cloudflare R2](https://www.cloudflare.com/products/r2/)) |
| **LINE Integration** | [@line/liff v2.30+](https://developers.line.biz/en/docs/liff/) + LINE Messaging API (Flex Messages) |
| **Archive & Packaging** | [adm-zip](https://github.com/cthackers/adm-zip) + [zlib](https://nodejs.org/api/zlib.html) |
| **Automated Testing** | [Vitest](https://vitest.dev/) (225+ Unit & Integration Tests, 27 Suites) |

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- [Node.js](https://nodejs.org/) version 20.x หรือสูงกว่า
- [PostgreSQL](https://www.postgresql.org/) Database (พร้อม Connection String)
- บัญชี [LINE Developers](https://developers.line.biz/) (สร้าง Provider, LINE Messaging API Channel และ LIFF App)
- S3-Compatible Object Storage (เช่น SeaweedFS, Cloudflare R2, AWS S3 หรือ MinIO)

### ขั้นตอนการติดตั้ง (Step-by-Step)

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/lalink.git
   cd lalink
   ```

2. **ติดตั้ง Dependencies**:
   ```bash
   npm install
   ```

3. **ตั้งค่าไฟล์ Environment Variables**:
   ```bash
   cp .env.example .env
   # แก้ไขค่าตัวแปรใน .env ให้ตรงกับการใช้งานจริง
   ```

4. **รัน Database Migrations & Generate Prisma Client**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **รัน Seed ข้อมูลเริ่มต้น (Initial Plans & Super Admin)**:
   ```bash
   npm run prisma:seed
   ```

6. **เริ่มต้นเซิร์ฟเวอร์สำหรับ Development**:
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔐 การตั้งค่า Environment Variables (`.env`)

สร้างไฟล์ `.env` ใน Root Directory และกำหนดค่าตัวแปรดังนี้:

```env
# =====================================================================
# 1. Database Configuration (PostgreSQL)
# =====================================================================
DATABASE_URL="postgresql://username:password@localhost:5432/lalink_db?schema=public"

# =====================================================================
# 2. Application & Authentication Security
# =====================================================================
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
AUTH_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
SESSION_COOKIE_NAME="lalink_session"
NODE_ENV="development"

# =====================================================================
# 3. LINE Integration (LIFF & Messaging API)
# =====================================================================
LINE_CHANNEL_ID="2011xxxxxx"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="your-line-channel-access-token"
NEXT_PUBLIC_LIFF_ID="2011xxxxxx-xxxxxxx"

# =====================================================================
# 4. S3-Compatible Object Storage (SeaweedFS / AWS S3 / Cloudflare R2)
# =====================================================================
S3_ENDPOINT="https://seaweed-s3.yourdomain.com"
S3_REGION="us-east-1"
S3_BUCKET="lalink-dev"
S3_ACCESS_KEY_ID="your-s3-access-key-id"
S3_SECRET_ACCESS_KEY="your-s3-secret-access-key"
S3_FORCE_PATH_STYLE="true"
```

---

## 💻 คำสั่งที่ใช้บ่อย (Useful Commands)

| คำสั่ง (Command) | คำอธิบาย (Description) |
| :--- | :--- |
| `npm run dev` | สตาร์ท Development Server ด้วย Turbopack |
| `npm run build` | คอมไพล์โปรเจกต์สำหรับ Production |
| `npm run start` | รันเซิร์ฟเวอร์ Production |
| `npm run test` | รันชุดการทดสอบ Automated Tests ทั้งหมด (Vitest 225+ tests) |
| `npm run lint` | ตรวจสอบ Code Quality ด้วย ESLint |
| `npm run type-check` | ตรวจสอบ TypeScript Types (`tsc --noEmit`) |
| `npm run prisma:validate` | ตรวจสอบความถูกต้องของ Prisma Schema |
| `npx prisma migrate dev` | สร้างและประยุกต์ใช้ Database Migration |
| `npx prisma studio` | เปิด Web GUI สำหรับจัดการข้อมูลใน Database |

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory Structure)

```text
lalink/
├── prisma/                          # Prisma schema & Database migrations
│   ├── migrations/                  # Sequential PostgreSQL migration SQL files
│   ├── schema.prisma                # Complete 42-Table Prisma Schema definition
│   └── seed.ts                      # Database Seeder script
├── public/                          # Static assets (Logos, Icons, Brand assets)
├── src/
│   ├── app/                         # Next.js App Router Routes
│   │   ├── (auth)/                  # Login & Registration views
│   │   ├── admin/                   # HR / Company Admin Portal (20+ routes)
│   │   │   ├── dashboard/           # Analytics & Overview
│   │   │   ├── employees/           # Employee management & LINE status
│   │   │   ├── leave-requests/      # Leave approvals & balance deduction
│   │   │   ├── subscription/        # Plan quota, history & upgrade requests
│   │   │   ├── messages/            # Company Admin Mailbox & Support
│   │   │   └── ...                  # Shifts, Schedules, Workflows, Holidays
│   │   ├── liff/                    # LINE LIFF Mobile Pages (Connect, Leave, History)
│   │   ├── system-admin/            # Super Admin Control Plane (13+ routes)
│   │   │   ├── companies/           # Multi-tenant management
│   │   │   ├── subscriptions/       # Plan assignments & upgrade approvals
│   │   │   ├── messages/            # Centralized Support Mailbox & AutoSearch
│   │   │   ├── backup/              # Database Backup & S3 Downloads
│   │   │   └── security/            # Active sessions, Audit logs & API keys
│   │   └── api/                     # REST API Endpoints (Health, Backup Downloads)
│   ├── components/                  # UI Components
│   │   ├── admin/                   # Company Admin views, Modals, Tables, Mailbox
│   │   ├── liff/                    # Mobile LIFF views, Leave forms, QR scanners
│   │   ├── system-admin/            # System Admin views, AutoSearch, Backups
│   │   └── ui/                      # Base Design System (Dialogs, Badges, Buttons)
│   ├── features/                    # Feature-based Server Actions & Business Logic
│   │   ├── auth/                    # Authentication, Sessions & RBAC
│   │   ├── company/                 # Tenant provisioning & Admin operations
│   │   ├── employee/                # Employee lifecycle & LINE account linking
│   │   ├── leave/                   # Leave calculation engine, policies, approvals
│   │   ├── messaging/               # Threaded messaging, replies & AutoSearch
│   │   ├── storage/                 # Attachment upload actions & presigned URLs
│   │   └── subscription/            # Plan upgrades, approval actions & trials
│   └── lib/                         # Core Infrastructure & Shared Utilities
│       ├── audit/                   # Audit Logger service
│       ├── backup/                  # BackupService & SQL generator
│       ├── database/                # Prisma client singleton
│       ├── line/                    # LINE Messaging API & Flex templates
│       ├── pdpa/                    # Data anonymization & Consent tracking
│       ├── security/                # Session cryptography & Rate limiters
│       └── storage/                 # S3 storage service & Tenant partitioning
├── storage/                         # Local storage cache (backups, temporary files)
└── tests/                           # Automated Test Suites
    └── unit/                        # 225+ Unit Tests across 27 Test Files
```

---

## 📄 ใบอนุญาต (License)

โครงการนี้อยู่ภายใต้ใบอนุญาตลิขสิทธิ์เฉพาะสำหรับองค์กร (Proprietary / Enterprise SaaS License) — สงวนลิขสิทธิ์ทั้งหมด

---

<p align="center">
  Developed with ❤️ for streamlined Enterprise Workforce & Leave Management via LINE
</p>
