import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const PATCH = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<{
    status?: 'APPROVED' | 'DECLINED' | 'REQUESTED';
    managerNote?: string;
    unassignClashingShifts?: boolean;
  }>(request);

  const existing = await prisma.leaveRecord.findFirst({
    where: { id, workspaceId },
    include: { user: true },
  });
  if (!existing) throw new HttpError(404, 'Leave record not found.');

  const updated = await prisma.leaveRecord.update({
    where: { id },
    data: {
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.managerNote !== undefined
        ? { managerNote: payload.managerNote?.trim() || null }
        : {}),
      reviewedByUserId: user.id,
      reviewedAt: new Date(),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  if (payload.status === 'APPROVED' && payload.unassignClashingShifts) {
    await prisma.shift.updateMany({
      where: {
        workspaceId,
        userId: existing.userId,
        deleted: false,
        date: { gte: existing.startDate, lte: existing.endDate },
      },
      data: {
        userId: null,
      },
    });
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: `LEAVE_${payload.status || 'UPDATED'}`,
    targetType: 'LeaveRecord',
    targetId: id,
    summary: `${user.name} set leave (${existing.leaveTypeName}: ${existing.startDate} to ${existing.endDate}) for ${existing.user.name} to ${updated.status}`,
  });

  return NextResponse.json({ leaveRecord: updated });
});

export const DELETE = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.leaveRecord.findFirst({
    where: { id, workspaceId },
    include: { user: true },
  });
  if (!existing) throw new HttpError(404, 'Leave record not found.');

  await prisma.leaveRecord.delete({ where: { id } });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LEAVE_DELETED',
    targetType: 'LeaveRecord',
    targetId: id,
    summary: `Deleted ${existing.leaveTypeName} record (${existing.startDate} to ${existing.endDate}) for ${existing.user.name}`,
  });

  return NextResponse.json({ ok: true });
});
