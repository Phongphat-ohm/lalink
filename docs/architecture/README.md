# Architecture Overview

## LALINK - ระบบลางานออนไลน์ Multi-Tenant SaaS ผ่าน LINE LIFF

### 1. High-Level Architecture

- **Single Full-Stack Repository**: Next.js (App Router, Server Actions, Route Handlers)
- **Frontend Clients**:
  - Employee: LINE LIFF (Mobile-First Web App embedded in LINE)
  - Admin / HR: Web Portal (Desktop-Responsive Management Dashboard)
  - System Admin: Platform Management Portal
- **Core Backend**: Next.js Runtime, Server Actions, Route Handlers
- **Database**: PostgreSQL with Prisma ORM
- **Object Storage**: S3-Compatible Storage Abstraction (MinIO / Cloudflare R2 / AWS S3)
- **External Integration**: LINE Login API, LINE Messaging API

### 2. Multi-Tenant Architecture & Isolation

- **Logical Separation**: Shared Database with `companyId` scoping on all queries.
- **Tenant Context**: Resolved strictly on the server-side from authenticated session cookie.
- **Data Access Layer**: All queries must enforce `WHERE companyId = session.companyId`.
