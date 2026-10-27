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
  const locations = await prisma.location.findMany({
    where: { workspaceId, deleted: false },
    include: {
      employeeLocations: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              deleted: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ locations });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    timezone?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    geofenceRadiusMeters?: number;
    clockInIps?: string;
    employeeIds?: string[];
    managerIds?: string[];
  }>(request);

  const name = (payload.name || '').trim();
  if (!name) {
    throw new HttpError(400, 'Location name is required.');
  }

  const location = await prisma.location.create({
    data: {
      workspaceId,
      name,
      timezone: (payload.timezone || 'Europe/London').trim(),
      address: payload.address?.trim() || null,
      latitude:
        typeof payload.latitude === 'number' ? payload.latitude : null,
      longitude:
        typeof payload.longitude === 'number' ? payload.longitude : null,
      geofenceRadiusMeters: Number(payload.geofenceRadiusMeters || 150),
      clockInIps: payload.clockInIps?.trim() || null,
    },
  });

  const employeeIds = Array.isArray(payload.employeeIds)
    ? payload.employeeIds
    : [user.id];
  const managerSet = new Set(
    Array.isArray(payload.managerIds) ? payload.managerIds : [user.id]
  );

  const allUserIds = Array.from(new Set([...employeeIds, ...managerSet]));
  for (const uid of allUserIds) {
    await prisma.employeeLocation
      .create({
        data: {
          userId: uid,
          locationId: location.id,
          isManager: managerSet.has(uid),
        },
      })
      .catch(() => undefined);
  }

  // Mark setup wizard step
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (ws) {
    try {
      const steps = JSON.parse(ws.setupStepsJson || '{}');
      steps.locationsAdded = true;
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
    action: 'LOCATION_CREATED',
    targetType: 'Location',
    targetId: location.id,
    summary: `Created location "${location.name}"`,
  });

  return NextResponse.json({ location }, { status: 201 });
});
