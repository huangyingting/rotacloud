import { prisma } from '@/lib/prisma';
import { AccountAdmissionError } from './errors';
import { hashPassword } from './passwords';
import { isValidAccountEmail, normalizeAccountEmail } from './policy';

/**
 * Provisions or promotes a root Administrator account from the deployment host CLI
 * (`npm run auth:bootstrap-admin -- --email <email> --name <name> --password <password>`).
 *
 * Security invariant: Never exposed via an HTTP API endpoint or public web route.
 * Zero dummy data is created during migrations; only an operator invoking this CLI
 * provisions the initial administrator and workspace.
 */
export async function bootstrapAdmin(input: {
  email: string;
  password: string;
  name?: string | null;
  companyName?: string | null;
  locationName?: string | null;
}) {
  const email = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid administrator email address.'
    );
  }

  if (!input.password || input.password.length < 8 || input.password.length > 128) {
    throw new AccountAdmissionError(
      400,
      'invalid_password',
      'Administrator password must be between 8 and 128 characters.'
    );
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const displayName = input.name?.trim() || email.split('@')[0] || 'Jack Wolf';
  const parts = displayName.split(/\s+/);
  const firstName = parts[0] || 'Admin';
  const lastName = parts.slice(1).join(' ') || 'User';
  const companyName = input.companyName?.trim() || 'MS';
  const locationName = input.locationName?.trim() || companyName;

  return prisma.$transaction(async (tx) => {
    let workspace = await tx.workspace.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!workspace) {
      workspace = await tx.workspace.create({
        data: {
          accountNumericId: 108044,
          name: companyName,
          industry: 'Hospitality',
          timezone: 'Europe/London',
          currencySymbol: '£',
          setupStepsJson: JSON.stringify({
            accountCreated: true,
            locationsAdded: true,
            rolesAdded: false,
            employeesAdded: false,
            shiftPublished: false,
          }),
        },
      });
    }

    let primaryLocation = await tx.location.findFirst({
      where: { workspaceId: workspace.id, deleted: false },
      orderBy: { createdAt: 'asc' },
    });

    if (!primaryLocation) {
      primaryLocation = await tx.location.create({
        data: {
          workspaceId: workspace.id,
          name: locationName,
          timezone: workspace.timezone,
          address: 'London, United Kingdom',
        },
      });
    }

    const existing = await tx.user.findUnique({
      where: { email },
    });

    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            workspaceId: workspace.id,
            name: displayName,
            firstName,
            lastName,
            passwordHash: null,
            role: 'ADMIN',
            isActive: true,
            deleted: false,
            emailVerified: existing.emailVerified ?? now,
          },
        })
      : await tx.user.create({
          data: {
            workspaceId: workspace.id,
            email,
            name: displayName,
            firstName,
            lastName,
            passwordHash: null,
            role: 'ADMIN',
            isActive: true,
            deleted: false,
            pin: '1001',
            weeklyHours: 40,
            holidayAllowance: 28,
            hourlyRate: 15.0,
            startDate: now.toISOString().slice(0, 10),
            rightToWorkChecked: true,
            emailVerified: now,
          },
        });

    await tx.employeeLocation.upsert({
      where: {
        userId_locationId: {
          userId: user.id,
          locationId: primaryLocation.id,
        },
      },
      create: {
        userId: user.id,
        locationId: primaryLocation.id,
        isManager: true,
      },
      update: {
        isManager: true,
      },
    });

    await tx.passwordCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passwordHash,
        passwordChangedAt: now,
      },
      update: {
        passwordHash,
        passwordChangedAt: now,
        resetTokenHash: null,
        resetExpiresAt: null,
      },
    });

    await tx.session.deleteMany({ where: { userId: user.id } });

    await tx.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: 'ADMIN',
        action: 'ADMIN_BOOTSTRAPPED',
        targetType: 'User',
        targetId: user.id,
        summary: `Bootstrapped administrator ${user.email} for workspace ${workspace.name} (#${workspace.accountNumericId}).`,
        metadataJson: JSON.stringify({
          created: !existing,
          workspaceId: workspace.id,
          accountNumericId: workspace.accountNumericId,
        }),
      },
    });

    return {
      user,
      workspace,
      location: primaryLocation,
      created: !existing,
    };
  });
}
