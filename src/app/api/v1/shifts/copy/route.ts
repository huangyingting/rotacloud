import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { addDays } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    locationId?: string;
    sourceWeekStart?: string;
    targetWeekStart?: string;
  }>(request);

  if (!payload.sourceWeekStart || !payload.targetWeekStart) {
    throw new HttpError(
      400,
      'sourceWeekStart and targetWeekStart (YYYY-MM-DD) are required.'
    );
  }

  const sourceEnd = addDays(payload.sourceWeekStart, 6);
  const sourceShifts = await prisma.shift.findMany({
    where: {
      workspaceId,
      deleted: false,
      ...(payload.locationId ? { locationId: payload.locationId } : {}),
      date: { gte: payload.sourceWeekStart, lte: sourceEnd },
    },
  });

  const sourceMondayMs = new Date(`${payload.sourceWeekStart}T12:00:00Z`).getTime();
  const createdShifts = [];

  for (const s of sourceShifts) {
    const sDateMs = new Date(`${s.date}T12:00:00Z`).getTime();
    const dayOffset = Math.round((sDateMs - sourceMondayMs) / 86400000);
    const targetDate = addDays(payload.targetWeekStart, dayOffset);

    const cloned = await prisma.shift.create({
      data: {
        workspaceId,
        locationId: s.locationId,
        roleId: s.roleId,
        userId: s.userId,
        date: targetDate,
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        breaksPaid: s.breaksPaid,
        netHours: s.netHours,
        wageCost: s.wageCost,
        notes: s.notes,
        published: false,
        createdByUserId: user.id,
      },
    });
    createdShifts.push(cloned);
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SHIFTS_COPIED',
    targetType: 'Shift',
    summary: `Copied ${createdShifts.length} shift(s) from week ${payload.sourceWeekStart} to ${payload.targetWeekStart}`,
  });

  return NextResponse.json({
    ok: true,
    copiedCount: createdShifts.length,
  });
});
