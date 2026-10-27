import { prisma } from '@/lib/prisma';

export async function removeDemoData() {
  return prisma.$transaction(async (tx) => {
    const demoUsers = await tx.user.deleteMany({
      where: {
        OR: [
          { email: { endsWith: '@example.com' } },
          { email: { startsWith: 'demo@' } },
          { id: { in: ['u_demo_admin', 'u_demo_employee'] } },
        ],
      },
    });

    const demoInvites = await tx.accountInvitation.deleteMany({
      where: {
        OR: [
          { email: { endsWith: '@example.com' } },
          { id: { in: ['inv_demo_pending', 'inv_demo_accepted'] } },
        ],
      },
    });

    return {
      removedUsers: demoUsers.count,
      removedInvitations: demoInvites.count,
    };
  });
}
