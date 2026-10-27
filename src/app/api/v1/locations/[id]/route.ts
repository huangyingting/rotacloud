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

  const existing = await prisma.location.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Location not found.');

  const updated = await prisma.location.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.timezone !== undefined
        ? { timezone: payload.timezone.trim() }
        : {}),
      ...(payload.address !== undefined
        ? { address: payload.address?.trim() || null }
        : {}),
      ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
      ...(payload.longitude !== undefined
        ? { longitude: payload.longitude }
        : {}),
      ...(payload.geofenceRadiusMeters !== undefined
        ? { geofenceRadiusMeters: Number(payload.geofenceRadiusMeters) }
        : {}),
      ...(payload.clockInIps !== undefined
        ? { clockInIps: payload.clockInIps?.trim() || null }
        : {}),
    },
  });

  if (Array.isArray(payload.employeeIds)) {
    const managerSet = new Set(payload.managerIds || []);
    const allIds = Array.from(
      new Set([...payload.employeeIds, ...managerSet])
    );
    await prisma.employeeLocation.deleteMany({ where: { locationId: id } });
    for (const uid of allIds) {
      await prisma.employeeLocation
        .create({
          data: {
            userId: uid,
            locationId: id,
            isManager: managerSet.has(uid),
          },
        })
        .catch(() => undefined);
    }
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LOCATION_UPDATED',
    targetType: 'Location',
    targetId: id,
    summary: `Updated location "${updated.name}"`,
  });

  return NextResponse.json({ location: updated });
});

export const DELETE = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.location.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Location not found.');

  await prisma.location.update({
    where: { id },
    data: { deleted: true },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'LOCATION_DELETED',
    targetType: 'Location',
    targetId: id,
    summary: `Deleted location "${existing.name}"`,
  });

  return NextResponse.json({ ok: true });
});
