import { NextResponse } from 'next/server';
import { api, HttpError, requireManagerOrAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const DELETE = api(async (request, context) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const { id } = await context.params;

  const existing = await prisma.leaveEmbargo.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Embargo not found.');

  await prisma.leaveEmbargo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
