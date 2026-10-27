# RotaCloud Playwright Exploration, Scenario Analysis & Parity Report

## 1. Executive Summary

Using Playwright with Chromium (both unauthenticated for public marketing/auth surfaces and authenticated with `.cred` session cookies for `app.rotacloud.com`, Account ID `108044`, Company `"MS"`, Admin User `"Jack Wolf"` / `2348143`), we systematically explored `https://rotacloud.com/` and `https://app.rotacloud.com/`.

We captured **147 high-resolution desktop, mobile, and interactive state screenshots (`01` through `135`)** in `/home/azadmin/rotacloud/screenshots/`, extracted the full Angular route table and `v1`/`v2` REST API contracts from the production JavaScript bundles, intercepted live JSON payloads from `https://api.rotacloud.com/`, and executed deep, end-to-end interactive feature trials across every module, drawer, modal, menu, and sub-tab.

---

## 2. Reverse-Engineered Visual Design System

### 2.1 Public Marketing Site (`https://rotacloud.com/`)
- **Typography**: `"Plus Jakarta Sans", sans-serif`
  - Hero `H1`: `58.5px`, `font-weight: 800`, `line-height: 67.275px`, color `#0a0e2f` (`rgb(10, 14, 47)`)
  - Body text: `16px`, `font-weight: 500`, color `#0a0e2f`
- **Color Palette**:
  - Page background: Warm cream `#fbf6ee` (`rgb(251, 246, 238)`)
  - Card / secondary section surface: `#f2ede2` (`rgb(242, 237, 226)`)
  - Primary dark navy ink: `#0a0e2f` (`rgb(10, 14, 47)`)
  - Primary CTA Electric Blue: `#0a65fc` (`rgb(10, 101, 252)`)
  - Accent highlights: Soft sky blue `#d8ecff`, coral/amber accents, emerald rating badges
- **Navigation Structure**:
  - Top bar with RotaCloud brand logo, `Features` dropdown (`Rota Planning`, `Time & Attendance`, `Leave & HR`), `Pricing`, `Case Studies`, `More`, `Log in` (`https://app.rotacloud.com/login`), and `Try for free` CTA.
  - Note on Authenticated Redirect: Visiting `https://rotacloud.com/` with an active session cookie redirects (`HTTP 302`) to `https://rotacloud.com/welcomeback/` ("Welcome back! Go to my dashboard").

### 2.2 Authenticated Web Application (`https://app.rotacloud.com/:accountId/*`)
- **Typography**: `"Source Sans Pro", "Helvetica Neue", Helvetica, Arial, sans-serif`
  - Base body font: `14px`–`16px`, color `#555459` (`rgb(85, 84, 89)`)
  - Page title `H2`: `24px`, `font-weight: 600`, color `#555459`
- **Color Palette & Chrome**:
  - Top Application Header Bar: Electric Blue `#0a65fc` (`rgb(10, 101, 252)`) with white text (`#ffffff`), active link indicator, and right-aligned utility icons (`fa-paper-plane` Memos, `fa-bell` Pending Requests/Notifications with red badge counter, `fa-question-circle` Help & Walkthroughs, `fa-cog` Settings, `fa-power-off` Logout).
  - Workspace background: `#ffffff` primary canvas with `#f5f6f8` table headers and secondary panels, `#e1e4e8` cell borders.
  - Action Buttons:
    - Circular primary `+` floating action button next to page headings (`#0a65fc` background, `#ffffff` icon)
    - Primary action button (`.button--primary`): `#0a65fc` background, `#ffffff` text
    - Secondary button (`.button--secondary`): `#eef2f7` background, `#333333` text
    - Status badges: `ADMIN` (`#0a65fc`), `MANAGER` (`#2679a8`), `UNPUBLISHED` (striped/amber indicator), `PUBLISHED` (solid role color)
