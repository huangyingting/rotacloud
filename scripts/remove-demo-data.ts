import './environment';
import { prisma } from '../src/lib/prisma';

async function main() {
  const result = await prisma.$transaction(async (tx) => {
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
      demoUsersRemoved: demoUsers.count,
      demoInvitationsRemoved: demoInvites.count,
    };
  });

  console.log(JSON.stringify({ ok: true, ...result }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
