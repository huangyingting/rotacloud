import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import {
  accountAdmissionMode,
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizeRbacRole,
} from './policy';
import { createDatabaseSession } from './session';
import { hashOpaqueToken } from './tokens';

export type RegistrationInput = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type InvitationRegistrationInput = RegistrationInput & {
  token: string;
};

function registrationEmail(email: string): string {
  if (!isValidAccountEmail(email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }
  return normalizeAccountEmail(email);
}

export async function registerWithInvitation(
  input: InvitationRegistrationInput
) {
  if (accountAdmissionMode() !== 'invitation-only') {
    throw new AccountAdmissionError(
      409,
      'mode_mismatch',
      'Invitation registration is not enabled.'
    );
  }

  if (!input.token || !input.token.trim()) {
    await prisma.auditLog.create({
      data: {
        action: 'INVITATION_REJECTED',
        targetType: 'AccountInvitation',
        summary: `Rejected registration attempt for ${input.email || 'unknown'}: missing invitation code.`,
        metadataJson: JSON.stringify({ reason: 'missing_token', email: input.email }),
      },
    });
    throw new AccountAdmissionError(
      400,
      'missing_invitation',
      'A valid single-use invitation code is required to register.'
    );
  }

  const normalizedEmail = registrationEmail(input.email);
  const tokenHash = hashOpaqueToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
  });

  if (!invitation || invitation.status !== 'PENDING') {
    await prisma.auditLog.create({
      data: {
        workspaceId: invitation?.workspaceId ?? null,
        action: 'INVITATION_REJECTED',
        targetType: 'AccountInvitation',
        targetId: invitation?.id ?? null,
        summary: `Rejected registration attempt for ${normalizedEmail}: invalid, consumed, or revoked invitation code.`,
        metadataJson: JSON.stringify({
          reason: invitation ? `status_${invitation.status}` : 'not_found',
          email: normalizedEmail,
        }),
      },
    });
    throw new AccountAdmissionError(
      410,
      'invalid_invitation',
      'This invitation code is invalid, already used, or has been revoked.'
    );
  }

  if (invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: {
        id: invitation.id,
        tokenHash,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    await prisma.auditLog.create({
      data: {
        workspaceId: invitation.workspaceId,
        action: 'INVITATION_REJECTED',
        targetType: 'AccountInvitation',
        targetId: invitation.id,
        summary: `Rejected registration attempt for ${normalizedEmail}: invitation ${invitation.codePrefix} expired.`,
        metadataJson: JSON.stringify({ reason: 'expired', email: normalizedEmail }),
      },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This invitation code has expired.'
    );
  }

  if (invitation.normalizedEmail !== normalizedEmail) {
    await prisma.auditLog.create({
      data: {
        workspaceId: invitation.workspaceId,
        action: 'INVITATION_REJECTED',
        targetType: 'AccountInvitation',
        targetId: invitation.id,
        summary: `Rejected registration attempt: email mismatch (${normalizedEmail} vs ${invitation.normalizedEmail}).`,
        metadataJson: JSON.stringify({
          reason: 'email_mismatch',
          attemptedEmail: normalizedEmail,
          invitedEmail: invitation.normalizedEmail,
        }),
      },
    });
    throw new AccountAdmissionError(
      403,
      'email_mismatch',
      'This invitation code was issued for a different email address.'
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, deleted: true },
  });
  if (existing && !existing.deleted) {
    throw new AccountAdmissionError(
      409,
      'already_member',
      'A RotaCloud account already exists for this email.'
    );
  }

  const firstName =
    input.firstName?.trim() ||
    invitation.firstName?.trim() ||
    input.name?.trim().split(/\s+/)[0] ||
    'Team';
  const lastName =
    input.lastName?.trim() ||
    invitation.lastName?.trim() ||
    input.name?.trim().split(/\s+/).slice(1).join(' ') ||
    'Member';
  const fullName = `${firstName} ${lastName}`.trim();
  const assignedRole = normalizeRbacRole(invitation.role);

  const user = await prisma.$transaction(async (tx) => {
    const claimed = await tx.accountInvitation.updateMany({
      where: {
        id: invitation.id,
        status: 'PENDING',
        tokenHash,
        expiresAt: { gt: now },
      },
      data: {
        status: 'CONSUMED',
        consumedAt: now,
        activeForEmail: null,
        tokenHash: null,
      },
    });
    if (!claimed.count) {
      throw new AccountAdmissionError(
        410,
        'invalid_invitation',
        'This invitation code is no longer active.'
      );
    }

    let workspaceId = invitation.workspaceId;
    if (!workspaceId) {
      const ws = await tx.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
      workspaceId = ws?.id ?? null;
    }

    const randomPin = String(Math.floor(1000 + Math.random() * 9000));

    const created = await tx.user.create({
      data: {
        workspaceId,
        email: normalizedEmail,
        emailVerified: now,
        name: fullName,
        firstName,
        lastName,
        phone: input.phone?.trim() || null,
        role: assignedRole,
        defaultRoleId: invitation.defaultRoleId || null,
        pin: randomPin,
        startDate: now.toISOString().slice(0, 10),
        isActive: true,
        deleted: false,
        passwordCredential: {
          create: { passwordHash, passwordChangedAt: now },
        },
      },
    });

    await tx.accountInvitation.update({
      where: { id: invitation.id },
      data: { acceptedById: created.id },
    });

    // Assign locations from invitation or fallback to workspace's primary location
    let locationIds: string[] = [];
    try {
      const parsed = JSON.parse(invitation.locationIdsJson);
      if (Array.isArray(parsed)) locationIds = parsed.filter((x) => typeof x === 'string');
    } catch {
      locationIds = [];
    }

    if (locationIds.length === 0 && workspaceId) {
      const primaryLoc = await tx.location.findFirst({
        where: { workspaceId, deleted: false },
        orderBy: { createdAt: 'asc' },
      });
      if (primaryLoc) locationIds = [primaryLoc.id];
    }

    for (const locationId of locationIds) {
      await tx.employeeLocation
        .create({
          data: {
            userId: created.id,
            locationId,
            isManager: assignedRole === 'ADMIN' || assignedRole === 'MANAGER',
          },
        })
        .catch(() => undefined);
    }

    if (invitation.defaultRoleId) {
      await tx.employeeRole
        .create({
          data: {
            userId: created.id,
            roleId: invitation.defaultRoleId,
          },
        })
        .catch(() => undefined);
    }

    if (workspaceId) {
      const ws = await tx.workspace.findUnique({ where: { id: workspaceId } });
      if (ws) {
        try {
          const steps = JSON.parse(ws.setupStepsJson || '{}');
          steps.employeesAdded = true;
          await tx.workspace.update({
            where: { id: workspaceId },
            data: { setupStepsJson: JSON.stringify(steps) },
          });
        } catch {
          // ignore
        }
      }
    }

    await tx.auditLog.create({
      data: {
        workspaceId,
        actorUserId: created.id,
        actorEmail: created.email,
        actorRole: created.role,
        action: 'INVITATION_CONSUMED',
        targetType: 'AccountInvitation',
        targetId: invitation.id,
        summary: `${created.email} registered as ${created.role} using single-use invitation ${invitation.codePrefix}...`,
        metadataJson: JSON.stringify({
          invitationId: invitation.id,
          codePrefix: invitation.codePrefix,
          userId: created.id,
          role: created.role,
        }),
      },
    });

    return created;
  });

  const session = await createDatabaseSession(user.id, now);
  return { user, session };
}
