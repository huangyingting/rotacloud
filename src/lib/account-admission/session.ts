import { randomBytes } from 'node:crypto';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export const SESSION_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

const IS_PRODUCTION = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL).protocol === 'https:'
  : process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_NAME = IS_PRODUCTION
  ? SESSION_COOKIES[1]
  : SESSION_COOKIES[0];

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: IS_PRODUCTION,
};

export async function createDatabaseSession(userId: string, now = new Date()) {
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  return prisma.session.create({
    data: {
      sessionToken: randomBytes(32).toString('base64url'),
      userId,
      expires,
    },
  });
}

export function setDatabaseSessionCookie(
  response: NextResponse,
  session: { sessionToken: string; expires: Date }
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.sessionToken,
    expires: session.expires,
    ...SESSION_COOKIE_OPTIONS,
  });
}
