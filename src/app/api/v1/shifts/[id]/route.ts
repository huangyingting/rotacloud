import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { calculateShiftMetrics } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const PATCH = api(async (request, context) => {
  const { user, workspaceId } = await requireUser(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<{
    action?: 'restore' | 'acknowledge' | 'claim';
    locationId?: string;
    roleId?: string;
    userId?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    breaksPaid?: boolean;
    notes?: string;
    published?: boolean;
  }>(request);

  const existing = await prisma.shift.findFirst({
    where: { id, workspaceId },
    include: { role: true, user: true },
  });
  if (!existing) throw new HttpError(404, 'Shift not found.');

  // Employee actions: acknowledge own shift or claim open shift
  if (payload.action === 'acknowledge') {
    const updated = await prisma.shift.update({
      where: { id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
    return NextResponse.json({ shift: updated });
  }

  if (payload.action === 'claim') {
    if (existing.userId) {
      throw new HttpError(409, 'This shift has already been assigned.');
    }
    if (existing.openShiftClaimApprovalRequired) {
      const req = await prisma.shiftRequest.create({
        data: {
          workspaceId,
          shiftId: existing.id,
          requesterUserId: user.id,
          type: 'CLAIM',
          status: 'PENDING',
          reason: 'Claimed open shift',
        },
      });
      return NextResponse.json({
        mode: 'approval_required',
        shiftRequest: req,
      });
    }

    const metrics = calculateShiftMetrics({
      startTime: existing.startTime,
      endTime: existing.endTime,
      breakMinutes: existing.breakMinutes,
      breaksPaid: existing.breaksPaid,
      hourlyRate: user.hourlyRate,
      roleDefaultRate: existing.role.defaultRate,
      salaryType: user.salaryType,
    });

    const claimed = await prisma.shift.update({
      where: { id },
      data: {
        userId: user.id,
        wageCost: metrics.wageCost,
      },
      include: {
        location: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, colour: true } },
        user: { select: { id: true, name: true, firstName: true, lastName: true } },
      },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'OPEN_SHIFT_CLAIMED',
      targetType: 'Shift',
      targetId: id,
      summary: `${user.name} claimed open ${existing.role.name} shift on ${existing.date}`,
    });

    return NextResponse.json({ mode: 'claimed', shift: claimed });
  }

  // Manager/Admin actions
  await requireManagerOrAdmin(request);

  if (payload.action === 'restore') {
    const restored = await prisma.shift.update({
      where: { id },
      data: {
        deleted: false,
        deletedAt: null,
        deletedByUserId: null,
      },
      include: {
        location: { select: { id: true, name: true } },
        role: { select: { id: true, name: true, colour: true } },
        user: { select: { id: true, name: true, firstName: true, lastName: true } },
      },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'SHIFT_RESTORED',
      targetType: 'Shift',
      targetId: id,
      summary: `Restored soft-deleted shift on ${restored.date} (${restored.startTime}-${restored.endTime})`,
    });

    return NextResponse.json({ shift: restored });
  }

  const nextRoleId = payload.roleId || existing.roleId;
  const nextUserId =
    payload.userId !== undefined ? payload.userId : existing.userId;
  const nextStartTime = payload.startTime || existing.startTime;
  const nextEndTime = payload.endTime || existing.endTime;
  const nextBreakMinutes =
    payload.breakMinutes !== undefined
      ? Number(payload.breakMinutes)
      : existing.breakMinutes;
  const nextBreaksPaid =
    payload.breaksPaid !== undefined
      ? Boolean(payload.breaksPaid)
      : existing.breaksPaid;

  const [role, assignee] = await Promise.all([
    prisma.role.findFirst({ where: { id: nextRoleId, workspaceId } }),
    nextUserId
      ? prisma.user.findFirst({ where: { id: nextUserId, workspaceId } })
      : Promise.resolve(null),
  ]);

  const metrics = calculateShiftMetrics({
    startTime: nextStartTime,
    endTime: nextEndTime,
    breakMinutes: nextBreakMinutes,
    breaksPaid: nextBreaksPaid,
    hourlyRate: assignee?.hourlyRate,
    roleDefaultRate: role?.defaultRate ?? existing.role.defaultRate,
    salaryType: assignee?.salaryType,
  });

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      ...(payload.locationId ? { locationId: payload.locationId } : {}),
      roleId: nextRoleId,
      userId: nextUserId,
      ...(payload.date ? { date: payload.date } : {}),
      startTime: nextStartTime,
      endTime: nextEndTime,
      breakMinutes: nextBreakMinutes,
      breaksPaid: nextBreaksPaid,
      netHours: metrics.netHours,
      wageCost: metrics.wageCost,
      ...(payload.notes !== undefined
        ? { notes: payload.notes?.trim() || null }
        : {}),
      ...(payload.published !== undefined
        ? { published: Boolean(payload.published) }
        : {}),
    },
    include: {
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true } },
      user: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SHIFT_UPDATED',
    targetType: 'Shift',
    targetId: id,
    summary: `Updated shift on ${updated.date} (${updated.startTime}-${updated.endTime})`,
  });

  return NextResponse.json({ shift: updated });
});

export const DELETE = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.shift.findFirst({
    where: { id, workspaceId },
    include: { role: true, user: true },
  });
  if (!existing) throw new HttpError(404, 'Shift not found.');

  await prisma.shift.update({
    where: { id },
    data: {
      deleted: true,
      deletedAt: new Date(),
      deletedByUserId: user.id,
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SHIFT_DELETED',
    targetType: 'Shift',
    targetId: id,
    summary: `Soft-deleted ${existing.role.name} shift on ${existing.date} for ${existing.user?.name || 'Open Shifts'}`,
  });

  return NextResponse.json({ ok: true });
});
