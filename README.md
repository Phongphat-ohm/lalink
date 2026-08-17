# 🌿 LALINK (ลาลิ้งค์) — ระบบบริหารจัดการวันลาผ่าน LINE สำหรับองค์กรยุคใหม่

<p align="center">
  <img src="public/logo.png" alt="LALINK Logo" width="120" />
</p>

<p align="center">
  <b>Enterprise Multi-Tenant Leave Management System seamlessly integrated with LINE LIFF & LINE Messaging API</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/LINE_LIFF-v2.30-06C755?style=flat-square&logo=line" alt="LINE LIFF" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-PostgreSQL-3982CE?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Tests-111%20Passed-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/PDPA-Compliant-emerald?style=flat-square" alt="PDPA" />
</p>

---

## 📌 สารบัญ (Table of Contents)

1. [เกี่ยวกับโครงการ (About Project)](#-เกี่ยวกับโครงการ-about-project)
2. [ฟีเจอร์เด่น (Key Features)](#-ฟีเจอร์เด่น-key-features)
   - [สำหรับพนักงาน (LINE LIFF Mobile Experience)](#1-สำหรับพนักงาน-line-liff-mobile-experience)
   - [สำหรับฝ่ายบุคคลและผู้บริหาร (HR & Company Admin Portal)](#2-สำหรับฝ่ายบุคคลและผู้บริหาร-hr--company-admin-portal)
   - [สำหรับผู้ดูแลระบบส่วนกลาง (System Administrator)](#3-สำหรับผู้ดูแลระบบส่วนกลาง-system-administrator)
3. [สถาปัตยกรรมและเทคโนโลยี (Architecture & Tech Stack)](#-สถาปัตยกรรมและเทคโนโลยี-architecture--tech-stack)
4. [ความปลอดภัยและ PDPA (Security & Compliance)](#-ความปลอดภัยและ-pdpa-security--compliance)
5. [การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)](#-การติดตั้งและเริ่มต้นใช้งาน-installation--setup)
6. [การตั้งค่า Environment Variables](#-การตั้งค่า-environment-variables)
7. [คำสั่งที่ใช้บ่อย (Useful Commands)](#-คำสั่งที่ใช้บ่อย-useful-commands)
8. [โครงสร้างไดเรกทอรี (Project Structure)](#-โครงสร้างไดเรกทอรี-project-structure)

---

## 📖 เกี่ยวกับโครงการ (About Project)

**LALINK** คือแพลตฟอร์มบริหารจัดการวันลาและสิทธิ์ประโยชน์พนักงานแบบ **Multi-Tenant** ระดับองค์กร ที่ผสานการทำงานเข้ากับ **LINE OA** และ **LINE Front-end Framework (LIFF)** อย่างสมบูรณ์แบบ ช่วยให้พนักงานสามารถยื่นใบลา ตรวจสอบสิทธิ์ และรับการแจ้งเตือนผลการอนุมัติได้แบบ Real-time ผ่านแอปพลิเคชัน LINE บนมือถือ พร้อมระบบ Portal สำหรับฝ่ายบุคคล (HR) และผู้บริหารที่มีการแยกข้อมูลของแต่ละบริษัทออกจากกันอย่างเด็ดขาด (Strict Tenant Isolation)

---

## ✨ ฟีเจอร์เด่น (Key Features)

### 1. สำหรับพนักงาน (LINE LIFF Mobile Experience)

- 📲 **เชื่อมต่อบัญชีสะดวกรวดเร็ว (Seamless Account Linking)**:
  - สแกน QR Code บริษัทผ่านกล้องของ LINE ด้วย `liff.scanCodeV2()` หรือเปิดผ่าน Direct Web Link
  - ตรวจสอบชื่อบริษัทและยืนยันข้อมูลก่อนผูกบัญชีด้วยรหัสพนักงานและวันเกิด (รองรับทั้ง ค.ศ. และ พ.ศ.)
- 📝 **ยื่นใบลาง่ายในไม่กี่วินาที (Leave Request Submission)**:
  - รองรับการลาเต็มวัน, ครึ่งวัน (เช้า/บ่าย), หรือลารายชั่วโมง
  - แนบไฟล์หลักฐาน (เช่น ใบรับรองแพทย์) จัดเก็บเข้าระบบคลาวด์ที่ปลอดภัย
- 📊 **แดชบอร์ดแสดงโควตาและประวัติ (Balance & History)**:
  - ตรวจสอบวันลาคงเหลือแบบเรียลไทม์ (ลาพักร้อน, ลากิจ, ลาป่วย ฯลฯ)
  - ปฏิทินแสดงวันหยุดประจำปีและวันลาของตนเอง
- 🔔 **LINE Push Notifications (Flex Message)**:
  - รับข้อความแจ้งเตือนสถานะทันทีเมื่อคำขอลาได้รับการอนุมัติ ปฏิเสธ หรือมีการยกเลิกคำขอ

### 2. สำหรับฝ่ายบุคคลและผู้บริหาร (HR & Company Admin Portal)

- 📈 **แดชบอร์ดภาพรวมองค์กร (HR Analytics Dashboard)**:
  - สรุปสถิติการลาประจำวัน/เดือน อัตราการลาจำแนกตามแผนก และคำขอที่รอการพิจารณา
- 📅 **ปฏิทินวันลาและวันหยุดบริษัท (Company Calendar & Holiday Planner)**:
  - จัดการวันหยุดนักขัตฤกษ์และวันหยุดพิเศษประจำปี
  - ดูภาพรวมตารางการลาของพนักงานทั้งองค์กรแบบ Gantt / Calendar View
- 👥 **จัดการโครงสร้างองค์กรและพนักงาน (Organization & Employees)**:
  - กำหนดสาขา (Branches), แผนก (Departments), และตำแหน่ง (Positions)
  - นำเข้า/ส่งออกข้อมูลพนักงาน (CSV / Excel) และจัดการสิทธิ์ผู้ใช้งาน (RBAC)
  - ตรวจสอบสถานะการเชื่อมต่อ LINE ของพนักงานแต่ละคน
- ⚙️ **กำหนดนโยบายวันลา (Leave Policies & Accrual Rules)**:
  - กำหนดสิทธิ์วันลาตามอายุงาน การปัดเศษวันลา และการยกยอดวันลาข้ามปี
- 🖨️ **ระบบ Company QR Code อัจฉริยะ**:
  - สร้าง QR Code ประจำบริษัททั้งแบบ **Plain Text** และ **Web URL**
  - ดาวน์โหลดการ์ดความละเอียดสูง (PNG 800x1050px) และพิมพ์โปสเตอร์ประกาศขนาด A4 ได้ทันที
- 📑 **รายงานและการตรวจสอบ (Reports & Audit Trail)**:
  - ส่งออกรายงานการลาในรูปแบบ CSV
  - บันทึกประวัติการกระทำทั้งหมดในระบบ (Audit Logging) ย้อนหลัง

### 3. สำหรับผู้ดูแลระบบส่วนกลาง (System Administrator)

- 🏢 **ระบบจัดการบริษัท (Multi-Company Management)**:
  - สร้างและอนุมัติบริษัทใหม่ พร้อมระบบ Generate รหัสบริษัทอัตโนมัติ (เช่น `COM-XXXXXX`)
  - จัดการสถานะการใช้งาน (Active / Suspended)
- 🔒 **Security Center & Global Audit Trail**:
  - ตรวจสอบประวัติการล็อกอิน ตรวจจับกิจกรรมที่น่าสงสัย และจัดการ Active Sessions
  - จัดการ API Keys สำหรับการเชื่อมต่อภายนอก
- 💾 **System Health & Storage Management**:
  - ตรวจสอบสถานะ Database, การใช้งาน Storage (S3 / Cloudflare R2), และระบบสำรองข้อมูล (Backup & Restore)

---

## 🏗️ สถาปัตยกรรมและเทคโนโลยี (Architecture & Tech Stack)

```mermaid
graph TD
    subgraph Client Layer
        A[LINE App / LIFF on Mobile]
        B[Web Browser / HR Admin]
        C[Web Browser / Super Admin]
    end

    subgraph Application Layer [Next.js App Router]
        D[Next.js Server Actions & API Routes]
        E[Scoped Data Access Layer - Tenant Context]
        F[LINE Messaging & Flex Template Engine]
        G[RBAC & Permissions Guard]
    end

    subgraph Data & Storage Layer
        H[(PostgreSQL + Prisma ORM)]
        I[Cloudflare R2 / AWS S3 Storage]
        J[LINE Platform API]
    end

    A -->|LIFF SDK v2.30| D
    B -->|Admin Session| D
    C -->|Super Admin Session| D
    D --> E
    D --> F
    D --> G
    E --> H
    D --> I
    F --> J
```

- **Frontend & Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) + Shadcn/ui Primitives
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **LINE Integration**: [@line/liff (v2.30+)](https://developers.line.biz/en/docs/liff/) + LINE Messaging API
- **Testing**: [Vitest](https://vitest.dev/) (111+ Unit & Integration Tests)
- **Object Storage**: AWS S3 Compatible Storage / [Cloudflare R2](https://www.cloudflare.com/products/r2/)

---

## 🛡️ ความปลอดภัยและ PDPA (Security & Compliance)

- **Strict Tenant Isolation**: แยกข้อมูลของแต่ละบริษัทอย่างเคร่งครัดผ่าน Tenant Context และ Scoped DAL ป้องกัน Data Leakage ข้ามบริษัท
- **PDPA Compliance**:
  - ระบบยินยอมรับเงื่อนไขการประมวลผลข้อมูลส่วนบุคคล (Consent Collection)
  - ระบบลบและทำลายข้อมูลอัตลักษณ์ (Data Anonymization / Right to Erasure) สำหรับพนักงานที่ลาออก
- **HTTP Security Headers & CSP**:
  - ตั้งค่า `Content-Security-Policy` ที่รัดกุม รองรับการโหลด Subwindows และ Endpoints ของ LINE
  - กำหนด `Permissions-Policy: camera=*` รองรับการเปิดกล้องสแกน QR ผ่าน WebRTC
  - ป้องกัน Clickjacking ด้วย `frame-ancestors` และบังคับใช้ HTTPS (`Strict-Transport-Security`)
- **Rate Limiting**: ระบบป้องกันการ Brute-force รหัสผ่านและการโจมตีแบบ DDoS

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

### ข้อกำหนดเบื้องต้น (Prerequisites)

- [Node.js](https://nodejs.org/) version 20.x หรือสูงกว่า
- [PostgreSQL](https://www.postgresql.org/) Database
- บัญชี [LINE Developers](https://developers.line.biz/) (สร้าง Provider, LINE Messaging API Channel และ LIFF App)

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
   npx prisma db push
   npx prisma generate
   ```

5. **รัน Seed ข้อมูลเริ่มต้น (Optional)**:

   ```bash
   npm run seed
   ```

6. **เริ่มต้นเซิร์ฟเวอร์สำหรับ Development**:
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔐 การตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน Root Directory และกำหนดค่าตัวแปรดังนี้:

```env
# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_URL="postgresql://username:password@localhost:5432/lalink_db?schema=public"

# ==========================================
# AUTHENTICATION & SECURITY
# ==========================================
AUTH_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# ==========================================
# LINE LIFF & MESSAGING API
# ==========================================
NEXT_PUBLIC_LIFF_ID="2007000000-xxxxxxx"
LINE_CHANNEL_ID="2007000000"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="your-line-long-lived-channel-access-token"

# ==========================================
# OBJECT STORAGE (S3 / CLOUDFLARE R2)
# ==========================================
STORAGE_PROVIDER="r2" # or "s3" / "local"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="lalink-attachments"
R2_PUBLIC_URL="https://attachments.yourdomain.com"
```

---

## 💻 คำสั่งที่ใช้บ่อย (Useful Commands)

| คำสั่ง (Command)     | คำอธิบาย (Description)                        |
| :------------------- | :-------------------------------------------- |
| `npm run dev`        | สตาร์ท Development Server ด้วย Turbopack      |
| `npm run build`      | คอมไพล์โปรเจกต์สำหรับ Production              |
| `npm run start`      | รันเซิร์ฟเวอร์ Production                     |
| `npm run test`       | รัน Unit & Integration Tests ทั้งหมด (Vitest) |
| `npm run lint`       | ตรวจสอบ Code Quality ด้วย ESLint              |
| `npm run format`     | จัดฟอร์แมตโค้ดด้วย Prettier                   |
| `npm run type-check` | ตรวจสอบ TypeScript Types (`tsc --noEmit`)     |
| `npx prisma studio`  | เปิด GUI สำหรับดูและแก้ไขข้อมูลในฐานข้อมูล    |

---

## 📁 โครงสร้างไดเรกทอรี (Project Structure)

```text
lalink/
├── prisma/                    # Prisma schema & Database migration scripts
│   └── schema.prisma
├── public/                    # Static assets (Logos, Icons, Brand assets)
├── src/
│   ├── app/                   # Next.js App Router Pages
│   │   ├── (auth)/            # Login & Registration views
│   │   ├── admin/             # HR / Company Admin Portal pages
│   │   ├── liff/              # LINE LIFF Mobile pages (Connect, Leave, History)
│   │   ├── system-admin/      # Super Admin Platform Management pages
│   │   └── api/               # API Routes (Health checks, Webhooks)
│   ├── components/            # Reusable UI & Business components
│   │   ├── admin/             # Admin portal components (Modals, Tables, QR)
│   │   ├── liff/              # LIFF layout, calendars, cards, and providers
│   │   ├── system-admin/      # System Admin components
│   │   └── ui/                # Base UI components (Buttons, Dialogs, Inputs)
│   ├── features/              # Modular Business Logic (Actions, Schemas, DAL)
│   │   ├── auth/              # Authentication & Session logic
│   │   ├── company/           # Company registration, code generator, settings
│   │   ├── employee/          # Employee management & LINE account linking
│   │   ├── leave/             # Leave requests, balance, calculations, approvals
│   │   ├── notification/      # Notifications & Announcements
│   │   ├── organization/      # Branches, Departments, Positions
│   │   └── report/            # CSV exports & Audit reporting
│   └── lib/                   # Core Infrastructure & Libraries
│       ├── audit/             # Audit Logging service
│       ├── database/          # Prisma database client instance
│       ├── line/              # LINE Messaging, Flex Templates, Token verification
│       ├── pdpa/              # Data minimization & Anonymization
│       ├── permissions/       # Role-Based Access Control (RBAC)
│       ├── security/          # Password hashing, Rate limiting
│       └── tenant/            # Tenant Context & Scoped DAL
└── tests/                     # Automated Test Suites (Vitest)
    └── unit/                  # 111+ Unit & Integration Tests
```

---

## 📄 ใบอนุญาต (License)

โครงการนี้อยู่ภายใต้ใบอนุญาตลิขสิทธิ์เฉพาะสำหรับองค์กร (Proprietary / Enterprise License) — สงวนลิขสิทธิ์ทั้งหมด

---

<p align="center">
  Developed with ❤️ for streamlined HR Leave Management via LINE
</p>
