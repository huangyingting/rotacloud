import { NextResponse } from 'next/server';
import { api, parseJsonBody, throttle } from '@/lib/api';
import { registerWithInvitation } from '@/lib/account-admission/registration';
import { setDatabaseSessionCookie } from '@/lib/account-admission/session';

export const POST = api(async (request) => {
  const payload = await parseJsonBody<{
    token?: string;
    invitationCode?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
  }>(request);

  const email = (payload.email || '').trim().toLowerCase();
  await throttle(`register:${email || 'anon'}`, 20, 600);

  const token = (payload.token || payload.invitationCode || '').trim();
  const result = await registerWithInvitation({
    token,
    email: payload.email || '',
    password: payload.password || '',
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: payload.name,
    phone: payload.phone,
  });

  const response = NextResponse.json(
    {
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        workspaceId: result.user.workspaceId,
      },
    },
    { status: 201 }
  );

  setDatabaseSessionCookie(response, result.session);
  return response;
});
