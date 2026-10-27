import { NextResponse } from 'next/server';
import { api, HttpError, parseJsonBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const shiftRequests = await prisma.shiftRequest.findMany({
    where: { workspaceId },
    include: {
      shift: {
        include: {
          location: { select: { id: true, name: true } },
          role: { select: { id: true, name: true, colour: true } },
        },
      },
      requester: {
        select: { id: true, name: true, firstName: true, lastName: true, email: true },
      },
      target: {
        select: { id: true, name: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ shiftRequests });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{
    shiftId?: string;
    type?: 'CLAIM' | 'DROP' | 'SWAP';
    targetUserId?: string | null;
    reason?: string;
  }>(request);

  if (!payload.shiftId || !payload.type) {
    throw new HttpError(400, 'shiftId and type (CLAIM | DROP | SWAP) are required.');
  }

  const shift = await prisma.shift.findFirst({
    where: { id: payload.shiftId, workspaceId, deleted: false },
  });
  if (!shift) throw new HttpError(404, 'Shift not found.');

  const shiftRequest = await prisma.shiftRequest.create({
    data: {
      workspaceId,
      shiftId: shift.id,
      requesterUserId: user.id,
      targetUserId: payload.targetUserId || null,
      type: payload.type,
      status: 'PENDING',
      reason: payload.reason?.trim() || null,
    },
    include: {
      shift: { include: { role: true, location: true } },
      requester: { select: { id: true, name: true, email: true } },
      target: { select: { id: true, name: true, email: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: `SHIFT_${payload.type}_REQUESTED`,
    targetType: 'ShiftRequest',
    targetId: shiftRequest.id,
    summary: `${user.name} submitted a ${payload.type} request for shift on ${shift.date}`,
  });

  return NextResponse.json({ shiftRequest }, { status: 201 });
});
