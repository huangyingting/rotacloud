import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
} from '@/lib/api';
import {
  createAccountInvitation,
  listAccountInvitations,
} from '@/lib/account-admission/invitations';

export const GET = api(async (request) => {
  const { workspaceId } = await requireManagerOrAdmin(request);
  const invitations = await listAccountInvitations(workspaceId);
  return NextResponse.json({ invitations });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    locationIds?: string[];
    defaultRoleId?: string;
    expiresInHours?: number;
  }>(request);

  const requestedRole = (payload.role || 'EMPLOYEE').toUpperCase();
  if (user.role === 'MANAGER' && requestedRole !== 'EMPLOYEE') {
    throw new HttpError(
      403,
      'Managers may only issue EMPLOYEE invitations.',
      'forbidden'
    );
  }

  const grant = await createAccountInvitation({
    workspaceId,
    email: payload.email || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: requestedRole,
    locationIds: payload.locationIds,
    defaultRoleId: payload.defaultRoleId,
    invitedById: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    expiresInHours: payload.expiresInHours,
  });

  return NextResponse.json(
    {
      invitation: grant.invitation,
      code: grant.code,
      token: grant.token,
      delivery: grant.delivery,
    },
    { status: 201 }
  );
});