- **Standard Role & Leave Type Colors Observed from `/v1/leave_types`**:
  - `1: Holiday` (`Hol`): `#2B9AF4` (Requestable, Paid)
  - `2: Other Leave` (`Other`): `#00AA77` (Requestable, Unpaid by default)
  - `3: Sickness` (`Sick`): `#F5B827` (Paid)
  - `4: Maternity / Paternity` (`Mat / Pat`): `#E889B9` (Paid)
  - `5: Public Holiday` (`Public Hol`): `#3B59C2` (Paid)
  - `6: Absence (Authorised)`: `#FF813D` (Time & Attendance, Paid)
  - `7: Absence (Unauthorised)`: `#E52332` (Time & Attendance, Paid)
  - `8: Furlough`: `#AB8058` (Paid)
  - `9: Parental`: `#AF597D` (Paid)
  - `10: Study Leave`: `#D2BE0B` (Paid)
  - `11: Compassionate`: `#9B51E0` (Paid)
  - `12: Training`: `#92CC18` (Paid)
  - `13: TOIL` (Time Off In Lieu): `#2679A8` (Requestable, Paid)
  - `14: Carer's Leave`: `#0C9292` (Paid)

---

## 3. Complete Route & Page Inventory Explored

### 3.1 Public Marketing & Authentication Routes
| Route | Description | Screenshot Evidence |
|---|---|---|
| `https://rotacloud.com/` | Marketing home page ("Rotas, simplified.", feature tabs, testimonials, CTA) | `01-marketing-home-desktop.png`, `02-marketing-home-mobile.png` |
| `https://rotacloud.com/pricing/` | Pricing calculator (Standard £10/mo, Pro £15/mo stairstep tiers, Time & Attendance add-on, FAQ) | `03-marketing-pricing-desktop.png`, `04-marketing-pricing-mobile.png` |
| `https://rotacloud.com/rota-planning/` | Rota planning product tour & capabilities | `05-marketing-rota-planning.png` |
| `https://rotacloud.com/time-and-attendance/` | Clocking in/out, timesheets, payroll export tour | `06-marketing-time-attendance.png` |
| `https://rotacloud.com/hr-software/` | Leave, holiday allowances, staff documents & HR tour | `07-marketing-hr-software.png` |
| `https://rotacloud.com/welcomeback/` | Returning authenticated user landing page | `08-marketing-welcomeback.png` |
| `https://app.rotacloud.com/login` | Login form (Email, Password, Remember Me, Forgot Password, SSO) | `09-app-login-desktop.png`, `10-app-login-mobile.png` |

