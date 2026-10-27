# Technical Specification

## 1. System Technology Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript 5)
- **Authentication**: NextAuth.js (`next-auth` v4.24.x) with JWT session strategy, custom Credentials provider, RBAC session callbacks, and invite-only admission service
- **ORM & Database**:
  - Prisma 7 (`@prisma/client`)
  - Local Dev / Automated Tests: SQLite (`better-sqlite3` + `@prisma/adapter-better-sqlite3`) via `prisma/schema.prisma`
  - Production: PostgreSQL (`pg` + `@prisma/adapter-pg`) via `prisma/schema.postgres.prisma`
- **Styling & Icons**: Tailwind CSS v4 + custom RotaCloud CSS design tokens (`#0a65fc` brand electric blue, `#fbf6ee` marketing cream, `#0a0e2f` dark navy, `#555459` app slate) + Lucide icons
- **Testing**: Node native test runner (`tsx --test`) for unit/domain/invitation/migration tests + Playwright (`@playwright/test`) for full E2E browser verification

---

## 2. REST API Specification (`/api/v1/*` and `/api/auth/*`)

All `/api/v1/*` routes authenticate via either:
1. Active NextAuth session cookie, OR
2. `Authorization: Bearer <rc_live_api_key>` header validated against active `ApiKey` records for the workspace.

### 2.1 Authentication & Invite-Only Admission Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | Public | NextAuth sign-in, sign-out, session check |
| `GET` | `/api/v1/invitations/validate` | Public | Validates `?code=...` invitation token; returns status (`VALID`, `EXPIRED`, `REVOKED`, `CONSUMED`, `INVALID`), target role, email hint, and company name |
| `POST` | `/api/auth/register` | Public (with valid code) | Redeems single-use `invitationCode`, hashes password with `bcryptjs`, creates `User`, assigns locations/roles, marks invitation `CONSUMED`, and writes `AuditLog` |
| `GET` | `/api/v1/invitations` | `ADMIN`, `MANAGER` | Lists workspace invitations with status, creator, consumer, and timestamps |
| `POST` | `/api/v1/invitations` | `ADMIN`, `MANAGER` | Creates a new single-use invitation code (`role`, `email`, `expiresInHours`, `locationIds`, `defaultRoleId`) and returns the plaintext code once |
| `POST` | `/api/v1/invitations/[id]/revoke` | `ADMIN` | Immediately revokes a pending invitation (`revokeReason`) and logs `INVITATION_REVOKED` |

### 2.2 Workspace, Settings & Profile Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`, `PATCH` | `/api/v1/account` | Auth (`PATCH`: `ADMIN`) | Returns or updates company details (`name`, `industry`, `timezone`, `currencySymbol`, `address`, `phone`, `vatNumber`, `setupStepsJson`) |
| `GET`, `PATCH` | `/api/v1/settings` | Auth (`PATCH`: `ADMIN`) | Returns or updates RotaCloud settings (`weekStarts`, `timeFormat`, `breaksPaid`, `holidayAccrualRate`, `openShiftClaimingEnabled`, `shiftSwapsEnabled`, `leaveTypesPaidJson`, etc.) |
| `GET`, `PATCH` | `/api/v1/me` | Auth | Returns or updates current user profile, notification preferences matrix, password, or onboarding wizard steps |

### 2.3 Company Entities (Locations, Roles, Groups, Employees, Documents, Memos)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`, `POST` | `/api/v1/locations` | Auth (`POST`: `ADMIN`) | List locations (with manager/employee counts) or create location (with timezone, address, geofence, allowed clock-in IPs) |
| `GET`, `PATCH`, `DELETE` | `/api/v1/locations/[id]` | Auth (`PATCH`/`DELETE`: `ADMIN`) | Get, update, or soft-delete a location and its assigned users/managers |
| `GET`, `POST` | `/api/v1/roles` | Auth (`POST`: `ADMIN`, `MANAGER`) | List or create job roles (`name`, `colour`, `defaultBreak`, `defaultRate`, `payCode`, `userIds`) |
| `GET`, `PATCH`, `DELETE` | `/api/v1/roles/[id]` | Auth (`PATCH`/`DELETE`: `ADMIN`, `MANAGER`) | Update or delete a job role |
| `GET`, `POST`, `DELETE` | `/api/v1/groups` | Auth (`POST`/`DELETE`: `ADMIN`, `MANAGER`) | Manage employee groups/departments |
| `GET`, `POST` | `/api/v1/employees` | Auth (`POST`: `ADMIN`, `MANAGER`) | List active/past employees or create employee profile (optionally generating an invitation code simultaneously) |
| `GET`, `PATCH`, `DELETE` | `/api/v1/employees/[id]` | Auth | Get or update employee details, personal info, locations, roles, salary/custom role rates, and Mon–Sun work schedule |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/v1/documents` | Auth | Upload/create HR documents, assign to staff, and record employee signature/acknowledgement |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/v1/memos` | Auth | Create company/location memos and record employee read receipts |

