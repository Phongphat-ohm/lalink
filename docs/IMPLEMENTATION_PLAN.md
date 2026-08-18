# LALINK — Implementation Plan (PHASE 0 Audit Result)

> Generated: 2026-08-18
> Audit Scope: Full codebase — Prisma Schema, Auth, RBAC, Tenant Isolation, Leave System, LINE/S3/Notification, Tests, Docker, Environment

---

## Current Architecture

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript Strict
- **Database**: PostgreSQL + Prisma ORM v7
- **Auth**: JWT Session Cookies (HS256, HttpOnly, Secure, 7-day expiry) via `jose`
- **Password**: bcryptjs (10 salt rounds)
- **LINE**: LIFF SDK v2.30 + LINE Messaging API (Flex Messages)
- **Storage**: S3-compatible (AWS SDK v3) with Pre-signed URLs
- **UI**: Tailwind CSS v4 + shadcn/ui + Lucide Icons
- **Testing**: Vitest 4.x (16 test files in `tests/unit/`)
- **Validation**: Zod v4
- **Security**: In-memory Rate Limiter, Audit Logger with Sanitization, PDPA Anonymization

---

## Existing Features

### Employee (LINE LIFF)
- Account Linking (QR Scan + Employee Code + DOB + PDPA Consent)
- Dashboard (Leave Balance Summary, Calendar, Recent Requests)
- Leave Request Submission (Type, Dates, Half-Day, Reason, Attachment, Balance Check, Overlap Check)
- Leave History (List, Detail Modal, Cancel Pending)
- Profile View + Logout
- LINE Flex Message Notifications (Submit/Approve/Reject/Cancel)
- Auto-login with Loop Protection

### Company Admin / HR (Web Portal)
- Login with Brute-force Protection
- Dashboard (Metrics: Active Employees, Pending Requests, On Leave Today)
- Employee CRUD (with department/position assignment)
- Department & Position Management
- Branch Management
- Leave Request Approval/Rejection (with Balance Adjustment + Audit)
- Leave Type Policy Configuration
- Holiday Management
- Calendar View (All Employees + Department Filter)
- Leave Balance Overview + Manual Adjustment
- LINE Account Status View
- Announcement Management (Target: All/Branch/Department)
- Audit Trail (Last 50 entries)
- Company Settings

### System Admin (Platform Control)
- Company/Tenant CRUD (Create with Auto-code + Default Config)
- Suspend/Activate Tenants
- User Management (Cross-tenant, Password Reset)
- Employee Cross-tenant View
- Session Management (Force Logout)
- Security Center (Events, Severity, Failed Logins)
- Platform Audit Logs
- System Health (Real-time 6-service Monitoring with Latency)
- Manual Database Backup (Simulated)
- API Key CRUD (SHA256 Hash, One-time Display)
- Change Password (Self-service)

### Infrastructure
- Multi-Tenant Isolation (Scoped DAL with `companyId` enforcement)
- RBAC (6 roles: SYSTEM_ADMIN, COMPANY_ADMIN, HR_ADMIN, HR, MANAGER, EMPLOYEE)
- 34 Permissions defined in static matrix
- HTTP Security Headers (CSP, HSTS, X-Content-Type-Options, Permissions-Policy)
- Health Check Endpoint (`/api/health`)
- Audit Logger with Sensitive Key Redaction
- PDPA Anonymization (Right to Erasure)

---

## Missing Features (Not Implemented)

### P1 — Leave Core
1. **Multi-Level Approval Workflow** — `ApprovalWorkflow` and `WorkflowStep` models exist in schema but NO runtime logic processes them. Approval is currently single-step only (approve/reject by anyone with LEAVE_APPROVE permission)
2. **Work Schedule System** — No model or logic for working days, working hours, shifts. `calculateLeaveDays()` hardcodes Saturday/Sunday as weekends
3. **Leave Year Configuration** — No `LeaveYear` model. Leave balance uses `year` (integer) with no support for fiscal/custom leave years
4. **Carry Forward** — `carriedForwardDays` field exists on `LeaveBalance` but no logic to calculate/expiry carry forward
5. **Hourly Leave** — `allowHourly` exists on `LeaveType` but no `HourlyPeriod` enum or hourly calculation logic
6. **Leave Balance Ledger Completeness** — `LeaveTransaction` missing `CARRY_FORWARD` and `EXPIRATION` types

