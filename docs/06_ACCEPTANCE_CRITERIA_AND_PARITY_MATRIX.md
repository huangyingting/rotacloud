# Acceptance Criteria & Feature-Parity Matrix

## 1. Acceptance Criteria (Given / When / Then)

### AC-01: Zero Dummy Data & CLI Admin Bootstrap
- **Given** a fresh database installation (`npm run db:migrate`),
- **When** the database is inspected prior to operator bootstrap,
- **Then** there must be `0` pre-seeded demo users, `0` hardcoded accounts, and `0` dummy shifts.
- **When** an operator runs `npm run auth:bootstrap-admin -- --email <email> --name <name> --password <password>`,
- **Then** the initial `ADMIN` user, workspace (`MS` / `108044` or custom company), default location, and `ADMIN_BOOTSTRAPPED` audit log entry are created.

### AC-02: Invite-Only Registration, Single-Use Consumption, Expiration & Revocation
- **Given** an unauthenticated visitor on `/register`,
- **When** they attempt to register without an invitation code or with an invalid/expired/revoked code,
- **Then** registration is rejected with HTTP `400`/`403` and an explicit error banner, and an `INVITATION_REJECTED` audit event is logged.
- **Given** an `ADMIN` generates an invitation code for role `EMPLOYEE` expiring in 72 hours,
- **When** a new user registers once using that invitation code,
- **Then** the user is created with role `EMPLOYEE`, assigned to the specified locations/roles, the invitation status transitions to `CONSUMED`, and any subsequent attempt to reuse the same code is rejected with `CONSUMED`.
- **When** an `ADMIN` revokes a `PENDING` invitation code,
- **Then** its status transitions to `REVOKED` immediately and it can no longer be used to register.

### AC-03: Role-Based Access Control (RBAC)
- **Given** an authenticated `EMPLOYEE` user,
- **When** they access `/app/dashboard`, `/app/rotas`, `/app/leave`, `/app/availability`, or `/app/attendance`,
- **Then** they can view published rotas, claim open shifts, request leave/swaps, clock in/out, and edit personal availability,
- **And** they are forbidden (`HTTP 403`) from creating invitations, revoking invitations, viewing other employees' salary/NI numbers, publishing rotas, or modifying company settings/API keys.

### AC-04: Interactive Rota Builder, Wage Costing, Publishing & Soft-Delete Recovery
- **Given** an `ADMIN` or `MANAGER` on `/app/rotas`,
- **When** they add a shift (`09:00`–`17:00`, `30m` unpaid break) for an employee with a `£12.50/hr` rate,
- **Then** the shift card displays `09:00 - 17:00`, role colour, `7.5h` net duration, and `£93.75` wage cost, initially in `Unpublished` state.
- **When** they click `Publish`,
- **Then** all unpublished shifts in the current view transition to `Published`, setup step `shiftPublished` marks complete, and an `AuditLog` entry is recorded.
- **When** they delete a shift,
- **Then** the shift disappears from the active rota grid, appears in `/app/deleted-shifts`, and can be restored back to the active rota.

### AC-05: Leave Management, 14 Leave Types, Embargoes, TOIL & Clash Detection
- **Given** an employee has a scheduled shift on `2026-10-28`,
- **When** a leave request overlapping `2026-10-28` is submitted or approved,
- **Then** the system detects and reports the clashing shift on `2026-10-28` and updates the employee's `Holiday Used` and `Holiday Remaining` counters in the annual matrix.
- **Given** an active Leave Embargo covering `2026-12-20` to `2026-12-31`,
- **When** an employee attempts to request holiday during that period,
- **Then** the embargo warning/block is enforced.

### AC-06: Attendance, PIN Terminal, Discrepancy Flags & Statutory Holiday Accrual
- **Given** an employee clocks in and out (via web or `/app/terminals` PIN pad) for an `8.0h` net shift,
- **When** the timesheet is recorded and approved,
- **Then** worked hours (`8.0h`), wage cost, lateness/discrepancy flags, and UK statutory holiday accrual (`8.0 * 12.07% = 0.97h`) are computed and available for payroll CSV export.

