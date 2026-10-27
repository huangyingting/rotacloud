# Architecture Decision Records (ADR)

## ADR-001: Next.js 16 App Router Full-Stack Architecture

- **Status**: Accepted
- **Context**: RotaCloud consists of both a content-rich public marketing website (`rotacloud.com`) and a highly interactive single-page workforce management application (`app.rotacloud.com`) backed by RESTful JSON APIs (`api.rotacloud.com/v1` and `/v2`).
- **Decision**: Build a unified Next.js 16 (App Router, React 19, TypeScript) application serving:
  1. Public marketing pages (`/`, `/pricing`, `/rota-planning`, `/time-and-attendance`, `/hr-software`, `/welcomeback`) with RotaCloud's warm cream (`#fbf6ee`), dark navy (`#0a0e2f`), and electric blue (`#0a65fc`) visual identity.
  2. Authentication and invite-only admission flows (`/login`, `/register`, `/forgot-password`).
  3. Full authenticated workspace application (`/app/*` and `/:accountId/*` compatible routes) with RotaCloud's electric blue top navigation bar (`#0a65fc`), sub-navigation tabs, interactive Rota grid, Leave matrix, Attendance timesheets, Availability calendar, Financials, Reports, and Settings.
  4. REST API route handlers under `/api/v1/*` and `/api/auth/*`.
- **Consequences**: Single deployable unit with zero CORS friction, shared TypeScript domain types, server-side session enforcement, and full E2E testability.

---

## ADR-002: Dual-Database Strategy with Prisma 7 (SQLite Local Dev, PostgreSQL Production)

- **Status**: Accepted
- **Context**: The application must use SQLite for zero-configuration local development and automated testing, and PostgreSQL for production deployments, following the `../Arcade` reference architecture.
- **Decision**:
  - Maintain `prisma/schema.prisma` (configured for `sqlite` provider with `@prisma/adapter-better-sqlite3`) and `prisma/schema.postgres.prisma` (configured for `postgresql` provider with `@prisma/adapter-pg`).
  - Provide `prisma.config.ts` and runtime adapter selection in `src/lib/prisma.ts` that automatically detects `sqlite` (`file:...`) vs `postgresql` (`postgres://...` / `postgresql://...`) connection strings.
  - Provide migration SQL files and CLI database lifecycle scripts (`db:migrate`, `db:upgrade-sqlite`, `db:remove-demo`, `db:maintain`).
- **Consequences**: Seamless local development and CI testing on SQLite while supporting horizontal scaling and managed PostgreSQL in production.

---

## ADR-003: Invite-Only Registration, Single-Use/Expiring Invitation Codes, Revocation & Zero Dummy Data

- **Status**: Accepted
- **Context**: Production security requires invite-only user registration with single-use, expiring invitation codes, role assignment, revocation, audit logging, and a strict prohibition on dummy data or demo user accounts.
- **Decision**:
  - Public registration (`/register` and `POST /api/auth/register`) requires a valid, unconsumed, non-revoked, non-expired invitation token (`invitationCode`).
  - The initial `ADMIN` account is provisioned exclusively via an operator CLI script (`npm run auth:bootstrap-admin -- --email <email> --name <name> --password <password> --company <company>`) or controlled environment bootstrap—never via hardcoded seed/demo users.
  - Administrators (and authorized Managers for employee-level invites) can issue single-use invitation codes (`POST /api/v1/invitations`) bound to a specific email (or open workspace code), target role (`ADMIN`, `MANAGER`, `EMPLOYEE`), location assignments, and expiration timestamp (`expiresAt`).
  - Invitations store only the SHA-256 hash (`tokenHash`) of the secret code in the database, enforce single-use consumption (`consumedAt`, `consumedByUserId`), and support immediate administrative revocation (`revokedAt`, `revokedByUserId`, `revokeReason`).