### 3.2 Authenticated Application Routes (`/:accountId/*`)
| Module | Route Pattern | Observed Capabilities & UI States | Screenshot Evidence |
|---|---|---|---|
| **Setup Wizard** | `/:accountId/dashboard` (first run) | 5-step guided onboarding: Welcome -> Locations -> Roles -> Employees -> Finish | `11-setup-wizard-step1-locations.png` |
| **Dashboard** | `/:accountId/dashboard` | "On leave today" widget (Holiday, Sickness, TOIL, Other counts), Pending Requests banner, Today's Shifts / Who's In, Quick Links | `12-dashboard-clean.png`, `41-dashboard-widgets-clean.png`, `38-app-dashboard-mobile.png` |
| **Calendar** | `/:accountId/calendar/:locationId/:date/:view` | Day and Month shift coverage view across locations, role filter, employee filter | `13-calendar-clean.png` |
| **Rotas** | `/:accountId/rotas/:locationId?view=week\|month` | Week & Month rota grid, Open Shifts row, Day Notes row, Employee rows with hours & wage cost summary, Shift cards (role color, time, break, notes, publish state), Copy shifts, Templates, Bulk actions, Publish workflow | `14-rotas-clean.png`, `42-rotas-builder-grid.png`, `62-rotas-week-view-clean.png`, `63-rotas-month-view-clean.png`, `65-scenario2-rota-grid-with-employee.png`, `66-scenario2-rota-cell-clicked.png`, `39-app-rotas-mobile.png` |
| **Employees** | `/:accountId/employees`, `/past`, `/add`, `/:id/*` | Active & Past Employees table, Search, Edit Groups, Add Employees batch form (invite options), Employee Profile tabs (`Employee Details`, `Personal Information`, `Locations`, `Roles`, `Wage & Salary`, `Work Schedule`, `Documents`, `Logbook`) | `15-employees-clean.png`, `16-employees-past-clean.png`, `44-employees-add-modal.png`, `45-employee-profile-details.png`, `58-employee-locations.png`, `59-employee-roles.png`, `60-employee-salary.png`, `61-employee-schedule.png` |
| **Locations** | `/:accountId/locations`, `/add`, `/:id` | Locations list (`Name`, `Time Zone`, `Managers`, `Employees`), Add/Edit Location with address, geofence radius, and allowed clock-in IPs | `17-locations-clean.png`, `46-location-edit-details.png`, `55-locations-add-form.png` |
| **Roles** | `/:accountId/roles`, `/add`, `/:id` | Job roles list (`Name`, `Default Break`, `Employees`), Add/Edit Role (`Name`, `Default Break (minutes)`, `Colour`, `Pay Code`, employee multi-select) | `18-roles-clean.png`, `54-roles-add-form.png`, `64-scenario1-role-created.png`, `70-role-edit-page.png` |
| **Groups** | `/:accountId/groups`, `/add`, `/:id` | Employee groups/departments for filtering rotas and reports | `19-groups-clean.png`, `56-groups-add-form.png` |
| **Documents** | `/:accountId/documents`, `/unsigned-documents` | HR document storage, employee document permissions, signature tracking | `20-documents-clean.png`, `21-unsigned-documents-clean.png` |
| **Memos** | `/:accountId/memos`, `/add` | Company-wide or location/employee-targeted announcements with attachments | `22-memos-clean.png` |
| **Leave** | `/:accountId/leave/:year`, `/embargoes`, `/toil` | Annual Leave matrix (`Holiday allowance`, `Holiday used`, `Holiday remaining`, `Jan`–`Dec`), Pending Leave Requests approval, Leave Embargoes (blackout dates), TOIL balance ledger, Clash detection with scheduled shifts | `23-leave-clean.png`, `24-leave-embargoes-clean.png`, `25-leave-toil-clean.png`, `47-leave-request-new-modal.png`, `67-scenario3-leave-grid-clean.png`, `40-app-leave-mobile.png` |
| **Attendance** | `/:accountId/attendance`, `/terminals` | Timesheets vs Scheduled Shifts comparison, Clock-in/out records, Paid/Unpaid breaks, Lateness & Discrepancy flags, Holiday Accrual (`12.07%`), Payroll export, Static PIN Terminals | `26-attendance-clean.png`, `27-terminals-clean.png` |
| **Availability** | `/:accountId/availability`, `/:userId/create-pattern` | Monthly Employee Availability calendar (`Available all-day`, `Unavailable all-day`, custom hours), Repeating 1/2/4-week patterns | `28-availability-clean.png`, `48-availability-create-pattern.png`, `69-scenario4-availability-interaction.png` |
| **Financials** | `/:accountId/budgets`, `/labour-forecasting` | Weekly Budgets & Revenue Targets per location, Scheduled Hours vs Budget, Wage Cost & Labour % vs Target | `29-budgets-clean.png`, `30-labour-forecasting-clean.png` |
| **Reports** | `/:accountId/reports` | 3 Report Suites: *Hours & Costs* (Daily, Monthly, Employee, Location, Role, Coverage, Working Time Directive), *Time Off & Cover* (Leave Totals, Leave by Employee, Unavailability & Swaps, Bradford Factor), *Shifts* (Employees Per Role, Shift Acknowledgement, Unclaimed Open Shifts, Shifts Claimed) | `31-reports-clean.png` |
| **Settings & Audit** | `/:accountId/settings/*`, `/activity`, `/deleted-shifts` | General Rota/Leave/Attendance settings, Compliance Rules, Billing, Company Details, Your Details, Notifications matrix, Password & Security (2FA, Sessions), Integrations, API Keys & Webhooks, Activity Log, Deleted Shifts recovery | `32-settings-general-clean.png` to `37-deleted-shifts-clean.png`, `49-settings-compliance.png` to `53-settings-api-webhooks.png` |

---

## 4. Scenarios Developed & Tested on Target Application

1. **Scenario 1 — First-Time Account Setup & Onboarding Wizard**:
   - Observed the 5-step `rc-setup-wizard` modal (`Welcome` -> `Add Locations` -> `Add Roles` -> `Add Employees` -> `Finish`) and verified how `PUT /v2/me/setupWizardSteps` persists completion flags (`welcome`, `locations`, `roles`, `employees`, `finish`, `onboarding_rotas`, `onboarding_leave`, etc.).
