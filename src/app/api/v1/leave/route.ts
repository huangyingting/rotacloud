import { NextResponse } from 'next/server';
import { api, HttpError, parseJsonBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  calculateLeaveDuration,
  detectLeaveEmbargoConflicts,
  detectLeaveShiftClashes,
  getLeaveTypeById,
  SYSTEM_LEAVE_TYPES,
} from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const year = url.searchParams.get('year') || new Date().getFullYear().toString();
  const userId = url.searchParams.get('userId') || undefined;

  const [leaveRecords, employees, embargoes] = await Promise.all([
    prisma.leaveRecord.findMany({
      where: {
        workspaceId,
        ...(userId ? { userId } : {}),
        startDate: { lte: `${year}-12-31` },
        endDate: { gte: `${year}-01-01` },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            holidayAllowance: true,
            holidayAllowanceUnit: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.user.findMany({
      where: { workspaceId, deleted: false },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        holidayAllowance: true,
        holidayAllowanceUnit: true,
        accruesHoliday: true,
        holidayAccrualRate: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.leaveEmbargo.findMany({
      where: { workspaceId },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  const allowanceMatrix = employees.map((emp) => {
    const allowance = Number(emp.holidayAllowance ?? 28);
    const usedDays = leaveRecords
      .filter(
        (lr) =>
          lr.userId === emp.id &&
          lr.status !== 'DECLINED' &&
          (lr.leaveTypeId === 1 || lr.leaveTypeName === 'Holiday')
      )
      .reduce((acc, lr) => acc + Number(lr.daysCount ?? 1), 0);
    return {
      id: emp.id,
      name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      allowance,
      usedDays,
      remainingDays: Math.max(0, allowance - usedDays),
    };
  });

  return NextResponse.json({
    leaveRecords,
    employees,
    allowanceMatrix,
    embargoes,
    systemLeaveTypes: SYSTEM_LEAVE_TYPES,
  });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{
    userId?: string;
    leaveTypeId?: number;
    startDate?: string;
    endDate?: string;
    daysCount?: number;
    hoursCount?: number;
    paid?: boolean;
    status?: string;
    notes?: string;
    forceOverrideEmbargo?: boolean;
  }>(request);

  const targetUserId =
    user.role === 'EMPLOYEE' ? user.id : payload.userId || user.id;

  const startDate = (payload.startDate || '').trim();
  const endDate = (payload.endDate || startDate).trim();
  if (!startDate) {
    throw new HttpError(400, 'Start date (YYYY-MM-DD) is required.');
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, workspaceId },
    include: { employeeLocations: true },
  });
  if (!targetUser) throw new HttpError(404, 'Employee not found.');

  const leaveType = getLeaveTypeById(Number(payload.leaveTypeId || 1));

  // Check Leave Embargoes
  const embargoes = await prisma.leaveEmbargo.findMany({
    where: { workspaceId },
  });
  const embargoConflicts = detectLeaveEmbargoConflicts(
    {
      startDate,
      endDate,
      locationIds: targetUser.employeeLocations.map((el) => el.locationId),
    },
    embargoes
  );

  if (
    embargoConflicts.length > 0 &&
    (user.role === 'EMPLOYEE' || !payload.forceOverrideEmbargo)
  ) {
    throw new HttpError(
      409,
      `Leave period conflicts with active Leave Embargo: "${embargoConflicts[0].name}" (${embargoConflicts[0].startDate} to ${embargoConflicts[0].endDate}).`,
      'embargo_conflict'
    );
  }

  // Calculate duration and detect clashing shifts
  const calculated = calculateLeaveDuration({
    startDate,
    endDate,
    workScheduleJson: targetUser.workScheduleJson,
    weeklyHours: targetUser.weeklyHours,
  });

  const daysCount =
    payload.daysCount !== undefined
      ? Number(payload.daysCount)
      : calculated.daysCount;
  const hoursCount =
    payload.hoursCount !== undefined
      ? Number(payload.hoursCount)
      : calculated.hoursCount;

  const existingShifts = await prisma.shift.findMany({
    where: {
      workspaceId,
      userId: targetUserId,
      deleted: false,
      date: { gte: startDate, lte: endDate },
    },
    include: { role: true, location: true },
  });

  const clashingShifts = detectLeaveShiftClashes(
    { userId: targetUserId, startDate, endDate },
    existingShifts
  );

  const initialStatus =
    user.role === 'ADMIN' || user.role === 'MANAGER'
      ? payload.status || 'APPROVED'
      : 'REQUESTED';

  const leaveRecord = await prisma.leaveRecord.create({
    data: {
      workspaceId,
      userId: targetUserId,
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      startDate,
      endDate,
      daysCount,
      hoursCount,
      paid:
        payload.paid !== undefined ? Boolean(payload.paid) : leaveType.defaultPaid,
      status: initialStatus,
      notes: payload.notes?.trim() || null,
      ...(initialStatus === 'APPROVED'
        ? { reviewedByUserId: user.id, reviewedAt: new Date() }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action:
      initialStatus === 'APPROVED' ? 'LEAVE_CREATED_APPROVED' : 'LEAVE_REQUESTED',
    targetType: 'LeaveRecord',
    targetId: leaveRecord.id,
    summary: `${targetUser.name}: ${leaveType.name} (${startDate} to ${endDate}, ${daysCount}d / ${hoursCount}h) [${initialStatus}]`,
    metadata: {
      clashingShiftCount: clashingShifts.length,
      clashingShiftDates: clashingShifts.map((s) => s.date),
    },
  });

  return NextResponse.json(
    {
      leaveRecord,
      clashingShifts,
      embargoConflicts,
    },
    { status: 201 }
  );
});
