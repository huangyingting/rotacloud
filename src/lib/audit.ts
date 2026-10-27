import { prisma } from '@/lib/prisma';

export type AuditLogInput = {
  workspaceId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

export async function recordAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId ?? null,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      metadataJson: JSON.stringify(input.metadata ?? {}),
      ipAddress: input.ipAddress ?? null,
    },
  });
}
