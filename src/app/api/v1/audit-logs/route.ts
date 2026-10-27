import { NextResponse } from 'next/server';
import { api, requireManagerOrAdmin } from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const GET = api(async (request) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || undefined;
  const limit = Math.min(200, Number(url.searchParams.get('limit') || 100));

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [{ workspaceId }, { workspaceId: null }],
      ...(action ? { action } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ auditLogs });
});