### 2.4 Rota, Shifts, Open Shifts, Swaps & Day Notes Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`, `POST` | `/api/v1/shifts` | Auth (`POST`: `ADMIN`, `MANAGER`) | Query shifts by date range, location, role, employee, or `deleted=true`; create assigned or Open Shift (`userId: null`) |
| `PATCH`, `DELETE` | `/api/v1/shifts/[id]` | Auth | Update shift, acknowledge shift, or soft-delete shift (recording `deletedAt` and `deletedByUserId`) |
| `POST` | `/api/v1/shifts/[id]/restore` | `ADMIN`, `MANAGER` | Restore a soft-deleted shift from `/app/deleted-shifts` |
| `POST` | `/api/v1/shifts/publish` | `ADMIN`, `MANAGER` | Bulk-publish unpublished shifts for a location/date range and create employee notifications |
| `POST` | `/api/v1/shifts/copy` | `ADMIN`, `MANAGER` | Copy shifts from previous week or custom date range |
| `POST` | `/api/v1/shifts/[id]/claim` | Auth | Claim an Open Shift (auto-assigns or creates pending claim request based on `openShiftApprovalRequiredByDefault` and eligibility checks) |
| `GET`, `POST`, `PATCH` | `/api/v1/shift-requests` | Auth | Create or approve/decline Shift Swap and Shift Drop requests |
| `GET`, `POST`, `DELETE` | `/api/v1/day-notes` | Auth | Manage daily operational notes on the rota grid |

### 2.5 Leave, Embargoes, TOIL & Availability Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/v1/leave` | Auth | List annual leave matrix, submit leave requests, approve/decline leave, and run shift clash detection |
| `GET`, `POST`, `DELETE` | `/api/v1/leave/embargoes` | Auth (`POST`/`DELETE`: `ADMIN`, `MANAGER`) | Manage blackout embargo periods |
| `GET`, `POST` | `/api/v1/leave/toil` | Auth (`POST`: `ADMIN`, `MANAGER`) | Bank or adjust employee TOIL balances |
| `GET`, `POST`, `DELETE` | `/api/v1/availability` | Auth | Manage daily availability entries and apply repeating 1/2/4-week patterns |

### 2.6 Attendance, Clocking Terminals, Budgets, Reports & Audit Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET`, `POST`, `PATCH` | `/api/v1/attendance` | Auth | List timesheets, clock in/out (web or PIN terminal), record breaks, approve timesheets, and calculate holiday accrual |
| `GET`, `POST`, `DELETE` | `/api/v1/terminals` | `ADMIN`, `MANAGER` | Manage static PIN clocking terminals per location |
| `GET`, `POST` | `/api/v1/budgets` | `ADMIN`, `MANAGER` | Get or save weekly location revenue targets, labour cost budgets, and forecasting metrics |
| `GET` | `/api/v1/reports` | `ADMIN`, `MANAGER` | Generate Hours & Costs, Leave & Bradford Factor, Working Time Directive, and Shift reports |
| `GET`, `POST`, `DELETE` | `/api/v1/api-keys` | `ADMIN` | Manage workspace REST API keys and Webhook endpoints |
| `GET` | `/api/v1/audit-logs` | `ADMIN` | Query immutable security and operational `AuditLog` entries |

---

## 3. Core Domain Formulas

1. **Shift Net Hours (`netHours`)**:
   - Let `grossMinutes = (endMinutes - startMinutes + 1440) % 1440` (supporting overnight shifts).
   - If account `breaksPaid === true`, `netMinutes = grossMinutes`; otherwise `netMinutes = Math.max(0, grossMinutes - breakMinutes)`.
   - `netHours = Number((netMinutes / 60).toFixed(2))`.
2. **Shift Wage Cost (`wageCost`)**:
   - Hourly employee: `rate = employee.roleRates[shift.roleId] ?? employee.hourlyRate ?? role.defaultRate ?? 0`.
   - `wageCost = Number((netHours * rate).toFixed(2))`.
   - Salaried employee: If `dashboardIncludeSalariesInRotaCosts` is enabled, weekly salary cost `annualSalary / 52` is distributed across scheduled shifts or shown in location summary.
3. **Bradford Factor (`bradfordScore`)**:
   - `B = S * S * D` where `S` is the count of distinct sickness absence spells in the rolling 52-week period and `D` is the total number of sickness days.
4. **UK Statutory Holiday Accrual (`accruedHours`)**:
   - `accruedHours = Number(((workedHours * holidayAccrualRate) / 100).toFixed(2))` where default `holidayAccrualRate = 12.07`.
