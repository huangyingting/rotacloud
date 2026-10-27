import { NextResponse } from 'next/server';
import { api, parseJsonBody, requireManagerOrAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    locationId?: string;
    startDate?: string;
    endDate?: string;
    shiftIds?: string[];
  }>(request);

  const result = await prisma.shift.updateMany({
    where: {
      workspaceId,
      deleted: false,
      published: false,
      ...(payload.locationId ? { locationId: payload.locationId } : {}),
      ...(payload.startDate && payload.endDate
        ? { date: { gte: payload.startDate, lte: payload.endDate } }
        : {}),
      ...(Array.isArray(payload.shiftIds) && payload.shiftIds.length > 0
        ? { id: { in: payload.shiftIds } }
        : {}),
    },
    data: {
      published: true,
    },
  });

  // Update setup wizard step
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (ws) {
    try {
      const steps = JSON.parse(ws.setupStepsJson || '{}');
      steps.shiftPublished = true;
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { setupStepsJson: JSON.stringify(steps) },
      });
    } catch {
      // ignore
    }
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SHIFTS_PUBLISHED',
    targetType: 'Shift',
    summary: `Published ${result.count} shift(s) on the rota`,
    metadata: {
      publishedCount: result.count,
      locationId: payload.locationId,
      startDate: payload.startDate,
      endDate: payload.endDate,
    },
  });

  return NextResponse.json({
    ok: true,
    publishedCount: result.count,
  });
});
