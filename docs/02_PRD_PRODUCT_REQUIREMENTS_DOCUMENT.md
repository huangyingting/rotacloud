# Product Requirements Document (PRD)

## 1. Product Vision & Scope

RotaCloud is a full-featured workforce management platform enabling organizations to plan staff rotas, track time and attendance, manage annual leave and HR records, monitor labour budgets and revenue targets, and communicate with staff across multiple locations.

This implementation replicates the public marketing experience (`rotacloud.com`) and the authenticated web application (`app.rotacloud.com`), enhanced with enterprise-grade **Invite-Only Registration** (single-use, expiring, revocable invitation codes), **Role-Based Access Control (RBAC)**, and **Immutable Audit Logging**, with **zero dummy data or demo user accounts**.

---

## 2. User Personas & Roles

1. **Account Administrator (`ADMIN`)**
   - Bootstrapped via CLI or invited with `ADMIN` role.
   - Configures company details, locations, roles, groups, compliance/account settings, API keys, webhooks, and invitations.
   - Has unrestricted access to Rota planning, Employee wages/salaries, Leave approvals, Attendance timesheets, Financial budgets, Reports, Deleted Shifts, and Audit/Activity logs.
2. **Location Manager (`MANAGER`)**
   - Invited with `MANAGER` role and assigned to one or more managed `Location` records.
   - Builds and publishes rotas, approves leave and shift swap/drop requests, manages employee availability, reviews and approves timesheets, and tracks location budgets.
3. **Staff Member (`EMPLOYEE`)**
   - Invited with `EMPLOYEE` role and assigned to locations and job roles.
   - Views personal and location rotas, acknowledges shifts, claims eligible Open Shifts, requests shift swaps or drops, submits holiday/TOIL requests, sets availability and repeating patterns, clocks in/out, signs documents, and reads company memos.

---

## 3. Functional Requirements by Module

### FR-01: Public Marketing Website (`rotacloud.com` Parity)
- **FR-01.1 Home Page (`/`)**: Hero section ("Rotas, simplified."), interactive feature showcase (`Rota Planning`, `Time & Attendance`, `Leave & HR`), customer proof metrics, testimonials, mobile app preview, and session-aware navigation (`Go to Dashboard` when logged in; `/welcomeback` support).
- **FR-01.2 Interactive Pricing Calculator (`/pricing`)**: Monthly/Annual billing toggle (16.7% annual discount), employee headcount input (`1` to `1000+`), real-time stairstep tier calculation for **Standard** (£10/mo for 1–5 staff) and **Pro** (£15/mo for 1–5 staff), optional **Time & Attendance** add-on and **SMS Notifications** bundle, feature comparison matrix, and FAQ accordion.
- **FR-01.3 Product Tour Pages (`/rota-planning`, `/time-and-attendance`, `/hr-software`, `/welcomeback`)**: Dedicated product breakdown pages matching the captured marketing layouts and responsive mobile drawers.

### FR-02: Authentication, Invite-Only Registration & Security
- **FR-02.1 Login (`/login`)**: Email and password authentication via NextAuth Credentials provider, session persistence, "Remember me", and account lock/suspension checks.
- **FR-02.2 Invite-Only Registration (`/register`)**:
  - Requires a valid single-use `invitationCode` (can be pre-filled via `?code=...` query string or entered manually).
  - Real-time invitation validation (`GET /api/v1/invitations/validate?code=...`) displaying the inviting company, assigned role (`ADMIN`, `MANAGER`, `EMPLOYEE`), and email restriction.
  - Rejects expired, revoked, consumed, or malformed codes with clear error states.
  - Atomically creates the user account, assigns their workspace role and locations, marks the invitation `consumedAt`, and records an `INVITATION_CONSUMED` audit log entry.
- **FR-02.3 Invitation Management (`/app/settings/invitations` & `/app/employees/add`)**:
  - Admins can generate single-use invitation codes with configurable expiration (e.g., 24h, 7d, 30d), target role, optional locked email address, default role, and location assignments.
  - Admins can view all `PENDING`, `CONSUMED`, `REVOKED`, and `EXPIRED` invitations and revoke any pending code with a reason.

