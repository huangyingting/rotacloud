import { NextResponse } from 'next/server';
import { api, HttpError, parseJsonBody, throttle } from '@/lib/api';
import { authenticatePassword } from '@/lib/account-admission/credentials';
import { setDatabaseSessionCookie } from '@/lib/account-admission/session';

export const POST = api(async (request) => {
  const payload = await parseJsonBody<{ email?: string; password?: string }>(
    request
  );
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';

  if (!email || !password) {
    throw new HttpError(
      400,
      'Please enter both your email address and password.',
      'missing_credentials'
    );
  }

  await throttle(`login:${email}`, 25, 300);

  const authResult = await authenticatePassword({ email, password });
  if (!authResult) {
    throw new HttpError(
      401,
      'Incorrect email address or password.',
      'invalid_credentials'
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      id: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name,
      firstName: authResult.user.firstName,
      lastName: authResult.user.lastName,
      role: authResult.user.role,
      workspaceId: authResult.user.workspaceId,
    },
  });

  setDatabaseSessionCookie(response, authResult.session);
  return response;
});
