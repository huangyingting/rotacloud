import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateShiftMetrics,
  calculateLeaveDuration,
  detectLeaveShiftClashes,
  detectLeaveEmbargoConflicts,
  calculateUkHolidayAccrual,
  calculateBradfordFactor,
  evaluateWtdCompliance,
  calculateSubscriptionQuote,
  LEAVE_TYPES,
} from '../src/lib/domain/workforce-engine';
import { prisma } from '../src/lib/prisma';
import { bootstrapAdmin } from '../src/lib/account-admission/bootstrap';
import {
  createAccountInvitation,
  inspectAccountInvitation,
  revokeAccountInvitation,
  rotateAccountInvitation,
} from '../src/lib/account-admission/invitations';
import { registerWithInvitation } from '../src/lib/account-admission/registration';
import { removeDemoData } from '../src/lib/account-admission/maintenance';

test('Workforce Domain Engine: calculates daytime, overnight, paid/unpaid break, and salaried shift metrics', () => {
  const daytime = calculateShiftMetrics({
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 30,
    breaksPaid: false,
    hourlyRate: 12.5,
  });
  assert.equal(daytime.grossMinutes, 480);
  assert.equal(daytime.netHours, 7.5);
  assert.equal(daytime.wageCost, 93.75);

  const overnightPaidBreak = calculateShiftMetrics({
    startTime: '22:00',
    endTime: '06:00',
    breakMinutes: 45,
    breaksPaid: true,
    hourlyRate: 15,
  });
  assert.equal(overnightPaidBreak.grossMinutes, 480);
  assert.equal(overnightPaidBreak.netHours, 8);
  assert.equal(overnightPaidBreak.wageCost, 120);

  const salaried = calculateShiftMetrics({
    startTime: '09:00',
    endTime: '17:00',
    breakMinutes: 60,
    breaksPaid: false,
    hourlyRate: 20,
    salaryType: 'salaried',
  });
  assert.equal(salaried.netHours, 7);
  assert.equal(salaried.wageCost, 0);
});

test('Workforce Domain Engine: supports all 14 RotaCloud leave types, shift clash detection, and embargo overlaps', () => {
  assert.equal(LEAVE_TYPES.length, 14);
  const leaveDur = calculateLeaveDuration({
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    weeklyHours: 40,
  });
  assert.equal(leaveDur.daysCount, 5);
  assert.equal(leaveDur.hoursCount, 40);

  const clashes = detectLeaveShiftClashes(
    {
      userId: 'u1',
      startDate: '2026-08-10',
      endDate: '2026-08-14',
    },
    [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-08-12',
      },
      {
        id: 's2',
        userId: 'u1',
        date: '2026-08-20',
      },
    ]
  );
  assert.equal(clashes.length, 1);
  assert.equal(clashes[0].id, 's1');

  const embargoes = detectLeaveEmbargoConflicts(
    {
      startDate: '2026-08-10',
      endDate: '2026-08-14',
    },
    [
      {
        id: 'e1',
        name: 'Summer Peak',
        startDate: '2026-08-01',
        endDate: '2026-08-15',
        appliesToAll: true,
      },
    ]
  );
  assert.equal(embargoes.length, 1);
});

test('Workforce Domain Engine: UK 12.07% holiday accrual, Bradford Factor S^2*D, WTD 48h compliance, and stairstep pricing', () => {
  assert.equal(calculateUkHolidayAccrual(100), 12.07);

  const bradford = calculateBradfordFactor(3, 9);
  assert.equal(bradford.score, 81);
  assert.equal(bradford.severity, 'Moderate');

  const wtd = evaluateWtdCompliance({
    weeklyScheduledHours: 52,
    maxWeeklyHours: 48,
    optedOutWtd: false,
  });
  assert.equal(wtd.compliant, false);
  assert.equal(wtd.exceededByHours, 4);

  const quote = calculateSubscriptionQuote({
    plan: 'pro',
    cycle: 'annual',
    employeesCount: 15,
    includeTimeAndAttendance: true,
    terminalsCount: 1,
  });
  assert.equal(quote.billedEmployeesBracket, 15);
  assert.ok(quote.totalMonthlyGBP > 0);
});

