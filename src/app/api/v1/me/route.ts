import { NextResponse } from 'next/server';
import { api, parseJsonBody, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  calculateStairstepSubscriptionCost,
  SYSTEM_LEAVE_TYPES,
} from '@/lib/domain/workforce-engine';
import { hashPassword } from '@/lib/account-admission/passwords';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);

  const [
    workspace,
    locations,
    roles,
    groups,
    employeeCount,
    pendingLeaveCount,
    pendingShiftRequestCount,
    memos,
  ] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.location.findMany({
      where: { workspaceId, deleted: false },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.role.findMany({
      where: { workspaceId, deleted: false },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.group.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({
      where: { workspaceId, deleted: false },
    }),
    prisma.leaveRecord.count({
      where: { workspaceId, status: 'REQUESTED' },
    }),
    prisma.shiftRequest.count({
      where: { workspaceId, status: 'PENDING' },
    }),
    prisma.companyMemo.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  let setupSteps = {
    accountCreated: true,
    locationsAdded: locations.length > 0,
    rolesAdded: roles.length > 0,
    employeesAdded: employeeCount > 1,
    shiftPublished: false,
  };

  if (workspace?.setupStepsJson) {
    try {
      const parsed = JSON.parse(workspace.setupStepsJson);
      setupSteps = {
        ...setupSteps,
        ...parsed,
        locationsAdded: parsed.locationsAdded || locations.length > 0,
        rolesAdded: parsed.rolesAdded || roles.length > 0,
        employeesAdded: parsed.employeesAdded || employeeCount > 1,
      };
    } catch {
      // ignore
    }
  }

  const pricing = calculateStairstepSubscriptionCost({
    employeeCount,
    planId: workspace?.planId || 'plan-standard',
    billingCycle: workspace?.billingCycle || 'monthly',
    addonTimeAndAttendance: workspace?.addonTimeAndAttendance ?? true,
  });

  return NextResponse.json({
    user,
    workspace: workspace
      ? {
          ...workspace,
          setupSteps,
          pricing,
          employeeCount,
        }
      : null,
    locations,
    roles,
    groups,
    systemLeaveTypes: SYSTEM_LEAVE_TYPES,
    pendingRequestsCount: pendingLeaveCount + pendingShiftRequestCount,
    pendingLeaveCount,
    pendingShiftRequestCount,
    memos,
  });
});

export const PATCH = api(async (request) => {
  const { user, workspaceId } = await requireUser(request);
  const payload = await parseJsonBody<{
    firstName?: string;
    lastName?: string;
    preferredName?: string;
    phone?: string;
    notifications?: Record<string, boolean>;
    twoFactorEnabled?: boolean;
    newPassword?: string;
    setupSteps?: Record<string, boolean>;
  }>(request);

  if (payload.setupSteps) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (ws) {
      let existing = {};
      try {
        existing = JSON.parse(ws.setupStepsJson || '{}');
      } catch {
        existing = {};
      }
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          setupStepsJson: JSON.stringify({ ...existing, ...payload.setupSteps }),
        },
      });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (payload.firstName !== undefined) updateData.firstName = payload.firstName.trim();
  if (payload.lastName !== undefined) updateData.lastName = payload.lastName.trim();
  if (payload.firstName !== undefined || payload.lastName !== undefined) {
    const f = payload.firstName?.trim() ?? user.firstName;
    const l = payload.lastName?.trim() ?? user.lastName;
    updateData.name = `${f} ${l}`.trim();
  }
  if (payload.preferredName !== undefined) {
    updateData.preferredName = payload.preferredName.trim() || null;
  }
  if (payload.phone !== undefined) {
    updateData.phone = payload.phone.trim() || null;
  }
  if (payload.notifications !== undefined) {
    updateData.notificationsJson = JSON.stringify(payload.notifications);
  }
  if (payload.twoFactorEnabled !== undefined) {
    updateData.twoFactorEnabled = Boolean(payload.twoFactorEnabled);
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  if (payload.newPassword && payload.newPassword.trim()) {
    const passwordHash = await hashPassword(payload.newPassword.trim());
    await prisma.passwordCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passwordHash,
        passwordChangedAt: new Date(),
      },
      update: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'PROFILE_UPDATED',
    targetType: 'User',
    targetId: user.id,
    summary: `Updated personal profile/settings for ${user.email}`,
  });

  return NextResponse.json({ ok: true, user: updatedUser });
});
