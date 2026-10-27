'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { LEAVE_TYPES } from '@/lib/domain/workforce-engine';
import {
  Palmtree,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Trash2,
} from 'lucide-react';

export default function LeavePage() {
  const { user, refreshWorkspace } = useAppContext();
  const [tab, setTab] = useState<'leave' | 'embargoes' | 'toil'>('leave');
  const [leaveRecords, setLeaveRecords] = useState<Array<any>>([]);
  const [allowanceMatrix, setAllowanceMatrix] = useState<Array<any>>([]);
  const [embargoes, setEmbargoes] = useState<Array<any>>([]);
  const [toilEntries, setToilEntries] = useState<Array<any>>([]);
  const [toilBalances, setToilBalances] = useState<Record<string, number>>({});
  const [employees, setEmployees] = useState<Array<any>>([]);
  const [warningBanner, setWarningBanner] = useState<string>('');

  // Leave form state
  const [selectedUserId, setSelectedUserId] = useState(user.id);
  const [leaveTypeCode, setLeaveTypeCode] = useState<number>(1);
  const [showAll14Types, setShowAll14Types] = useState<boolean>(false);
  const [startPeriod, setStartPeriod] = useState<'full' | 'am' | 'pm'>('full');
  const [endPeriod, setEndPeriod] = useState<'full' | 'am' | 'pm'>('full');
  const [isPaidLeave, setIsPaidLeave] = useState<boolean>(true);
  const [showWhoElseOnLeave, setShowWhoElseOnLeave] = useState<boolean>(false);
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');

  // Set Holiday Allowance Modal state (matching app.rotacloud.com Leave -> "Set")
  const [allowanceModalUser, setAllowanceModalUser] = useState<any | null>(
    null
  );
  const [allowanceMode, setAllowanceMode] = useState<'FIXED' | 'ACCRUE'>(
    'FIXED'
  );
  const [allowanceUnit, setAllowanceUnit] = useState<'DAYS' | 'HOURS'>('DAYS');
  const [allowanceValue, setAllowanceValue] = useState<number>(28);

  // Embargo form state
  const [embTitle, setEmbTitle] = useState('');
  const [embStart, setEmbStart] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [embEnd, setEmbEnd] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // TOIL form state
  const [toilUserId, setToilUserId] = useState(user.id);
  const [toilDelta, setToilDelta] = useState(4);
  const [toilReason, setToilReason] = useState('');

  const loadData = useCallback(async () => {
    const [leaveRes, embRes, toilRes, empRes] = await Promise.all([
      fetch('/api/v1/leave'),
      fetch('/api/v1/embargoes'),
      fetch('/api/v1/toil'),
      fetch('/api/v1/employees'),
    ]);

    if (leaveRes.ok) {
      const d = await leaveRes.json();
      setLeaveRecords(d.leaveRecords || []);
      setAllowanceMatrix(d.allowanceMatrix || []);
    }
    if (embRes.ok) {
      const d = await embRes.json();
      setEmbargoes(d.embargoes || []);
    }
    if (toilRes.ok) {
      const d = await toilRes.json();
      setToilEntries(d.entries || []);
      setToilBalances(d.balancesByUser || {});
    }
    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees || []);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddLeave(e: React.FormEvent) {
    e.preventDefault();
    setWarningBanner('');
    const res = await fetch('/api/v1/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUserId,
        leaveTypeCode: Number(leaveTypeCode),
        startDate,
        endDate,
        notes,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const clashes = data.warnings?.clashingShifts?.length || 0;
      const embs = data.warnings?.embargoOverlaps?.length || 0;
      if (clashes > 0 || embs > 0) {
        setWarningBanner(
          `Leave recorded with warnings: ${clashes} clashing shift(s) and ${embs} embargo overlap(s) detected.`
        );
      }
      setNotes('');
      await loadData();
      await refreshWorkspace();
    }
  }

  async function handleReviewLeave(
    id: string,
    status: 'APPROVED' | 'DECLINED'
  ) {
    await fetch(`/api/v1/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await loadData();
    await refreshWorkspace();
  }

  async function handleAddEmbargo(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/embargoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: embTitle,
        startDate: embStart,
        endDate: embEnd,
      }),
    });
    setEmbTitle('');
    await loadData();
  }

  async function handleDeleteEmbargo(id: string) {
    await fetch(`/api/v1/embargoes?id=${id}`, { method: 'DELETE' });
    await loadData();
  }

  async function handleAddToil(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/toil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: toilUserId,
        hoursDelta: Number(toilDelta),
        reason: toilReason || 'Overtime banked as TOIL',
      }),
    });
    setToilReason('');
    await loadData();
  }

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-[#0a65fc]" />
            Leave, Holiday Allowances, Embargoes &amp; TOIL
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Track all 14 statutory &amp; custom leave categories, holiday
            entitlements, blackout dates, and Time Off In Lieu.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-[#e2e5ec] p-1 bg-[#f5f6f8]">
          <button
            type="button"
            onClick={() => setTab('leave')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold ${
              tab === 'leave'
                ? 'bg-white text-[#0a65fc] shadow-xs'
                : 'text-[#555459]'
            }`}
          >
            Leave &amp; Allowances
          </button>
          <button
            type="button"
            onClick={() => setTab('embargoes')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold ${
              tab === 'embargoes'
                ? 'bg-white text-[#0a65fc] shadow-xs'
                : 'text-[#555459]'
            }`}
          >
            Leave Embargoes ({embargoes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('toil')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold ${
              tab === 'toil'
                ? 'bg-white text-[#0a65fc] shadow-xs'
                : 'text-[#555459]'
            }`}
          >
            TOIL Ledger
          </button>
        </div>
      </div>

      {warningBanner && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          {warningBanner}
        </div>
      )}

      {tab === 'leave' && (
        <>
          {/* Request / Add Leave Drawer-Style Card (matching app.rotacloud.com 14-Type Leave Drawer) */}
          <form
            onSubmit={handleAddLeave}
            className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm space-y-4"
          >
            {/* Leave Type Pill Selector with "More" expanding all 14 RotaCloud Types */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase text-[#555459]">
                  Leave Type ({showAll14Types ? 'All 14 Types' : 'Top 4 + More'})
                </label>
                <button
                  type="button"
                  onClick={() => setShowAll14Types(!showAll14Types)}
                  className="text-xs font-bold text-[#0a65fc] hover:underline"
                >
                  {showAll14Types ? 'Show Fewer' : 'More (All 14 Types)'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(showAll14Types ? LEAVE_TYPES : LEAVE_TYPES.slice(0, 4)).map(
                  (lt) => {
                    const active = leaveTypeCode === lt.code;
                    return (
                      <button
                        key={lt.code}
                        type="button"
                        onClick={() => {
                          setLeaveTypeCode(lt.code);
                          setIsPaidLeave(lt.defaultPaid);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          active
                            ? 'text-white border-transparent shadow-xs'
                            : 'bg-[#f5f6f8] text-slate-700 border-[#e2e5ec] hover:bg-slate-100'
                        }`}
                        style={
                          active ? { backgroundColor: lt.colour } : undefined
                        }
                      >
                        {lt.name}
                      </button>
                    );
                  }
                )}
                {!showAll14Types && (
                  <button
                    type="button"
                    onClick={() => setShowAll14Types(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-[#0a65fc] text-[#0a65fc] hover:bg-[#ebf3ff]"
                  >
                    More +10
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Employee
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={!isManager}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Leave Category
                </label>
                <select
                  value={leaveTypeCode}
                  onChange={(e) => setLeaveTypeCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  {LEAVE_TYPES.map((lt) => (
                    <option key={lt.code} value={lt.code}>
                      #{lt.code} — {lt.name} ({lt.defaultPaid ? 'Paid' : 'Unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-[#555459]">
                    Start Date
                  </label>
                  <div className="inline-flex rounded border border-[#e2e5ec] text-[10px] font-bold overflow-hidden">
                    {(['full', 'am', 'pm'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setStartPeriod(p)}
                        className={`px-1.5 py-0.5 uppercase ${
                          startPeriod === p
                            ? 'bg-[#0a65fc] text-white'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-[#555459]">
                    End Date
                  </label>
                  <div className="inline-flex rounded border border-[#e2e5ec] text-[10px] font-bold overflow-hidden">
                    {(['full', 'am', 'pm'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEndPeriod(p)}
                        className={`px-1.5 py-0.5 uppercase ${
                          endPeriod === p
                            ? 'bg-[#0a65fc] text-white'
                            : 'bg-white text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Pay Status
                </label>
                <div className="grid grid-cols-2 rounded-lg border border-[#e2e5ec] p-0.5 bg-[#f5f6f8] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsPaidLeave(true)}
                    className={`py-1.5 rounded-md ${
                      isPaidLeave
                        ? 'bg-white text-[#0a65fc] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaidLeave(false)}
                    className={`py-1.5 rounded-md ${
                      !isPaidLeave
                        ? 'bg-white text-[#0a65fc] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Unpaid
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />{' '}
                {isManager ? 'Add Leave' : 'Request Leave'}
              </button>
            </div>

            {/* Leave Note (0 / 300) & "See who else is on leave" */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#e2e5ec]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-[#555459]">
                    Message (optional)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {notes.length} / 300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter a message..."
                  className="w-full px-3 py-1.5 rounded-lg border border-[#e2e5ec] text-xs"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setShowWhoElseOnLeave(!showWhoElseOnLeave)}
                  className="text-xs font-bold text-[#0a65fc] hover:underline text-left"
                >
                  {showWhoElseOnLeave
                    ? '▾ Hide who else is on leave'
                    : '▸ See who else is on leave'}
                </button>
                {showWhoElseOnLeave && (
                  <div className="mt-1.5 text-xs text-slate-600 bg-[#f5f6f8] px-3 py-2 rounded-lg border border-[#e2e5ec]">
                    {leaveRecords.filter(
                      (l) =>
                        l.status !== 'DECLINED' &&
                        l.startDate <= endDate &&
                        l.endDate >= startDate
                    ).length === 0 ? (
                      <span>
                        No other employees have overlapping leave between{' '}
                        {startDate} and {endDate}.
                      </span>
                    ) : (
                      <span>
                        {
                          leaveRecords.filter(
                            (l) =>
                              l.status !== 'DECLINED' &&
                              l.startDate <= endDate &&
                              l.endDate >= startDate
                          ).length
                        }{' '}
                        overlapping leave record(s) found during this period.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Annual Leave Allowance Matrix */}
          <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-x-auto">
            <div className="px-6 py-4 border-b border-[#e2e5ec] flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Annual Holiday Entitlement Matrix
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Click &ldquo;Set&rdquo; to configure Fixed Allowance vs Accrue
                Holiday (Days / Hours)
              </span>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Annual Allowance</th>
                  <th className="p-4">Used (Days)</th>
                  <th className="p-4">Remaining Balance</th>
                  <th className="p-4 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e5ec]">
                {allowanceMatrix.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{row.name}</td>
                    <td className="p-4">{row.allowance} days</td>
                    <td className="p-4 font-semibold text-amber-700">
                      {row.usedDays} days
                    </td>
                    <td className="p-4 font-extrabold text-emerald-700">
                      {row.remainingDays} days
                    </td>
                    <td className="p-4 text-right">
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => {
                            setAllowanceModalUser(row);
                            setAllowanceValue(row.allowance ?? 28);
                          }}
                          className="px-3 py-1 rounded-md border border-[#e2e5ec] hover:bg-slate-100 text-xs font-bold text-[#0a65fc]"
                        >
                          Set
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Set Holiday Allowance Modal (matching app.rotacloud.com Leave -> "Set") */}
          {allowanceModalUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Holiday Allowance for {allowanceModalUser.name}
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold uppercase text-[#555459] mb-1">
                      Calculation Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAllowanceMode('FIXED')}
                        className={`py-2 px-3 rounded-lg border font-bold ${
                          allowanceMode === 'FIXED'
                            ? 'border-[#0a65fc] bg-[#ebf3ff] text-[#0a65fc]'
                            : 'border-[#e2e5ec] text-slate-700'
                        }`}
                      >
                        Fixed Allowance
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllowanceMode('ACCRUE')}
                        className={`py-2 px-3 rounded-lg border font-bold ${
                          allowanceMode === 'ACCRUE'
                            ? 'border-[#0a65fc] bg-[#ebf3ff] text-[#0a65fc]'
                            : 'border-[#e2e5ec] text-slate-700'
                        }`}
                      >
                        Accrue Holiday (12.07%)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[#555459] mb-1">
                      Allowance Unit
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAllowanceUnit('DAYS')}
                        className={`py-2 px-3 rounded-lg border font-bold ${
                          allowanceUnit === 'DAYS'
                            ? 'border-[#0a65fc] bg-[#ebf3ff] text-[#0a65fc]'
                            : 'border-[#e2e5ec] text-slate-700'
                        }`}
                      >
                        Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllowanceUnit('HOURS')}
                        className={`py-2 px-3 rounded-lg border font-bold ${
                          allowanceUnit === 'HOURS'
                            ? 'border-[#0a65fc] bg-[#ebf3ff] text-[#0a65fc]'
                            : 'border-[#e2e5ec] text-slate-700'
                        }`}
                      >
                        Hours
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[#555459] mb-1">
                      Annual Entitlement ({allowanceUnit.toLowerCase()})
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={365}
                      value={allowanceValue}
                      onChange={(e) =>
                        setAllowanceValue(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAllowanceModalUser(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(
                        `/api/v1/employees/${allowanceModalUser.id}`,
                        {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            annualLeaveAllowance: Number(allowanceValue),
                          }),
                        }
                      );
                      setAllowanceModalUser(null);
                      await loadData();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                  >
                    Save Allowance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leave Records Table */}
          <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e5ec]">
              <h2 className="text-base font-bold text-slate-900">
                Leave &amp; Absence Records
              </h2>
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e5ec]">
                {leaveRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#555459]">
                      No leave requests or absences recorded yet.
                    </td>
                  </tr>
                ) : (
                  leaveRecords.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">
                        {l.user?.name}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{l.leaveTypeName}</span>
                        <span className="ml-2 text-xs text-[#555459]">
                          ({l.paid ? 'Paid' : 'Unpaid'})
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold">
                        {l.startDate} → {l.endDate}
                      </td>
                      <td className="p-4 text-xs">
                        {l.daysCount}d ({l.hoursCount}h)
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            l.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'REQUESTED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {isManager && l.status === 'REQUESTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleReviewLeave(l.id, 'APPROVED')
                              }
                              className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReviewLeave(l.id, 'DECLINED')
                              }
                              className="p-1.5 rounded bg-red-600 text-white hover:bg-red-700"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'embargoes' && (
        <div className="space-y-6">
          {isManager && (
            <form
              onSubmit={handleAddEmbargo}
              className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Embargo Name *
                </label>
                <input
                  type="text"
                  required
                  value={embTitle}
                  onChange={(e) => setEmbTitle(e.target.value)}
                  placeholder="e.g. Peak December Trading"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={embStart}
                  onChange={(e) => setEmbStart(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={embEnd}
                  onChange={(e) => setEmbEnd(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" /> Create Embargo
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                  <th className="p-4">Embargo Period</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4">End Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e5ec]">
                {embargoes.map((e) => (
                  <tr key={e.id}>
                    <td className="p-4 font-bold text-slate-900">{e.title}</td>
                    <td className="p-4">{e.startDate}</td>
                    <td className="p-4">{e.endDate}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteEmbargo(e.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'toil' && (
        <div className="space-y-6">
          {isManager && (
            <form
              onSubmit={handleAddToil}
              className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Employee
                </label>
                <select
                  value={toilUserId}
                  onChange={(e) => setToilUserId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (Balance: {toilBalances[emp.id] || 0}h)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Hours Adjustment (+/-)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={toilDelta}
                  onChange={(e) => setToilDelta(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={toilReason}
                  onChange={(e) => setToilReason(e.target.value)}
                  placeholder="Bank Holiday overtime banked"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4" /> Record TOIL
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Hours Delta</th>
                  <th className="p-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e5ec]">
                {toilEntries.map((t) => (
                  <tr key={t.id}>
                    <td className="p-4 font-bold text-slate-900">
                      {t.user?.name}
                    </td>
                    <td className="p-4">{t.effectiveDate}</td>
                    <td className="p-4 font-bold text-[#0a65fc]">
                      {t.hoursDelta > 0 ? `+${t.hoursDelta}h` : `${t.hoursDelta}h`}
                    </td>
                    <td className="p-4 text-[#555459]">{t.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