test('Invite-Only Admission & Audit Lifecycle: bootstrap admin, issue single-use code, consume once, reject replay, revoke/rotate, and verify zero dummy data', async () => {
  await prisma.auditLog.deleteMany({});
  await prisma.accountInvitation.deleteMany({});
  await prisma.shiftRequest.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.leaveRecord.deleteMany({});
  await prisma.timesheet.deleteMany({});
  await prisma.employeeLocation.deleteMany({});
  await prisma.employeeRole.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  // 1. Bootstrap initial Admin via CLI helper
  const boot = await bootstrapAdmin({
    email: 'jack.wolf@rotacloud-test.local',
    name: 'Jack Wolf',
    password: 'AdminPassword123!',
    companyName: 'MS',
    locationName: 'York',
  });
  assert.equal(boot.user.role, 'ADMIN');
  assert.equal(boot.workspace.accountNumericId, 108044);

  // 2. Issue single-use invitation code for an EMPLOYEE
  const issued = await createAccountInvitation({
    workspaceId: boot.workspace.id,
    email: 'barista@rotacloud-test.local',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    role: 'EMPLOYEE',
    expiresInHours: 48,
    invitedById: boot.user.id,
    locationIds: [boot.location.id],
  });
  assert.match(issued.code, /^RC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // 3. Inspect code before consumption
  const inspected = await inspectAccountInvitation(issued.code);
  assert.equal(inspected.status, 'pending');
  assert.equal(inspected.email, 'barista@rotacloud-test.local');

  // 4. Register employee using single-use invitation code
  const registered = await registerWithInvitation({
    token: issued.code,
    email: 'barista@rotacloud-test.local',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    password: 'StaffPassword123!',
  });
  assert.equal(registered.user.role, 'EMPLOYEE');

  // 5. Verify replay of consumed invitation code is strictly rejected
  await assert.rejects(
    async () => {
      await registerWithInvitation({
        token: issued.code,
        email: 'barista@rotacloud-test.local',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        password: 'StaffPassword123!',
      });
    },
    /invalid|already used|revoked/i
  );

  // 6. Issue another invitation, rotate its code, and then revoke it
  const secondInvite = await createAccountInvitation({
    workspaceId: boot.workspace.id,
    email: 'supervisor@rotacloud-test.local',
    role: 'MANAGER',
    invitedById: boot.user.id,
  });
  const rotated = await rotateAccountInvitation(secondInvite.invitation.id);
  assert.notEqual(rotated.code, secondInvite.code);

  const revoked = await revokeAccountInvitation(secondInvite.invitation.id, {
    userId: boot.user.id,
  });
  assert.equal(revoked.status, 'REVOKED');

  const inspectRevoked = await inspectAccountInvitation(rotated.code);
  assert.equal(inspectRevoked.status, 'invalid');

  // 7. Verify AuditLog captured all security events
  const auditLogs = await prisma.auditLog.findMany({
    where: { workspaceId: boot.workspace.id },
  });
  const actions = new Set(auditLogs.map((a) => a.action));
  assert.ok(actions.has('ADMIN_BOOTSTRAPPED'));
  assert.ok(actions.has('INVITATION_CREATED'));
  assert.ok(actions.has('INVITATION_CONSUMED'));
  assert.ok(actions.has('INVITATION_REVOKED'));

  // 8. Verify removeDemoData leaves legitimate accounts intact
  const cleanup = await removeDemoData();
  assert.equal(cleanup.removedUsers, 0);

  // 9. Clean up test records so local SQLite DB remains at 0 dummy/test users
  await prisma.auditLog.deleteMany({});
  await prisma.accountInvitation.deleteMany({});
  await prisma.employeeLocation.deleteMany({});
  await prisma.employeeRole.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});
});

