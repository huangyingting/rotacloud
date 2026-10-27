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
  const roles = await prisma.role.findMany({
    where: { workspaceId, deleted: false },
    include: {
      employeeRoles: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              deleted: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ roles });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    colour?: string;
    defaultBreak?: number;
    defaultRate?: number;
    payCode?: string;
    employeeIds?: string[];
  }>(request);

  const name = (payload.name || '').trim();
  if (!name) {
    throw new HttpError(400, 'Role name is required.');
  }

  const role = await prisma.role.create({
    data: {
      workspaceId,
      name,
      colour: (payload.colour || '#0a65fc').trim(),
      defaultBreak: Number(payload.defaultBreak || 0),
      defaultRate: Number(payload.defaultRate ?? 12.0),
      payCode: payload.payCode?.trim() || null,
    },
  });

  const employeeIds = Array.isArray(payload.employeeIds)
    ? payload.employeeIds
    : [user.id];
  for (const uid of employeeIds) {
    await prisma.employeeRole
      .create({
        data: {
          userId: uid,
          roleId: role.id,
        },
      })
      .catch(() => undefined);
  }

  // Update setup wizard step
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (ws) {
    try {
      const steps = JSON.parse(ws.setupStepsJson || '{}');
      steps.rolesAdded = true;
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
    action: 'ROLE_CREATED',
    targetType: 'Role',
    targetId: role.id,
    summary: `Created role "${role.name}" (${role.colour})`,
  });

  return NextResponse.json({ role }, { status: 201 });
});
