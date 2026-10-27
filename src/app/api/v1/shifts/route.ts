import { NextResponse } from 'next/server';
import {
  api,
  HttpError,
  parseJsonBody,
  requireManagerOrAdmin,
  requireUser,
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { calculateShiftMetrics } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const locationId = url.searchParams.get('locationId') || undefined;
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const deletedOnly = url.searchParams.get('deleted') === 'true';

  const shifts = await prisma.shift.findMany({
    where: {
      workspaceId,
      deleted: deletedOnly,
      ...(locationId ? { locationId } : {}),
      ...(startDate && endDate
        ? { date: { gte: startDate, lte: endDate } }
        : startDate
          ? { date: { gte: startDate } }
          : {}),
    },
    include: {
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true, defaultRate: true } },
      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          hourlyRate: true,
          salaryType: true,
        },
      },
      deletedBy: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({ shifts });
});

export const POST = api(async (request) => {
  const { user, workspaceId } = await requireManagerOrAdmin(request);
  const payload = await parseJsonBody<{
    locationId?: string;
    roleId?: string;
    userId?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    breaksPaid?: boolean;
    notes?: string;
    published?: boolean;
    openShiftClaimApprovalRequired?: boolean;
  }>(request);

  if (!payload.locationId || !payload.roleId || !payload.date) {
    throw new HttpError(
      400,
      'locationId, roleId, and date (YYYY-MM-DD) are required.'
    );
  }

  const startTime = (payload.startTime || '09:00').trim();
  const endTime = (payload.endTime || '17:00').trim();

  const [role, assignee] = await Promise.all([
    prisma.role.findFirst({ where: { id: payload.roleId, workspaceId } }),
    payload.userId
      ? prisma.user.findFirst({ where: { id: payload.userId, workspaceId } })
      : Promise.resolve(null),
  ]);

  if (!role) throw new HttpError(404, 'Selected role not found.');

  let customRoleRate: number | null = null;
  if (assignee?.roleRatesJson) {
    try {
      const rates = JSON.parse(assignee.roleRatesJson);
      if (typeof rates[role.id] === 'number') {
        customRoleRate = rates[role.id];
      }
    } catch {
      customRoleRate = null;
    }
  }

  const breakMinutes =
    payload.breakMinutes !== undefined
      ? Number(payload.breakMinutes)
      : role.defaultBreak;

  const metrics = calculateShiftMetrics({
    startTime,
    endTime,
    breakMinutes,
    breaksPaid: Boolean(payload.breaksPaid),
    hourlyRate: assignee?.hourlyRate,
    roleDefaultRate: role.defaultRate,
    customRoleRate,
    salaryType: assignee?.salaryType,
  });

  const shift = await prisma.shift.create({
    data: {
      workspaceId,
      locationId: payload.locationId,
      roleId: payload.roleId,
      userId: payload.userId || null,
      date: payload.date,
      startTime,
      endTime,
      breakMinutes,
      breaksPaid: Boolean(payload.breaksPaid),
      netHours: metrics.netHours,
      wageCost: metrics.wageCost,
      notes: payload.notes?.trim() || null,
      published: Boolean(payload.published),
      openShiftClaimApprovalRequired: Boolean(
        payload.openShiftClaimApprovalRequired
      ),
      createdByUserId: user.id,
    },
    include: {
      location: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, colour: true, defaultRate: true } },
      user: { select: { id: true, name: true, firstName: true, lastName: true } },
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'SHIFT_CREATED',
    targetType: 'Shift',
    targetId: shift.id,
    summary: `Created ${shift.role.name} shift on ${shift.date} (${shift.startTime}-${shift.endTime}) for ${shift.user?.name || 'Open Shifts'}`,
    metadata: {
      date: shift.date,
      netHours: shift.netHours,
      wageCost: shift.wageCost,
    },
  });

  return NextResponse.json({ shift }, { status: 201 });
});
