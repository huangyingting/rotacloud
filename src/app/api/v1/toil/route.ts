import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const [entries, employees] = await Promise.all([
    prisma.toilEntry.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.user.findMany({
      where: { workspaceId, deleted: false },
      select: { id: true, name: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ]);

  const balances = employees.map((emp) => {
    const empEntries = entries.filter((e) => e.userId === emp.id);
    const accrued = empEntries
      .filter((e) => e.hoursDelta > 0)
      .reduce((acc, e) => acc + e.hoursDelta, 0);
    const used = empEntries
      .filter((e) => e.hoursDelta < 0)
      .reduce((acc, e) => acc + Math.abs(e.hoursDelta), 0);
    return {
      user: emp,
      accruedHours: Number(accrued.toFixed(2)),
      usedHours: Number(used.toFixed(2)),
      balanceHours: Number((accrued - used).toFixed(2)),
    };
  });

  return NextResponse.json({ entries, balances });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    userId?: string;
    date?: string;
    hoursDelta?: number;
    reason?: string;
  }>(request);

  if (!payload.userId || payload.hoursDelta === undefined) {
    throw new HttpError(400, 'userId and hoursDelta are required.');
  }

  const entry = await prisma.toilEntry.create({
    data: {
      workspaceId,
      userId: payload.userId,
      date: payload.date || new Date().toISOString().slice(0, 10),
      hoursDelta: Number(payload.hoursDelta),
      reason: (payload.reason || 'TOIL adjustment').trim(),
      recordedByUserId: user.id,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'TOIL_RECORDED',
    targetType: 'ToilEntry',
    targetId: entry.id,
    summary: `Recorded TOIL (${entry.hoursDelta > 0 ? '+' : ''}${entry.hoursDelta}h) for ${entry.user.name}: ${entry.reason}`,
  });

  return NextResponse.json({ entry }, { status: 201 });
});
