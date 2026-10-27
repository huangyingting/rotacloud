import { NextResponse } from 'next/server';
import { api, HttpError, parseJsonBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  calculateShiftMetrics,
  calculateStatutoryHolidayAccrual,
  evaluateTimesheetDiscrepancies,
} from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const locationId = url.searchParams.get('locationId') || undefined;
  const status = url.searchParams.get('status') || undefined;

  const timesheets = await prisma.timesheet.findMany({
    where: {
      workspaceId,
      ...(locationId ? { locationId } : {}),
      ...(status ? { status } : {}),
      ...(startDate && endDate
        ? { date: { gte: startDate, lte: endDate } }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          hourlyRate: true,
          payrollId: true,
        },
      },
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true } },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ timesheets });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{
    mode?: 'clock_in' | 'clock_out' | 'pin_clock' | 'manual';
    pin?: string;
    userId?: string;
    locationId?: string;
    roleId?: string;
    shiftId?: string | null;
    date?: string;
    scheduledStart?: string;
    scheduledEnd?: string;
    clockInTime?: string;
    clockOutTime?: string;
    breakMinutes?: number;
    notes?: string;
  }>(request);

  let targetUser = await prisma.user.findFirst({
    where: {
      workspaceId,
      ...(payload.mode === 'pin_clock' && payload.pin
        ? { pin: payload.pin.trim() }
        : { id: payload.userId || user.id }),
      deleted: false,
    },
  });

  if (!targetUser) {
    throw new HttpError(
      404,
      payload.mode === 'pin_clock'
        ? 'No active employee found with that 4-digit PIN.'
        : 'Employee not found.'
    );
  }

  const today = payload.date || new Date().toISOString().slice(0, 10);
  const nowHHMM = new Date().toTimeString().slice(0, 5);

  const [primaryLocation, primaryRole, matchingShift] = await Promise.all([
    payload.locationId
      ? prisma.location.findFirst({
          where: { id: payload.locationId, workspaceId },
        })
      : prisma.location.findFirst({
          where: { workspaceId, deleted: false },
          orderBy: { createdAt: 'asc' },
        }),
    payload.roleId
      ? prisma.role.findFirst({ where: { id: payload.roleId, workspaceId } })
      : targetUser.defaultRoleId
        ? prisma.role.findFirst({
            where: { id: targetUser.defaultRoleId, workspaceId },
          })
        : prisma.role.findFirst({
            where: { workspaceId, deleted: false },
            orderBy: { createdAt: 'asc' },
          }),
    prisma.shift.findFirst({
      where: {
        workspaceId,
        userId: targetUser.id,
        date: today,
        deleted: false,
      },
    }),
  ]);

  if (!primaryLocation) {
    throw new HttpError(400, 'Create a location before recording timesheets.');
  }

  let effectiveRole = primaryRole;
  if (!effectiveRole) {
    effectiveRole = await prisma.role.create({
      data: {
        workspaceId,
        name: 'General Staff',
        colour: '#0a65fc',
        defaultRate: targetUser.hourlyRate || 12.0,
      },
    });
  }

  // Handle PIN clock toggle or explicit clock_in / clock_out
  if (
    payload.mode === 'pin_clock' ||
    payload.mode === 'clock_in' ||
    payload.mode === 'clock_out'
  ) {
    const openSheet = await prisma.timesheet.findFirst({
      where: {
        workspaceId,
        userId: targetUser.id,
        date: today,
        clockOutTime: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      openSheet &&
      (payload.mode === 'clock_out' || payload.mode === 'pin_clock')
    ) {
      const outTime = payload.clockOutTime || nowHHMM;
      const inTime = openSheet.clockInTime || '09:00';
      const metrics = calculateShiftMetrics({
        startTime: inTime,
        endTime: outTime,
        breakMinutes: openSheet.breakMinutes,
        hourlyRate: targetUser.hourlyRate,
        roleDefaultRate: effectiveRole.defaultRate,
        salaryType: targetUser.salaryType,
      });

      const flags = evaluateTimesheetDiscrepancies({
        scheduledStart: openSheet.scheduledStart,
        scheduledEnd: openSheet.scheduledEnd,
        clockInTime: inTime,
        clockOutTime: outTime,
      });

      const accruedHoliday = calculateStatutoryHolidayAccrual(
        metrics.netHours,
        targetUser.holidayAccrualRate || 12.07
      );

      const closed = await prisma.timesheet.update({
        where: { id: openSheet.id },
        data: {
          clockOutTime: outTime,
          workedHours: metrics.netHours,
          wageCost: metrics.wageCost,
          accruedHolidayHours: accruedHoliday,
          status: 'SUBMITTED',
          discrepancyFlagsJson: JSON.stringify(flags),
        },
        include: {
          user: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          role: { select: { id: true, name: true, colour: true } },
        },
      });

      await recordAuditLog({
        workspaceId,
        actorUserId: targetUser.id,
        actorEmail: targetUser.email,
        actorRole: targetUser.role,
        action: 'TIMESHEET_CLOCK_OUT',
        targetType: 'Timesheet',
        targetId: closed.id,
        summary: `${targetUser.name} clocked out at ${outTime} (${closed.workedHours}h worked)`,
      });

      return NextResponse.json({ action: 'clocked_out', timesheet: closed });
    }

    const inTime = payload.clockInTime || nowHHMM;
    const schedStart =
      payload.scheduledStart || matchingShift?.startTime || null;
    const schedEnd = payload.scheduledEnd || matchingShift?.endTime || null;
    const flags = evaluateTimesheetDiscrepancies({
      scheduledStart: schedStart,
      scheduledEnd: schedEnd,
      clockInTime: inTime,
      clockOutTime: null,
    });

    const created = await prisma.timesheet.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        locationId: primaryLocation.id,
        roleId: matchingShift?.roleId || effectiveRole.id,
        shiftId: matchingShift?.id || null,
        date: today,
        scheduledStart: schedStart,
        scheduledEnd: schedEnd,
        clockInTime: inTime,
        clockOutTime: null,
        breakMinutes: matchingShift?.breakMinutes || 0,
        workedHours: 0,
        wageCost: 0,
        accruedHolidayHours: 0,
        status: 'OPEN',
        discrepancyFlagsJson: JSON.stringify(flags),
      },
      include: {
        user: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, colour: true } },
      },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: targetUser.id,
      actorEmail: targetUser.email,
      actorRole: targetUser.role,
      action: 'TIMESHEET_CLOCK_IN',
      targetType: 'Timesheet',
      targetId: created.id,
      summary: `${targetUser.name} clocked in at ${inTime} (${primaryLocation.name})`,
    });

    return NextResponse.json(
      { action: 'clocked_in', timesheet: created },
      { status: 201 }
    );
  }

  // Manual timesheet entry
  const clockInTime = (payload.clockInTime || '09:00').trim();
  const clockOutTime = (payload.clockOutTime || '17:00').trim();
  const breakMinutes = Number(
    payload.breakMinutes ?? matchingShift?.breakMinutes ?? 30
  );

  const metrics = calculateShiftMetrics({
    startTime: clockInTime,
    endTime: clockOutTime,
    breakMinutes,
    hourlyRate: targetUser.hourlyRate,
    roleDefaultRate: effectiveRole.defaultRate,
    salaryType: targetUser.salaryType,
  });

  const schedStart =
    payload.scheduledStart ?? matchingShift?.startTime ?? clockInTime;
  const schedEnd =
    payload.scheduledEnd ?? matchingShift?.endTime ?? clockOutTime;

  const flags = evaluateTimesheetDiscrepancies({
    scheduledStart: schedStart,
    scheduledEnd: schedEnd,
    clockInTime,
    clockOutTime,
  });

  const accruedHoliday = calculateStatutoryHolidayAccrual(
    metrics.netHours,
    targetUser.holidayAccrualRate || 12.07
  );

  const timesheet = await prisma.timesheet.create({
    data: {
      workspaceId,
      userId: targetUser.id,
      locationId: primaryLocation.id,
      roleId: effectiveRole.id,
      shiftId: matchingShift?.id || null,
      date: today,
      scheduledStart: schedStart,
      scheduledEnd: schedEnd,
      clockInTime,
      clockOutTime,
      breakMinutes,
      workedHours: metrics.netHours,
      wageCost: metrics.wageCost,
      accruedHolidayHours: accruedHoliday,
      status: 'SUBMITTED',
      discrepancyFlagsJson: JSON.stringify(flags),
      notes: payload.notes?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, firstName: true, lastName: true } },
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'TIMESHEET_CREATED',
    targetType: 'Timesheet',
    targetId: timesheet.id,
    summary: `Recorded timesheet for ${targetUser.name} on ${today} (${clockInTime}-${clockOutTime}, ${timesheet.workedHours}h)`,
  });

  return NextResponse.json({ timesheet }, { status: 201 });
});
