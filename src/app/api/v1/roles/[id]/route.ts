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
    colour?: string;
    defaultBreak?: number;
    defaultRate?: number;
    payCode?: string;
    employeeIds?: string[];
  }>(request);

  const existing = await prisma.role.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new HttpError(404, 'Role not found.');

  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.colour !== undefined ? { colour: payload.colour.trim() } : {}),
      ...(payload.defaultBreak !== undefined
        ? { defaultBreak: Number(payload.defaultBreak) }
        : {}),
      ...(payload.defaultRate !== undefined
        ? { defaultRate: Number(payload.defaultRate) }
        : {}),
      ...(payload.payCode !== undefined
        ? { payCode: payload.payCode?.trim() || null }
        : {}),
    },
  });

  if (Array.isArray(payload.employeeIds)) {
    await prisma.employeeRole.deleteMany({ where: { roleId: id } });
    for (const uid of payload.employeeIds) {
      await prisma.employeeRole
        .create({
          data: {
            userId: uid,
            roleId: id,
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
    action: 'ROLE_UPDATED',
    targetType: 'Role',
    targetId: id,
    summary: `Updated role "${updated.name}"`,
  });

  return NextResponse.json({ role: updated });
});

export const DELETE = api(async (request, context) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.role.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new HttpError(404, 'Role not found.');

  await prisma.role.update({
    where: { id },
    data: { deleted: true },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ROLE_DELETED',
    targetType: 'Role',
    targetId: id,
    summary: `Deleted role "${existing.name}"`,
  });

  return NextResponse.json({ ok: true });
});