2. **Scenario 2 — Job Role Lifecycle (`POST /v1/roles`, `GET /v1/roles`, `DELETE /v1/roles/:id`)**:
   - Navigated to `/108044/roles/add`, created role `"Shift Supervisor"` with `default_break: 30`, verified the toast notification `"Shift Supervisor has been added"`, confirmed its presence in `/v1/roles` (`id: 483414`) and in the Rota Builder role filter, and verified clean deletion.
3. **Scenario 3 — Rota Grid Navigation, Shift Scheduling, Wage Cost & Publishing**:
   - Dismissed the `/rotas` intro screen (`onboarding_rotas`), navigated to `/108044/rotas/297602?view=week` and `?view=month`, inspected the virtualized grid (`Open Shifts` row, `Day Notes` row, employee rows, weekly summary bar, location/role/employee filters, `Publish` button, `Copy` tools, and cell click actions).
4. **Scenario 4 — Employee Profile, Pay Rates & Regular Work Schedule**:
   - Explored `/108044/employees/add` (batch employee creation with `Don't invite`, `Send invite(s) only`, `Send onboarding invite`) and `/108044/employees/2348143/*` (`Employee Details`, `Roles`, `Wage & Salary` with hourly/annual salary + custom per-role pay rates, and `Work Schedule` setting regular Working/Day Off status for Mon–Sun).
5. **Scenario 5 — Leave Allowances, 14 Leave Types, Embargoes & TOIL**:
   - Verified the 14 system leave types from `/v1/leave_types`, the annual leave matrix (`/v1/leave_overview/2026` and `/v1/holiday_allowances/2026`), Leave Embargoes (`/108044/leave/embargoes`), and Time Off In Lieu (`/108044/leave/toil`).
6. **Scenario 6 — Availability Calendar & Repeating Patterns**:
   - Inspected `/108044/availability` monthly calendar and `/108044/availability/2348143/create-pattern` (`1 week`, `2 weeks`, `4 weeks` repeating availability cycle).
7. **Scenario 7 — Edge Cases, Empty States & Permission Boundaries**:
   - Verified 404/permission guard ("Whoops! The page you requested could not be found, or you do not have permission to access it.") when visiting feature-gated or non-existent sub-routes (`/108044/notifications`, `/108044/deleted-shifts` when no shifts deleted, `/108044/employees/2348143/personal` vs `/details`).
   - Verified Pending Requests warning banner (`"Fill in your address and industry to complete your company profile"` from `GET /v1/requests`).
   - Verified invalid phone number banner on `/settings/notifications` (`"The mobile number associated with your account appears to be invalid"`).

---

## 5. Deep Interactive Feature Analysis, DOM Mechanics & Live API Payloads (`71`–`135`)

### 5.1 Rota Builder Grid (`/:accountId/rotas/:locationId?view=week|month`)
- **Virtual Scroll & Row Structure (`cdk-virtual-scroll-viewport.rota__rows`)**:
  - Top summary header (`Week 44 summary`) with two daily metric rows:
    - **`H`** (Scheduled Hours per day & weekly total, e.g., `7h 30m`)
    - **`C`** (Wage Cost per day & weekly total, e.g., `£0.00`)
  - **`Open shifts` (`OS`)** row (`div.rota__row.open-shifts`) at the top of the virtual scroll viewport.
  - **Employee rows** (`div.rota__row`, e.g., `Jack Wolf`, avatar badge `JW`, link `a.detail__name[href="/108044/employees/2348143/information"]`, weekly counter `7h 30m | 1 shift`).
  - Bottom **`+ Add employee`** button (`button.add-employee__button`).
  - Screenshots: `103-rota-week-jack-visible.png`, `104-rota-jack-cell-hover.png`, `115-rota-grid-with-unpublished-shift.png`.
- **View Options Checkboxes (`div.actions__option` in toolbar)**:
  - 6 live view-toggle checkboxes (`input.actions__option__field--checkbox`):
    1. `Hours & costs`
    2. `Notes`
    3. `Role colours`
    4. `Leave`
    5. `Unavailability`
    6. `Warnings`
