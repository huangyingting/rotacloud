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
  const groups = await prisma.group.findMany({
    where: { workspaceId },
    include: {
      users: {
        where: { deleted: false },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ groups });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    employeeIds?: string[];
  }>(request);

  const name = (payload.name || '').trim();
  if (!name) throw new HttpError(400, 'Group name is required.');

  const group = await prisma.group.create({
    data: {
      workspaceId,
      name,
    },
  });

  if (Array.isArray(payload.employeeIds) && payload.employeeIds.length > 0) {
    await prisma.user.updateMany({
      where: { workspaceId, id: { in: payload.employeeIds } },
      data: { groupId: group.id },
    });
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'GROUP_CREATED',
    targetType: 'Group',
    targetId: group.id,
    summary: `Created employee group "${group.name}"`,
  });

  return NextResponse.json({ group }, { status: 201 });
});
