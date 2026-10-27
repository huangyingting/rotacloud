import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { addDays, getMondayOfWeek } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const locationId = url.searchParams.get('locationId') || undefined;
  const weekStart = getMondayOfWeek(
    url.searchParams.get('weekStart') || undefined
  );
  const weekEnd = addDays(weekStart, 6);

  const [budgets, shifts, timesheets, locations] = await Promise.all([
    prisma.weeklyBudget.findMany({
      where: {
        workspaceId,
        ...(locationId ? { locationId } : {}),
      },
      include: { location: { select: { id: true, name: true } } },
      orderBy: { weekStart: 'desc' },
    }),
    prisma.shift.findMany({
      where: {
        workspaceId,
        deleted: false,
        ...(locationId ? { locationId } : {}),
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.timesheet.findMany({
      where: {
        workspaceId,
        ...(locationId ? { locationId } : {}),
        date: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.location.findMany({
      where: { workspaceId, deleted: false },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const scheduledHours = Number(
    shifts.reduce((acc, s) => acc + s.netHours, 0).toFixed(2)
  );
  const scheduledWageCost = Number(
    shifts.reduce((acc, s) => acc + s.wageCost, 0).toFixed(2)
  );
  const actualHours = Number(
    timesheets.reduce((acc, t) => acc + t.workedHours, 0).toFixed(2)
  );
  const actualWageCost = Number(
    timesheets.reduce((acc, t) => acc + t.wageCost, 0).toFixed(2)
  );

  return NextResponse.json({
    budgets,
    locations,
    weekStart,
    weekEnd,
    summary: {
      scheduledHours,
      scheduledWageCost,
      actualHours,
      actualWageCost,
    },
  });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    locationId?: string;
    weekStart?: string;
    revenueTarget?: number;
    labourBudgetAmount?: number;
    labourTargetPercent?: number;
    targetHours?: number;
    forecastNotes?: string;
  }>(request);

  if (!payload.locationId) {
    throw new HttpError(400, 'locationId is required.');
  }

  const weekStart = getMondayOfWeek(payload.weekStart);

  const budget = await prisma.weeklyBudget.upsert({
    where: {
      locationId_weekStart: {
        locationId: payload.locationId,
        weekStart,
      },
    },
    create: {
      workspaceId,
      locationId: payload.locationId,
      weekStart,
      revenueTarget: Number(payload.revenueTarget || 0),
      labourBudgetAmount: Number(payload.labourBudgetAmount || 0),
      labourTargetPercent: Number(payload.labourTargetPercent ?? 25),
      targetHours: Number(payload.targetHours || 0),
      forecastNotes: payload.forecastNotes?.trim() || null,
    },
    update: {
      revenueTarget: Number(payload.revenueTarget || 0),
      labourBudgetAmount: Number(payload.labourBudgetAmount || 0),
      labourTargetPercent: Number(payload.labourTargetPercent ?? 25),
      targetHours: Number(payload.targetHours || 0),
      forecastNotes: payload.forecastNotes?.trim() || null,
    },
    include: { location: { select: { id: true, name: true } } },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'BUDGET_SAVED',
    targetType: 'WeeklyBudget',
    targetId: budget.id,
    summary: `Updated weekly budget for ${budget.location.name} (${weekStart}): £${budget.labourBudgetAmount} budget / £${budget.revenueTarget} revenue target`,
  });

  return NextResponse.json({ budget });
});
