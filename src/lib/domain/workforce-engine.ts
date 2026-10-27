export type LeaveTypeDefinition = {
  id: number;
  name: string;
  colour: string;
  defaultPaid: boolean;
  deductsFromHolidayAllowance: boolean;
  countsTowardBradford: boolean;
};

export const SYSTEM_LEAVE_TYPES: LeaveTypeDefinition[] = [
  { id: 1, name: 'Holiday', colour: '#2B9AF4', defaultPaid: true, deductsFromHolidayAllowance: true, countsTowardBradford: false },
  { id: 2, name: 'Other Leave', colour: '#00AA77', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 3, name: 'Sickness', colour: '#F5B827', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: true },
  { id: 4, name: 'Maternity / Paternity', colour: '#E889B9', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 5, name: 'Public Holiday', colour: '#3B59C2', defaultPaid: true, deductsFromHolidayAllowance: true, countsTowardBradford: false },
  { id: 6, name: 'Absence (Authorised)', colour: '#FF813D', defaultPaid: false, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 7, name: 'Absence (Unauthorised)', colour: '#E52332', defaultPaid: false, deductsFromHolidayAllowance: false, countsTowardBradford: true },
  { id: 8, name: 'Furlough', colour: '#AB8058', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 9, name: 'Parental', colour: '#AF597D', defaultPaid: false, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 10, name: 'Study Leave', colour: '#D2BE0B', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 11, name: 'Compassionate', colour: '#9B51E0', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 12, name: 'Training', colour: '#92CC18', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 13, name: 'TOIL', colour: '#2679A8', defaultPaid: true, deductsFromHolidayAllowance: false, countsTowardBradford: false },
  { id: 14, name: "Carer's Leave", colour: '#0C9292', defaultPaid: false, deductsFromHolidayAllowance: false, countsTowardBradford: false },
];

export function getLeaveTypeById(id: number): LeaveTypeDefinition {
  return SYSTEM_LEAVE_TYPES.find((lt) => lt.id === id) || SYSTEM_LEAVE_TYPES[0];
}

export function parseTimeMinutes(hhmm: string): number {
  const [hRaw = '0', mRaw = '0'] = (hhmm || '00:00').split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(24 * 60, h * 60 + m));
}

export function calculateShiftMetrics(input: {
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  breaksPaid?: boolean;
  hourlyRate?: number;
  roleDefaultRate?: number;
  customRoleRate?: number | null;
  salaryType?: string;
}): {
  grossMinutes: number;
  netMinutes: number;
  netHours: number;
  effectiveHourlyRate: number;
  wageCost: number;
} {
  const startMins = parseTimeMinutes(input.startTime);
  const endMins = parseTimeMinutes(input.endTime);

  let grossMinutes = endMins - startMins;
  if (grossMinutes <= 0) {
    grossMinutes += 24 * 60;
  }

  const breakMins = Math.max(0, Number(input.breakMinutes || 0));
  const netMinutes = input.breaksPaid
    ? grossMinutes
    : Math.max(0, grossMinutes - breakMins);

  const netHours = Number((netMinutes / 60).toFixed(2));

  let effectiveHourlyRate = 0;
  if (input.salaryType === 'salaried' || input.salaryType === 'ANNUAL_SALARY') {
    effectiveHourlyRate = 0;
  } else if (
    typeof input.customRoleRate === 'number' &&
    input.customRoleRate > 0
  ) {
    effectiveHourlyRate = input.customRoleRate;
  } else if (typeof input.hourlyRate === 'number' && input.hourlyRate > 0) {
    effectiveHourlyRate = input.hourlyRate;
  } else if (
    typeof input.roleDefaultRate === 'number' &&
    input.roleDefaultRate > 0
  ) {
    effectiveHourlyRate = input.roleDefaultRate;
  }

  const wageCost = Number((netHours * effectiveHourlyRate).toFixed(2));

  return {
    grossMinutes,
    netMinutes,
    netHours,
    effectiveHourlyRate,
    wageCost,
  };
}

export function calculateStatutoryHolidayAccrual(
  workedHours: number,
  accrualRatePercent = 12.07
): number {
  if (workedHours <= 0 || accrualRatePercent <= 0) return 0;
  return Number(((workedHours * accrualRatePercent) / 100).toFixed(2));
}

