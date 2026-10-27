import { prisma } from '@/lib/prisma';
import { normalizeAccountEmail } from './policy';

export async function authorizeSocialSignIn(input: {
  provider: string;
  providerAccountId: string;
  type: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  sessionState?: string;
  profile?: Record<string, unknown>;
  userName?: string | null;
  userImage?: string | null;
}): Promise<boolean> {
  const rawEmail = typeof input.profile?.email === 'string' ? input.profile.email : '';
  if (!rawEmail) return false;
  const email = normalizeAccountEmail(rawEmail);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // Strict invite-only policy: social sign-in is only allowed for existing invited users
  if (!existingUser || !existingUser.isActive || existingUser.deleted) {
    return false;
  }

  return true;
}
