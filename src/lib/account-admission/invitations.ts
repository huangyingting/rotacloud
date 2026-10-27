import { Prisma, type AccountInvitation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import {
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizeRbacRole,
  type RbacRole,
} from './policy';
import { createInvitationCode, hashOpaqueToken } from './tokens';

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateAccountInvitationInput = {
  workspaceId?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: RbacRole | string;
  locationIds?: string[];
  defaultRoleId?: string | null;
  invitedById?: string;
  actorEmail?: string;
  actorRole?: string;
  expiresInHours?: number;
  expiresAt?: Date;
};

export type AccountInvitationGrant = {
  invitation: AccountInvitation;
  code: string;
  token: string;
  delivery: { queued: boolean; reason?: string };
};

export type PublicInvitationView = {
  id: string;
  status: 'pending' | 'consumed' | 'revoked' | 'expired' | 'invalid';
  codePrefix: string | null;
  maskedEmail: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  expiresAt: Date | null;
};

function invitationExpiry(
  now: Date,
  requestedDate?: Date,
  expiresInHours?: number
): Date {
  const expiresAt =
    requestedDate ??
    (expiresInHours !== undefined
      ? new Date(now.getTime() + expiresInHours * 3600 * 1000)
      : new Date(now.getTime() + DEFAULT_INVITATION_TTL_MS));
  if (
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime() ||
    expiresAt.getTime() > now.getTime() + 30 * 86400000
  ) {
    throw new AccountAdmissionError(
      400,
      'invalid_expiry',
      'Invitation expiry must be in the future and within the next 30 days.'
    );
  }
  return expiresAt;
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const result = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return result.count;
}

export async function createAccountInvitation(
  input: CreateAccountInvitationInput
): Promise<AccountInvitationGrant> {
  const normalizedEmail = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }

  const role = normalizeRbacRole(input.role);
  const code = createInvitationCode();
  const codePrefix = code.slice(0, 7);
  const tokenHash = hashOpaqueToken(code);
  const now = new Date();
  const expiresAt = invitationExpiry(now, input.expiresAt, input.expiresInHours);

  try {
    await prisma.accountInvitation.updateMany({
      where: {
        activeForEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, deleted: true },
    });
    if (existingUser && !existingUser.deleted) {
      throw new AccountAdmissionError(
        409,
        'already_member',
        'A RotaCloud account already exists for this email.'
      );
    }

    const active = await prisma.accountInvitation.findUnique({
      where: { activeForEmail: normalizedEmail },
      select: { id: true },
    });
    if (active) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active pending invitation already exists for this email.'
      );
    }

    let workspaceId = input.workspaceId ?? null;
    if (!workspaceId) {
      const ws = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
      workspaceId = ws?.id ?? null;
    }

    const invitation = await prisma.accountInvitation.create({
      data: {
        workspaceId,
        codePrefix,
        tokenHash,
        email: input.email.trim(),
        normalizedEmail,
        activeForEmail: normalizedEmail,
        firstName: input.firstName?.trim() || '',
        lastName: input.lastName?.trim() || '',
        role,
        status: 'PENDING',
        locationIdsJson: JSON.stringify(input.locationIds ?? []),
        defaultRoleId: input.defaultRoleId || null,
        invitedById: input.invitedById || null,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorUserId: input.invitedById || null,
        actorEmail: input.actorEmail || null,
        actorRole: input.actorRole || 'ADMIN',
        action: 'INVITATION_CREATED',
        targetType: 'AccountInvitation',
        targetId: invitation.id,
        summary: `Issued single-use ${role} invitation (${codePrefix}...) for ${normalizedEmail}`,
        metadataJson: JSON.stringify({
          codePrefix,
          email: normalizedEmail,
          role,
          expiresAt: expiresAt.toISOString(),
        }),
      },
    });

    return {
      invitation,
      code,
      token: code,
      delivery: {
        queued: false,
        reason: 'Share this single-use invitation code directly with the recipient.',
      },
    };
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }
    throw error;
  }
}

export async function inspectAccountInvitation(
  rawToken: string,
  now = new Date()
): Promise<PublicInvitationView> {
  if (!rawToken || !rawToken.trim()) {
    return {
      id: '',
      status: 'invalid',
      codePrefix: null,
      maskedEmail: null,
      expiresAt: null,
    };
  }

  const tokenHash = hashOpaqueToken(rawToken);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      workspaceId: true,
      codePrefix: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return {
      id: '',
      status: 'invalid',
      codePrefix: null,
      maskedEmail: null,
      expiresAt: null,
    };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    return {
      id: invitation.id,
      status: 'expired',
      codePrefix: invitation.codePrefix,
      maskedEmail: maskEmail(invitation.email),
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    id: invitation.id,
    status: invitation.status.toLowerCase() as PublicInvitationView['status'],
    codePrefix: invitation.codePrefix,
    maskedEmail: maskEmail(invitation.email),
    email: invitation.email,
    firstName: invitation.firstName,
    lastName: invitation.lastName,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
  };
}

export async function revokeAccountInvitation(
  id: string,
  actor?: { userId?: string | null; email?: string | null; role?: string | null; reason?: string }
): Promise<AccountInvitation> {
  const now = new Date();
  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status === 'REVOKED') {
    return invitation;
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be revoked.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      revokedByUserId: actor?.userId || null,
      revokeReason: actor?.reason || 'Revoked by administrator',
      activeForEmail: null,
      tokenHash: null,
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: invitation.workspaceId,
      actorUserId: actor?.userId || null,
      actorEmail: actor?.email || null,
      actorRole: actor?.role || 'ADMIN',
      action: 'INVITATION_REVOKED',
      targetType: 'AccountInvitation',
      targetId: invitation.id,
      summary: `Revoked pending invitation (${invitation.codePrefix}...) for ${invitation.email}`,
      metadataJson: JSON.stringify({
        codePrefix: invitation.codePrefix,
        email: invitation.email,
        reason: actor?.reason || 'Revoked by administrator',
      }),
    },
  });

  return updated;
}

export async function rotateAccountInvitation(
  id: string,
  expiresAt?: Date
): Promise<AccountInvitationGrant> {
  const code = createInvitationCode();
  const codePrefix = code.slice(0, 7);
  const tokenHash = hashOpaqueToken(code);
  const now = new Date();
  const nextExpiry = invitationExpiry(now, expiresAt);

  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status !== 'PENDING' || invitation.expiresAt <= now) {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only an active pending invitation can be rotated.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: { codePrefix, tokenHash, expiresAt: nextExpiry },
  });

  return {
    invitation: updated,
    code,
    token: code,
    delivery: {
      queued: false,
      reason: 'Share the new invitation code directly. The previous code is now invalid.',
    },
  };
}

export async function listAccountInvitations(workspaceId?: string) {
  await expirePendingInvitations();
  return prisma.accountInvitation.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
      acceptedBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
