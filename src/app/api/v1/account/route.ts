import { NextResponse } from 'next/server';
import { api, parseJsonBody, requireAdmin, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { calculateStairstepSubscriptionCost } from '@/lib/domain/workforce-engine';
import { recordAuditLog } from '@/lib/audit';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const [workspace, employeeCount] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: workspaceId } }),
    prisma.user.count({ where: { workspaceId, deleted: false } }),
  ]);

  const pricing = calculateStairstepSubscriptionCost({
    employeeCount,
    planId: workspace?.planId || 'plan-standard',
    billingCycle: workspace?.billingCycle || 'monthly',
    addonTimeAndAttendance: workspace?.addonTimeAndAttendance ?? true,
  });

  return NextResponse.json({
    account: workspace,
    employeeCount,
    pricing,
  });
});

export const PATCH = api(async (request) => {
  const { user, workspaceId } = await requireAdmin(request);
  const payload = await parseJsonBody<{
    name?: string;
    industry?: string;
    timezone?: string;
    currencySymbol?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    county?: string;
    postcode?: string;
    countryName?: string;
    vatNumber?: string;
    planId?: string;
    billingCycle?: string;
    addonTimeAndAttendance?: boolean;
    addonSmsCredits?: number;
    settings?: Record<string, unknown>;
  }>(request);

  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  let mergedSettings: Record<string, unknown> = {};
  if (ws?.settingsJson) {
    try {
      mergedSettings = JSON.parse(ws.settingsJson);
    } catch {
      mergedSettings = {};
    }
  }
  if (payload.settings) {
    mergedSettings = { ...mergedSettings, ...payload.settings };
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.industry !== undefined ? { industry: payload.industry.trim() } : {}),
      ...(payload.timezone !== undefined ? { timezone: payload.timezone.trim() } : {}),
      ...(payload.currencySymbol !== undefined
        ? { currencySymbol: payload.currencySymbol.trim() }
        : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone.trim() || null } : {}),
      ...(payload.address1 !== undefined
        ? { address1: payload.address1.trim() || null }
        : {}),
      ...(payload.address2 !== undefined
        ? { address2: payload.address2.trim() || null }
        : {}),
      ...(payload.city !== undefined ? { city: payload.city.trim() || null } : {}),
      ...(payload.county !== undefined
        ? { county: payload.county.trim() || null }
        : {}),
      ...(payload.postcode !== undefined
        ? { postcode: payload.postcode.trim() || null }
        : {}),
      ...(payload.countryName !== undefined
        ? { countryName: payload.countryName.trim() }
        : {}),
      ...(payload.vatNumber !== undefined
        ? { vatNumber: payload.vatNumber.trim() || null }
        : {}),
      ...(payload.planId !== undefined ? { planId: payload.planId } : {}),
      ...(payload.billingCycle !== undefined
        ? { billingCycle: payload.billingCycle }
        : {}),
      ...(payload.addonTimeAndAttendance !== undefined
        ? { addonTimeAndAttendance: Boolean(payload.addonTimeAndAttendance) }
        : {}),
      ...(payload.addonSmsCredits !== undefined
        ? { addonSmsCredits: Number(payload.addonSmsCredits) }
        : {}),
      ...(payload.settings !== undefined
        ? { settingsJson: JSON.stringify(mergedSettings) }
        : {}),
    },
  });

  await recordAuditLog({
    workspaceId,
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'ACCOUNT_SETTINGS_UPDATED',
    targetType: 'Workspace',
    targetId: workspaceId,
    summary: `Updated company account settings for ${updated.name}`,
  });

  return NextResponse.json({ account: updated });
});
