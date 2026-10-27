import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  calculateShiftMetrics,
  calculateStatutoryHolidayAccrual,
  evaluateTimesheetDiscrepancies,
} from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const PATCH = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<{
    status?: 'OPEN' | 'SUBMITTED' | 'APPROVED';
    clockInTime?: string;
    clockOutTime?: string;
    breakMinutes?: number;
    notes?: string;
  }>(request);

  const existing = await prisma.timesheet.findFirst({
    where: { id, workspaceId },
    include: { user: true, role: true },
  });
  if (!existing) throw new HttpError(404, 'Timesheet not found.');

  const inTime = payload.clockInTime ?? existing.clockInTime ?? '09:00';
  const outTime = payload.clockOutTime ?? existing.clockOutTime ?? '17:00';
  const breakMinutes =
    payload.breakMinutes !== undefined
      ? Number(payload.breakMinutes)
      : existing.breakMinutes;

  const metrics = calculateShiftMetrics({
    startTime: inTime,
    endTime: outTime,
    breakMinutes,
    hourlyRate: existing.user.hourlyRate,
    roleDefaultRate: existing.role.defaultRate,
    salaryType: existing.user.salaryType,
  });

  const flags = evaluateTimesheetDiscrepancies({
    scheduledStart: existing.scheduledStart,
    scheduledEnd: existing.scheduledEnd,
    clockInTime: inTime,
    clockOutTime: outTime,
  });

  const accruedHolidayHours = calculateStatutoryHolidayAccrual(
    metrics.netHours,
    existing.user.holidayAccrualRate || 12.07
  );

  const nextStatus = payload.status || existing.status;

  const updated = await prisma.timesheet.update({
    where: { id },
    data: {
      clockInTime: inTime,
      clockOutTime: outTime,
      breakMinutes,
      workedHours: metrics.netHours,
      wageCost: metrics.wageCost,
      accruedHolidayHours,
      status: nextStatus,
      discrepancyFlagsJson: JSON.stringify(flags),
      ...(payload.notes !== undefined
        ? { notes: payload.notes?.trim() || null }
        : {}),
      ...(nextStatus === 'APPROVED'
        ? { approvedByUserId: user.id, approvedAt: new Date() }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action:
      nextStatus === 'APPROVED' ? 'TIMESHEET_APPROVED' : 'TIMESHEET_UPDATED',
    targetType: 'Timesheet',
    targetId: id,
    summary: `${user.name} updated timesheet for ${existing.user.name} on ${existing.date} [${nextStatus}]`,
  });

  return NextResponse.json({ timesheet: updated });
});

export const DELETE = api(async (request, context) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.timesheet.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Timesheet not found.');

  await prisma.timesheet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
