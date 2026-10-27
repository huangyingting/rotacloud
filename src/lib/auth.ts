import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import { authenticatePassword } from './account-admission/credentials';
import { authorizeSocialSignIn } from './account-admission/social';
import {
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from './account-admission/session';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'database',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'RotaCloud Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const result = await authenticatePassword({
          email: credentials.email,
          password: credentials.password,
        });
        return result?.user ?? null;
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false;
      if (account.provider === 'credentials') return true;
      return authorizeSocialSignIn({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        type: account.type,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
        tokenType: account.token_type,
        scope: account.scope,
        idToken: account.id_token,
        sessionState: account.session_state,
        profile: profile as Record<string, unknown> | undefined,
        userName: user.name,
        userImage: user.image,
      });
    },
    async session({ session, user }) {
      if (session.user && user) {
        Object.assign(session.user, {
          id: user.id,
          role: (user as { role?: string }).role || 'EMPLOYEE',
          workspaceId: (user as { workspaceId?: string | null }).workspaceId || null,
        });
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: SESSION_COOKIE_OPTIONS.secure,
};