- **Consequences**: Complete elimination of unauthorized public signups and demo/dummy accounts; full cryptographic hygiene for invitation tokens.

---

## ADR-004: Role-Based Access Control (RBAC) & Location-Scoped Permissions

- **Status**: Accepted
- **Context**: RotaCloud defines three primary account permission levels (`admin`, `manager`, `employee`) plus location-scoped management.
- **Decision**:
  - Enforce three RBAC roles (`ADMIN`, `MANAGER`, `EMPLOYEE`) in NextAuth JWT/session tokens and API middleware (`src/lib/rbac.ts`):
    - `ADMIN`: Full access to all locations, employees, payroll/salary data, company settings, billing, API keys/webhooks, invitations, and audit logs.
    - `MANAGER`: Can manage rotas, shifts, timesheets, availability, memos, and leave requests for their managed locations; can invite `EMPLOYEE` accounts if permitted; cannot modify company billing or global security settings.
    - `EMPLOYEE`: Can view published rotas, acknowledge shifts, claim open shifts, request shift swaps/drops, submit leave requests, manage personal availability, clock in/out, view personal payslips/documents/memos, and update personal profile/notification preferences.
- **Consequences**: Fine-grained authorization matching RotaCloud's multi-location workforce model.

---

## ADR-005: Immutable Audit Logging & Soft-Delete Shift Recovery

- **Status**: Accepted
- **Context**: Both the security requirements (audit logging for auth, invitations, roles, and sensitive mutations) and RotaCloud's native features (`/activity` Activity Log and `/deleted-shifts` Deleted Shifts recovery) require comprehensive event tracking.
- **Decision**:
  - Implement an `AuditLog` table recording `actorUserId`, `actorEmail`, `actorRole`, `action` (e.g., `AUTH_LOGIN`, `INVITATION_CREATED`, `INVITATION_REVOKED`, `INVITATION_CONSUMED`, `ROLE_CHANGED`, `SHIFT_CREATED`, `SHIFT_PUBLISHED`, `SHIFT_DELETED`, `SHIFT_RESTORED`, `LEAVE_APPROVED`, `TIMESHEET_APPROVED`, `SETTINGS_UPDATED`), `targetType`, `targetId`, `summary`, `metadataJson`, `ipAddress`, and `createdAt`.
  - Shifts use soft deletion (`deleted: true`, `deletedAt`, `deletedByUserId`) so administrators can inspect and restore deleted shifts in the `Deleted Shifts` view.
- **Consequences**: Complete operational and security traceability across the entire platform.

---

## ADR-006: Deterministic Workforce Calculation Engines

- **Status**: Accepted
- **Context**: RotaCloud performs real-time calculations for shift net hours, paid/unpaid break deductions, hourly and salaried labour costs, UK holiday accrual (`12.07%`), leave clash detection, and the Bradford Factor (`B = S^2 × D`).
- **Decision**: Encapsulate all workforce domain formulas in pure, unit-tested TypeScript modules under `src/lib/domain/`:
  - **Shift & Cost Engine**: Handles overnight shifts (e.g., `22:00`–`06:00`), paid vs unpaid break rules (`breaks_paid` account setting), custom per-employee role rates (`roleRatesJson`) falling back to employee default hourly rate or role default rate, and labour cost % against weekly revenue budgets.
  - **Leave & Accrual Engine**: Calculates working days overlapping a leave request, detects clashing scheduled shifts, updates employee holiday used/remaining balances, and computes `12.07%` UK statutory holiday accrual on clocked hours.
  - **Bradford Factor & Reports Engine**: Computes `S^2 × D` (where `S` = number of separate sicknessspells and `D` = total days of absence) with standard trigger thresholds (`<50` Low, `50–124` Medium, `125–399` High, `400+` Critical) and Working Time Directive (`48h` weekly average) compliance metrics.
- **Consequences**: 100% deterministic, testable business logic shared between API endpoints, Reports, and Rota UI components.
