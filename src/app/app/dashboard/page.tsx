'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/components/AppShell';
import {
  getMondayOfWeek,
  getWeekDates,
} from '@/lib/domain/workforce-engine';
import {
  Calendar,
  Clock,
  Palmtree,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, workspace, locations, refreshWorkspace } = useAppContext();
  const [shifts, setShifts] = useState<Array<any>>([]);
  const [leaveRecords, setLeaveRecords] = useState<Array<any>>([]);
  const [shiftRequests, setShiftRequests] = useState<Array<any>>([]);
  const [clockMessage, setClockMessage] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const weekMonday = getMondayOfWeek(today);
  const weekDates = getWeekDates(weekMonday);

  const loadDashboardData = useCallback(async () => {
    const [shiftsRes, leaveRes, reqRes] = await Promise.all([
      fetch(`/api/v1/shifts?startDate=${weekDates[0]}&endDate=${weekDates[6]}`),
      fetch(`/api/v1/leave?year=${today.slice(0, 4)}`),
      fetch('/api/v1/shift-requests'),
    ]);
    if (shiftsRes.ok) {
      const d = await shiftsRes.json();
      setShifts(d.shifts || []);
    }
    if (leaveRes.ok) {
      const d = await leaveRes.json();
      setLeaveRecords(d.leaveRecords || []);
    }
    if (reqRes.ok) {
      const d = await reqRes.json();
      setShiftRequests(d.shiftRequests || []);
    }
  }, [today, weekDates[0], weekDates[6]]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleQuickClock(mode: 'clock_in' | 'clock_out') {
    setClockMessage('');
    const res = await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        locationId: locations[0]?.id,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setClockMessage(
        data.action === 'clocked_in'
          ? `Clocked in at ${data.timesheet.clockInTime}`
          : `Clocked out at ${data.timesheet.clockOutTime} (${data.timesheet.workedHours}h)`
      );
    } else {
      setClockMessage(data.error || 'Unable to clock.');
    }
  }

  async function handleReviewLeave(id: string, status: 'APPROVED' | 'DECLINED') {
    await fetch(`/api/v1/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadDashboardData();
    await refreshWorkspace();
  }

  async function handleReviewShiftRequest(
    id: string,
    status: 'APPROVED' | 'DECLINED'
  ) {
    await fetch(`/api/v1/shift-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadDashboardData();
    await refreshWorkspace();
  }

  const myWeekShifts = shifts.filter((s) => s.userId === user.id);
  const todayShifts = shifts.filter((s) => s.date === today);
  const openShiftsCount = shifts.filter((s) => !s.userId).length;
  const onLeaveToday = leaveRecords.filter(
    (l) =>
      l.status === 'APPROVED' && l.startDate <= today && l.endDate >= today
  );
  const pendingLeaves = leaveRecords.filter((l) => l.status === 'REQUESTED');
  const pendingShiftReqs = shiftRequests.filter((r) => r.status === 'PENDING');

  const steps = workspace?.setupSteps || {
    accountCreated: true,
    locationsAdded: false,
    rolesAdded: false,
    employeesAdded: false,
    shiftPublished: false,
  };
  const completedSteps = Object.values(steps).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header & Quick Clocking Bar */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.firstName || user.name}
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            {workspace?.name} (#{workspace?.accountNumericId}) •{' '}
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {clockMessage && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              {clockMessage}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleQuickClock('clock_in')}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5" /> Clock In Now
          </button>
          <button
            type="button"
            onClick={() => handleQuickClock('clock_out')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Square className="w-3.5 h-3.5" /> Clock Out
          </button>
          <Link
            href="/app/rotas"
            className="px-4 py-2 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            Open Rota Builder <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Setup Wizard Progress Banner if incomplete */}
      {completedSteps < 5 && (
        <div className="bg-[#ebf3ff] border border-[#0a65fc]/25 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0a65fc] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Complete your RotaCloud Setup ({completedSteps}/5 steps done)
              </div>
              <div className="text-xs text-[#555459]">
                Add locations, create roles, invite employees, and publish your
                first shift.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Link
              href="/app/locations"
              className="px-3 py-1.5 rounded bg-white text-[#0a65fc] border border-[#0a65fc]/20"
            >
              + Locations
            </Link>
            <Link
              href="/app/roles"
              className="px-3 py-1.5 rounded bg-white text-[#0a65fc] border border-[#0a65fc]/20"
            >
              + Roles
            </Link>
            <Link
              href="/app/employees"
              className="px-3 py-1.5 rounded bg-white text-[#0a65fc] border border-[#0a65fc]/20"
            >
              + Invite Staff
            </Link>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#555459]">
            <span>Scheduled Today</span>
            <Calendar className="w-4 h-4 text-[#0a65fc]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {todayShifts.length}
          </div>
          <div className="text-xs text-[#555459] mt-1">
            {openShiftsCount} Open Shift(s) this week
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#555459]">
            <span>Your Weekly Hours</span>
            <Clock className="w-4 h-4 text-[#0a65fc]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {myWeekShifts.reduce((a, s) => a + s.netHours, 0).toFixed(1)}h
          </div>
          <div className="text-xs text-[#555459] mt-1">
            Across {myWeekShifts.length} scheduled shift(s)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#555459]">
            <span>On Leave Today</span>
            <Palmtree className="w-4 h-4 text-[#0a65fc]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {onLeaveToday.length}
          </div>
          <div className="text-xs text-[#555459] mt-1">
            Approved absences today
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-[#555459]">
            <span>Pending Requests</span>
            <Users className="w-4 h-4 text-[#0a65fc]" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {pendingLeaves.length + pendingShiftReqs.length}
          </div>
          <div className="text-xs text-[#555459] mt-1">
            {pendingLeaves.length} Leave • {pendingShiftReqs.length} Shift Swaps
          </div>
        </div>
      </div>

      {/* Your Weekly Rota Strip */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e5ec] flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Your Rota This Week ({weekDates[0]} to {weekDates[6]})
          </h2>
          <Link
            href="/app/rotas"
            className="text-xs font-bold text-[#0a65fc] hover:underline"
          >
            View Full Rota →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#e2e5ec]">
          {weekDates.map((d) => {
            const dt = new Date(`${d}T12:00:00Z`);
            const dayShifts = myWeekShifts.filter((s) => s.date === d);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`p-4 min-h-[120px] ${
                  isToday ? 'bg-[#ebf3ff]/40' : ''
                }`}
              >
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>
                    {dt.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded bg-[#0a65fc] text-white text-[10px]">
                      Today
                    </span>
                  )}
                </div>
                {dayShifts.length === 0 ? (
                  <div className="text-xs text-slate-400 italic mt-4">
                    No shifts
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayShifts.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-md p-2 text-white text-xs shadow-xs"
                        style={{
                          backgroundColor: s.role?.colour || '#0a65fc',
                        }}
                      >
                        <div className="font-bold">
                          {s.startTime} - {s.endTime}
                        </div>
                        <div className="opacity-90 truncate">
                          {s.role?.name} • {s.location?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Two-Column Grid: Scheduled Today + Pending Requests / On Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm">
          <div className="px-6 py-4 border-b border-[#e2e5ec] flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Who&apos;s In Today ({today})
            </h2>
            <Link
              href="/app/calendar"
              className="text-xs font-bold text-[#0a65fc] hover:underline"
            >
              Coverage Calendar
            </Link>
          </div>
          <div className="p-6">
            {todayShifts.length === 0 ? (
              <p className="text-sm text-[#555459]">
                No shifts scheduled for today yet.{' '}
                <Link
                  href="/app/rotas"
                  className="text-[#0a65fc] font-bold hover:underline"
                >
                  Add shifts on the Rota Builder
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-3">
                {todayShifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#f5f6f8] border border-[#e2e5ec]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-8 rounded-full"
                        style={{ backgroundColor: s.role?.colour || '#0a65fc' }}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {s.user?.name || 'Open Shift (Unassigned)'}
                        </div>
                        <div className="text-xs text-[#555459]">
                          {s.role?.name} • {s.location?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">
                        {s.startTime} – {s.endTime}
                      </div>
                      <div className="text-xs text-[#555459]">
                        {s.netHours}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Approvals & On Leave */}
        <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm">
          <div className="px-6 py-4 border-b border-[#e2e5ec] flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Pending Requests &amp; Leave Today
            </h2>
            <Link
              href="/app/leave"
              className="text-xs font-bold text-[#0a65fc] hover:underline"
            >
              Manage Leave
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {pendingLeaves.length === 0 &&
            pendingShiftReqs.length === 0 &&
            onLeaveToday.length === 0 ? (
              <p className="text-sm text-[#555459]">
                All caught up! No pending leave requests or shift swaps waiting
                for approval.
              </p>
            ) : (
              <>
                {pendingLeaves.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50/70 border border-amber-200"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {l.user?.name} — {l.leaveTypeName}
                      </div>
                      <div className="text-xs text-[#555459]">
                        {l.startDate} to {l.endDate} ({l.daysCount}d /{' '}
                        {l.hoursCount}h)
                      </div>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewLeave(l.id, 'APPROVED')}
                          className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Approve Leave"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewLeave(l.id, 'DECLINED')}
                          className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                          title="Decline Leave"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {pendingShiftReqs.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50/70 border border-blue-200"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {r.requester?.name} — Shift {r.type}
                      </div>
                      <div className="text-xs text-[#555459]">
                        {r.shift?.date} ({r.shift?.startTime}-
                        {r.shift?.endTime}) • {r.shift?.role?.name}
                      </div>
                    </div>
                    {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewShiftRequest(r.id, 'APPROVED')
                          }
                          className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Approve Request"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewShiftRequest(r.id, 'DECLINED')
                          }
                          className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                          title="Decline Request"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {onLeaveToday.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#f5f6f8] border border-[#e2e5ec]"
                  >
                    <div className="text-sm font-bold text-slate-800">
                      {l.user?.name}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                      {l.leaveTypeName} Today
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
