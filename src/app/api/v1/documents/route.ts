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
  const documents = await prisma.companyDocument.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ documents });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    title?: string;
    fileName?: string;
    fileSize?: number;
    category?: string;
    userId?: string | null;
    requiresSignature?: boolean;
  }>(request);

  const title = (payload.title || '').trim();
  if (!title) throw new HttpError(400, 'Document title is required.');

  const document = await prisma.companyDocument.create({
    data: {
      workspaceId,
      title,
      fileName:
        (payload.fileName || '').trim() ||
        `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      fileSize: Number(payload.fileSize || 42800),
      category: payload.category || 'Company Policy',
      userId: payload.userId || null,
      requiresSignature: Boolean(payload.requiresSignature),
      uploadedByUserId: user.id,
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'DOCUMENT_UPLOADED',
    targetType: 'CompanyDocument',
    targetId: document.id,
    summary: `Uploaded HR document "${document.title}"`,
  });

  return NextResponse.json({ document }, { status: 201 });
});

export const PATCH = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{ id?: string; action?: 'sign' }>(
    request
  );
  if (!payload.id) throw new HttpError(400, 'Document id is required.');

  const existing = await prisma.companyDocument.findFirst({
    where: { id: payload.id, workspaceId },
  });
  if (!existing) throw new HttpError(404, 'Document not found.');

  const updated = await prisma.companyDocument.update({
    where: { id: payload.id },
    data: {
      signedAt: new Date(),
      signedByUserId: user.id,
    },
  });

  return NextResponse.json({ document: updated });
});
