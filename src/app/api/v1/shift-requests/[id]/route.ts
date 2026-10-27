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
    status?: 'APPROVED' | 'DECLINED';
    managerNote?: string;
  }>(request);

  if (!payload.status || !['APPROVED', 'DECLINED'].includes(payload.status)) {
    throw new HttpError(400, 'status must be APPROVED or DECLINED.');
  }

  const existing = await prisma.shiftRequest.findFirst({
    where: { id, workspaceId },
    include: { shift: true, requester: true, target: true },
  });
  if (!existing) throw new HttpError(404, 'Shift request not found.');

  const updated = await prisma.$transaction(async (tx) => {
    const req = await tx.shiftRequest.update({
      where: { id },
      data: {
        status: payload.status,
        managerNote: payload.managerNote?.trim() || null,
        reviewedByUserId: user.id,
        reviewedAt: new Date(),
      },
    });

    if (payload.status === 'APPROVED') {
      if (existing.type === 'CLAIM') {
        await tx.shift.update({
          where: { id: existing.shiftId },
          data: { userId: existing.requesterUserId },
        });
      } else if (existing.type === 'DROP') {
        await tx.shift.update({
          where: { id: existing.shiftId },
          data: { userId: null },
        });
      } else if (existing.type === 'SWAP' && existing.targetUserId) {
        await tx.shift.update({
          where: { id: existing.shiftId },
          data: { userId: existing.targetUserId },
        });
      }
    }

    return req;
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: `SHIFT_REQUEST_${payload.status}`,
    targetType: 'ShiftRequest',
    targetId: id,
    summary: `${user.name} ${payload.status.toLowerCase()} ${existing.type} request from ${existing.requester.name}`,
  });

  return NextResponse.json({ shiftRequest: updated });
});
