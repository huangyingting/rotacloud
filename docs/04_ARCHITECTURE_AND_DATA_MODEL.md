# Architecture & Data Model Specification

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                        Browser / Responsive Client (React 19)                     |
|  - Public Marketing Pages (/, /pricing, /rota-planning, /time-and-attendance,     |
|    /hr-software, /welcomeback)                                                    |
|  - Auth & Invite-Only Admission (/login, /register)                               |
|  - Authenticated RotaCloud App (/app/dashboard, /app/calendar, /app/rotas,        |
|    /app/employees, /app/locations, /app/roles, /app/groups, /app/documents,       |
|    /app/memos, /app/leave, /app/attendance, /app/terminals, /app/availability,    |
|    /app/budgets, /app/reports, /app/settings/*, /app/activity, /app/deleted-shifts|
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / JSON (Session Cookie or API Key)
+-----------------------------------------v-----------------------------------------+
|                     Next.js 16 App Router Server & API Layer                      |
|  - NextAuth JWT Session & RBAC Guard (ADMIN | MANAGER | EMPLOYEE)                 |
|  - Account Admission Service (SHA-256 Token Hashing, Single-Use, Revocation)      |
|  - Workforce Engines (Shift/Wage Calculator, Leave Clash & Accrual, Bradford)     |
|  - Audit Logger (Immutable AuditLog Persistence)                                  |
+-----------------------------------------+-----------------------------------------+
                                          | Prisma 7 Driver Adapter
                 +------------------------+------------------------+
                 |                                                 |
+----------------v-----------------+             +-----------------v----------------+
|   Local Dev / CI Database        |             |   Production Database            |
|   SQLite (better-sqlite3)        |             |   PostgreSQL (pg adapter)        |
|   prisma/schema.prisma           |             |   prisma/schema.postgres.prisma  |
+----------------------------------+             +----------------------------------+
```

---

## 2. Relational Data Model (Prisma Schema Entities)

### 2.1 Core Workspace, User, Invitation & Audit Entities
1. **`Workspace`** (`id`, `accountNumericId` default `108044`, `name`, `industry`, `timezone` default `"Europe/London"`, `currencySymbol` default `"£"`, `phone`, `address1`, `address2`, `city`, `county`, `postcode`, `countryName` default `"United Kingdom"`, `vatNumber`, `planId` default `"plan-standard"`, `setupStepsJson`, `settingsJson`, `createdAt`, `updatedAt`)
2. **`User`** (`id`, `workspaceId`, `email`, `passwordHash`, `firstName`, `middleName`, `lastName`, `preferredName`, `role` (`"ADMIN"` | `"MANAGER"` | `"EMPLOYEE"`), `isActive`, `deleted`, `deletedAt`, `pin`, `phone`, `dob`, `gender`, `startDate`, `finalWorkingDate`, `employmentType`, `rightToWorkChecked`, `weeklyHours`, `maxWeeklyHours`, `optedOutWtd`, `holidayAllowance`, `holidayAllowanceUnit` default `"days"`, `accruesHoliday`, `holidayAccrualRate` default `12.07`, `salaryType` default `"hourly"`, `hourlyRate`, `annualSalary`, `overtimeRate`, `payrollId`, `niNumber`, `defaultRoleId`, `groupId`, `address1`, `city`, `postcode`, `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelation`, `workScheduleJson`, `roleRatesJson`, `notificationsJson`, `twoFactorEnabled`, `notes`, `createdAt`, `updatedAt`)
3. **`AccountInvitation`** (`id`, `workspaceId`, `codePrefix`, `tokenHash`, `email`, `firstName`, `lastName`, `role`, `status` (`"PENDING"` | `"CONSUMED"` | `"REVOKED"` | `"EXPIRED"`), `locationIdsJson`, `defaultRoleId`, `expiresAt`, `createdByUserId`, `consumedAt`, `consumedByUserId`, `revokedAt`, `revokedByUserId`, `revokeReason`, `createdAt`, `updatedAt`)
4. **`AuditLog`** (`id`, `workspaceId`, `actorUserId`, `actorEmail`, `actorRole`, `action`, `targetType`, `targetId`, `summary`, `metadataJson`, `ipAddress`, `createdAt`)

### 2.2 Company Structure Entities
5. **`Location`** (`id`, `workspaceId`, `name`, `timezone` default `"Europe/London"`, `address`, `latitude`, `longitude`, `geofenceRadiusMeters` default `150`, `clockInIps`, `deleted`, `createdAt`, `updatedAt`)
6. **`EmployeeLocation`** (`id`, `userId`, `locationId`, `isManager`) — Many-to-many join between `User` and `Location` with per-location management flag.
7. **`Role`** (`id`, `workspaceId`, `name`, `colour` default `"#0a65fc"`, `defaultBreak` default `0`, `defaultRate` default `0`, `payCode`, `deleted`, `createdAt`, `updatedAt`)
8. **`EmployeeRole`** (`id`, `userId`, `roleId`, `customRate`) — Many-to-many join between `User` and `Role`.
9. **`Group`** (`id`, `workspaceId`, `name`, `createdAt`, `updatedAt`)

### 2.3 Rota, Shift, Request & Day Note Entities
10. **`Shift`** (`id`, `workspaceId`, `locationId`, `roleId`, `userId` nullable for Open Shifts, `date` (`YYYY-MM-DD`), `startTime` (`HH:mm`), `endTime` (`HH:mm`), `breakMinutes` default `0`, `breaksPaid` default `false`, `netHours`, `wageCost`, `notes`, `published` default `false`, `acknowledged` default `false`, `acknowledgedAt`, `openShiftClaimApprovalRequired` default `false`, `deleted` default `false`, `deletedAt`, `deletedByUserId`, `createdByUserId`, `createdAt`, `updatedAt`)
11. **`DayNote`** (`id`, `workspaceId`, `locationId`, `date` (`YYYY-MM-DD`), `content`, `visibility` default `"all"`, `createdByUserId`, `createdAt`, `updatedAt`)
12. **`ShiftRequest`** (`id`, `workspaceId`, `shiftId`, `requesterUserId`, `targetUserId` nullable, `type` (`"CLAIM"` | `"DROP"` | `"SWAP"`), `status` (`"PENDING"` | `"APPROVED"` | `"DECLINED"`), `reason`, `managerNote`, `reviewedByUserId`, `reviewedAt`, `createdAt`, `updatedAt`)

### 2.4 Leave, Embargoes, TOIL & Availability Entities
13. **`LeaveRecord`** (`id`, `workspaceId`, `userId`, `leaveTypeId` (`1`..`14`), `leaveTypeName`, `startDate` (`YYYY-MM-DD`), `endDate` (`YYYY-MM-DD`), `daysCount`, `hoursCount`, `paid` default `true`, `status` (`"REQUESTED"` | `"APPROVED"` | `"DECLINED"`), `notes`, `managerNote`, `reviewedByUserId`, `reviewedAt`, `createdAt`, `updatedAt`)
14. **`LeaveEmbargo`** (`id`, `workspaceId`, `name`, `startDate`, `endDate`, `locationId` nullable, `appliesToAll` default `true`, `createdAt`, `updatedAt`)
15. **`ToilEntry`** (`id`, `workspaceId`, `userId`, `date`, `hoursDelta`, `reason`, `recordedByUserId`, `createdAt`)
16. **`AvailabilityEntry`** (`id`, `workspaceId`, `userId`, `date` (`YYYY-MM-DD`), `status` (`"AVAILABLE"` | `"UNAVAILABLE"` | `"PREFERRED"`), `allDay` default `true`, `startTime`, `endTime`, `notes`, `sourcePatternId`, `createdAt`, `updatedAt`)
17. **`AvailabilityPattern`** (`id`, `workspaceId`, `userId`, `startDate`, `endDate`, `frequencyWeeks` (`1` | `2` | `4`), `scheduleJson`, `createdAt`)

### 2.5 Attendance, Terminals, Budgets, HR & API Entities
18. **`Timesheet`** (`id`, `workspaceId`, `userId`, `locationId`, `roleId`, `shiftId` nullable, `date` (`YYYY-MM-DD`), `scheduledStart`, `scheduledEnd`, `clockInTime`, `clockOutTime`, `breakMinutes` default `0`, `workedHours`, `wageCost`, `accruedHolidayHours`, `status` (`"OPEN"` | `"SUBMITTED"` | `"APPROVED"`), `discrepancyFlagsJson`, `notes`, `approvedByUserId`, `approvedAt`, `createdAt`, `updatedAt`)
19. **`ClockingTerminal`** (`id`, `workspaceId`, `locationId`, `name`, `deviceCode`, `lastPingAt`, `isActive` default `true`, `createdAt`)
20. **`WeeklyBudget`** (`id`, `workspaceId`, `locationId`, `weekStart` (`YYYY-MM-DD`), `revenueTarget` default `0`, `labourBudgetAmount` default `0`, `labourTargetPercent` default `25`, `targetHours` default `0`, `forecastNotes`, `createdAt`, `updatedAt`)
21. **`CompanyDocument`** (`id`, `workspaceId`, `title`, `fileName`, `fileSize`, `category`, `userId` nullable, `requiresSignature` default `false`, `signedAt`, `signedByUserId`, `uploadedByUserId`, `createdAt`)
22. **`CompanyMemo`** (`id`, `workspaceId`, `title`, `content`, `locationId` nullable, `requiresAcknowledgement` default `false`, `acknowledgedByJson`, `authorUserId`, `createdAt`)
23. **`ApiKey`** (`id`, `workspaceId`, `name`, `keyPrefix`, `keyHash`, `lastUsedAt`, `revokedAt`, `createdByUserId`, `createdAt`)
24. **`WebhookEndpoint`** (`id`, `workspaceId`, `url`, `eventsJson`, `signingSecret`, `isActive` default `true`, `createdAt`)