- **Day Header Drawer (`button.rota__day__button`)**:
  - Clicking any day header (e.g., `26 Monday`) opens a right-hand sidebar drawer (`Monday October 26, 2026`, `Hours`, `Costs`) with **`+ Day note`** (`button.button-add-note`).
  - Clicking `+ Day note` opens the Day Note input (`textarea#note`, `placeholder="Write a note..."`, `0 / 500` character limit, `Visible to everyone` checkbox, `Save` / `Cancel`).
  - Screenshots: `99-rota-day-sidebar.png`, `100-rota-day-note-modal.png`.
- **Rota Cell Interactive Controls (`rc-cell.rota__cell`)**:
  - Hovering any cell reveals two action buttons inside `.cell-items`:
    1. **`+` (`button.button-add.cell__button`)**: Opens the right-hand **Add Shift Drawer**.
    2. **`...` (`button.rota-cell__button-ellipsis.cell__button`, `data-testid="cell-options"`)**: Opens a context popover menu with three actions:
       - `Add leave`
       - `Add day off`
       - `Add shift`
  - Screenshot: `113-rota-cell-ellipsis-menu.png`.
- **Add Shift & Edit Shift Right-Hand Drawer**:
  - Header displays employee name (`Jack Wolf (You)`), date (`Monday 26 October 2026`), `Delete shift` icon button (`button[title="Delete shift"]`, when editing), and `Close` (`button.header-button--close`).
  - Inputs:
    - `input#date` (`type="date"`, when editing an existing shift)
    - `input#duration` (`type="text"`, `placeholder="e.g. 9am - 5pm"`, parses natural-language or `HH:mm - HH:mm` ranges such as `09:00 - 17:00`)
    - `input#break` (`type="number"`, `placeholder="0"`, in `min`)
    - Role selector (`No Role`, `Barista`, etc.)
    - Location selector (`MS`, when editing)
    - `Publish and send notification?` checkbox
    - `textarea.info__details__textarea` (`placeholder="Shift note (optional)"`, `0 / 1500` character counter, helper text `"This note is visible to <Employee>"`)
    - Primary action button `Add` (`button.action__button--confirm`)
  - Live API Mutation (`POST /v1/shifts?exclude_link_header=true`):
    ```json
    {
      "start_time": 1792998000,
      "end_time": 1793026800,
      "minutes_break": 30,
      "location": 297602,
      "role": null,
      "notes": "Opening barista shift",
      "user": 2348143,
      "published": false,
      "open": false
    }
    ```
  - Screenshots: `105-rota-add-shift-modal-open.png`, `114-rota-add-shift-filled.png`, `122-rota-edit-shift-drawer-open.png`.
- **Publish Workflow (`button.publish__button`) & Delete Shift Workflow**:
  - When unpublished shifts exist on the visible rota, the Publish button updates to **`Publish N`** (e.g., `Publish 1`).
  - Clicking `Publish 1` opens the confirmation modal:
    > **Are you sure?**
    > Are you sure you want to publish this week's rota? Hold ALT while clicking to skip this message in future.
    > `[OK]` or `Cancel`
  - Clicking `OK` (`button.modal-button__item.btn`) fires `POST /v1/shifts_published?exclude_link_header=true` with payload `{"shifts":[277801077]}` (`[{"id":277801077,"code":200}]`), adds the `.published` class to `a.cell__shift.card`, and resets the button label to `Publish`.
  - Clicking `button[title="Delete shift"]` in the Edit Shift drawer opens `"Are you sure you wish to delete this shift? Hold ALT while clicking to skip this message in future."` and sends `DELETE /v1/shifts/277801077?exclude_link_header=true`.
  - Screenshots: `115-rota-grid-with-unpublished-shift.png`, `117-rota-publish-modal.png`, `123-rota-shift-published-confirmed.png`, `124-rota-delete-shift-confirm.png`.