### P2 — Employee Management
7. **Employee Import (CSV/Excel)** — No import functionality exists
8. **Employee Lifecycle Management** — Status exists (ACTIVE/RESIGNED/TERMINATED) but no lifecycle automation (session revocation, line unlinking on resignation)
9. **Employee Self-Service (Additional)** — No announcements view, holiday view, approval chain view, contact info, account status in LIFF

### P3 — Notification & Communication
10. **Notification Center** — In-app notifications exist but no UI to view/read them. No read/unread tracking. No `isRead` field on Notification model
11. **Announcement System Improvements** — No `isPinned`, `read/unread tracking`, `attachment` support. No LIFF announcement view
12. **Notification Provider Architecture** — Tightly coupled to LINE. No abstraction for future Email/SMS providers

### P4 — Security & Auth
13. **MFA/2FA (TOTP)** — Not implemented
14. **Password Policy** — Minimum length validated (8 chars) but no complexity rules, no password history, no configurable policy
15. **Session Management (User Self-Service)** — No UI for users to view/revoke their own sessions
16. **Login History** — `LoginLog` model exists but not surfaced in any admin UI

### P5 — SaaS & Subscription
17. **Subscription Management** — `Plan` and `Subscription` models exist but `features/subscription/index.ts` is empty (`export {}`). No EntitlementService, no feature gating
18. **Usage Tracking** — No tracking of employee count, storage usage, API usage
19. **Tenant Onboarding Wizard** — No step-by-step onboarding flow

### P6 — Reporting & Analytics
20. **Advanced Reports** — Basic report exists but no department stats, monthly trends, annual summaries, average approval time
21. **CSV Export** — Exists but limited. No multi-report export service

### P7 — Backup & Recovery
22. **Real Backup System** — Backup is simulated (random size/checksum). No actual pg_dump or S3 backup
23. **Restore Strategy** — No restore functionality or documentation

### P8 — Production Infrastructure
24. **Dockerfile** — No Dockerfile exists
25. **Docker Compose** — No docker-compose.yml exists
26. **Background Job System** — Notifications are inline `await` calls, no queue/retry system
27. **Webhook System** — Not implemented
28. **Email Service** — Not implemented (only LINE)

### P9 — UI/UX
29. **Design System** — No centralized design tokens (colors hardcoded as `#533afd` in components)
30. **Accessibility** — No ARIA labels, focus management, or keyboard navigation testing
31. **Responsive Testing** — No systematic responsive breakpoints defined

---

## Partial Features

| Feature | Status | Gap |
|---|---|---|
| Approval Workflow | Models exist, runtime is single-step | Need multi-level orchestration engine |
| Work Schedule | No model | Hardcoded weekend exclusion |
| Hourly Leave | `allowHourly` flag exists | No calculation or UI support |
| Carry Forward | `carriedForwardDays` field exists | No activation/expiry logic |
| Subscription | Schema exists, module is empty | Full implementation needed |
| Backup | UI exists, logic is simulated | Need real pg_dump + S3 backup |
| Notification Center | DB model exists, no UI | No read/unread, no LIFF view |
| Announcement Read | Model exists, no tracking | No `AnnouncementRead` relation |
| Login History | Model exists, no UI | No admin page |
| Employee Import | Permission exists | No import logic |
| Session Management | System Admin has force-logout | No user self-service |

---

## Security Gaps

1. **Rate Limiter is In-Memory** — `rate-limiter.ts` uses `Map`. Resets on server restart. Not shared across instances. Need Redis-based or DB-backed rate limiting for production
2. **No CSRF Token on Server Actions** — Relies solely on SameSite=Lax cookies. Should add CSRF token for state-changing operations
3. **No Request Body Size Limit** — Server Actions don't enforce payload size limits
4. **No Input Sanitization on Rich Text** — Announcement content, leave reasons stored as-is. Consider HTML sanitization
5. **Health Endpoint Exposes Internal Info** — No sensitive data currently, but no access control
6. **API Key has No IP Restriction** — Schema lacks `allowedIps` field
7. **No Brute-force on Employee Account Linking Beyond In-Memory** — Same rate limiter issue
8. **Session has No Server-side Revocation** — JWT-only. If compromised, cannot revoke without wait for expiry. `UserSession` model exists but not used for JWT validation

---

## Database Gaps