export function enumerateDatesInclusive(
  startDate: string,
  endDate: string
): string[] {
  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [startDate];
  }
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 366) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    guard += 1;
  }
  return result;
}

export function calculateLeaveDuration(input: {
  startDate: string;
  endDate: string;
  workScheduleJson?: string;
  weeklyHours?: number;
}): { daysCount: number; hoursCount: number } {
  const dates = enumerateDatesInclusive(input.startDate, input.endDate);
  let schedule: Record<string, boolean> = {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  };
  if (input.workScheduleJson) {
    try {
      schedule = { ...schedule, ...JSON.parse(input.workScheduleJson) };
    } catch {
      // keep default
    }
  }

  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  let workingDaysInRange = 0;
  for (const d of dates) {
    const dt = new Date(`${d}T00:00:00Z`);
    const key = dayMap[dt.getUTCDay()];
    if (schedule[key] !== false) {
      workingDaysInRange += 1;
    }
  }

  const daysCount = workingDaysInRange > 0 ? workingDaysInRange : dates.length;
  const activeWeekDays =
    Object.values(schedule).filter(Boolean).length || 5;
  const dailyHours = Number(
    ((input.weeklyHours || 40) / activeWeekDays).toFixed(2)
  );
  const hoursCount = Number((daysCount * dailyHours).toFixed(2));

  return { daysCount, hoursCount };
}

export function detectLeaveShiftClashes<
  T extends { id: string; userId: string | null; date: string; deleted?: boolean }
>(
  leave: { userId: string; startDate: string; endDate: string },
  shifts: T[]
): T[] {
  return shifts.filter(
    (shift) =>
      !shift.deleted &&
      shift.userId === leave.userId &&
      shift.date >= leave.startDate &&
      shift.date <= leave.endDate
  );
}

export function detectLeaveEmbargoConflicts<
  T extends {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    locationId?: string | null;
    appliesToAll?: boolean;
  }
>(
  leave: { startDate: string; endDate: string; locationIds?: string[] },
  embargoes: T[]
): T[] {
  return embargoes.filter((embargo) => {
    const overlaps =
      leave.startDate <= embargo.endDate && leave.endDate >= embargo.startDate;
    if (!overlaps) return false;
    if (embargo.appliesToAll || !embargo.locationId) return true;
    return (leave.locationIds || []).includes(embargo.locationId);
  });
}

export function evaluateTimesheetDiscrepancies(input: {
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  graceMinutes?: number;
}): string[] {
  const flags: string[] = [];
  const grace = input.graceMinutes ?? 5;

  if (input.clockInTime && !input.clockOutTime) {
    flags.push('MISSING_CLOCK_OUT');
  }
  if (!input.scheduledStart && input.clockInTime) {
    flags.push('UNSCHEDULED_SHIFT');
    return flags;
  }
  if (input.scheduledStart && input.clockInTime) {
    const schedIn = parseTimeMinutes(input.scheduledStart);
    const actualIn = parseTimeMinutes(input.clockInTime);
    if (actualIn - schedIn > grace) flags.push('LATE_IN');
    else if (schedIn - actualIn > grace * 2) flags.push('EARLY_IN');
  }
  if (input.scheduledEnd && input.clockOutTime) {
    const schedOut = parseTimeMinutes(input.scheduledEnd);
    const actualOut = parseTimeMinutes(input.clockOutTime);
    if (schedOut - actualOut > grace) flags.push('EARLY_OUT');
    else if (actualOut - schedOut > grace * 2) flags.push('LATE_OUT');
  }
  return flags;
}

export function calculateBradfordFactor(
  spellsCount: number,
  totalDaysAbsent: number
): {
  spells: number;
  totalDays: number;
  score: number;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
} {
  const spells = Math.max(0, Math.round(spellsCount));
  const totalDays = Math.max(0, Number(totalDaysAbsent.toFixed(1)));
  const score = Math.round(spells * spells * totalDays);

  let severity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (score >= 500) severity = 'Critical';
  else if (score >= 200) severity = 'High';
  else if (score >= 51) severity = 'Moderate';

  return { spells, totalDays, score, severity };
}

