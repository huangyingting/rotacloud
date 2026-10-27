import { NextResponse } from 'next/server';
import { api, HttpError, parseJsonBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { enumerateDatesInclusive } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const userId = url.searchParams.get('userId') || undefined;

  const [entries, patterns] = await Promise.all([
    prisma.availabilityEntry.findMany({
      where: {
        workspaceId,
        ...(userId ? { userId } : {}),
        ...(startDate && endDate
          ? { date: { gte: startDate, lte: endDate } }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.availabilityPattern.findMany({
      where: {
        workspaceId,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ entries, patterns });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{
    mode?: 'single' | 'pattern';
    userId?: string;
    date?: string;
    status?: 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED';
    allDay?: boolean;
    startTime?: string;
    endTime?: string;
    notes?: string;
    // Pattern fields
    startDate?: string;
    endDate?: string;
    frequencyWeeks?: number;
    schedule?: Record<string, 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED'>;
  }>(request);

  const targetUserId =
    user.role === 'EMPLOYEE' ? user.id : payload.userId || user.id;

  if (payload.mode === 'pattern') {
    const startDate =
      payload.startDate || new Date().toISOString().slice(0, 10);
    const endDate =
      payload.endDate ||
      new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10);
    const frequencyWeeks = Number(payload.frequencyWeeks || 1);
    const schedule = payload.schedule || {
      mon: 'AVAILABLE',
      tue: 'AVAILABLE',
      wed: 'AVAILABLE',
      thu: 'AVAILABLE',
      fri: 'AVAILABLE',
      sat: 'UNAVAILABLE',
      sun: 'UNAVAILABLE',
    };

    const pattern = await prisma.availabilityPattern.create({
      data: {
        workspaceId,
        userId: targetUserId,
        startDate,
        endDate,
        frequencyWeeks,
        scheduleJson: JSON.stringify(schedule),
      },
    });

    const dates = enumerateDatesInclusive(startDate, endDate).slice(0, 90);
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    for (const d of dates) {
      const dt = new Date(`${d}T12:00:00Z`);
      const dayKey = dayMap[dt.getUTCDay()];
      const dayStatus = schedule[dayKey] || 'AVAILABLE';
      await prisma.availabilityEntry.upsert({
        where: { userId_date: { userId: targetUserId, date: d } },
        create: {
          workspaceId,
          userId: targetUserId,
          date: d,
          status: dayStatus,
          allDay: true,
          sourcePatternId: pattern.id,
        },
        update: {
          status: dayStatus,
          allDay: true,
          sourcePatternId: pattern.id,
        },
      });
    }

    await recordAuditLog({
      workspaceId,
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AVAILABILITY_PATTERN_CREATED',
      targetType: 'AvailabilityPattern',
      targetId: pattern.id,
      summary: `Created ${frequencyWeeks}-week repeating availability pattern (${startDate} to ${endDate})`,
    });

    return NextResponse.json(
      { pattern, populatedDays: dates.length },
      { status: 201 }
    );
  }

  if (!payload.date) {
    throw new HttpError(400, 'date (YYYY-MM-DD) is required.');
  }

  const entry = await prisma.availabilityEntry.upsert({
    where: {
      userId_date: {
        userId: targetUserId,
        date: payload.date,
      },
    },
    create: {
      workspaceId,
      userId: targetUserId,
      date: payload.date,
      status: payload.status || 'UNAVAILABLE',
      allDay: payload.allDay ?? true,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      notes: payload.notes?.trim() || null,
    },
    update: {
      status: payload.status || 'UNAVAILABLE',
      allDay: payload.allDay ?? true,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      notes: payload.notes?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ entry });
});
