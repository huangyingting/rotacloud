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
  const memos = await prisma.companyMemo.findMany({
    where: { workspaceId },
    include: { location: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ memos });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    title?: string;
    content?: string;
    locationId?: string | null;
    requiresAcknowledgement?: boolean;
  }>(request);

  const title = (payload.title || '').trim();
  const content = (payload.content || '').trim();
  if (!title || !content) {
    throw new HttpError(400, 'Memo title and content are required.');
  }

  const memo = await prisma.companyMemo.create({
    data: {
      workspaceId,
      title,
      content,
      locationId: payload.locationId || null,
      requiresAcknowledgement: Boolean(payload.requiresAcknowledgement),
      acknowledgedByJson: JSON.stringify([user.id]),
      authorUserId: user.id,
    },
    include: { location: { select: { id: true, name: true } } },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'MEMO_CREATED',
    targetType: 'CompanyMemo',
    targetId: memo.id,
    summary: `Published company memo "${memo.title}"`,
  });

  return NextResponse.json({ memo }, { status: 201 });
});
