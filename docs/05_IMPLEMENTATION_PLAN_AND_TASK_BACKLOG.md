# Implementation Plan & Task Backlog

## 1. Phased Implementation Plan

### Phase 1: Playwright Exploration & Reverse Engineering (Completed)
- Explored `https://rotacloud.com/` and `https://app.rotacloud.com/` using `.cred` session cookies.
- Captured 70 screenshots across desktop and mobile viewports.
- Extracted all Angular routes, `v1`/`v2` REST endpoints, design tokens, and interactive scenario traces.

### Phase 2: Architecture, PRD, Spec & Parity Documentation (Completed)
- Authored ADRs, PRD, Technical Specification, Data Model, Implementation Plan, Acceptance Criteria, Parity Matrix, and Invite-Only Auth/Audit Specification.

### Phase 3: Project Scaffolding, Dual-Database Prisma Schema & CLI Tooling
- Initialize Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 project in `/home/azadmin/rotacloud`.
- Configure `prisma.config.ts`, `prisma/schema.prisma` (SQLite), `prisma/schema.postgres.prisma` (PostgreSQL), and initial migration SQL.
- Implement database connection factory (`src/lib/prisma.ts`) and operational CLI scripts:
  - `scripts/bootstrap-admin.ts` (`npm run auth:bootstrap-admin`)
  - `scripts/remove-demo-data.ts` (`npm run db:remove-demo`)
  - `scripts/upgrade-legacy-sqlite.ts` (`npm run db:upgrade-sqlite`)
  - `scripts/maintain-data.ts` (`npm run db:maintain`)

### Phase 4: Invite-Only Authentication, RBAC & Immutable Audit Logging
- Implement `src/lib/account-admission/` (token generation, SHA-256 hashing, single-use validation, expiration checks, revocation, and atomic registration).
- Implement `src/lib/audit.ts` for immutable `AuditLog` persistence.
- Implement `src/lib/auth.ts` (NextAuth Credentials provider, JWT/session enrichment with `role`, `workspaceId`, `accountNumericId`, and `isActive` checks) and `src/lib/rbac.ts`.

### Phase 5: Workforce Domain Engines & REST API Route Handlers
- Implement `src/lib/domain/workforce-engine.ts` (shift net hours, overnight shifts, paid/unpaid break deductions, custom role rates, wage cost, UK `12.07%` holiday accrual, leave clash detector, Bradford Factor `S^2 × D`, WTD compliance, and stairstep pricing calculator).
- Implement all `/api/v1/*` and `/api/auth/*` endpoints with full RBAC enforcement and audit logging.

### Phase 6: Public Marketing Site & Authenticated RotaCloud Application UI
- Build public marketing pages (`/`, `/pricing`, `/rota-planning`, `/time-and-attendance`, `/hr-software`, `/welcomeback`) matching `rotacloud.com`.
- Build authentication pages (`/login`, `/register`, `/forgot-password`) with invite-code validation UI.
- Build the authenticated RotaCloud application shell (Electric Blue `#0a65fc` top navbar, Pending Requests badge, Memos drawer, Help/Setup Wizard modal, Settings link, Logout) and all 18 application modules (`/app/dashboard`, `/app/calendar`, `/app/rotas`, `/app/employees`, `/app/locations`, `/app/roles`, `/app/groups`, `/app/documents`, `/app/memos`, `/app/leave`, `/app/attendance`, `/app/terminals`, `/app/availability`, `/app/budgets`, `/app/reports`, `/app/settings/*`, `/app/activity`, `/app/deleted-shifts`) plus `/:accountId/*` route alias redirection for 1:1 URL compatibility.

### Phase 7: Automated Unit, Migration, Zero-Dummy-Data & Playwright E2E Verification
- Write and run unit tests (`tests/*.test.ts`) for domain calculations, invite-only admission lifecycle, revocation, and SQLite upgrade/zero-demo-data guarantees.
- Write and run Playwright E2E tests (`tests/e2e/rotacloud.spec.ts`) testing public pages, CLI admin bootstrap, invite code creation, single-use employee registration, invitation revocation, rota building, shift publishing, soft-delete & recovery, leave request & clash detection, attendance clocking, availability patterns, budgets, reports, and RBAC boundaries.

---

## 2. Prioritized Task Backlog

| ID | Category | Task Description | Priority | Status |
|---|---|---|---|---|
| `TB-01` | Exploration | Playwright exploration of `rotacloud.com` and `app.rotacloud.com` with 70 screenshots | P0 | Done |
| `TB-02` | Documentation | Complete ADR, PRD, Spec, Data Model, Backlog, Acceptance Criteria, Parity Matrix | P0 | Done |
| `TB-03` | Database | Dual Prisma schema (`schema.prisma` SQLite + `schema.postgres.prisma` Postgres) & migrations | P0 | Pending |
| `TB-04` | Operations | CLI admin bootstrap (`bootstrap-admin.ts`), zero-demo-data & maintenance scripts | P0 | Pending |
| `TB-05` | Security | Invite-only registration service, single-use/expiring codes, revocation & `AuditLog` | P0 | Pending |
| `TB-06` | Auth & RBAC | NextAuth configuration, RBAC guards (`ADMIN`, `MANAGER`, `EMPLOYEE`), API key auth | P0 | Pending |
| `TB-07` | Domain Engine | Shift hours/cost calculator, 14 leave types, clash detector, `12.07%` accrual, Bradford Factor | P0 | Pending |
| `TB-08` | Backend APIs | REST APIs for Account, Settings, Locations, Roles, Groups, Employees, Invitations, Audit | P0 | Pending |
| `TB-09` | Backend APIs | REST APIs for Shifts (Publish, Copy, Claim, Restore), Swap/Drop Requests, Day Notes | P0 | Pending |
| `TB-10` | Backend APIs | REST APIs for Leave, Embargoes, TOIL, Availability Patterns, Timesheets, Terminals, Budgets, Reports | P0 | Pending |
| `TB-11` | Frontend Public | Public marketing pages (`/`, `/pricing`, `/rota-planning`, `/time-and-attendance`, `/hr-software`, `/welcomeback`) | P1 | Pending |
| `TB-12` | Frontend Auth | `/login`, `/register` (invite-only), `/forgot-password` pages | P0 | Pending |
| `TB-13` | Frontend App | App Shell, Setup Wizard, Dashboard, Coverage Calendar, Interactive Rota Builder (Week & Month) | P0 | Pending |
| `TB-14` | Frontend App | Company pages (Employees + 6 profile tabs, Past Employees, Locations, Roles, Groups, Documents, Memos) | P0 | Pending |
| `TB-15` | Frontend App | Leave matrix, Embargoes, TOIL, Attendance Timesheets, PIN Terminal, Availability & Repeating Patterns | P0 | Pending |
| `TB-16` | Frontend App | Financials (Budgets & Forecasting), Reports (3 suites), Settings (10 tabs), Activity Log, Deleted Shifts | P0 | Pending |
| `TB-17` | QA & E2E | Unit tests, lint, production build, and full Playwright E2E test suite | P0 | Pending |
