import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const locationId = url.searchParams.get('locationId') || undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  const dayNotes = await prisma.dayNote.findMany({
    where: {
      workspaceId,
      ...(locationId ? { locationId } : {}),
      ...(startDate && endDate
        ? { date: { gte: startDate, lte: endDate } }
        : {}),
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ dayNotes });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    locationId?: string;
    date?: string;
    content?: string;
    visibility?: string;
  }>(request);

  if (!payload.locationId || !payload.date) {
    throw new HttpError(400, 'locationId and date are required.');
  }

  const content = (payload.content || '').trim();
  if (!content) {
    await prisma.dayNote.deleteMany({
      where: {
        workspaceId,
        locationId: payload.locationId,
        date: payload.date,
      },
    });
    return NextResponse.json({ deleted: true });
  }

  const dayNote = await prisma.dayNote.upsert({
    where: {
      locationId_date: {
        locationId: payload.locationId,
        date: payload.date,
      },
    },
    create: {
      workspaceId,
      locationId: payload.locationId,
      date: payload.date,
      content,
      visibility: payload.visibility || 'all',
      createdByUserId: user.id,
    },
    update: {
      content,
      visibility: payload.visibility || 'all',
    },
  });

  return NextResponse.json({ dayNote });
});
