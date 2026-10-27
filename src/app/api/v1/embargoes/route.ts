import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const embargoes = await prisma.leaveEmbargo.findMany({
    where: { workspaceId },
    include: { location: { select: { id: true, name: true } } },
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json({ embargoes });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    startDate?: string;
    endDate?: string;
    locationId?: string | null;
    appliesToAll?: boolean;
  }>(request);

  const name = (payload.name || '').trim();
  const startDate = (payload.startDate || '').trim();
  const endDate = (payload.endDate || startDate).trim();
  if (!name || !startDate) {
    throw new HttpError(400, 'Embargo name and startDate are required.');
  }

  const embargo = await prisma.leaveEmbargo.create({
    data: {
      workspaceId,
      name,
      startDate,
      endDate,
      locationId: payload.locationId || null,
      appliesToAll: payload.appliesToAll ?? !payload.locationId,
    },
    include: { location: { select: { id: true, name: true } } },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'EMBARGO_CREATED',
    targetType: 'LeaveEmbargo',
    targetId: embargo.id,
    summary: `Created Leave Embargo "${embargo.name}" (${startDate} to ${endDate})`,
  });

  return NextResponse.json({ embargo }, { status: 201 });
});
