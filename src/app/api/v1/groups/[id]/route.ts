import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const PATCH = api(async (request, context) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<{
    name?: string;
    employeeIds?: string[];
  }>(request);

  const existing = await prisma.group.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new HttpError(404, 'Group not found.');

  const group = await prisma.group.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    },
  });

  if (Array.isArray(payload.employeeIds)) {
    await prisma.user.updateMany({
      where: { workspaceId, groupId: id },
      data: { groupId: null },
    });
    if (payload.employeeIds.length > 0) {
      await prisma.user.updateMany({
        where: { workspaceId, id: { in: payload.employeeIds } },
        data: { groupId: id },
      });
    }
  }

  return NextResponse.json({ group });
});

export const DELETE = api(async (request, context) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.group.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new HttpError(404, 'Group not found.');

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
