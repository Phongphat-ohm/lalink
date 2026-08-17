# PROMPT: ระบบลางานออนไลน์ Multi-Tenant SaaS ผ่าน LINE LIFF

> **Role & Objective**  
> คุณคือ **Senior Full-Stack Engineer, Software Architect, Security Engineer และ DevOps Engineer**  
> จงพัฒนา **"ระบบลางานออนไลน์"** แบบ **Multi-Tenant SaaS** สำหรับหลายบริษัท โดยพนักงานใช้งานผ่าน **LINE LIFF** และผู้ดูแลบริษัท/HR ใช้งานผ่าน **Web Application**  
> ระบบต้องออกแบบระดับ **Production Ready** ตั้งแต่ต้น โดยให้ความสำคัญกับ Security, Privacy, PDPA, Multi-Tenant Isolation, Maintainability, Scalability, Testing, Documentation และ Deployment

---

## 📋 สารบัญ (Table of Contents)

1. [Technology Stack](#1-technology-stack)
2. [Version Policy](#2-version-policy)
3. [Architecture](#3-architecture)
4. [Multi-Tenant SaaS](#4-multi-tenant-saas)
5. [Tenant Isolation](#5-tenant-isolation)
6. [Database Schema & Models](#6-database)
7. [Company Entity](#7-company)
8. [Employee Entity](#8-employee)
9. [Roles & Permissions](#9-roles)
10. [System Admin Scope](#10-system-admin)
11. [Company Admin & HR Scope](#11-company-admin--hr)
12. [Employee Authentication ผ่าน LINE LIFF](#12-employee-authentication-ผ่าน-line-liff)
13. [First-time Account Linking](#13-first-time-account-linking)
14. [Account Linking Security](#14-account-linking-security)
15. [Admin Authentication](#15-admin-authentication)
16. [Session Security](#16-session-security)
17. [Authorization Pipeline](#17-authorization)
18. [API Security](#18-api-security)
19. [Leave Types](#19-leave-types)
20. [Leave Policy](#20-leave-policy)
21. [Leave Balance & Ledger](#21-leave-balance)
22. [Leave Request](#22-leave-request)
23. [Leave Calculation](#23-leave-calculation)
24. [Employee LIFF UI](#24-employee-liff-ui)
25. [Employee Dashboard](#25-employee-dashboard)
26. [Leave Form](#26-leave-form)
27. [Employee Leave History](#27-employee-leave-history)
28. [Admin Web Application](#28-admin-web-application)
29. [Admin Dashboard](#29-admin-dashboard)
30. [Leave Approval Workflow](#30-leave-approval)
31. [LINE Notification Service](#31-line-notification)
32. [S3 File Upload System](#32-s3-file-upload-system)
33. [Storage Architecture](#33-storage-architecture)
34. [S3 Security](#34-s3-security)
35. [File Organization](#35-file-organization)
36. [Audit Logging](#36-audit-log)
37. [PDPA & Privacy](#37-pdpa--privacy)
38. [Security Hardening](#38-security)
39. [UI/UX Design & Theme](#39-uiux-design)
40. [UI Components](#40-ui-component)
41. [File Structure](#41-file-structure)
42. [File Management](#42-file-management)
43. [Code Maintainability](#43-code-maintainability)
44. [Environment Variables](#44-environment)
45. [Database Migration](#45-database-migration)
46. [Database Seeding](#46-seed)
47. [Error Handling](#47-error-handling)
48. [Logging Strategy](#48-logging)
49. [Performance Optimization](#49-performance)
50. [Scalability Strategy](#50-scalability)
51. [Backup & Disaster Recovery](#51-backup)
52. [Monitoring & Health Check](#52-monitoring)
53. [Docker & Containerization](#53-docker)
54. [Deployment บน Coolify](#54-coolify)
55. [Testing Strategy](#55-testing)
56. [Verification Checklist](#56-ทุกครั้งที่แก้ไขต้องตรวจสอบ)
57. [Build Policy](#57-build)
58. [CI/CD Pipeline](#58-cicd)
59. [Git & Commit Standards](#59-git)
60. [Documentation Standards](#60-documentation)
61. [Development Roadmap (13 Phases)](#61-development-workflow)
62. [Production Mocking Prohibition](#62-ห้ามสร้าง-mock-ที่ใช้ใน-production)
63. [Zero Security Bypass](#63-ห้ามแก้ปัญหาด้วย-security-bypass)
64. [Error Resolution Workflow](#64-error-workflow)
65. [Pre-task Verification](#65-ก่อนเริ่ม-task-ทุกครั้ง)
66. [Post-task Reporting Template](#66-รายงานหลังทำงาน)
67. [Final System Architecture](#67-final-architecture)

---

## 1. Technology Stack

ใช้ Technology และ Package รุ่น **Latest Stable** ที่เป็น Production Ready ณ วันที่เริ่มพัฒนา  
_ห้ามเดา Version และห้ามใช้ Version เก่าโดยไม่มีเหตุผล ก่อนติดตั้ง Package ให้ตรวจสอบ Official Documentation / npm / GitHub Official Repository และตรวจสอบ Compatibility ระหว่าง Package ทั้งหมด_

| Layer                | Technology / Package                                                                                                                                                                                                                                                                   |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**             | • **Node.js**: LTS รุ่นล่าสุดที่เหมาะกับ Production<br>• **Framework**: Next.js (App Router, Stable ล่าสุด)<br>• **Frontend**: React (Stable ล่าสุด)<br>• **Language**: TypeScript (Strict Mode, Stable ล่าสุด)<br>• **Database**: PostgreSQL<br>• **ORM**: Prisma ORM (Stable ล่าสุด) |
| **UI & Styling**     | • **CSS**: Tailwind CSS (Stable ล่าสุด)<br>• **Components**: shadcn/ui (ล่าสุด)<br>• **Icons**: Lucide Icons (ล่าสุด)                                                                                                                                                                  |
| **Validation**       | • **Schema Validation**: Zod (Stable ล่าสุด)                                                                                                                                                                                                                                           |
| **LINE Integration** | • **LIFF**: LINE LIFF SDK ล่าสุด<br>• **Auth**: LINE Login<br>• **Messaging**: LINE Messaging API                                                                                                                                                                                      |
| **Authentication**   | • **Session**: Secure Server-side Session<br>• **Hashing**: Argon2id หรือ bcrypt สำหรับ Password Hashing                                                                                                                                                                               |
| **Testing**          | • Unit Testing<br>• Integration Testing<br>• E2E Testing                                                                                                                                                                                                                               |
| **Code Quality**     | • ESLint<br>• Formatter ที่เหมาะสม (Prettier)<br>• TypeScript Strict Mode                                                                                                                                                                                                              |

> [!IMPORTANT]
>
> - **Package Manager**: ต้องเลือกเพียงตัวเดียวและใช้ Lockfile เพียงชุดเดียว ห้ามใช้ npm / yarn / pnpm / bun ปะปนกัน
> - **Node Version**: ต้องสร้าง `.nvmrc` และกำหนด Node.js Version ที่ใช้ใน Project อย่างชัดเจน

---

## 2. Version Policy

- ทุก Package ต้องใช้ **Latest Stable Version** ณ วันที่เริ่ม Project
- **ห้ามใช้**:
  - ❌ Alpha
  - ❌ Beta
  - ❌ RC (Release Candidate)
  - ❌ Experimental  
    _(เว้นแต่จำเป็นจริงและต้องอธิบายเหตุผลอย่างละเอียด)_
- เมื่อมี Package ใหม่ต้องตรวจสอบ Compatibility กับ Next.js, React, Node.js, Prisma และ Package อื่นก่อนติดตั้งเสมอ
- **ห้ามเพิ่ม Dependency โดยไม่จำเป็น**: หากสามารถใช้ความสามารถของ Next.js, React, Node.js หรือ Web API ได้ ให้พิจารณาใช้ Built-in Feature ก่อน

---

## 3. Architecture

ใช้ **Next.js Full Stack ใน Project เดียว** ไม่ต้องสร้าง Backend Server แยก

```mermaid
flowchart TD
    Client[User / Browser / LINE WebView]
    Cloudflare[Cloudflare / Reverse Proxy - HTTPS]
    NextApp[Next.js Full Stack App]

    subgraph NextServer[Next.js App Runtime]
        Routes[Server Components / Server Actions / Route Handlers]
        BizLogic[Business Logic & Central Services]
        PrismaORM[Prisma ORM Client]
    end

    DB[(PostgreSQL Database)]
    LineAPI[LINE APIs / Messaging / LIFF]
    S3[S3-compatible Object Storage]

    Client -->|HTTPS| Cloudflare
    Cloudflare --> NextApp
    NextApp --> Routes
    Routes --> BizLogic
    BizLogic --> PrismaORM
    PrismaORM --> DB
    BizLogic -->|Notification / Auth| LineAPI
    BizLogic -->|Pre-signed URLs / Assets| S3
```

> [!NOTE]
> ระบบต้องแยก **UI, Business Logic, Database Access, Authentication, Authorization, Storage และ External Services** ออกจากกันอย่างชัดเจน เพื่อให้สามารถพัฒนาต่อและเปลี่ยน Infrastructure ในอนาคตได้ง่าย

---

## 4. Multi-Tenant SaaS

ระบบต้องรองรับหลายบริษัท โดยกำหนดให้ **Company เป็น Tenant หลัก** ข้อมูลของแต่ละบริษัทต้องแยกออกจากกันอย่างเด็ดขาด

```text
Company A
├── Users
├── Employees
├── Departments
├── Positions
├── Leave Types
├── Leave Balances
├── Leave Requests
├── Holidays
├── Attachments
└── Notifications

Company B
├── Users
├── Employees
├── Departments
├── Positions
├── Leave Types
├── Leave Balances
├── Leave Requests
├── Holidays
├── Attachments
└── Notifications
```

> [!CAUTION]
> **Company A ต้องไม่มีทางเข้าถึงข้อมูล Company B** แม้จะพยายามแก้ไข ID, URL Parameter, Request Body หรือพยายามเรียก API โดยตรงก็ตาม

---

## 5. Tenant Isolation

ข้อมูลที่เป็นของบริษัทต้องผูกกับ `companyId` ตามความเหมาะสม ได้แก่:

- `User`, `Employee`, `Department`, `Position`
- `LeaveType`, `LeaveBalance`, `LeaveTransaction`, `LeaveRequest`, `LeaveAttachment`
- `Holiday`, `Notification`, `AuditLog`

### Tenant Isolation Flow

```text
Client Request
  ↓
Server-side Authentication (Identify User Session)
  ↓
Retrieve User & Associated Company
  ↓
Build Server-side Tenant Context
  ↓
Authorization Check (Permissions & Roles)
  ↓
Scoped Database Query (WHERE companyId = context.companyId)
```

> [!IMPORTANT]
>
> - **ห้ามรับ `companyId` จาก Client แล้วเชื่อทันที**
> - ต้องใช้ **Server-side Authentication** เพื่อระบุ Company เสมอ
> - ทุก Database Query ที่เกี่ยวข้องกับ Tenant ต้องมี **Tenant Scope** กำกับอย่างเคร่งครัด

---

## 6. Database

ใช้ **PostgreSQL** เป็น Database หลัก และใช้ **Prisma ORM** สำหรับ Database Access ทั้งหมด _(ห้ามใช้ Database อื่นเป็น Database หลัก)_

### Core Data Models

| Model Name         | คำอธิบายหน้าที่                                   |
| :----------------- | :------------------------------------------------ |
| `Company`          | ข้อมูลบริษัท / Tenant                             |
| `User`             | บัญชีผู้ใช้งานระบบ (Web Admin / HR / Manager)     |
| `Employee`         | ข้อมูลพนักงานและข้อมูลการผูก LINE Account         |
| `Department`       | แผนกในแต่ละบริษัท                                 |
| `Position`         | ตำแหน่งงาน                                        |
| `Role`             | บทบาทผู้ใช้งาน                                    |
| `Permission`       | สิทธิ์การเข้าถึงฟังก์ชัน                          |
| `RolePermission`   | ตารางเชื่อมโยงสิทธิ์กับบทบาท                      |
| `LeaveType`        | ประเภทการลางานของบริษัท                           |
| `LeaveBalance`     | ยอดวันลาคงเหลือประจำปี                            |
| `LeaveTransaction` | สมุดบัญชีบันทึกการเปลี่ยนแปลงวันลา (Audit Ledger) |
| `LeaveRequest`     | รายการคำขอลางาน                                   |
| `LeaveAttachment`  | ข้อมูล Metadata ไฟล์แนบการลา                      |
| `Holiday`          | วันหยุดประจำปีของบริษัท                           |
| `Notification`     | บันทึกประวัติการแจ้งเตือน                         |
| `AuditLog`         | บันทึกความปลอดภัยและการเปลี่ยนแปลงข้อมูล          |
| `Plan`             | แพ็กเกจบริการ SaaS                                |
| `Subscription`     | สถานะการสมัครและรอบชำระเงินของบริษัท              |

_(สามารถเพิ่ม Model ได้เมื่อจำเป็น แต่ต้องอธิบายเหตุผลและผลกระทบก่อน)_

---

## 7. Company

Company ต้องมีข้อมูลพื้นฐานอย่างน้อย:

- `id` (Primary Key)
- `code` (**Unique** - รหัสย่อบริษัท)
- `name` (ชื่อบริษัท)
- `taxId` (เลขประจำตัวผู้เสียภาษี)
- `email`, `phone`, `address`
- `status` (ACTIVE, SUSPENDED, PENDING)
- `createdAt`, `updatedAt`

---

## 8. Employee

Employee ต้องมีข้อมูลอย่างน้อย:

- `id` (Primary Key)
- `companyId` (Foreign Key เชื่อมกับ Company)
- `employeeCode` (รหัสพนักงาน)
- `firstName`, `lastName`
- `dateOfBirth` (วัน/เดือน/ปีเกิด สำหรับ Verify ตอนผูกบัญชี)
- `email`, `phone`
- `departmentId`, `positionId`
- `status` (ACTIVE, PROBATION, RESIGNED)
- `lineUserId` (LINE User ID ที่เชื่อมโยงแล้ว)
- `createdAt`, `updatedAt`

> [!NOTE]
>
> - **Composite Unique**: ต้องสร้าง Unique Constraint `(companyId, employeeCode)` เพราะต่างบริษัทสามารถมีรหัสพนักงานเหมือนกันได้ แต่ภายในบริษัทเดียวกันห้ามซ้ำ
> - **Unique LINE User**: `lineUserId` ต้องไม่สามารถผูกกับพนักงานหลายคนพร้อมกันได้

---

## 9. Roles

ระบบรองรับ Role พื้นฐานอย่างน้อย:

1. `SYSTEM_ADMIN` - ผู้ดูแลระบบส่วนกลางระดับ Platform
2. `COMPANY_ADMIN` - ผู้บริหาร / ผู้ดูแลระบบระดับบริษัท
3. `HR` - เจ้าหน้าที่ฝ่ายบุคคล
4. `MANAGER` - หัวหน้างาน (รองรับ Approval Workflow)
5. `EMPLOYEE` - พนักงานทั่วไป

> [!TIP]
> ออกแบบ Permission เป็น **Central Authorization Layer** ห้ามกระจาย Role/Permission Logic กระจัดกระจายไปทั่ว UI Components

---

## 10. System Admin

System Admin เป็นผู้ดูแล Platform ทั้งหมด โดยมีสิทธิ์เข้าถึง:

- [x] ดูและจัดการบริษัททั้งหมด (สร้าง / แก้ไข / สั่ง Suspend)
- [x] จัดการ Subscription และแพ็กเกจ
- [x] ดูภาพรวมสถิติผู้ใช้งานระดับระบบ
- [x] ตรวจสอบ Security Events และ System Health
- [x] จัดการ Platform Settings ส่วนกลาง

_(เฉพาะ System Admin เท่านั้นที่สามารถเข้าถึงข้อมูลระดับ Platform)_

---

## 11. Company Admin / HR

### สิทธิ์ของ Company Admin:

- จัดการข้อมูลบริษัท, ตั้งค่าระบบ, Leave Policy
- จัดการพนักงาน, แผนก (Departments), ตำแหน่ง (Positions)
- จัดการประเภทการลา (Leave Types) และวันหยุด (Holidays)
- ตรวจสอบใบลา, อนุมัติ / ไม่อนุมัติใบลา, ดูรายงานภาพรวม

### สิทธิ์ของ HR & Manager:

- HR มี Permission ตามที่กำหนดตามโครงสร้าง RBAC
- Manager สามารถอนุมัติใบลาของลูกทีมในสายงานได้ตาม Workflow

---

## 12. Employee Authentication ผ่าน LINE LIFF

พนักงานเข้าใช้งานระบบผ่าน LINE LIFF เป็นช่องทางหลัก

```mermaid
sequenceDiagram
    autonumber
    actor Employee as พนักงาน (LINE)
    participant LIFF as LIFF Frontend
    participant Server as Next.js Server
    participant DB as PostgreSQL

    Employee->>LIFF: เปิดหน้า LIFF App
    LIFF->>Server: ส่ง LINE Access Token / ID Token
    Server->>Server: Verify LINE Token & ดึง LINE User ID
    Server->>DB: ค้นหา Employee จาก lineUserId
    alt พนักงานเคยเชื่อมต่อบัญชีแล้ว
        DB-->>Server: ส่งข้อมูล Employee + Company
        Server-->>LIFF: ออก Server-side Session Cookie
        LIFF-->>Employee: แสดงหน้า Employee Dashboard
    else ยังไม่เคยเชื่อมต่อบัญชี
        Server-->>LIFF: ส่งสถานะ NOT_LINKED
        LIFF-->>Employee: แสดงหน้า "เชื่อมต่อบัญชีพนักงาน"
    end
```

---

## 13. First-time Account Linking

กรณี LINE User ID ยังไม่เคยผูกกับพนักงาน ให้เข้าสู่ Flow การยืนยันตัวตน:

```text
หน้า: "เชื่อมต่อบัญชีพนักงาน" (First-time Account Linking)
  ├── 1. กรอก รหัสบริษัท (Company Code)
  ├── 2. กรอก รหัสพนักงาน (Employee Code)
  └── 3. กรอก วัน/เดือน/ปีเกิด (Date of Birth)
```

### การตรวจสอบข้อมูล (Server-side Validation)

1. ตรวจสอบความถูกต้องร่วมกัน: `Company Code` + `Employee Code` + `Date of Birth`
2. **หากถูกต้อง**: อัปเดต `lineUserId` ลงในตาราง Employee -> สร้าง Session -> นำเข้าสู่ Dashboard
3. **หากไม่ถูกต้อง**: แสดงข้อความกลาง:
   > _"ไม่สามารถเชื่อมต่อบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง"_
   > _(ห้ามระบุเจาะจงว่าช่องใดผิด เพื่อป้องกัน User Enumeration)_

---

## 14. Account Linking Security

ระบบผูกบัญชีต้องมีมาตรการความปลอดภัยเข้มงวด:

- **Rate Limiting**: จำกัดจำนวนครั้งในการส่งคำขอผูกบัญชี
- **Failed Attempt Counter**: นับจำนวนครั้งที่ใส่ข้อมูลผิดพลาด
- **Temporary Lock**: ล็อกการพยายามผูกบัญชีชั่วคราวหากพยายามผิดเกินกำหนด
- **Security Event Logging**: บันทึก Log ทุกครั้งที่มีการพยายามเชื่อมต่อ
- **Bot Protection**: ป้องกันการยิงสคริปต์อัตโนมัติ
- **OTP Ready**: สถาปัตยกรรมต้องรองรับการส่ง SMS/Email OTP ในอนาคต
- **Zero Information Leakage**: ห้ามเปิดเผยข้อมูล Employee ใดๆ หากการยืนยันตัวตนไม่ผ่าน

---

## 15. Admin Authentication

Admin / HR ใช้งานผ่าน Web Application (Route: `/admin/login`)

- **Credentials**: Username / Email + Password
- **Password Security**: Hash ด้วย `Argon2id` หรือ `bcrypt`
- **กฎเหล็กด้าน Password**:
  - ❌ ห้ามเก็บ Plain Text Password
  - ❌ ห้ามบันทึก Password ลง Log
  - ❌ ห้ามส่ง Password หรือ Hash กลับไปยัง Client
- **ฟีเจอร์ที่ต้องรองรับ**:
  - Login / Logout
  - Password Reset Flow
  - Session Expiration & Auto-refresh
  - Brute Force Protection (ล็อกบัญชีเมื่อ Login พลาดหลายครั้ง)
  - รองรับ Two-Factor Authentication (2FA / TOTP) ในอนาคต

---

## 16. Session Security

- ใช้ **Secure Server-side Session** ในการระบุตัวตน
- กำหนดค่า Security Flags สำหรับ Cookie อย่างเข้มงวด:
  - `HttpOnly`: ป้องกันการเข้าถึง Cookie จาก JavaScript (XSS Mitigation)
  - `Secure`: ส่ง Cookie ผ่าน HTTPS เท่านั้น
  - `SameSite=Lax` หรือ `Strict`: ป้องกัน CSRF Attacks
  - `Max-Age` / `Expires`: กำหนดอายุ Session ชัดเจน
- ❌ **ห้ามใช้ LocalStorage เป็นแหล่งหลักในการตัดสินสิทธิ์ Authorization**
- ❌ **ห้ามอนุญาตให้ Client ส่งข้อมูลเหล่านี้มาเพื่อกำหนดสิทธิ์เอง**:
  - `companyId`, `employeeId`, `userId`, `role`, `permissions`

---

## 17. Authorization

ทุก Request บน Server ต้องผ่าน Pipeline ตรวจสอบอย่างเป็นระบบ:

```text
Incoming Request
  ↓
1. Authentication (ตรวจสอบความถูกต้องของ Session)
  ↓
2. Tenant Detection (ระบุ Tenant/Company จาก Session)
  ↓
3. Role Verification (ตรวจสอบ Role ของผู้ใช้)
  ↓
4. Permission Check (ตรวจสอบสิทธิ์การกระทำตาม RBAC)
  ↓
5. Resource Ownership Check (ตรวจสอบความเป็นเจ้าของข้อมูล)
  ↓
6. Execute Operation (ทำคำสั่ง / Query ข้อมูล)
```

### การป้องกันช่องโหว่ความปลอดภัย

- 🛡️ **IDOR** (Insecure Direct Object Reference)
- 🛡️ **Privilege Escalation** (การยกระดับสิทธิ์โดยไม่ได้รับอนุญาต)
- 🛡️ **Cross-Tenant Access** (การข้ามไปอ่าน/เขียนข้อมูลของบริษัทอื่น)
- 🛡️ **Unauthorized Resource Access**

---

## 18. API Security

ทุก API Endpoint (Route Handlers / Server Actions) ต้องมี:

- [x] **Authentication & Authorization Guard**
- [x] **Tenant Scoping** อัตโนมัติจาก Server Session
- [x] **Input Validation** ด้วย Zod Schema
- [x] **Rate Limiting** ป้องกัน DoS และ Brute Force
- [x] **Payload Size Limit** ป้องกัน Resource Exhaustion
- [x] **Secure Error Handling** ไม่เปิดเผย Stack Trace หรือข้อมูลภายใน

> [!WARNING]
> ห้ามเชื่อข้อมูลสำคัญที่ Client ส่งมา เช่น `companyId`, `employeeId`, `userId`, `role`, `permissions`, `leaveBalance`, `approvalStatus` ข้อมูลเหล่านี้ต้องคำนวณและตรวจสอบบน Server เท่านั้น

---

## 19. Leave Types

ระบบต้องรองรับประเภทการลาพื้นฐาน และเปิดให้แต่ละบริษัทสร้างเพิ่มเติมได้เอง:

- ลาป่วย (Sick Leave)
- ลากิจ (Personal Leave)
- ลาพักร้อน (Annual Leave)
- ลาคลอด (Maternity Leave)
- ลาโดยไม่รับค่าจ้าง (Leave Without Pay)
- ประเภทการลาแบบกำหนดเอง (Custom Leave Types)

---

## 20. Leave Policy

แต่ละ Company สามารถกำหนดเงื่อนไขการลาแยกกันได้อย่างอิสระ:

- **Annual Quota**: จำนวนโควตาวันลาต่อปี
- **Allow Half Day**: อนุญาตให้ลาครึ่งวันได้หรือไม่
- **Allow Hourly**: อนุญาตให้ลาเป็นรายชั่วโมงได้หรือไม่
- **Require Attachment**: บังคับแนบเอกสาร (เช่น ใบรับรองแพทย์) เมื่อลาเกินกี่วัน
- **Require Reason**: บังคับระบุเหตุผลหรือไม่
- **Allow Past Date**: อนุญาตให้ยื่นลาย้อนหลังได้หรือไม่
- **Weekend / Holiday Policy**: นับวันหยุดเสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์เป็นวันลาหรือไม่

_(ห้าม Hard-code Leave Policy ลงใน Code)_

---

## 21. Leave Balance & Ledger

ระบบต้องบันทึกยอดคงเหลือและประวัติการเปลี่ยนแปลงด้วยโครงสร้าง Ledger ที่ตรวจสอบได้:

### 1. `LeaveBalance`

เก็บยอดสรุปปัจจุบันของพนักงานในแต่ละประเภทการลาประจำปี

### 2. `LeaveTransaction`

สมุดบัญชีบันทึกทุก Action ของวันลาเพื่อ Audit ย้อนหลัง:

- `CREDIT` (เพิ่มโควตาเริ่มต้น หรือโควตาพิเศษ)
- `DEBIT` (ตัดวันลาเมื่อคำขอได้รับการอนุมัติ)
- `ADJUSTMENT` (HR ปรับยอดเพิ่ม/ลด)
- `REVERSAL` (คืนยอดวันลาเมื่อคำขอยกเลิก)

> [!IMPORTANT]
> ทุก Operation ที่เกี่ยวข้องกับการปรับปรุงยอดวันลา ต้องทำงานภายใต้ **Database Transaction (`prisma.$transaction`)** และมีกลไกป้องกัน **Race Condition** (เช่น Row-level Locking หรือ Optimistic Concurrency Control)

---

## 22. Leave Request

### Entity Schema

- `id` (Primary Key)
- `companyId` (Foreign Key)
- `employeeId` (Foreign Key)
- `leaveTypeId` (Foreign Key)
- `startDate`, `endDate` (ช่วงเวลาที่ขอลา)
- `totalDays` (จำนวนวันลาที่คำนวณได้)
- `reason` (เหตุผลการลา)
- `status`
- `createdAt`, `updatedAt`

### Lifecycle Statuses

```text
[ DRAFT ] ──> [ PENDING ] ──┬──> [ APPROVED ] ──> [ CANCELLED ]
                            ├──> [ REJECTED ]
                            └──> [ WITHDRAWN ]
```

_(ออกแบบ Schema ให้รองรับ Multi-Level Approval ในอนาคต)_

---

## 23. Leave Calculation

ระบบคำนวณวันลาต้องคำนึงถึง:

- วันทำงานปกติของบริษัท
- วันหยุดสุดสัปดาห์ (เสาร์ / อาทิตย์)
- วันหยุดพิเศษและวันหยุดประจำปีของบริษัท (`Holiday`)
- วันหยุดราชการ / นักขัตฤกษ์
- การลาเต็มวัน / ครึ่งวัน (เช้า-บ่าย)
- กฎเฉพาะของแต่ละบริษัท

_(ห้าม Hard-code ว่าวันเสาร์-อาทิตย์เป็นวันหยุดเสมอไป เพราะบางบริษัทมีกะการทำงานต่างกัน)_

---

## 24. Employee LIFF UI

### Routing Structure

- `/liff` - Entry Point & Auth Resolver
- `/liff/connect` - หน้ายืนยันตัวตนเชื่อมต่อบัญชีครั้งแรก
- `/liff/dashboard` - หน้าแรกพนักงาน แสดงยอดวันลาและเมนูด่วน
- `/liff/leave` - หน้าแบบฟอร์มยื่นใบลา
- `/liff/history` - หน้าประวัติการลาและติดตามสถานะ
- `/liff/profile` - หน้าข้อมูลส่วนตัวพนักงาน

### แนวทางการออกแบบ

- **Mobile First**: ออกแบบสำหรับหน้าจอสมาร์ทโฟนโดยเฉพาะ
- **LINE WebView Optimized**: รองรับ Safe Area, Navigation Bar และ In-App Browser ของ LINE
- **Touch-Friendly**: ปุ่มกดและช่อง Input เหมาะกับนิ้วมือและการใช้งานด้วยมือเดียว

---

## 25. Employee Dashboard

### องค์ประกอบบนหน้าจอ

1. **Header**:
   - แสดงข้อความต้อนรับ: `สวัสดี คุณ [ชื่อ-นามสกุล]`
   - ข้อมูลสังกัด: `บริษัท [ชื่อบริษัท]` | `รหัสพนักงาน [Code]`
2. **Leave Balance Summary Cards**:
   - ลาพักร้อนคงเหลือ (คงเหลือ / ทั้งหมด)
   - ลาป่วยคงเหลือ
   - ลากิจคงเหลือ
3. **Action Buttons**:
   - 🔘 **ยื่นใบลา** (Primary Action)
   - 🔘 **ประวัติการลา**
   - 🔘 **โปรไฟล์**

---

## 26. Leave Form

### ฟิลด์ในแบบฟอร์ม

- [ ] เลือกประเภทการลา (Dropdown)
- [ ] วันที่เริ่มต้น - วันที่สิ้นสุด (Date Picker)
- [ ] ตัวเลือกเต็มวัน / ครึ่งวัน (Full Day / Half Day AM-PM)
- [ ] เหตุผลการลา (Textarea)
- [ ] แนบเอกสารหลักฐาน (File Upload: รองรับ PDF, PNG, JPG)

### Client & Server Pre-submit Validation

1. โควตาวันลาคงเหลือเพียงพอหรือไม่
2. วันที่เลือกถูกต้องตามปฏิทินหรือไม่
3. มีการยื่นใบลาซ้อนทับกับช่วงเวลาเดิมหรือไม่ (Overlapping Check)
4. เอกสารแนบถูกต้องตาม Policy หรือไม่
5. ตรงตามเงื่อนไขการยื่นล่วงหน้า/ย้อนหลังของบริษัทหรือไม่

---

## 27. Employee Leave History

### ข้อมูลที่แสดงในรายการ

- ประเภทการลา
- ช่วงวันที่ลา และจำนวนวันรวม
- เหตุผลการลา
- **Badge สถานะ**:
  - 🟡 **รออนุมัติ** (`PENDING`)
  - 🟢 **อนุมัติ** (`APPROVED`)
  - 🔴 **ไม่อนุมัติ** (`REJECTED` พร้อมแสดงเหตุผลที่ไม่อนุมัติ)
  - ⚪ **ยกเลิก** (`CANCELLED` / `WITHDRAWN`)
- ปุ่มกดยกเลิกคำขอ (เฉพาะใบลาที่ยังรออนุมัติ)

---

## 28. Admin Web Application

### Routing Structure

| Route                   | หน้าที่การทำงาน                                    |
| :---------------------- | :------------------------------------------------- |
| `/admin`                | Root Redirect / Authentication Gate                |
| `/admin/login`          | หน้าเข้าสู่ระบบสำหรับ Admin / HR                   |
| `/admin/dashboard`      | หน้าแดชบอร์ดสรุปภาพรวม สถิติ และ Action Items      |
| `/admin/employees`      | จัดการรายชื่อพนักงาน ข้อมูลสังกัด และการ Link LINE |
| `/admin/departments`    | จัดการโครงสร้างแผนก                                |
| `/admin/positions`      | จัดการตำแหน่งงาน                                   |
| `/admin/leave-requests` | จัดการและอนุมัติใบลาของพนักงานทั้งหมด              |
| `/admin/leave-types`    | จัดการประเภทการลาและโควตาประจำปี                   |
| `/admin/holidays`       | กำหนดปฏิทินวันหยุดประจำปีของบริษัท                 |
| `/admin/reports`        | ออกรายงานการลา สถิติ และ Export ข้อมูล             |
| `/admin/settings`       | ตั้งค่าข้อมูลบริษัทและ Leave Policy                |

---

## 29. Admin Dashboard

### Metrics & Widgets

- 👥 จำนวนพนักงานทั้งหมด (Active Employees)
- ⏳ ใบลาที่รอการอนุมัติ (Pending Requests - Action Needed)
- 🏖️ พนักงานที่ลางานวันนี้ (Who's Out Today)
- 📊 สถิติการลาประจำเดือน
- 📈 ประเภทยอดวันลาที่ถูกใช้มากที่สุด
- 📑 ตารางคำขอล่าสุดพร้อมระบบ **Pagination & Filter**

> [!NOTE]
> ข้อมูลรายการพนักงานและใบลาต้องใช้ **Server-side Pagination** เสมอ ห้ามดึงข้อมูลทั้งหมดขึ้นมาพร้อมกัน

---

## 30. Leave Approval

Admin / HR / ผู้มีอำนาจอนุมัติสามารถ:

- เปิดดูรายละเอียดคำขอลางานแบบละเอียด
- ดูข้อมูลพนักงาน แผนก ประวัติการลา และยอดวันลาคงเหลือ
- ตรวจสอบเอกสารแนบผ่าน Secure Signed URL
- ดำเนินการ:
  - ✅ **อนุมัติ (Approve)**: ระบบตัดยอด Balance และส่ง Notification
  - ❌ **ไม่อนุมัติ (Reject)**: **ต้องระบุเหตุผลในการไม่อนุมัติทุกครั้ง**
  - 🚫 **ยกเลิกใบลา (Cancel)**: คืนยอด Balance เข้าระบบ

---

## 31. LINE Notification

แจ้งเตือนเหตุการณ์สำคัญผ่าน LINE Messaging API แบบอัตโนมัติ:

```text
[ พนักงานส่งใบลา ] ──> แจ้งเตือนพนักงาน: "ระบบได้รับใบลาของคุณแล้ว (สถานะ: รออนุมัติ)"
                     ──> แจ้งเตือน HR/หัวหน้างาน: "มีใบลาใหม่รอการตรวจสอบ"

[ ผู้ดูแลอนุมัติ ]    ──> แจ้งเตือนพนักงาน: "ใบลาของคุณได้รับการอนุมัติเรียบร้อยแล้ว"

[ ผู้ดูแลไม่อนุมัติ ] ──> แจ้งเตือนพนักงาน: "ใบลาของคุณไม่ได้รับการอนุมัติ (เหตุผล: ...)"
```

> [!TIP]
> สร้าง **Notification Service** แยกออกจาก Business Logic เป็นอิสระ ห้ามเรียก LINE API ผสมอยู่ใน UI Component

---

## 32. S3 File Upload System

ใช้ **S3-compatible Object Storage** เป็นระบบจัดเก็บไฟล์หลัก (Private Storage)  
รองรับผู้ให้บริการ เช่น Amazon S3, MinIO, Cloudflare R2 หรือ SeaweedFS

> [!CAUTION]
>
> - **ห้ามเก็บไฟล์ Upload ลงใน PostgreSQL โดยตรง** (PostgreSQL เก็บเฉพาะ Metadata)
> - **ห้ามใช้ Public Bucket** ไฟล์พนักงานและใบรับรองแพทย์เป็นข้อมูลส่วนบุคคลอ่อนไหว

### File Metadata Model (`LeaveAttachment` / `FileObject`)

```typescript
interface FileMetadata {
  id: string;
  companyId: string;
  uploadedBy: string;
  originalName: string;
  objectKey: string;
  mimeType: string;
  size: number;
  bucket: string;
  checksum: string;
  createdAt: Date;
}
```

---

## 33. Storage Architecture

สร้าง Storage Abstraction Layer เพื่อลด Dependency กับ Provider:

```typescript
// lib/storage/storage-service.interface.ts
export interface StorageService {
  upload(params: {
    file: Buffer;
    key: string;
    mimeType: string;
  }): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  createSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}
```

---

## 34. S3 Security

การดาวน์โหลดไฟล์ต้องผ่าน Flow การยืนยันสิทธิ์ก่อนสร้าง Temporary Pre-signed URL เสมอ:

```text
User Download Request
  ↓
Server-side Authentication
  ↓
Tenant Context & Permission Check
  ↓
File Ownership Verification (ไฟล์นี้เป็นของ Tenant และ User มีสิทธิ์ดู)
  ↓
Generate Short-lived Pre-signed URL (อายุ 5-15 นาที)
  ↓
Client Downloads File from S3 Directly
```

### การตรวจสอบไฟล์ขาเข้า (Upload Validation)

- ตรวจสอบขนาดไฟล์สูงสุด (เช่น ไม่เกิน 5MB ต่อไฟล์)
- ตรวจสอบ MIME Type และ File Signature (Magic Bytes)
- ตรวจสอบนามสกุลไฟล์ที่อนุญาต (PNG, JPG, JPEG, PDF)
- ห้ามเชื่อถือ Content-Type จาก Client Header เพียงอย่างเดียว

---

## 35. File Organization

กำหนด Object Key ให้แยกสัดส่วนตาม Tenant และ Resource อย่างชัดเจน:

```text
companies/{companyId}/employees/{employeeId}/leave/{leaveRequestId}/{fileId}.{ext}
```

> [!WARNING]
>
> - ห้ามใช้ชื่อไฟล์ดั้งเดิมจาก User เป็น Object Key โดยตรง
> - ห้ามเปิดเผย Internal Storage Path สู่ภายนอก

---

## 36. Audit Log

ระบบต้องบันทึก Audit Log สำหรับ Security Events และ Data Modification สำคัญ:

| Event Type              | ตัวอย่างการทำงาน                                                |
| :---------------------- | :-------------------------------------------------------------- |
| **Authentication**      | `LOGIN`, `LOGIN_FAILED`, `LOGOUT`                               |
| **LINE Integration**    | `LINK_LINE`, `UNLINK_LINE`                                      |
| **Employee Management** | `CREATE_EMPLOYEE`, `UPDATE_EMPLOYEE`, `DELETE_EMPLOYEE`         |
| **Leave Lifecycle**     | `CREATE_LEAVE`, `APPROVE_LEAVE`, `REJECT_LEAVE`, `CANCEL_LEAVE` |
| **File Operations**     | `UPLOAD_ATTACHMENT`, `DOWNLOAD_ATTACHMENT`, `DELETE_ATTACHMENT` |
| **System Settings**     | `CHANGE_PERMISSION`, `CHANGE_COMPANY_SETTING`                   |

> [!CAUTION]
> **ห้ามบันทึกข้อมูลเหล่านี้ลงใน Audit Log**: Passwords, OTP, Access Tokens, Session Tokens, Secrets และข้อมูลสุขภาพหรือข้อมูลส่วนบุคคลที่ไม่จำเป็น

---

## 37. PDPA / Privacy

ระบบต้องออกแบบตามหลัก **Data Protection & PDPA Compliance**:

- **Privacy Policy**: รองรับข้อตกลงและนโยบายความเป็นส่วนตัว
- **Data Minimization**: เก็บเฉพาะข้อมูลที่จำเป็นต่อการจัดการวันลา
- **Access Control & Audit Trail**: ตรวจสอบย้อนหลังได้ว่าใครเข้าถึงข้อมูลพนักงานคนใด
- **Data Retention & Deletion**: รองรับการลบหรือ Anonymize ข้อมูลเมื่อพนักงานลาออกหรือครบกำหนดจัดเก็บ
- **Data Export**: รองรับการส่งออกข้อมูลส่วนบุคคลตามสิทธิ์เจ้าของข้อมูล

---

## 38. Security

### ภัยคุกคามที่ต้องป้องกัน

- 🛡️ **SQL Injection**: ป้องกันด้วย Prisma Parameterized Queries
- 🛡️ **XSS (Cross-Site Scripting)**: Sanitize ข้อมูล และใช้ React Auto-escaping
- 🛡️ **CSRF**: ป้องกันด้วย SameSite Cookies และ Server Actions Token
- 🛡️ **IDOR & Cross-Tenant Leakage**: ตรวจสอบ Tenant Scope ทุก Query
- 🛡️ **Brute Force**: ป้องกันด้วย Rate Limiting & Account Lockout
- 🛡️ **Session Hijacking**: บังคับ HTTPS, Secure & HttpOnly Cookies
- 🛡️ **Malicious File Upload**: ตรวจสอบ File Signature และเก็บใน Private S3

### HTTP Security Headers

```text
Content-Security-Policy
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

_(ต้องทดสอบว่า Security Headers ไม่กระทบการโหลด LIFF SDK ใน LINE WebView)_

---

## 39. UI/UX Design

- **Style**: Modern, Clean, Minimal, Professional, Highly Usable
- **Responsive**: Mobile First สำหรับ LIFF, Desktop Friendly สำหรับ Admin Web
- **Color Palette & Theme**: **Teal / Cyan-Green + White Theme (โทนสีเขียวฟ้าสบายตา สะอาด ทันสมัย และเป็นมิตรต่อสายตา)**

| Semantic         | Color Value / Directive                                | การใช้งาน                                                      |
| :--------------- | :----------------------------------------------------- | :------------------------------------------------------------- |
| **Primary**      | 🟩🟦 **Teal / Cyan-Green** (`#0D9488` / `#0F766E`)     | ปุ่มหลัก (Primary Buttons), Active States, Accents, Highlights |
| **Background**   | ⬜ **White** (`#FFFFFF`)                               | พื้นหลังหลัก คลีน สบายตา                                       |
| **Secondary BG** | ▫️ **Light Slate / Mint Tint** (`#F0FDFA` / `#F8FAFC`) | พื้นหลังการ์ด ตาราง และ Container รอง                          |
| **Success**      | 🟩 **Emerald Green** (`#10B981`)                       | สถานะ "อนุมัติ", การบันทึกสำเร็จ                               |
| **Destructive**  | 🟥 **Rose / Red** (`#EF4444`)                          | สถานะ "ไม่อนุมัติ", ข้อความ Error, ลบข้อมูล                    |
| **Warning**      | 🟨 **Amber** (`#F59E0B`)                               | สถานะ "รออนุมัติ", ข้อความแจ้งเตือน                            |

_(เน้นโทนสีเขียวฟ้าที่ให้ความรู้สึกสบายตา สะอาด เรียบหรู และมืออาชีพ ไม่ใช้สีที่ฉูดฉาดเกินไป และใช้ Design System ชุดเดียวกันทั่วทั้งระบบ)_

---

## 40. UI Component

ใช้ **shadcn/ui** ร่วมกับ Tailwind CSS ในการสร้าง Reusable Component Library:

```text
components/ui/
├── button.tsx       ├── dialog.tsx      ├── badge.tsx
├── input.tsx        ├── drawer.tsx      ├── tabs.tsx
├── select.tsx       ├── sheet.tsx       ├── dropdown-menu.tsx
├── date-picker.tsx  ├── table.tsx       ├── toast.tsx
├── card.tsx         ├── form.tsx        ├── alert.tsx
└── loading-state.tsx / empty-state.tsx / error-state.tsx
```

_(ห้ามสร้าง Component ซ้ำซ้อนที่ทำหน้าที่เหมือนกัน)_

---

## 41. File Structure

```text
project/
├── app/
│   ├── (public)/                     # หน้า Landing / Public Info
│   ├── (auth)/                       # Admin Login / Forgot Password
│   ├── liff/                         # พนักงานใช้งานผ่าน LINE LIFF
│   │   ├── connect/
│   │   ├── dashboard/
│   │   ├── leave/
│   │   ├── history/
│   │   └── profile/
│   ├── admin/                        # Company Admin & HR Portal
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── departments/
│   │   ├── positions/
│   │   ├── leave-requests/
│   │   ├── leave-types/
│   │   ├── holidays/
│   │   ├── reports/
│   │   └── settings/
│   ├── system-admin/                 # Platform Super Admin Portal
│   └── api/                          # Next.js Route Handlers & Webhooks
├── components/
│   ├── ui/                           # Base shadcn/ui components
│   ├── liff/                         # LIFF-specific UI components
│   ├── admin/                        # Admin Web-specific UI components
│   ├── system-admin/                 # System Admin components
│   └── shared/                       # Shared UI components
├── features/                         # Feature-based Business Logic Modules
│   ├── auth/
│   ├── company/
│   ├── employee/
│   ├── leave/
│   ├── notification/
│   ├── storage/
│   └── subscription/
├── lib/                              # Core Utilities, Providers & Configs
│   ├── auth/
│   ├── database/                     # Prisma Client Instance
│   ├── line/                         # LINE LIFF & Messaging API Client
│   ├── security/                     # Rate limiter, Hash, Encryption
│   ├── tenant/                       # Tenant Context Resolver
│   ├── permissions/                  # RBAC Engine
│   ├── storage/                      # S3 Storage Service
│   └── utils/
├── prisma/
│   ├── schema.prisma                 # Database Schema Definition
│   ├── migrations/                   # Migration History
│   └── seed.ts                       # Seeding Script
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                             # Full Technical Documentation
│   ├── architecture/
│   ├── database/
│   ├── security/
│   ├── deployment/
│   └── development/
├── scripts/
├── public/
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
└── README.md
```

---

## 42. File Management

ก่อนสร้างไฟล์ใหม่ ต้องปฏิบัติตามกฎ:

1. ตรวจสอบว่ามีไฟล์หรือโมดูลที่ทำหน้าที่เดียวกันอยู่แล้วหรือไม่
2. นำ Code เดิมกลับมาใช้ซ้ำ (Reuse) เมื่อเหมาะสม
3. แก้ไขเพิ่มเติมในไฟล์เดิมหากเป็นหน้าที่เดียวกัน
4. สร้างไฟล์ใหม่เมื่อมีเหตุผลด้านสถาปัตยกรรมที่ชัดเจนเท่านั้น
5. **ห้ามสร้าง Duplicate Utility, Component หรือ Service ซ้ำซ้อน**
6. เมื่อย้ายหรือลบไฟล์ ต้องอัปเดตและทดสอบ Import และ Dependency ทั้งหมด
7. ห้ามทิ้งไฟล์ทดลอง, ไฟล์ Temporary หรือไฟล์ที่ไม่ได้ใช้งานไว้ใน Project

---

## 43. Code Maintainability

- **TypeScript Strict**: ห้ามใช้ `any` ยกเว้นกรณีจำเป็นอย่างยิ่ง
- **Single Responsibility Principle**: Function และ Class ต้องมีหน้าที่ชัดเจน
- **Separation of Concerns**: Business Logic ต้องแยกออกจาก UI อย่างเด็ดขาด
- **DRY (Don't Repeat Yourself)**: ลด Code ที่ซ้ำซ้อนด้วย Helper/Service ที่ใช้ร่วมกันได้
- **No Hard-coded Rules**:
  - ❌ ไม่ Hard-code Business Rules
  - ❌ ไม่ Hard-code Company ID / Code
  - ❌ ไม่ Hard-code ข้อมูล Employee
  - ❌ ไม่ Hard-code Environment / URLs
  - ❌ ไม่ Hard-code Leave Policies

---

## 44. Environment

สร้างไฟล์ `.env.example` เป็นแม่แบบที่สมบูรณ์  
_(ห้าม Commit ไฟล์ `.env`, `.env.local`, `.env.production` หรือ Production Secrets ลง Git เด็ดขาด)_

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/leave_saas?schema=public"

# App & Authentication
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="your-super-secret-auth-key-at-least-32-chars"

# LINE Integration
LINE_CHANNEL_ID="your-line-channel-id"
LINE_CHANNEL_SECRET="your-line-channel-secret"
LINE_CHANNEL_ACCESS_TOKEN="your-line-messaging-channel-token"
NEXT_PUBLIC_LIFF_ID="your-liff-app-id"

# S3-compatible Object Storage
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_BUCKET="leave-saas-attachments"
S3_ACCESS_KEY_ID="your-s3-access-key"
S3_SECRET_ACCESS_KEY="your-s3-secret-key"
```

---

## 45. Database Migration

ใช้ **Prisma Migration** สำหรับการเปลี่ยนแปลง Database ทั้งหมด  
_(ห้ามแก้ไข Production Database โดยตรงแบบ Manual)_

```text
Development Flow:
Schema Change in schema.prisma ──> npx prisma migrate dev ──> Test & Build

Production Deployment:
npx prisma migrate deploy (ห้ามรัน migrate dev บน Production)
```

---

## 46. Seed

จัดเตรียม Data Seeding Script (`prisma/seed.ts`) สำหรับ Development และ Testing:

- Demo Company (เช่น Demo Enterprise, Sample Corp)
- Demo Admin / HR Accounts
- Demo Employees (พร้อมรหัสและวันเกิดสำหรับทดสอบ Link LINE)
- Demo Leave Types & Quotas
- Demo Company Holidays

> [!CAUTION]
> ข้อมูล Seed ต้องไม่สร้าง Default Password หรือ Secret ที่ไม่ปลอดภัยลงในระบบ Production โดยอัตโนมัติ

---

## 47. Error Handling

- สร้างระบบจัดการ Error กลาง (Global Error Boundary & Centralized API Error Response)
- **ข้อมูลที่ห้ามแสดงให้ User เห็นบนหน้าจอ**:
  - ❌ Stack Trace
  - ❌ SQL Query / Database Internal Error
  - ❌ File System Path
  - ❌ Credentials / Tokens / Secrets
- Developer ต้องสามารถตรวจสอบสาเหตุของ Error จาก Server-side Logs ได้อย่างละเอียด

---

## 48. Logging

แยกหมวดหมู่ Log อย่างชัดเจน:

1. **Application Logs**: ข้อมูลการทำงานทั่วไปของระบบ
2. **Error Logs**: รายละเอียดข้อผิดพลาดและ Stack Trace สำหรับ Developer
3. **Security Logs**: เหตุการณ์ผิดปกติ การ Login พลาด หรือการเข้าถึงที่ต้องสงสัย
4. **Audit Logs**: ประวัติการเปลี่ยนแปลงข้อมูลสำคัญทางธุรกิจ

_(ห้ามบันทึก Password, OTP, Token, Secret หรือข้อมูลส่วนบุคคลเกินความจำเป็นลง Log)_

---

## 49. Performance

- **Database Optimization**: สร้าง Database Indexes ให้ตรงกับเงื่อนไขใน Query ที่พบบ่อย (เช่น `companyId`, `employeeId`, `status`, `createdAt`)
- **Pagination**: ใช้ Server-side Pagination สำหรับตารางข้อมูลทุกแห่ง
- **Prevent N+1 Queries**: ใช้ Prisma `include` หรือ `select` อย่างมีประสิทธิภาพ
- **Lazy Loading & Code Splitting**: ลด Bundle Size ฝั่ง Client เพื่อให้ LIFF โหลดเร็วที่สุด

---

## 50. Scalability

สถาปัตยกรรมต้องรองรับการเติบโตของธุรกิจ:

- รองรับตั้งแต่ **1 Company -> 10 Companies -> 100 Companies -> 1,000+ Companies**
- แยก Tenant ด้วย Logical Isolation บน PostgreSQL โดยไม่ต้องปรับโครงสร้างหลัก
- Stateless Server Architecture เพื่อให้พร้อม Scale แบบ Horizontal Container ได้ตลอดเวลา

---

## 51. Backup

- กำหนดกลยุทธ์การสำรองข้อมูล Database และ S3:
  - **Daily Backup**: สำรองข้อมูลประจำวัน
  - **Weekly Backup & Retention Policy**: เก็บข้อมูลตามรอบระยะเวลา
  - **Off-site Backup**: สำรองข้อมูลไปยัง Storage ต่าง Zone/Provider
- จัดทำคู่มือและขั้นตอนการกู้คืนข้อมูล (**Restore Procedure Documentation**) ที่ทดสอบแล้วว่าใช้งานได้จริง

---

## 52. Monitoring

- สร้าง Endpoint `/api/health` สำหรับตรวจสอบสถานะระบบ (Database Connectivity, Storage, App Uptime)
- ติดตั้ง Logging และ Error Tracking ระบบ
- Monitoring ต้องไม่เปิดเผย Sensitive Data สู่สาธารณะ

---

## 53. Docker

สร้าง Production `Dockerfile` แบบ **Multi-stage Build** เพื่อให้ Image มีขนาดเล็กและปลอดภัย:

1. **Dependencies Stage**: ติดตั้งเฉพาะ Package ที่จำเป็น
2. **Builder Stage**: Compile TypeScript และรัน Next.js Standalone Build
3. **Runner Stage**: ใช้งาน Alpine/Distroless Image และรันด้วย **Non-root User**

---

## 54. Coolify

ระบบต้องพร้อมสำหรับการ Deploy บน **Coolify / Self-hosted PaaS**:

- ระบุ Build Command: `npm run build`
- ระบุ Start Command: `npm run start` หรือ `node server.js` (Standalone Mode)
- รองรับการใส่ Environment Variables ผ่าน Dashboard
- รองรับการรัน `prisma migrate deploy` อัตโนมัติก่อน Start Server
- รองรับ Health Check URL `/api/health`
- รองรับ Reverse Proxy, Domain Mapping และ SSL/HTTPS อัตโนมัติ

---

## 55. Testing

ต้องมี Automated Tests ครอบคลุมฟังก์ชันสำคัญ:

```text
tests/
├── auth/
│   ├── valid-login.test.ts
│   ├── invalid-credentials.test.ts
│   ├── lockout-after-failed-attempts.test.ts
│   └── expired-session.test.ts
├── account-linking/
│   ├── valid-first-time-linking.test.ts
│   ├── invalid-dob-or-code.test.ts
│   ├── prevent-cross-company-linking.test.ts
│   └── rate-limit-linking.test.ts
├── tenant-isolation/
│   ├── query-scoping-company-a-pass.test.ts
│   └── query-scoping-cross-company-deny.test.ts
├── leave/
│   ├── valid-leave-deduction.test.ts
│   ├── insufficient-balance-rejected.test.ts
│   ├── overlapping-date-rejected.test.ts
│   └── concurrency-balance-lock.test.ts
└── storage/
    ├── unauthorized-file-access-denied.test.ts
    └── mime-type-validation.test.ts
```

---

## 56. ทุกครั้งที่แก้ไขต้องตรวจสอบ

> [!IMPORTANT]
> **นี่เป็นกฎบังคับที่ต้องทำทุกครั้ง** เมื่อมีการเพิ่ม Feature, แก้ Bug, แก้ Database, แก้ Auth, แก้ UI/API หรือ Config

```text
ลำดับขั้นตอนการตรวจสอบคุณภาพ (Quality Gate):
1. Format Source Code (Prettier / Formatter)
2. Run Linter (ESLint)
3. Run TypeScript Type Check (tsc --noEmit)
4. Run Unit Tests & Integration Tests
5. Validate Prisma Schema & Generate Client
6. Run Production Build (npm run build)
```

**เกณฑ์การผ่านงาน:**

- `Lint: PASS`
- `Type Check: PASS`
- `Tests: PASS`
- `Build: PASS`

_(ห้ามถือว่างานเสร็จสิ้นหากยังมีข้อผิดพลาดในขั้นตอนเหล่านี้)_

---

## 57. Build

- ตรวจสอบความถูกต้องด้วยคำสั่ง:
  ```bash
  npm run build
  ```
- ต้องแก้ไข Build Errors และ Type Errors ทั้งหมดก่อนส่งมอบงาน ห้ามเลื่อนการ Build ไปทำภายหลัง

---

## 58. CI/CD

วางโครงสร้าง CI/CD Pipeline ให้ตรวจสอบอัตโนมัติในทุก Pull Request:

```mermaid
flowchart LR
    A[Code Push] --> B[Install Dependencies]
    B --> C[Lint Check]
    C --> D[Type Check]
    D --> E[Run Tests]
    E --> F[Production Build]
    F --> G[Deploy to Staging/Production]
```

_(หากขั้นตอนใดไม่ผ่าน (FAIL) ให้หยุด Pipeline ทันที)_

---

## 59. Git

- กำหนดค่า `.gitignore` ให้ครอบคลุม:
  `node_modules`, `.next`, `.env*`, `coverage`, `logs`, `uploads`, `build output`
- **ห้าม Commit**: Secret, Database Dump, ไฟล์ Upload ของ User หรือ Temporary Files
- **รูปแบบ Commit Message** ตาม Semantic Commit Standards:
  - `feat: add employee leave request form`
  - `fix: prevent cross-tenant leave access`
  - `security: add account linking rate limiting`
  - `test: add tenant isolation tests for leave balance`

---

## 60. Documentation

จัดทำ Documentation ครบถ้วนใน Folder `docs/` และ `README.md`:

- **README.md**: ภาพรวมโปรเจกต์, Prerequisites, การติดตั้ง, การตั้งค่า Environment, การรัน Database Migration, คำสั่ง Development/Testing/Build
- **Architecture Docs**: โครงสร้างระบบ, Multi-tenant Isolation, S3 File Storage
- **Database Docs**: ER Diagram, คำอธิบาย Entity, Data Dictionary
- **Security & Privacy Docs**: แนวทางความปลอดภัย, RBAC, PDPA Implementation
- **Deployment Docs**: คู่มือการ Deploy บน Coolify และ Docker

---

## 61. Development Workflow

ห้ามทำทุกอย่างพร้อมกันในคราวเดียว **ให้พัฒนาทีละ Phase ตาม Roadmap 13 ขั้นตอน**:

```text
Phase 1:  Project Foundation (Next.js, TypeScript, Tailwind, shadcn/ui, Prisma Setup)
Phase 2:  Database Design (Schema, Migrations, Constraints, Seed Data)
Phase 3:  Admin Authentication & RBAC (Session, Login, Roles, Tenant Context)
Phase 4:  Multi-Tenant Security Hardening (Isolation Engine, IDOR Protection, Security Tests)
Phase 5:  LINE LIFF Foundation (LIFF Init, Token Verify, First-time Linking, Session)
Phase 6:  Employee LIFF System (Dashboard, Leave Form, Leave History, Profile)
Phase 7:  Admin Web Portal (Dashboard, Employees, Departments, Leave Approval Workflow)
Phase 8:  S3 File Storage System (Upload Abstraction, Pre-signed URLs, Private Buckets)
Phase 9:  LINE Notification Service (Messaging Webhook, Automated Status Alerts)
Phase 10: Reports & Analytics (Leave Statistics, Audit Logs, Data Export)
Phase 11: Security Hardening & PDPA (Rate Limiting, Security Headers, Privacy Rules)
Phase 12: Comprehensive Automated Testing (Unit, Integration, E2E & Concurrency Tests)
Phase 13: Production Readiness & Deployment (Docker, Coolify Setup, Backups, Monitoring)
```

> [!TIP]
> **เมื่อจบแต่ละ Phase ต้องรัน Quality Gate (Lint -> Type Check -> Test -> Build) และ Review ก่อนเริ่ม Phase ถัดไปเสมอ**

---

## 62. ห้ามสร้าง Mock ที่ใช้ใน Production

- หากจำเป็นต้องใช้ Mock Data ให้แยกไฟล์ไว้ในหมวดหมู่ `tests/mocks/` หรือระบุให้ชัดเจน
- Mock ต้องใช้เฉพาะในสภาพแวดล้อม **Development / Testing** เท่านั้น
- **ห้ามปล่อยให้ Mock ถูกเรียกใช้งานบน Production เด็ดขาด**

---

## 63. ห้ามแก้ปัญหาด้วย Security Bypass

- ❌ ห้าม Disable Authentication ชั่วคราวเพื่อความสะดวก
- ❌ ห้าม Disable Authorization หรือข้ามขั้นตอนการเช็คสิทธิ์
- ❌ ห้าม Skip Tenant Check หรือปิดเงื่อนไข `companyId`
- ❌ ห้าม Disable Validation หรือใช้ Type `any` หลบ Error
- ❌ ห้าม Hard-code User หรือ Company สำหรับ Bypass

_(เมื่อพบปัญหาความปลอดภัย ให้แก้ไขที่ **Root Cause** เสมอ)_

---

## 64. Error Workflow

เมื่อเกิดข้อผิดพลาดในการพัฒนาหรือทดสอบ ให้ปฏิบัติตามวงจร:

```text
พบข้อผิดพลาด (Error)
  ↓
จำลองปัญหา (Reproduce)
  ↓
วิเคราะห์หาสาเหตุที่แท้จริง (Root Cause Analysis)
  ↓
แก้ไขปัญหาที่ต้นเหตุ (Fix)
  ↓
เขียน Automated Regression Test ป้องกันการเกิดซ้ำ
  ↓
รัน Format ──> Lint ──> Type Check ──> Test ──> Build
```

---

## 65. ก่อนเริ่ม Task ทุกครั้ง

ตรวจสอบความพร้อมก่อนเริ่มลงมือเขียนโค้ด:

1. สำรวจโครงสร้างโปรเจกต์ (Project Structure)
2. ตรวจสอบโค้ดที่มีอยู่เดิมเพื่อนำมาใช้งานต่อ (Existing Code Reuse)
3. ตรวจสอบ Dependencies และ Package Compatibility
4. ตรวจสอบ Database Schema และ Migration ปัจจุบัน
5. ตรวจสอบเอกสารและ Test Suites ที่เกี่ยวข้อง
6. ตรวจสอบ Environment Variables ที่จำเป็น

_(ห้ามสร้างไฟล์หรือโมดูลใหม่ทับของเดิมโดยไม่ตรวจสอบ)_

---

## 66. รายงานหลังทำงาน

หลังจบแต่ละ Task ต้องสรุปรายงานผลในรูปแบบมาตรฐาน:

```markdown
## Completed

- รายการสิ่งที่ได้ทำเสร็จสิ้น
- Files ที่เพิ่ม / แก้ไข
- การเปลี่ยนแปลงใน Database (Migrations / Seeds)
- การปรับปรุงด้าน Security
- Tests ที่เพิ่มและผลการทดสอบ

## Validation

- Lint: PASS / FAIL
- Type Check: PASS / FAIL
- Tests: PASS / FAIL
- Prisma Validate: PASS / FAIL
- Build: PASS / FAIL

## Key Files

- รายชื่อไฟล์สำคัญที่มีการแก้ไขหรือสร้างใหม่

## Next Step

- คำแนะนำขั้นตอนและ Phase ถัดไปที่ต้องดำเนินการ
```

_(หาก Test หรือ Build มีข้อผิดพลาด ห้ามรายงานว่างานเสร็จสมบูรณ์)_

---

## 67. Final Architecture

```text
LEAVE MANAGEMENT MULTI-TENANT SaaS
├── System Super Admin (Platform Oversight)
│   ├── Companies Management
│   ├── Subscriptions & Billing
│   ├── Security Audit & Events
│   └── System Health & Monitoring
│
├── Company A (Tenant A)
│   ├── Admin Web Portal (Company Settings, Policies, Reports)
│   ├── HR Management (Employees, Departments, Positions)
│   └── Employees
│       └── LINE LIFF (Leave Request, Balances, History)
│
├── Company B (Tenant B)
│   ├── Admin Web Portal
│   ├── HR Management
│   └── Employees
│       └── LINE LIFF
│
├── PostgreSQL + Prisma ORM (Tenant-Isolated Database)
├── S3-compatible Object Storage (Encrypted Private Files)
└── LINE Messaging API & LIFF SDK (Real-time Alerts)
```

---

> [!IMPORTANT]
>
> ### 🌟 กฎเหล็กสำคัญที่สุด (The Golden Rule)
>
> **"สร้างระบบที่ไม่ได้เพียงแค่ทำงานได้ แต่ต้องปลอดภัยสูงสุด ดูแลรักษาง่าย ทดสอบได้แบบอัตโนมัติ Deploy ได้อย่างไร้รอยต่อ และพร้อมให้ Developer คนอื่นเข้ามาพัฒนาต่อได้อย่างราบรื่น"**
>
> ```text
> ทุกครั้งที่แก้ไข:
> FORMAT  ──>  TYPE CHECK  ──>  TEST  ──>  BUILD  ──>  REVIEW
> (ห้ามข้ามขั้นตอนโดยไม่มีเหตุผล)
> ```