- **Rota Tools Menu (`rc-menu.rota__action_menu--tools`)**:
  - Contains 15 tools across 4 sections:
    - *Copy*: `Copy last week's shifts`, `Copy custom range` (opens modal with `Copy from`, `Copy to`, `Days to copy: 7 days`, `Include shift notes?`, `Employees to copy: Select all / Deselect all`)
    - *Templates*: `Load template`, `Save as template` (opens modal with `Template name` input)
    - *Bulk actions (PRO)*: `Add shifts`, `Edit shifts`, `Publish shifts`, `Unpublish shifts`, `Assign shifts`, `Delete shifts`, `Lock shifts`
    - *Manage*: `Add / remove employees`, `Share rota`, `See deleted shifts` (navigates to `/:accountId/rotas/deleted-shifts`), `Tool guides`
  - Screenshots: `83-rota-tools-dropdown.png`, `125-rota-see-deleted-shifts.png`, `126-deleted-shifts-populated.png`.

### 5.2 Employees Directory, Batch Add & 8-Tab Employee Profile (`/:accountId/employees/*`)
- **Employees Directory (`/:accountId/employees`)**:
  - Header `Employees (1)` with `+` button, `Search...` input, `Edit Groups`, `Past Employees`, `Import`, and `Download` (`https://exports.rotacloud.com/108044/employees`).
  - Table columns: `Name` (with `ADMIN` badge), `Email`, `Locations`, `Roles`, `Default Role`, `Wage / Salary`, `Weekly Hours`, and trash button (`button.delete-icon-button`).
  - Screenshot: `126-employees-table-loaded.png`.
- **Batch Add Employees (`/:accountId/employees/add`)**:
  - 5-row tabular batch form with `+ Add another row`:
    - Columns: `First Name*`, `Last Name*`, `Email Address`, `Default Role`, `Account Type` (`Employee`, `Manager`, `Administrator`).
    - **Inviting employees** radio group:
      1. `Don't invite` (`"No invite will be sent. You can invite employees later."`)
      2. `Send invite(s) only` (`"Employees will receive an email to set their password and log in."`)
      3. `Send onboarding invite to new hire(s)` (`"Employees will be asked to enter their personal & emergency contact details when joining."`)
  - Screenshot: `91-employees-add-form.png`.
- **8-Tab Employee Profile (`/:accountId/employees/:id/*`)**:
  1. **`Employee Details` (`/details`)**: `Account Type` (`Employee`, `Manager`, `Administrator`), `Group`, `Weekly Contracted Hours`, `Opted out of Working Time Directive`, `Maximum Weekly Hours`, `Holiday Allocation` (`Fixed Allowance` / `Accrue Holiday`, `Days` / `Hours`), `Default Role`, `Employment Type` (`Full Time`, `Part Time`, `Fixed Term`, `Casual`, `Apprentice/Trainee`, `Agency`, `Contractor/Freelancer`, `Temporary`), `Start Date`, `'Right to work' status confirmed`, `Final Working Date`, `Notes` (`Only visible to administrators and managers`). (`127-employee-profile-tab-details.png`)
  2. **`Personal Information` (`/information`)**: `Basic Information` (`Title`: `Mr`/`Miss`/`Ms`/`Mrs`/`Mx`/`Dr`, `First Name`, `Middle Name(s)`, `Last Name`, `Gender`, `Date of Birth` Day/Month/Year selects), `Emergency Contact` (`Name`, `Relationship to Employee`, `Phone Number`), `Contact Details` (`Address 1`, `Address 2`, `City`, `County`, `Postcode`, `Email Address`, `Secondary Email Address`, `Phone Number`, `Secondary Phone Number`). (`129-employee-profile-tab-locations.png`)
  3. **`Locations` (`/locations`)**: Multi-selector (`Search...`, `Select All · Deselect All`, Location tiles). (`130-employee-profile-tab-roles.png`)
  4. **`Roles` (`/roles`)**: Multi-selector (`Search...`, `Select All · Deselect All`, Role tiles). (`131-employee-profile-tab-wage-salary.png`)
  5. **`Wage & Salary` (`/salary`)**: `NI Number`, `Default Wage / Salary` (`£` `per hour` / `per annum`), `Custom Role Rates`. (`132-employee-profile-tab-work-schedule.png`)
  6. **`Work Schedule` (`/schedule`)**: 7 dropdowns (`Monday` through `Sunday`, each `Working` or `Day Off`) to display regular days off on the rota. (`133-employee-profile-tab-documents.png`)
  7. **`Documents PRO` (`/documents`)**: Staff document storage & signatures. (`134-employee-profile-tab-logbook.png`)
  8. **`Logbook PRO` (`/logbook`)**: Staff HR logbook notes.

