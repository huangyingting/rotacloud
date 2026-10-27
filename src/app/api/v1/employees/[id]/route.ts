import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { normalizeRbacRole } from '@/lib/account-admission/policy';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request, context) => {
  const { user, workspaceId } = await requireUser(request);
  const { id } = await context.params;

  if (user.role === 'EMPLOYEE' && user.id !== id) {
    throw new HttpError(403, 'You can only view your own employee profile.');
  }

  const employee = await prisma.user.findFirst({
    where: { id, workspaceId },
    include: {
      defaultRole: true,
      group: true,
      employeeLocations: { include: { location: true } },
      employeeRoles: { include: { role: true } },
      leaveRecords: { orderBy: { startDate: 'desc' }, take: 20 },
      toilEntries: { orderBy: { date: 'desc' }, take: 20 },
    },
  });

  if (!employee) throw new HttpError(404, 'Employee not found.');

  return NextResponse.json({ employee });
});

export const PATCH = api(async (request, context) => {
  const { user, workspaceId } = await requireUser(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<Record<string, unknown>>(request);

  const existing = await prisma.user.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Employee not found.');

  // Employees can only update their own contact/emergency fields
  if (user.role === 'EMPLOYEE') {
    if (user.id !== id) {
      throw new HttpError(403, 'Forbidden.');
    }
    const updatedSelf = await prisma.user.update({
      where: { id },
      data: {
        ...(typeof payload.phone === 'string'
          ? { phone: payload.phone.trim() || null }
          : {}),
        ...(typeof payload.preferredName === 'string'
          ? { preferredName: payload.preferredName.trim() || null }
          : {}),
        ...(typeof payload.address1 === 'string'
          ? { address1: payload.address1.trim() || null }
          : {}),
        ...(typeof payload.city === 'string'
          ? { city: payload.city.trim() || null }
          : {}),
        ...(typeof payload.postcode === 'string'
          ? { postcode: payload.postcode.trim() || null }
          : {}),
        ...(typeof payload.emergencyContactName === 'string'
          ? { emergencyContactName: payload.emergencyContactName.trim() || null }
          : {}),
        ...(typeof payload.emergencyContactPhone === 'string'
          ? {
              emergencyContactPhone:
                payload.emergencyContactPhone.trim() || null,
            }
          : {}),
        ...(typeof payload.emergencyContactRelation === 'string'
          ? {
              emergencyContactRelation:
                payload.emergencyContactRelation.trim() || null,
            }
          : {}),
      },
    });
    return NextResponse.json({ employee: updatedSelf });
  }

  // Manager or Admin update across all 6 profile tabs
  const firstName =
    typeof payload.firstName === 'string'
      ? payload.firstName.trim()
      : existing.firstName;
  const lastName =
    typeof payload.lastName === 'string'
      ? payload.lastName.trim()
      : existing.lastName;

  const nextRole =
    typeof payload.role === 'string'
      ? normalizeRbacRole(payload.role)
      : existing.role;
  if (user.role === 'MANAGER' && nextRole === 'ADMIN') {
    throw new HttpError(403, 'Only Administrators can grant ADMIN role.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      ...(typeof payload.middleName === 'string'
        ? { middleName: payload.middleName.trim() || null }
        : {}),
      ...(typeof payload.preferredName === 'string'
        ? { preferredName: payload.preferredName.trim() || null }
        : {}),
      ...(typeof payload.email === 'string' && payload.email.trim()
        ? { email: payload.email.trim().toLowerCase() }
        : {}),
      role: nextRole,
      ...(typeof payload.isActive === 'boolean'
        ? { isActive: payload.isActive }
        : {}),
      ...(typeof payload.deleted === 'boolean'
        ? {
            deleted: payload.deleted,
            deletedAt: payload.deleted ? new Date() : null,
          }
        : {}),
      ...(typeof payload.pin === 'string' ? { pin: payload.pin.trim() } : {}),
      ...(typeof payload.phone === 'string'
        ? { phone: payload.phone.trim() || null }
        : {}),
      ...(typeof payload.dob === 'string'
        ? { dob: payload.dob.trim() || null }
        : {}),
      ...(typeof payload.gender === 'string'
        ? { gender: payload.gender.trim() || null }
        : {}),
      ...(typeof payload.startDate === 'string'
        ? { startDate: payload.startDate.trim() || null }
        : {}),
      ...(typeof payload.finalWorkingDate === 'string'
        ? { finalWorkingDate: payload.finalWorkingDate.trim() || null }
        : {}),
      ...(typeof payload.employmentType === 'string'
        ? { employmentType: payload.employmentType }
        : {}),
      ...(typeof payload.rightToWorkChecked === 'boolean'
        ? { rightToWorkChecked: payload.rightToWorkChecked }
        : {}),
      ...(payload.weeklyHours !== undefined
        ? { weeklyHours: Number(payload.weeklyHours) }
        : {}),
      ...(payload.maxWeeklyHours !== undefined
        ? { maxWeeklyHours: Number(payload.maxWeeklyHours) }
        : {}),
      ...(typeof payload.optedOutWtd === 'boolean'
        ? { optedOutWtd: payload.optedOutWtd }
        : {}),
      ...(payload.holidayAllowance !== undefined
        ? { holidayAllowance: Number(payload.holidayAllowance) }
        : {}),
      ...(typeof payload.holidayAllowanceUnit === 'string'
        ? { holidayAllowanceUnit: payload.holidayAllowanceUnit }
        : {}),
      ...(typeof payload.accruesHoliday === 'boolean'
        ? { accruesHoliday: payload.accruesHoliday }
        : {}),
      ...(payload.holidayAccrualRate !== undefined
        ? { holidayAccrualRate: Number(payload.holidayAccrualRate) }
        : {}),
      ...(typeof payload.salaryType === 'string'
        ? { salaryType: payload.salaryType }
        : {}),
      ...(payload.hourlyRate !== undefined
        ? { hourlyRate: Number(payload.hourlyRate) }
        : {}),
      ...(payload.annualSalary !== undefined
        ? { annualSalary: Number(payload.annualSalary) }
        : {}),
      ...(payload.overtimeRate !== undefined
        ? { overtimeRate: Number(payload.overtimeRate) }
        : {}),
      ...(typeof payload.payrollId === 'string'
        ? { payrollId: payload.payrollId.trim() || null }
        : {}),
      ...(typeof payload.niNumber === 'string'
        ? { niNumber: payload.niNumber.trim().toUpperCase() || null }
        : {}),
      ...(payload.defaultRoleId !== undefined
        ? {
            defaultRoleId:
              typeof payload.defaultRoleId === 'string' && payload.defaultRoleId
                ? payload.defaultRoleId
                : null,
          }
        : {}),
      ...(payload.groupId !== undefined
        ? {
            groupId:
              typeof payload.groupId === 'string' && payload.groupId
                ? payload.groupId
                : null,
          }
        : {}),
      ...(typeof payload.address1 === 'string'
        ? { address1: payload.address1.trim() || null }
        : {}),
      ...(typeof payload.city === 'string'
        ? { city: payload.city.trim() || null }
        : {}),
      ...(typeof payload.postcode === 'string'
        ? { postcode: payload.postcode.trim() || null }
        : {}),
      ...(typeof payload.emergencyContactName === 'string'
        ? { emergencyContactName: payload.emergencyContactName.trim() || null }
        : {}),
      ...(typeof payload.emergencyContactPhone === 'string'
        ? {
            emergencyContactPhone:
              payload.emergencyContactPhone.trim() || null,
          }
        : {}),
      ...(typeof payload.emergencyContactRelation === 'string'
        ? {
            emergencyContactRelation:
              payload.emergencyContactRelation.trim() || null,
          }
        : {}),
      ...(payload.workSchedule !== undefined
        ? { workScheduleJson: JSON.stringify(payload.workSchedule) }
        : {}),
      ...(payload.roleRates !== undefined
        ? { roleRatesJson: JSON.stringify(payload.roleRates) }
        : {}),
      ...(typeof payload.notes === 'string'
        ? { notes: payload.notes.trim() || null }
        : {}),
    },
  });

  if (Array.isArray(payload.locationIds)) {
    const managerLocationIds = new Set(
      Array.isArray(payload.managerLocationIds)
        ? (payload.managerLocationIds as string[])
        : []
    );
    await prisma.employeeLocation.deleteMany({ where: { userId: id } });
    for (const locId of payload.locationIds as string[]) {
      await prisma.employeeLocation
        .create({
          data: {
            userId: id,
            locationId: locId,
            isManager:
              managerLocationIds.has(locId) ||
              updated.role === 'ADMIN' ||
              updated.role === 'MANAGER',
          },
        })
        .catch(() => undefined);
    }
  }

  if (Array.isArray(payload.roleIds)) {
    await prisma.employeeRole.deleteMany({ where: { userId: id } });
    for (const roleId of payload.roleIds as string[]) {
      await prisma.employeeRole
        .create({
          data: {
            userId: id,
            roleId,
          },
        })
        .catch(() => undefined);
    }
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'EMPLOYEE_UPDATED',
    targetType: 'User',
    targetId: id,
    summary: `Updated employee profile for ${updated.name} (${updated.email})`,
  });

  return NextResponse.json({ employee: updated });
});

export const DELETE = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  if (id === user.id) {
    throw new HttpError(400, 'You cannot archive your own active account.');
  }

  const existing = await prisma.user.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Employee not found.');

  await prisma.user.update({
    where: { id },
    data: {
      deleted: true,
      deletedAt: new Date(),
      isActive: false,
      finalWorkingDate:
        existing.finalWorkingDate || new Date().toISOString().slice(0, 10),
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'EMPLOYEE_ARCHIVED',
    targetType: 'User',
    targetId: id,
    summary: `Moved employee ${existing.name} (${existing.email}) to Past Employees`,
  });

  return NextResponse.json({ ok: true });
});