### FR-03: Dashboard, Setup Wizard & Coverage Calendar
- **FR-03.1 Guided Setup Wizard**: 5-step interactive onboarding modal (`Welcome`, `Locations`, `Roles`, `Employees`, `Finish`) for newly bootstrapped workspaces, dismissible with persistent step tracking.
- **FR-03.2 Dashboard (`/app/dashboard`)**:
  - Pending Requests alert banner (e.g., incomplete company profile, pending leave requests, pending shift swaps/drops, unsigned documents).
  - **On Leave Today** widget with category counters (`Holiday`, `Sickness`, `TOIL`, `Public Holiday`, `Other`).
  - **Today's Shifts / Who's In** live status panel showing scheduled, clocked-in, and open shifts across locations.
  - Quick-action cards for Calendar, Rota, Roles, Leave, Employees, and Attendance.
- **FR-03.3 Coverage Calendar (`/app/calendar`)**: Day and Month shift coverage views with location, role, and employee filters.

### FR-04: Interactive Rota Builder (`/app/rotas`)
- **FR-04.1 Week & Month Views**: Switchable Week (Mon–Sun 7-day columns) and Month calendar grids filtered by Location, Role, Group, or Employee search.
- **FR-04.2 Open Shifts Row**: Dedicated top row for unassigned shifts (`Open Shifts`) that eligible employees can claim (with optional admin approval).
- **FR-04.3 Day Notes Row**: Daily operational notes per location (`Day Notes`) with optional visibility to staff.
- **FR-04.4 Employee Rows & Real-Time Costing**: Displays each employee's avatar/initials, role badges, weekly scheduled hours, shift count, and calculated wage cost (`£`).
- **FR-04.5 Shift Lifecycle**:
  - Add/Edit Shift modal (`Start Time`, `End Time`, `Unpaid/Paid Break minutes`, `Location`, `Role`, `Employee` or `Open Shift`, `Shift Notes`, `Published` toggle).
  - Publish workflow (`Publish` button showing count of unpublished shifts -> bulk publish with notification logging).
  - Copy shifts (`Copy previous week` or `Copy date range`) and Clear week tools.
  - Shift Swaps & Drop Requests workflow (employees can request to drop or swap a shift; managers approve/decline).
  - Soft-delete tracking: Deleting a published/scheduled shift moves it to **Deleted Shifts** (`/app/deleted-shifts`) where it can be inspected or restored.

### FR-05: Company Management (Employees, Locations, Roles, Groups, Documents, Memos)
- **FR-05.1 Employees (`/app/employees`, `/app/employees/past`, `/app/employees/[id]`)**:
  - Active & Past Employees directory with search, role/location/group filters, CSV export, and termination/reactivation (`Final Working Date`).
  - Multi-tab Employee Profile replicating RotaCloud: `Employee Details` (Account Type, Group, Weekly Contracted Hours, Max Weekly Hours, WTD Opt-out, Holiday Allocation, Employment Type, Start Date, Right to Work), `Personal Information` (DOB, Gender, Phone, Address, Emergency Contact), `Locations`, `Roles`, `Wage & Salary` (`hourly` vs `salaried`, NI Number, Payroll ID, Custom Role Rates), and `Work Schedule` (Mon–Sun regular Working vs Day Off).
- **FR-05.2 Locations (`/app/locations`)**: Manage locations with Name, Time Zone (`Europe/London`, etc.), Address, Geofence coordinates/radius, Clock-in IP allowlist, assigned Managers, and assigned Employees.
- **FR-05.3 Roles (`/app/roles`)**: Manage job roles with Name, Colour hex picker, Default Break (minutes), Default Hourly Rate, Pay Code, and assigned Employees.
- **FR-05.4 Groups (`/app/groups`)**: Manage employee groups/departments.
- **FR-05.5 Documents (`/app/documents` & `/app/documents/unsigned`)**: Upload/record HR documents, assign to employees, require employee signature/acknowledgement, and track unsigned documents.
- **FR-05.6 Memos (`/app/memos`)**: Publish company memos targeted to locations or specific employees with read-receipt tracking.

