import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { createAccountInvitation } from '@/lib/account-admission/invitations';
import { normalizeRbacRole } from '@/lib/account-admission/policy';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get('deleted') === 'true';

  const employees = await prisma.user.findMany({
    where: {
      workspaceId,
      deleted: includeDeleted,
    },
    include: {
      defaultRole: true,
      group: true,
      employeeLocations: {
        include: { location: true },
      },
      employeeRoles: {
        include: { role: true },
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });

  // Hide sensitive wage/NI details from regular EMPLOYEE users viewing coworkers
  const sanitized = employees.map((emp) => {
    if (user.role === 'EMPLOYEE' && emp.id !== user.id) {
      return {
        ...emp,
        hourlyRate: 0,
        annualSalary: 0,
        overtimeRate: 0,
        niNumber: null,
        payrollId: null,
        roleRatesJson: '{}',
      };
    }
    return emp;
  });

  return NextResponse.json({ employees: sanitized });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    groupId?: string | null;
    defaultRoleId?: string | null;
    locationIds?: string[];
    roleIds?: string[];
    weeklyHours?: number;
    holidayAllowance?: number;
    hourlyRate?: number;
    salaryType?: string;
    annualSalary?: number;
    employmentType?: string;
    startDate?: string;
    issueInvitation?: boolean;
    expiresInHours?: number;
  }>(request);

  const firstName = (payload.firstName || '').trim();
  const lastName = (payload.lastName || '').trim();
  const email = (payload.email || '').trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    throw new HttpError(
      400,
      'First name, last name, and email address are required.'
    );
  }

  const assignedRole = normalizeRbacRole(payload.role);
  if (user.role === 'MANAGER' && assignedRole !== 'EMPLOYEE') {
    throw new HttpError(
      403,
      'Managers may only add EMPLOYEE accounts.',
      'forbidden'
    );
  }

  // If issueInvitation is true, also issue a single-use invitation code
  let invitationCode: string | null = null;
  if (payload.issueInvitation) {
    const grant = await createAccountInvitation({
      workspaceId,
      email,
      firstName,
      lastName,
      role: assignedRole,
      locationIds: payload.locationIds,
      defaultRoleId: payload.defaultRoleId || null,
      invitedById: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      expiresInHours: payload.expiresInHours ?? 168,
    });
    invitationCode = grant.code;
    return NextResponse.json(
      {
        mode: 'invitation_issued',
        invitation: grant.invitation,
        invitationCode,
      },
      { status: 201 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && !existing.deleted) {
    throw new HttpError(
      409,
      'An employee with this email address already exists.'
    );
  }

  const randomPin = String(Math.floor(1000 + Math.random() * 9000));

  const created = await prisma.user.create({
    data: {
      workspaceId,
      email,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      phone: payload.phone?.trim() || null,
      role: assignedRole,
      groupId: payload.groupId || null,
      defaultRoleId: payload.defaultRoleId || null,
      weeklyHours: Number(payload.weeklyHours ?? 40),
      holidayAllowance: Number(payload.holidayAllowance ?? 28),
      salaryType: payload.salaryType || 'hourly',
      hourlyRate: Number(payload.hourlyRate ?? 12.0),
      annualSalary: Number(payload.annualSalary ?? 0),
      employmentType: payload.employmentType || 'Full Time',
      startDate:
        payload.startDate || new Date().toISOString().slice(0, 10),
      pin: randomPin,
      isActive: true,
      deleted: false,
    },
  });

  let locIds = Array.isArray(payload.locationIds) ? payload.locationIds : [];
  if (locIds.length === 0) {
    const primaryLoc = await prisma.location.findFirst({
      where: { workspaceId, deleted: false },
      orderBy: { createdAt: 'asc' },
    });
    if (primaryLoc) locIds = [primaryLoc.id];
  }

  for (const locId of locIds) {
    await prisma.employeeLocation
      .create({
        data: {
          userId: created.id,
          locationId: locId,
          isManager: assignedRole === 'ADMIN' || assignedRole === 'MANAGER',
        },
      })
      .catch(() => undefined);
  }

  const roleIds = Array.isArray(payload.roleIds)
    ? payload.roleIds
    : payload.defaultRoleId
      ? [payload.defaultRoleId]
      : [];
  for (const rId of new Set(roleIds)) {
    await prisma.employeeRole
      .create({
        data: {
          userId: created.id,
          roleId: rId,
        },
      })
      .catch(() => undefined);
  }

  // Update setup wizard step
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (ws) {
    try {
      const steps = JSON.parse(ws.setupStepsJson || '{}');
      steps.employeesAdded = true;
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { setupStepsJson: JSON.stringify(steps) },
      });
    } catch {
      // ignore
    }
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'EMPLOYEE_CREATED',
    targetType: 'User',
    targetId: created.id,
    summary: `Added employee ${created.name} (${created.email}) as ${created.role}`,
  });

  return NextResponse.json({ employee: created }, { status: 201 });
});
