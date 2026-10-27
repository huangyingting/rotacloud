import { NextResponse } from 'next/server';
import { api, requireUser } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import {
  calculateBradfordFactor,
  evaluateWtdCompliance,
  getLeaveTypeById,
} from '@/lib/domain/workforce-engine';

export const GET = api(async (request) => {
  const { workspaceId } = await requireUser(request);
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;
  const locationId = url.searchParams.get('locationId') || undefined;

  const [employees, shifts, timesheets, leaveRecords] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId, deleted: false },
      include: { defaultRole: true, group: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.shift.findMany({
      where: {
        workspaceId,
        deleted: false,
        ...(locationId ? { locationId } : {}),
        ...(startDate && endDate
          ? { date: { gte: startDate, lte: endDate } }
          : {}),
      },
      include: { role: true, location: true },
    }),
    prisma.timesheet.findMany({
      where: {
        workspaceId,
        ...(locationId ? { locationId } : {}),
        ...(startDate && endDate
          ? { date: { gte: startDate, lte: endDate } }
          : {}),
      },
    }),
    prisma.leaveRecord.findMany({
      where: {
        workspaceId,
        ...(startDate && endDate
          ? { startDate: { lte: endDate }, endDate: { gte: startDate } }
          : {}),
      },
    }),
  ]);

  const employeeReports = employees.map((emp) => {
    const empShifts = shifts.filter((s) => s.userId === emp.id);
    const empTimesheets = timesheets.filter((t) => t.userId === emp.id);
    const empLeaves = leaveRecords.filter(
      (l) => l.userId === emp.id && l.status === 'APPROVED'
    );

    const scheduledHours = Number(
      empShifts.reduce((acc, s) => acc + s.netHours, 0).toFixed(2)
    );
    const scheduledCost = Number(
      empShifts.reduce((acc, s) => acc + s.wageCost, 0).toFixed(2)
    );
    const workedHours = Number(
      empTimesheets.reduce((acc, t) => acc + t.workedHours, 0).toFixed(2)
    );
    const workedCost = Number(
      empTimesheets.reduce((acc, t) => acc + t.wageCost, 0).toFixed(2)
    );
    const accruedHolidayHours = Number(
      empTimesheets
        .reduce((acc, t) => acc + t.accruedHolidayHours, 0)
        .toFixed(2)
    );

    const holidayUsedDays = Number(
      empLeaves
        .filter((l) => getLeaveTypeById(l.leaveTypeId).deductsFromHolidayAllowance)
        .reduce((acc, l) => acc + l.daysCount, 0)
        .toFixed(1)
    );
    const holidayRemainingDays = Number(
      Math.max(0, emp.holidayAllowance - holidayUsedDays).toFixed(1)
    );

    const bradfordLeaves = empLeaves.filter(
      (l) => getLeaveTypeById(l.leaveTypeId).countsTowardBradford
    );
    const bradford = calculateBradfordFactor(
      bradfordLeaves.length,
      bradfordLeaves.reduce((acc, l) => acc + l.daysCount, 0)
    );

    const wtd = evaluateWtdCompliance({
      weeklyScheduledHours: scheduledHours,
      maxWeeklyHours: emp.maxWeeklyHours,
      optedOutWtd: emp.optedOutWtd,
    });

    return {
      employee: {
        id: emp.id,
        name: emp.name || `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        role: emp.role,
        defaultRoleName: emp.defaultRole?.name || 'Unassigned',
        groupName: emp.group?.name || 'No Group',
        weeklyHours: emp.weeklyHours,
        hourlyRate: emp.hourlyRate,
        holidayAllowance: emp.holidayAllowance,
        optedOutWtd: emp.optedOutWtd,
      },
      shiftCount: empShifts.length,
      scheduledHours,
      scheduledCost,
      workedHours,
      workedCost,
      varianceHours: Number((workedHours - scheduledHours).toFixed(2)),
      varianceCost: Number((workedCost - scheduledCost).toFixed(2)),
      accruedHolidayHours,
      holidayUsedDays,
      holidayRemainingDays,
      bradford,
      wtd,
    };
  });

  const openShifts = shifts.filter((s) => !s.userId);
  const unpublishedShifts = shifts.filter((s) => !s.published);

  return NextResponse.json({
    employeeReports,
    totals: {
      totalScheduledHours: Number(
        employeeReports.reduce((a, r) => a + r.scheduledHours, 0).toFixed(2)
      ),
      totalScheduledCost: Number(
        employeeReports.reduce((a, r) => a + r.scheduledCost, 0).toFixed(2)
      ),
      totalWorkedHours: Number(
        employeeReports.reduce((a, r) => a + r.workedHours, 0).toFixed(2)
      ),
      totalWorkedCost: Number(
        employeeReports.reduce((a, r) => a + r.workedCost, 0).toFixed(2)
      ),
      openShiftsCount: openShifts.length,
      unpublishedShiftsCount: unpublishedShifts.length,
    },
  });
});