### FR-06: Leave, Holiday Allowances, Embargoes & TOIL (`/app/leave`)
- **FR-06.1 Annual Leave Matrix**: Displays every employee's `Holiday Allowance`, `Holiday Used`, `Holiday Remaining`, and monthly breakdown (`Jan`–`Dec`).
- **FR-06.2 14 RotaCloud Leave Types**: Supports all 14 standard leave types with exact RotaCloud colors and paid/unpaid configuration.
- **FR-06.3 Leave Requests & Clash Detection**: Submitting or approving leave automatically checks for clashing scheduled shifts in the date range and warns the manager (with options to convert clashing shifts to Open Shifts or delete them).
- **FR-06.4 Leave Embargoes (`/app/leave/embargoes`)**: Define blackout date ranges (company-wide or per-location/role) blocking or warning on holiday requests.
- **FR-06.5 TOIL Management (`/app/leave/toil`)**: Ledger for banking Time Off In Lieu hours/days and deducting used TOIL.

### FR-07: Time & Attendance, Clocking & Terminals (`/app/attendance`, `/app/terminals`)
- **FR-07.1 Timesheet Management**: Compare `Scheduled Shift` vs `Clocked Timesheet` (`Clock In`, `Clock Out`, `Break Minutes`, `Total Hours`, `Wage Cost`, `Variance/Discrepancy` badge, `Approved` status).
- **FR-07.2 Live Web Clock-In / Clock-Out & PIN Terminal (`/app/terminals`)**:
  - Employees can clock in/out directly from their dashboard or via a location Terminal using their 4-digit PIN.
  - Automatically flags late arrivals (`lateness_added_after_minutes`) and time discrepancies (`flag_in_out_discrepancies_minutes`).
- **FR-07.3 Statutory Holiday Accrual & Payroll Export**: Automatically calculates accrued holiday (`12.07%` default rate on worked hours) and exports approved timesheets to CSV for payroll (Xero/Sage/Moorepay compatible).

### FR-08: Employee Availability & Repeating Patterns (`/app/availability`)
- **FR-08.1 Monthly Availability Calendar**: Interactive per-employee calendar allowing `AVAILABLE` (all-day or custom hours), `UNAVAILABLE` (all-day or custom hours), and `PREFERRED` slots with notes.
- **FR-08.2 Repeating Patterns (`/app/availability/create-pattern`)**: Create 1-week, 2-week, or 4-week repeating availability templates that populate the calendar and surface directly in the Rota Builder.

### FR-09: Financials, Budgets & Reports (`/app/budgets`, `/app/reports`)
- **FR-09.1 Budgets & Labour Forecasting (`/app/budgets`, `/app/budgets/labour-forecasting`)**: Set weekly sales/revenue targets and target labour cost % (or hours/cost cap) per location; automatically compare against scheduled rota hours and wage costs with visual variance indicators.
- **FR-09.2 Comprehensive Reports Suite (`/app/reports`)**:
  - **Hours & Costs**: Daily Totals, Monthly Totals, Employee Totals, Location Totals, Role Totals, Coverage, Working Time Directive (`48h/week` compliance check).
  - **Time Off & Cover**: Leave Totals, Leave by Employee, Unavailability & Swaps, **Bradford Factor** (`S^2 × D` absence score per employee).
  - **Shifts**: Employees Per Role, Shift Acknowledgement, Unclaimed Open Shifts, Shifts Claimed by Employee.
  - Supports date-range filtering, location filtering, and CSV export.

### FR-10: Settings, Integrations, API Keys, Webhooks & Audit Logs (`/app/settings/*`, `/app/activity`, `/app/deleted-shifts`)
- **FR-10.1 Account & Rota Settings**: Configure `weekStarts`, `timeFormat`, `breaksPaid`, `currencySymbol`, Open Shift claiming rules, Shift Swap rules, Leave year start & notice period, Paid/Unpaid leave defaults, and Attendance rounding rules.
- **FR-10.2 Company Details, Your Details, Notifications & Security**: Update company profile, personal details, notification delivery matrix (`Desktop`, `Email`, `Push`, `SMS`), password change, and 2FA toggle.
- **FR-10.3 API Keys & Webhooks (`/app/settings/api`)**: Generate and revoke REST API keys (`rc_live_...`) and configure webhook endpoints with signing secrets for events (`shift.created`, `shift.published`, `leave.approved`, `timesheet.approved`).
- **FR-10.4 Activity & Security Audit Log (`/app/activity`)**: Searchable, filterable chronological log of all workspace, RBAC, invitation, and scheduling events.
