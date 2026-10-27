# RotaCloud — Workforce Management, Rota Scheduling, Time & Attendance & HR Platform

A full-stack, production-ready replication of **RotaCloud** (`rotacloud.com` & `app.rotacloud.com`) built with **Next.js 16 (App Router)**, **Auth.js / NextAuth v4**, **Prisma 7** (SQLite for local development, PostgreSQL for production), **Tailwind CSS 4**, **Invite-Only Single-Use Registration**, **RBAC (`ADMIN`, `MANAGER`, `EMPLOYEE`)**, and **Immutable Security & Operational Audit Logging**.

---

## Key Capabilities & Parity Highlights

1. **Public Marketing Website & Interactive Pricing Calculator (`rotacloud.com` Parity)**
   - Home (`/`), Pricing (`/pricing`), Rota Planning (`/rota-planning`), Time & Attendance (`/time-and-attendance`), HR Software (`/hr-software`), and Returning Customer Campaign (`/welcomeback`).
   - Exact stairstep subscription calculator (`1–10`, `11–20`, `21–30`, `31–50`, `51–75`, `76–100`, `101–150`, `151–200`, `201–250` employee brackets) across **Standard** and **Pro** plans, **Monthly** and **Annual** cycles, **Time & Attendance** add-on, and **Terminals**.

2. **Invite-Only Admission, Single-Use Expiring Codes, RBAC & Audit Logging**
   - **Zero Dummy Data**: Ships with an empty, schema-migrated database (`0` pre-seeded demo users).
   - **CLI Bootstrap**: Provision the initial `ADMIN` account and workspace (`Account #108044`) via `npm run auth:bootstrap-admin`.
   - **Single-Use Invitation Codes (`RC-XXXX-XXXX-XXXX`)**: Stored exclusively as a `SHA-256` hash (`tokenHash`) and display prefix (`codePrefix`). Codes enforce expiration (`expiresAt`), atomic single-use consumption (`CONSUMED`), revocation (`REVOKED`), and rotation.
   - **Role-Based Access Control (RBAC)**: Enforces `ADMIN`, `MANAGER`, and `EMPLOYEE` permissions on both UI views and `/api/v1/*` route handlers.
   - **Immutable Audit Trail (`AuditLog`)**: Tracks logins, failed logins, invitation creation/consumption/revocation/rotation, shift publishing/deletion/restoration, leave approvals, timesheet approvals, and settings changes.

3. **Rota Planning & Scheduling (`app.rotacloud.com` Parity)**
   - Interactive **Week & Month Rota Builder** (`/app/rotas`) with Location selector, Open Shifts row, Day Notes row, Employee hours/cost summaries, live shift net-hours & wage-cost preview, **Publish Rota** workflow, **Copy Previous Week**, **Shift Swaps/Drops**, and **Deleted Shifts Audit & Recovery** (`/app/deleted-shifts`).

4. **Leave, Holiday Entitlements, Embargoes & TOIL (`/app/leave`)**
   - Supports all **14 RotaCloud Leave & Absence categories** (`Holiday`, `Unpaid Leave`, `Sick`, `Compassionate`, `Maternity`, `Paternity`, `Shared Parental`, `Adoption`, `Jury Service`, `Medical`, `Training`, `Furlough`, `TOIL`, `Other`).
   - Automatic **Shift Clash** and **Leave Embargo** overlap warnings, **Annual Leave Allowance Matrix**, and **TOIL Ledger**.

5. **Time & Attendance, UK 12.07% Holiday Accrual & 4-Digit PIN Kiosk Terminal**
   - **Timesheets (`/app/attendance`)**: Compares scheduled shifts against actual clock-ins, calculates lateness discrepancies, computes **UK 12.07% statutory holiday accrual** (`calculateUkHolidayAccrual`), supports manager approval, and exports payroll CSVs.
   - **Kiosk Terminal (`/app/terminals`)**: Pair tablet terminals and clock staff in/out via an interactive **4-digit PIN pad**.

6. **Workforce Analytics, Bradford Factor & WTD Compliance (`/app/reports`, `/app/budgets`)**
   - **Budgets**: Weekly revenue forecast vs target labour cost `%` and live scheduled rota variance.
   - **Reports**: Labour hours/cost reports, **Bradford Factor (`S² × D`)** sickness scoring, and **UK 48-hour Working Time Directive (WTD)** compliance checks.

---

## Quick Start (Local SQLite Development)

```bash
# 1. Install dependencies & generate Prisma Client
npm install

# 2. Apply SQLite database migrations
npm run db:migrate:sqlite

# 3. Bootstrap your initial ADMIN user (no dummy data is pre-seeded)
npm run auth:bootstrap-admin -- --email admin@example.com --name "Jack Wolf" --password "StrongPassword123!" --company "MS" --location "York"

# 4. Start the development server
npm run dev
```

## Production PostgreSQL Deployment

```bash
export DATABASE_PROVIDER=postgresql
export DATABASE_URL="postgresql://user:pass@host:5432/rotacloud?schema=public"
npm run db:generate:postgres
npm run db:migrate:postgres
npm run build
npm run start
```

## Testing & Verification

```bash
# Run unit & integration tests (domain calculations + invite-only admission lifecycle)
npm test

# Run ESLint & production build verification
npm run lint
npm run build

# Run end-to-end Playwright test suite
npm run test:e2e
```

## Documentation Suite

See [`ROTACLOUD_EXPLORATION_AND_PARITY_REPORT.md`](./ROTACLOUD_EXPLORATION_AND_PARITY_REPORT.md) and [`docs/README.md`](./docs/README.md) for the complete set of ADR, PRD, Technical Specification, Data Model, Implementation Plan, Acceptance Criteria, and Invite-Only Security documents, plus all **70 Playwright exploration screenshots** in [`./screenshots/`](./screenshots/).