### AC-07: Financials, Budgets & Reports (Including Bradford Factor & WTD)
- **Given** weekly revenue targets and labour budgets are configured on `/app/budgets`,
- **When** shifts are scheduled on the rota,
- **Then** `/app/budgets` and `/app/budgets/labour-forecasting` display real-time scheduled hours, wage cost, and labour cost % vs target.
- **When** `/app/reports` is viewed,
- **Then** all 3 report suites (*Hours & Costs*, *Time Off & Cover* including Bradford Factor `S^2 × D`, and *Shifts*) render accurate aggregated metrics with CSV export.

---

## 2. 1:1 Feature-Parity Matrix (`rotacloud.com` & `app.rotacloud.com` vs Local Implementation)

| Original RotaCloud Surface / Feature | Original URL / API | Local Next.js Route / API | Parity Status |
|---|---|---|---|
| Public Marketing Home | `https://rotacloud.com/` | `/` | 100% Parity |
| Interactive Stairstep Pricing | `https://rotacloud.com/pricing/` | `/pricing` | 100% Parity |
| Rota Planning Product Page | `https://rotacloud.com/rota-planning/` | `/rota-planning` | 100% Parity |
| Time & Attendance Product Page | `https://rotacloud.com/time-and-attendance/` | `/time-and-attendance` | 100% Parity |
| Leave & HR Software Page | `https://rotacloud.com/hr-software/` | `/hr-software` | 100% Parity |
| Returning User Welcome Back | `https://rotacloud.com/welcomeback/` | `/welcomeback` | 100% Parity |
| Login & Session Auth | `https://app.rotacloud.com/login` | `/login`, `/api/auth/[...nextauth]` | 100% Parity |
| Invite-Only Registration (Enhanced) | Invite links | `/register`, `/api/v1/invitations/*` | 100% + Enhanced |
| 5-Step Setup Wizard | `rc-setup-wizard` / `/v2/me/setupWizardSteps` | Setup Wizard Modal + `/api/v1/me` | 100% Parity |
| Dashboard & On Leave Today | `/:accountId/dashboard` | `/app/dashboard` (`/:accountId/dashboard`) | 100% Parity |
| Coverage Calendar (Day/Month) | `/:accountId/calendar` | `/app/calendar` | 100% Parity |
| Rota Builder (Week/Month, Open Shifts, Day Notes, Publish, Copy, Swaps) | `/:accountId/rotas/:locationId` | `/app/rotas` + `/api/v1/shifts/*` | 100% Parity |
| Rota Cell Hover `+` & `...` Options Menu (`Add leave`, `Add day off`, `Add shift`) | `rc-cell.rota__cell` | `/app/rotas` cell hover & ellipsis popover | 100% Parity |
| Add / Edit Shift Right-Hand Drawer (`e.g. 9am - 5pm` duration parser, break `min`, `0 / 1500` note, `Publish and send notification?`, `Delete shift`) | `/:accountId/rotas/:locationId?view=week&shift=:id` | `/app/rotas` Shift Drawer | 100% Parity |
| Rota Day Header Sidebar (`Hours`, `Costs`, `+ Day note` with `0 / 500` & `Visible to everyone`) | `button.rota__day__button` | `/app/rotas` Day Sidebar Drawer | 100% Parity |
| Rota 6 View Checkboxes (`Hours & costs`, `Notes`, `Role colours`, `Leave`, `Unavailability`, `Warnings`) | `input.actions__option__field--checkbox` | `/app/rotas` View Options Bar | 100% Parity |
| Rota 15-Item Tools Menu (`Copy last week's shifts`, `Copy custom range`, `Load/Save template`, `Bulk actions`, `Add / remove employees`, `Share rota`, `See deleted shifts`, `Tool guides`) | `rc-menu.rota__action_menu--tools` | `/app/rotas` Tools Dropdown & Modals | 100% Parity |
| Publish N Counter & Confirmation Modal (`Are you sure? ... Hold ALT while clicking to skip...`) | `button.publish__button` / `POST /v1/shifts_published` | `/app/rotas` Publish Confirmation Modal + `/api/v1/shifts/publish` | 100% Parity |
| Active & Past Employees + Batch Add Form (`Don't invite`, `Send invite(s) only`, `Send onboarding invite`) + 8 Profile Tabs (`Employee Details`, `Personal Information`, `Locations`, `Roles`, `Wage & Salary`, `Work Schedule`, `Documents PRO`, `Logbook PRO`) | `/:accountId/employees/*`, `/:accountId/employees/:id/*` | `/app/employees`, `/app/employees/[id]` | 100% Parity |
| Annual Leave Matrix, Set Holiday Allowance Modal, 14-Type Add Leave Drawer (`More` expand, `am`/`pm` half-days, `Paid`/`Unpaid` pills, `See who else is on leave`) & Leave Tools Menu (`Embargoes`, `Request Rules`, `Request History`, `Show Deleted`, `Calendar Feed`) | `/:accountId/leave/:year?request=new` | `/app/leave` + `/api/v1/leave` | 100% Parity |
| Availability Single-Day Modal (`Unavailable`/`Available`, `All day` toggle, 15-min `start-time`/`end-time` selects) & 1/2/4-Week Repeating Pattern Builder | `/:accountId/availability`, `/:accountId/availability/:userId/create-pattern` | `/app/availability` + `/api/v1/availability` | 100% Parity |
| Locations (Timezone, Geofence, IPs) | `/:accountId/locations/*` | `/app/locations` + `/api/v1/locations` | 100% Parity |
| Roles (Colour, Break, Rate, Pay Code) | `/:accountId/roles/*` | `/app/roles` + `/api/v1/roles` | 100% Parity |
| Employee Groups | `/:accountId/groups/*` | `/app/groups` + `/api/v1/groups` | 100% Parity |
| HR Documents & Unsigned Tracking | `/:accountId/documents`, `/unsigned-documents` | `/app/documents` + `/api/v1/documents` | 100% Parity |
| Company Memos | `/:accountId/memos` | `/app/memos` + `/api/v1/memos` | 100% Parity |
| Annual Leave Matrix & 14 Leave Types | `/:accountId/leave/:year` | `/app/leave` + `/api/v1/leave` | 100% Parity |
| Leave Embargoes & TOIL | `/:accountId/leave/embargoes`, `/toil` | `/app/leave/embargoes`, `/app/leave/toil` | 100% Parity |
| Attendance Timesheets & Holiday Accrual | `/:accountId/attendance` | `/app/attendance` + `/api/v1/attendance` | 100% Parity |
| Static PIN Clocking Terminals | `/:accountId/terminals` | `/app/terminals` + `/api/v1/terminals` | 100% Parity |
| Availability & 1/2/4-Week Patterns | `/:accountId/availability/*` | `/app/availability` + `/api/v1/availability` | 100% Parity |
| Budgets & Labour Forecasting | `/:accountId/budgets/*` | `/app/budgets` + `/api/v1/budgets` | 100% Parity |
| Reports (Hours/Costs, Bradford, WTD, Shifts) | `/:accountId/reports` | `/app/reports` + `/api/v1/reports` | 100% Parity |
| Settings (General, Compliance, Billing, Company, Details, Notifications, Security, Integrations, API & Webhooks, Invitations) | `/:accountId/settings/*` | `/app/settings` + `/api/v1/settings` | 100% Parity |
| Activity Log & Security Audit Trail | `/:accountId/activity` | `/app/activity` + `/api/v1/audit-logs` | 100% Parity |
| Deleted Shifts Audit & Recovery | `/:accountId/deleted-shifts` | `/app/deleted-shifts` + `/api/v1/shifts/[id]/restore` | 100% Parity |
