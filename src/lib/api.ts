import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIES } from '@/lib/account-admission/session';
import { hashOpaqueToken } from '@/lib/account-admission/tokens';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'request_error'
  ) {
    super(message);
  }
}

export const publicUserSelect = {
  id: true,
  workspaceId: true,
  name: true,
  firstName: true,
  lastName: true,
  preferredName: true,
  email: true,
  image: true,
  role: true,
  isActive: true,
  deleted: true,
  pin: true,
  phone: true,
  weeklyHours: true,
  holidayAllowance: true,
  holidayAllowanceUnit: true,
  accruesHoliday: true,
  salaryType: true,
  hourlyRate: true,
  annualSalary: true,
  defaultRoleId: true,
  groupId: true,
  notificationsJson: true,
  twoFactorEnabled: true,
} as const;

export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export async function currentUser(request?: Request): Promise<AuthenticatedUser | null> {
  // Check Bearer API key if request is provided
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.toLowerCase().startsWith('bearer rc_live_')) {
      const rawKey = authHeader.slice('bearer '.length).trim();
      const keyHash = hashOpaqueToken(rawKey);
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
      });
      if (apiKey && !apiKey.revokedAt) {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });
        const adminUser = await prisma.user.findFirst({
          where: {
            workspaceId: apiKey.workspaceId,
            role: 'ADMIN',
            deleted: false,
            isActive: true,
          },
          select: publicUserSelect,
        });
        if (adminUser) return adminUser;
      }
    }
  }

  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const token = jar.get(name)?.value;
    if (!token) continue;
    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: { select: publicUserSelect } },
    });
    if (
      session &&
      session.expires > new Date() &&
      session.user.isActive &&
      !session.user.deleted
    ) {
      return session.user;
    }
  }
  return null;
}

export async function requireUser(request?: Request) {
  const user = await currentUser(request);
  if (!user) throw new HttpError(401, 'Sign in to continue.', 'unauthorized');
  let workspaceId = user.workspaceId;
  if (!workspaceId) {
    const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = ws?.id ?? null;
  }
  if (!workspaceId) {
    throw new HttpError(400, 'Workspace is not initialized.', 'no_workspace');
  }
  return { user, workspaceId };
}

export async function requireManagerOrAdmin(request?: Request) {
  const ctx = await requireUser(request);
  if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'MANAGER') {
    throw new HttpError(
      403,
      'Manager or Administrator access is required for this action.',
      'forbidden'
    );
  }
  return ctx;
}

export async function requireAdmin(request?: Request) {
  const ctx = await requireUser(request);
  if (ctx.user.role !== 'ADMIN') {
    throw new HttpError(
      403,
      'Administrator access is required for this action.',
      'forbidden'
    );
  }
  return ctx;
}

export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object') {
      throw new HttpError(400, 'A valid JSON object body is required.');
    }
    return data as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, 'Invalid JSON payload.');
  }
}

export async function throttle(key: string, limit = 20, seconds = 900) {
  const now = new Date();
  await prisma.requestLimit.upsert({
    where: { key },
    create: {
      key,
      count: 0,
      resetsAt: new Date(now.getTime() + seconds * 1000),
    },
    update: {},
  });
  await prisma.requestLimit.updateMany({
    where: { key, resetsAt: { lte: now } },
    data: { count: 0, resetsAt: new Date(now.getTime() + seconds * 1000) },
  });
  const result = await prisma.requestLimit.updateMany({
    where: { key, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  if (!result.count) {
    throw new HttpError(
      429,
      'Too many requests. Please try again later.',
      'rate_limited'
    );
  }
}

type Handler<Context> = (
  request: Request,
  context: Context
) => Promise<Response>;

export function api<Context = { params: Promise<Record<string, string>> }>(
  handler: Handler<Context>
): Handler<Context> {
  return async (request, context) => {
    try {
      const response = await handler(request, context);
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    } catch (error) {
      let status = 500;
      let message = 'The request could not be completed. Please try again.';
      let code = 'internal_error';

      if (error instanceof HttpError) {
        ({ status, message, code } = error);
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          status = 409;
          message = 'This record already exists.';
          code = 'conflict';
        } else if (error.code === 'P2025') {
          status = 404;
          message = 'Record not found.';
          code = 'not_found';
        }
      } else if (
        error instanceof Error &&
        'status' in error &&
        typeof (error as { status?: unknown }).status === 'number'
      ) {
        status = (error as { status: number }).status;
        message = error.message;
        code = (error as { code?: string }).code || 'request_error';
      }

      if (status === 500) {
        console.error('[api]', request.method, new URL(request.url).pathname, error);
      }
      return NextResponse.json(
        { error: message, code },
        {
          status,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }
  };
}
