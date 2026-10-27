import { randomBytes } from 'node:crypto';
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
  const terminals = await prisma.clockingTerminal.findMany({
    where: { workspaceId },
    include: { location: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ terminals });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    locationId?: string;
  }>(request);

  const name = (payload.name || '').trim();
  if (!name || !payload.locationId) {
    throw new HttpError(400, 'Terminal name and locationId are required.');
  }

  const deviceCode = `TERM-${randomBytes(3).toString('hex').toUpperCase()}`;

  const terminal = await prisma.clockingTerminal.create({
    data: {
      workspaceId,
      locationId: payload.locationId,
      name,
      deviceCode,
      lastPingAt: new Date(),
      isActive: true,
    },
    include: { location: { select: { id: true, name: true } } },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'TERMINAL_CREATED',
    targetType: 'ClockingTerminal',
    targetId: terminal.id,
    summary: `Registered clocking terminal "${terminal.name}" (${terminal.deviceCode})`,
  });

  return NextResponse.json({ terminal }, { status: 201 });
});
