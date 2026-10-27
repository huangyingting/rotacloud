-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "accountNumericId" INTEGER NOT NULL DEFAULT 108044,
    "name" TEXT NOT NULL DEFAULT 'MS',
    "industry" TEXT NOT NULL DEFAULT 'Hospitality',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "currencySymbol" TEXT NOT NULL DEFAULT '£',
    "phone" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "county" TEXT,
    "postcode" TEXT,
    "countryName" TEXT NOT NULL DEFAULT 'United Kingdom',
    "vatNumber" TEXT,
    "planId" TEXT NOT NULL DEFAULT 'plan-standard',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "addonTimeAndAttendance" BOOLEAN NOT NULL DEFAULT true,
    "addonSmsCredits" INTEGER NOT NULL DEFAULT 100,
    "setupStepsJson" TEXT NOT NULL DEFAULT '{"accountCreated":true,"locationsAdded":false,"rolesAdded":false,"employeesAdded":false,"shiftPublished":false}',
    "settingsJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "firstName" TEXT NOT NULL DEFAULT '',
    "middleName" TEXT,
    "lastName" TEXT NOT NULL DEFAULT '',
    "preferredName" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "pin" TEXT,
    "phone" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "startDate" TEXT,
    "finalWorkingDate" TEXT,
    "employmentType" TEXT NOT NULL DEFAULT 'Full Time',
    "rightToWorkChecked" BOOLEAN NOT NULL DEFAULT false,
    "weeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "maxWeeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 48,
    "optedOutWtd" BOOLEAN NOT NULL DEFAULT false,
    "holidayAllowance" DOUBLE PRECISION NOT NULL DEFAULT 28,
    "holidayAllowanceUnit" TEXT NOT NULL DEFAULT 'days',
    "accruesHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayAccrualRate" DOUBLE PRECISION NOT NULL DEFAULT 12.07,
    "salaryType" TEXT NOT NULL DEFAULT 'hourly',
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "annualSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payrollId" TEXT,
    "niNumber" TEXT,
    "defaultRoleId" TEXT,
    "groupId" TEXT,
    "address1" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "workScheduleJson" TEXT NOT NULL DEFAULT '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}',
    "roleRatesJson" TEXT NOT NULL DEFAULT '{}',
    "notificationsJson" TEXT NOT NULL DEFAULT '{"rotaPublishedEmail":true,"rotaPublishedPush":true,"shiftReminderEmail":true,"shiftReminderPush":true,"leaveUpdateEmail":true,"leaveUpdatePush":true,"swapUpdateEmail":true,"swapUpdatePush":true}',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetTokenHash" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetsAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AccountInvitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "codePrefix" TEXT NOT NULL,
    "tokenHash" TEXT,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "activeForEmail" TEXT,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "locationIdsJson" TEXT NOT NULL DEFAULT '[]',
    "defaultRoleId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT,
    "acceptedById" TEXT,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/London',
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 150,
    "clockInIps" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isManager" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmployeeLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colour" TEXT NOT NULL DEFAULT '#0a65fc',
    "defaultBreak" INTEGER NOT NULL DEFAULT 0,
    "defaultRate" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "payCode" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "customRate" DOUBLE PRECISION,

    CONSTRAINT "EmployeeRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "breaksPaid" BOOLEAN NOT NULL DEFAULT false,
    "netHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "openShiftClaimApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedByUserId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'all',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DayNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftRequest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "managerNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaveTypeId" INTEGER NOT NULL DEFAULT 1,
    "leaveTypeName" TEXT NOT NULL DEFAULT 'Holiday',
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "daysCount" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "hoursCount" DOUBLE PRECISION NOT NULL DEFAULT 8,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "managerNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveEmbargo" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "locationId" TEXT,
    "appliesToAll" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveEmbargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToilEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hoursDelta" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToilEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNAVAILABLE',
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "notes" TEXT,
    "sourcePatternId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityPattern" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "frequencyWeeks" INTEGER NOT NULL DEFAULT 1,
    "scheduleJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "shiftId" TEXT,
    "date" TEXT NOT NULL,
    "scheduledStart" TEXT,
    "scheduledEnd" TEXT,
    "clockInTime" TEXT,
    "clockOutTime" TEXT,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accruedHolidayHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "discrepancyFlagsJson" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClockingTerminal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "lastPingAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClockingTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyBudget" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "revenueTarget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labourBudgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labourTargetPercent" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "targetHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "forecastNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 1024,
    "category" TEXT NOT NULL DEFAULT 'Policy',
    "userId" TEXT,
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signedByUserId" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyMemo" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "locationId" TEXT,
    "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedByJson" TEXT NOT NULL DEFAULT '[]',
    "authorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "eventsJson" TEXT NOT NULL DEFAULT '["shift.published","leave.approved","timesheet.approved"]',
    "signingSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_accountNumericId_key" ON "Workspace"("accountNumericId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_workspaceId_deleted_idx" ON "User"("workspaceId", "deleted");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_userId_key" ON "PasswordCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCredential_resetTokenHash_key" ON "PasswordCredential"("resetTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_tokenHash_key" ON "AccountInvitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitation_activeForEmail_key" ON "AccountInvitation"("activeForEmail");

-- CreateIndex
CREATE INDEX "AccountInvitation_workspaceId_status_idx" ON "AccountInvitation"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "AccountInvitation_normalizedEmail_status_idx" ON "AccountInvitation"("normalizedEmail", "status");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Location_workspaceId_deleted_idx" ON "Location"("workspaceId", "deleted");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeLocation_userId_locationId_key" ON "EmployeeLocation"("userId", "locationId");

-- CreateIndex
CREATE INDEX "Role_workspaceId_deleted_idx" ON "Role"("workspaceId", "deleted");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeRole_userId_roleId_key" ON "EmployeeRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "Group_workspaceId_idx" ON "Group"("workspaceId");

-- CreateIndex
CREATE INDEX "Shift_workspaceId_locationId_date_deleted_idx" ON "Shift"("workspaceId", "locationId", "date", "deleted");

-- CreateIndex
CREATE INDEX "Shift_workspaceId_userId_date_deleted_idx" ON "Shift"("workspaceId", "userId", "date", "deleted");

-- CreateIndex
CREATE UNIQUE INDEX "DayNote_locationId_date_key" ON "DayNote"("locationId", "date");

-- CreateIndex
CREATE INDEX "ShiftRequest_workspaceId_status_idx" ON "ShiftRequest"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "LeaveRecord_workspaceId_userId_startDate_idx" ON "LeaveRecord"("workspaceId", "userId", "startDate");

-- CreateIndex
CREATE INDEX "LeaveRecord_workspaceId_status_idx" ON "LeaveRecord"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "LeaveEmbargo_workspaceId_startDate_endDate_idx" ON "LeaveEmbargo"("workspaceId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "ToilEntry_workspaceId_userId_idx" ON "ToilEntry"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "AvailabilityEntry_workspaceId_date_idx" ON "AvailabilityEntry"("workspaceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityEntry_userId_date_key" ON "AvailabilityEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "AvailabilityPattern_workspaceId_userId_idx" ON "AvailabilityPattern"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Timesheet_workspaceId_date_status_idx" ON "Timesheet"("workspaceId", "date", "status");

-- CreateIndex
CREATE INDEX "Timesheet_workspaceId_userId_date_idx" ON "Timesheet"("workspaceId", "userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClockingTerminal_deviceCode_key" ON "ClockingTerminal"("deviceCode");

-- CreateIndex
CREATE INDEX "ClockingTerminal_workspaceId_idx" ON "ClockingTerminal"("workspaceId");

-- CreateIndex
CREATE INDEX "WeeklyBudget_workspaceId_weekStart_idx" ON "WeeklyBudget"("workspaceId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyBudget_locationId_weekStart_key" ON "WeeklyBudget"("locationId", "weekStart");

-- CreateIndex
CREATE INDEX "CompanyDocument_workspaceId_idx" ON "CompanyDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "CompanyMemo_workspaceId_createdAt_idx" ON "CompanyMemo"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_workspaceId_idx" ON "ApiKey"("workspaceId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_workspaceId_idx" ON "WebhookEndpoint"("workspaceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultRoleId_fkey" FOREIGN KEY ("defaultRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordCredential" ADD CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitation" ADD CONSTRAINT "AccountInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitation" ADD CONSTRAINT "AccountInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitation" ADD CONSTRAINT "AccountInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLocation" ADD CONSTRAINT "EmployeeLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeLocation" ADD CONSTRAINT "EmployeeLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeRole" ADD CONSTRAINT "EmployeeRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_deletedByUserId_fkey" FOREIGN KEY ("deletedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayNote" ADD CONSTRAINT "DayNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayNote" ADD CONSTRAINT "DayNote_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftRequest" ADD CONSTRAINT "ShiftRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRecord" ADD CONSTRAINT "LeaveRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEmbargo" ADD CONSTRAINT "LeaveEmbargo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveEmbargo" ADD CONSTRAINT "LeaveEmbargo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToilEntry" ADD CONSTRAINT "ToilEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToilEntry" ADD CONSTRAINT "ToilEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityEntry" ADD CONSTRAINT "AvailabilityEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityEntry" ADD CONSTRAINT "AvailabilityEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityPattern" ADD CONSTRAINT "AvailabilityPattern_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityPattern" ADD CONSTRAINT "AvailabilityPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockingTerminal" ADD CONSTRAINT "ClockingTerminal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockingTerminal" ADD CONSTRAINT "ClockingTerminal_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyBudget" ADD CONSTRAINT "WeeklyBudget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyBudget" ADD CONSTRAINT "WeeklyBudget_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMemo" ADD CONSTRAINT "CompanyMemo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyMemo" ADD CONSTRAINT "CompanyMemo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

