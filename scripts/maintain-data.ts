import './environment';
import { prisma } from '../src/lib/prisma';

async function main() {
  const now = new Date();
  const [sessions, limits, invitations] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { expires: { lte: now } } }),
    prisma.requestLimit.deleteMany({ where: { resetsAt: { lte: now } } }),
    prisma.accountInvitation.updateMany({
      where: { status: 'PENDING', expiresAt: { lte: now } },
      data: { status: 'EXPIRED', tokenHash: null, activeForEmail: null },
    }),
  ]);

  await prisma.passwordCredential.updateMany({
    where: { resetExpiresAt: { lte: now } },
    data: { resetExpiresAt: null, resetTokenHash: null },
  });

  console.log(
    JSON.stringify({
      ok: true,
      expiredSessions: sessions.count,
      expiredLimits: limits.count,
      expiredInvitations: invitations.count,
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