export function evaluateWtdCompliance(input: {
  weeklyScheduledHours: number;
  maxWeeklyHours?: number;
  optedOutWtd?: boolean;
}): {
  compliant: boolean;
  exceededByHours: number;
  limitHours: number;
} {
  const limitHours = input.optedOutWtd
    ? Math.max(48, input.maxWeeklyHours || 60)
    : input.maxWeeklyHours || 48;
  const exceededByHours = Number(
    Math.max(0, input.weeklyScheduledHours - limitHours).toFixed(2)
  );
  return {
    compliant: exceededByHours === 0,
    exceededByHours,
    limitHours,
  };
}

export function calculateStairstepSubscriptionCost(input: {
  employeeCount: number;
  planId: 'plan-standard' | 'plan-pro' | string;
  billingCycle: 'monthly' | 'annual' | string;
  addonTimeAndAttendance?: boolean;
  smsCreditsBundle?: number;
}): {
  bandMaxEmployees: number;
  bandsCount: number;
  baseMonthlyGBP: number;
  addonAttendanceMonthlyGBP: number;
  smsPackGBP: number;
  discountPercent: number;
  effectiveMonthlyGBP: number;
} {
  const staff = Math.max(1, Math.min(500, Math.ceil(input.employeeCount || 1)));
  const bandsCount = Math.ceil(staff / 5);
  const bandMaxEmployees = bandsCount * 5;
  const isPro = input.planId === 'plan-pro';
  const ratePerBand = isPro ? 15 : 10;
  const baseMonthlyGBP = bandsCount * ratePerBand;
  const addonAttendanceMonthlyGBP = input.addonTimeAndAttendance
    ? bandsCount * 5
    : 0;
  const smsPackGBP =
    input.smsCreditsBundle && input.smsCreditsBundle > 0
      ? Number(((input.smsCreditsBundle / 100) * 6).toFixed(2))
      : 0;

  const isAnnual = input.billingCycle === 'annual';
  const discountPercent = isAnnual ? 16.7 : 0;
  const recurringSubtotal = baseMonthlyGBP + addonAttendanceMonthlyGBP;
  const discountedRecurring = isAnnual
    ? Number((recurringSubtotal * (1 - 0.167)).toFixed(2))
    : recurringSubtotal;

  return {
    bandMaxEmployees,
    bandsCount,
    baseMonthlyGBP,
    addonAttendanceMonthlyGBP,
    smsPackGBP,
    discountPercent,
    effectiveMonthlyGBP: Number((discountedRecurring + smsPackGBP).toFixed(2)),
  };
}

export function getMondayOfWeek(dateStr?: string): string {
  const base = dateStr ? new Date(`${dateStr}T12:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return getMondayOfWeek(new Date().toISOString().slice(0, 10));
  }
  const day = base.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setUTCDate(base.getUTCDate() + diff);
  return base.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, offset: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function getWeekDates(weekStartMonday: string): string[] {
  const monday = getMondayOfWeek(weekStartMonday);
  return Array.from({ length: 7 }, (_, idx) => addDays(monday, idx));
}

export const LEAVE_TYPES = SYSTEM_LEAVE_TYPES.map((lt) => ({
  ...lt,
  code: lt.id,
}));

export const calculateUkHolidayAccrual = calculateStatutoryHolidayAccrual;

export function calculateSubscriptionQuote(input: {
  plan: 'standard' | 'pro';
  cycle: 'monthly' | 'annual';
  employeesCount: number;
  includeTimeAndAttendance?: boolean;
  terminalsCount?: number;
}) {
  const base = calculateStairstepSubscriptionCost({
    employeeCount: input.employeesCount,
    planId: input.plan === 'pro' ? 'plan-pro' : 'plan-standard',
    billingCycle: input.cycle,
    addonTimeAndAttendance: input.includeTimeAndAttendance,
  });
  const terminalsMonthlyGBP = Math.max(0, input.terminalsCount || 0) * 15;
  return {
    ...base,
    billedEmployeesBracket: base.bandMaxEmployees,
    rotaMonthlyGBP: base.baseMonthlyGBP,
    attendanceMonthlyGBP: base.addonAttendanceMonthlyGBP,
    terminalsMonthlyGBP,
    totalMonthlyGBP: Number(
      (base.effectiveMonthlyGBP + terminalsMonthlyGBP).toFixed(2)
    ),
  };
}

