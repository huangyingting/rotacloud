import { NextResponse } from 'next/server';
import {
  api,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import {
  revokeAccountInvitation,
  rotateAccountInvitation,
} from '@/lib/account-admission/invitations';

export const PATCH = api(async (request, context) => {
  const { user } = await requireManagerOrAdmin(request);
  const { id } = await context.params;
  const payload = await parseJsonBody<{
    action?: 'revoke' | 'rotate';
    reason?: string;
  }>(request);

  if (payload.action === 'rotate') {
    const rotated = await rotateAccountInvitation(id);
    return NextResponse.json({
      invitation: rotated.invitation,
      code: rotated.code,
      token: rotated.token,
    });
  }

  const revoked = await revokeAccountInvitation(id, {
    userId: user.id,
    email: user.email,
    role: user.role,
    reason: payload.reason,
  });
  return NextResponse.json({ invitation: revoked });
});

export const DELETE = api(async (request, context) => {
  const { user } = await requireManagerOrAdmin(request);
  const { id } = await context.params;
  const revoked = await revokeAccountInvitation(id, {
    userId: user.id,
    email: user.email,
    role: user.role,
    reason: 'Revoked via DELETE',
  });
  return NextResponse.json({ invitation: revoked });
});