### Missing Models
- `WorkSchedule` — Employee/Department/Branch work schedule
- `WorkScheduleEntry` — Daily time slots (e.g., Mon 08:30-17:30)
- `LeaveYear` — Custom leave year configuration per company
- `PasswordHistory` — Track used passwords for policy
- `MfaSecret` — TOTP secrets for MFA users
- `AnnouncementRead` — Track who read announcements
- `WebhookConfig` — Webhook endpoint configuration
- `WebhookDelivery` — Webhook delivery logs
- `NotificationPreference` — User notification preferences
- `ImportLog` — Employee import history

### Missing Fields
- `Notification.isRead` — Boolean for read/unread
- `Notification.readAt` — DateTime when read
- `Announcement.isPinned` — Boolean for pinned announcements
- `ApiKey.allowedIps` — IP restriction for API keys
- `ApiKey.rateLimit` — Per-key rate limit
- `User.mfaEnabled` — MFA flag
- `User.mfaSecret` — Encrypted TOTP secret
- `Employee.photoUrl` — Employee photo (not just LINE avatar)

### Missing Indexes
- `LeaveRequest.[companyId, status]` — Composite for filtered queries
- `LeaveRequest.[employeeId, status]` — Employee's pending requests
- `Notification.[recipientId, isRead]` — Unread notifications
- `Announcement.[companyId, isPublished, publishedAt]` — Active announcements

### Missing Enums
- `LeaveTransactionType` — Missing `CARRY_FORWARD`, `EXPIRATION`
- `LeavePeriod` — Missing `HOURLY` for hourly leave
- `NotificationChannel` — Missing `SMS`

---

## Architecture Gaps

1. **Notification Service Not Decoupled** — `NotificationService` directly calls LINE functions. Should use Provider pattern (LINEProvider, EmailProvider, InAppProvider)
2. **No Background Job Abstraction** — All work runs inline in HTTP requests. Need JobQueue abstraction for future Redis/BullMQ integration
3. **No EntitlementService** — Subscription checks should be centralized, not scattered
4. **Rate Limiter Not Persistent** — In-memory only. Need pluggable backend
5. **No Middleware** — No Next.js middleware for route protection. Auth checks done in each page/action individually
6. **Scattered ActionResult Type** — `ActionResult` interface duplicated in `features/leave/actions.ts`, `features/leave/approval-actions.ts`, `features/auth/actions.ts`
7. **No API Route Versioning** — Single `/api/health` endpoint. No REST API for external integrations
8. **No Error Boundary** — No global React Error Boundary for graceful error UI

---

## Technical Debt

1. `any` types in `messaging.ts` (`messages: any[]`), `notification/service.ts` (`payload: flexMessage as any`)
2. `console.warn`/`console.error` used instead of structured logger
3. No consistent `ActionResult` shared type (duplicated 3 times)
4. `features/subscription/index.ts` is empty placeholder
5. `prisma/seed.ts` exists but not audited for completeness
6. No `.dockerignore` file
7. No `middleware.ts` for auth guard

---

## Testing Gaps

### Existing Tests (16 files)
- `auth.test.ts`, `account-linking.test.ts`, `admin-approval.test.ts`
- `concurrency-ledger.test.ts`, `e2e-workflow.test.ts`, `leave-workflow.test.ts`
- `notification.test.ts`, `password-management.test.ts`, `reports-and-audit.test.ts`
- `schema.test.ts`, `security-and-pdpa.test.ts`, `storage.test.ts`
- `tenant-isolation.test.ts`, `foundation.test.ts`, `company-registration.test.ts`
- `admin-enterprise.test.ts`

### Missing Tests
- No integration tests (only unit tests in `tests/unit/`)
- No E2E tests with Playwright
- No load/concurrency tests
- No approval workflow multi-level tests
- No work schedule calculation tests
- No carry forward tests
- No hourly leave tests
- No notification provider tests
- No API key security tests
- No file upload attack tests (path traversal, magic bytes)

---

## Production Gaps

1. **No Dockerfile** — Multi-stage build needed
2. **No docker-compose.yml** — For local dev with PostgreSQL + MinIO
3. **No .dockerignore** — Prevent node_modules in image
4. **No nginx/reverse proxy config** — For production HTTPS
5. **No Database Migration Strategy** — Need `prisma migrate deploy` in startup script
6. **No Real Backup** — Need pg_dump + S3 backup script
7. **No Monitoring beyond /api/health** — Need proper logging (Pino/Winston)
8. **No Structured Error Logging** — Console only
9. **No CI/CD Pipeline** — No GitHub Actions or similar
10. **No Environment Variable Validation** — No startup validation of required env vars