### 5.3 Leave Matrix, 14-Type Leave Drawer, Allowance Modal & Tools (`/:accountId/leave/*`)
- **Annual Leave Matrix (`/:accountId/leave/2026`)**:
  - Columns: `Employee`, `Holiday allowance`, `Holiday used`, `Holiday remaining`, `Jan`–`Dec`.
  - Clicking an employee's `Set` link under `Holiday allowance` opens the **Set Holiday Allowance** modal (`Fixed Allowance` vs `Accrue Holiday`, `Days` vs `Hours`, numeric input `placeholder="0"`, `Save` / `Cancel`). (`119-leave-set-allowance-modal-clean.png`)
- **Add Leave Right-Hand Drawer (`/:accountId/leave/2026?request=new`)**:
  - Employee dropdown (`select#user`: `Select an employee...`, `Jack Wolf`).
  - Leave type selector: shows `Holiday`, `Sickness`, `Other Leave`, `Mat / Pat` by default; clicking `More` expands all **14 leave types** (`Holiday`, `Sickness`, `Other Leave`, `Mat / Pat`, `Public Holiday`, `Absence (Authorised)`, `Absence (Unauthorised)`, `Furlough`, `Parental`, `Study Leave`, `Compassionate`, `Training`, `TOIL`, `Carer's Leave`).
  - Start & End date pickers (`input#start`, `input#end`) with **`am` / `pm` half-day buttons** (`button.period-button`).
  - `Days deducted` override input (`input#days`, `placeholder="Auto"`).
  - **`Paid` / `Unpaid` toggle pills** (`button.paid-option`).
  - `Add a message (optional)` textarea (`0 / 300` character counter).
  - **`See who else is on leave`** collapsible conflict preview.
  - Screenshot: `108-leave-add-all-14-types-drawer.png`.
- **Leave Tools Menu (`rc-menu.leave__tools-menu`) & Embargoes (`/:accountId/leave/embargoes`)**:
  - Tools items: `Embargoes`, `Request Rules PRO`, `Request History`, `Show Deleted`, `Calendar Feed`.
  - Embargoes page (`/108044/leave/embargoes`) allows creating blackout date ranges (`Start Date`, `End Date`, `Locations` / `Roles` / `Employees` scope).
  - Screenshots: `95-leave-tools-dropdown.png`, `109-leave-tool-embargoes.png`, `120-leave-embargoes-add-modal.png`.

### 5.4 Availability Single-Day Modal & Repeating Pattern Builder (`/:accountId/availability/*`)
- **Single-Day Availability Modal (`Create availability`)**:
  - Triggered by clicking `+` on any calendar cell in `/:accountId/availability`.
  - Radio buttons: `Unavailable` (`input#type-unavailable`) vs `Available` (`input#type-available`).
  - **`All day` toggle switch** (`input#all-day-toggle` / `.switch__slider`).
  - When `All day` is toggled **off**, reveals 15-minute increment time dropdowns **`select#start-time-input-0`** (`00:00` to `23:45`) and **`select#end-time-input-0`** (`00:15` to `24:00`) plus `+ Add another time` and `Notes (optional)` (`textarea#notes-input`, `0 / 300`).
  - Screenshots: `101-availability-single-day-modal-open.png`, `110-availability-custom-hours-modal.png`.
- **Repeating Availability Pattern Builder (`/:accountId/availability/:userId/create-pattern`)**:
  - Pattern settings: `Start date` (`input#start-date`), `End date (optional)` (`input#end-date`), and **`Repeating every` frequency tabs** (`1 week`, `2 weeks`, `4 weeks`).
  - Interactive `Monday`–`Sunday` pattern grid where clicking `+` on any weekday opens the `Create availability` modal for that pattern day.
  - Screenshots: `88-availability-repeating-pattern.png`, `102-availability-pattern-day-modal.png`.

