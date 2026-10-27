import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { hashOpaqueToken } from '@/lib/account-admission/tokens';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const [workspace, apiKeys, webhooks] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    workspace,
    apiKeys,
    webhooks,
  });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireAdmin(request);
  const payload = await parseJsonBody<{
    action?: 'create_api_key' | 'revoke_api_key' | 'create_webhook' | 'delete_webhook';
    name?: string;
    id?: string;
    url?: string;
    events?: string[];
  }>(request);

  if (payload.action === 'create_api_key') {
    const name = (payload.name || '').trim() || 'Production Integration Key';
    const rawSecret = `rc_live_${randomBytes(18).toString('hex')}`;
    const keyPrefix = rawSecret.slice(0, 14);
    const keyHash = hashOpaqueToken(rawSecret);

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId,
        name,
        keyPrefix,
        keyHash,
        createdByUserId: user.id,
      },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'API_KEY_CREATED',
      targetType: 'ApiKey',
      targetId: apiKey.id,
      summary: `Generated REST API key "${name}" (${keyPrefix}...)`,
    });

    return NextResponse.json(
      { apiKey, plaintextKey: rawSecret },
      { status: 201 }
    );
  }

  if (payload.action === 'revoke_api_key') {
    if (!payload.id) throw new HttpError(400, 'API key id is required.');
    const updated = await prisma.apiKey.update({
      where: { id: payload.id },
      data: { revokedAt: new Date() },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'API_KEY_REVOKED',
      targetType: 'ApiKey',
      targetId: updated.id,
      summary: `Revoked REST API key "${updated.name}" (${updated.keyPrefix}...)`,
    });

    return NextResponse.json({ apiKey: updated });
  }

  if (payload.action === 'create_webhook') {
    const url = (payload.url || '').trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new HttpError(400, 'Enter a valid HTTP/HTTPS webhook endpoint URL.');
    }
    const signingSecret = `whsec_${randomBytes(16).toString('hex')}`;
    const webhook = await prisma.webhookEndpoint.create({
      data: {
        workspaceId,
        url,
        eventsJson: JSON.stringify(
          payload.events || [
            'shift.published',
            'leave.approved',
            'timesheet.approved',
          ]
        ),
        signingSecret,
        isActive: true,
      },
    });

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'WEBHOOK_CREATED',
      targetType: 'WebhookEndpoint',
      targetId: webhook.id,
      summary: `Registered webhook endpoint ${webhook.url}`,
    });

    return NextResponse.json({ webhook }, { status: 201 });
  }

  if (payload.action === 'delete_webhook' && payload.id) {
    await prisma.webhookEndpoint.delete({ where: { id: payload.id } });
    return NextResponse.json({ ok: true });
  }

  throw new HttpError(400, 'Unsupported settings action.');
});