---

## Proposed Architecture (Changes Needed)

### Must Change
1. **Shared `ActionResult` type** — Move to `src/lib/types.ts`
2. **Notification Provider Pattern** — `NotificationService` → `NotificationDispatcher` with LINE/InApp/Email providers
3. **Work Schedule Model** — New DB models + calculation integration
4. **Multi-Level Approval Engine** — Runtime engine using existing `ApprovalWorkflow`/`WorkflowStep` models
5. **Background Job Abstraction** — `JobQueue` interface with InMemory implementation (Redis-ready)

### Should Change
6. **Rate Limiter Backend** — Add DB-backed option alongside in-memory
7. **Session Validation** — Check `UserSession.isRevoked` during JWT verification
8. **Middleware** — Add `middleware.ts` for route-level auth protection

### Nice to Have
9. **Structured Logger** — Replace console with Pino
10. **Global Error Boundary** — React Error Boundary component

---

## Implementation Phases

| Phase | Focus | Dependencies | Complexity |
|---|---|---|---|
| **PHASE 0** | Audit & Plan | None | ✅ Done |
| **PHASE 1** | Database & Architecture Foundation | PHASE 0 | Medium |
| **PHASE 2** | Leave Calculation Engine | PHASE 1 | Medium |
| **PHASE 3** | Leave Year + Balance + Carry Forward | PHASE 1, 2 | High |
| **PHASE 4** | Work Schedule + Shift | PHASE 1 | High |
| **PHASE 5** | Approval Workflow (Multi-Level) | PHASE 1, 2 | High |
| **PHASE 6** | Employee Lifecycle + Import | PHASE 1 | Medium |
| **PHASE 7** | Notification Center + Announcement | PHASE 1 | Medium |
| **PHASE 8** | MFA + Session Security | PHASE 1 | Medium |
| **PHASE 9** | SaaS Plan + Subscription + Usage | PHASE 1 | High |
| **PHASE 10** | Tenant Onboarding Wizard | PHASE 1, 9 | Medium |
| **PHASE 11** | Analytics + Reporting | PHASE 1, 2, 3 | Medium |
| **PHASE 12** | Backup + Restore | PHASE 1 | Medium |
| **PHASE 13** | Security Center + API Keys + Webhook | PHASE 1 | Medium |
| **PHASE 14** | Performance + Accessibility + UI Polish | All | Medium |
| **PHASE 15** | Complete Testing | All | High |
| **PHASE 16** | Production Hardening (Docker, CI/CD) | All | Medium |

---

## Dependencies

```
PHASE 1 ──┬──> PHASE 2 ──> PHASE 3
           ├──> PHASE 4
           ├──> PHASE 5 (also needs PHASE 2)
           ├──> PHASE 6
           ├──> PHASE 7
           ├──> PHASE 8
           ├──> PHASE 9 ──> PHASE 10
           ├──> PHASE 11 (also needs PHASE 2, 3)
           ├──> PHASE 12
           └──> PHASE 13
PHASE 14 ── requires all above
PHASE 15 ── requires all above
PHASE 16 ── requires all above
```

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Work Schedule complexity | High — affects leave calculation, approval, UI | Design incrementally. Start with simple working days, add shifts later |
| Multi-Level Approval Race Condition | High — concurrent approvals could cause double-processing | Use DB transactions + row-level locking. Lock `LeaveRequest` row before processing |
| Carry Forward Edge Cases | Medium — year boundary, policy conflicts | Thorough unit tests. Run carry forward as scheduled job, not inline |
| Subscription Entitlement Bloat | Medium — checking entitlements everywhere | Centralize in `EntitlementService`. Cache entitlement results |
| Real Backup Complexity | Medium — pg_dump + S3 coordination | Start with simple pg_dump script. Add S3 sync in Phase 12 |
| Breaking Existing Features | High — refactoring may break 16 test files | Run full test suite after every change. Maintain backward compatibility |

---

## Migration Strategy

1. All schema changes via `prisma migrate dev` (never manual)
2. New models added without removing existing ones (backward compatible)
3. Feature flags for new functionality (toggle via `SystemSetting`)
4. Existing tests must pass before and after each phase
5. Rollback plan: Revert migration + code for each phase

---

> **END OF PHASE 0 — Audit Complete**
> Awaiting user command to proceed with PHASE 1.
