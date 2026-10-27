import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  SESSION_COOKIES,
} from '@/lib/account-admission/session';

export const POST = api(async () => {
  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const token = jar.get(name)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { sessionToken: token } });
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    expires: new Date(0),
    ...SESSION_COOKIE_OPTIONS,
  });
  return response;
});
