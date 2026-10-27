'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { Clock, CheckCircle2, Download, Plus } from 'lucide-react';

export default function AttendancePage() {
  const { user, locations } = useAppContext();
  const [timesheets, setTimesheets] = useState<Array<any>>([]);
  const [summary, setSummary] = useState<any>(null);
  const [employees, setEmployees] = useState<Array<any>>([]);

  // Manual timesheet form
  const [empId, setEmpId] = useState(user.id);
  const [locId, setLocId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockOutTime, setClockOutTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(30);

  const loadAttendance = useCallback(async () => {
    const [attRes, empRes] = await Promise.all([
      fetch('/api/v1/attendance'),
      fetch('/api/v1/employees'),
    ]);
    if (attRes.ok) {
      const d = await attRes.json();
      setTimesheets(d.timesheets || []);
      setSummary(d.summary || null);
    }
    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees || []);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  async function handleAddTimesheet(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'manual',
        userId: empId || user.id,
        locationId: locId || locations[0]?.id,
        date,
        clockInTime,
        clockOutTime,
        breakMinutes: Number(breakMinutes),
      }),
    });
    await loadAttendance();
  }

  async function handleApprove(id: string) {
    await fetch(`/api/v1/attendance/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    await loadAttendance();
  }

  function exportCsv() {
    const header =
      'Employee,PayrollID,Date,Location,ClockIn,ClockOut,BreakMins,WorkedHours,UKHolidayAccrualHours,LabourCostGBP,Status\n';
    const rows = timesheets
      .map(
        (t) =>
          `"${t.user?.name}","${t.user?.payrollId || ''}","${t.date}","${t.location?.name}","${t.clockInTime || ''}","${t.clockOutTime || ''}",${t.breakMinutes},${t.workedHours},${t.ukHolidayAccrualHours || 0},${t.labourCost},${t.status}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rotacloud-timesheets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0a65fc]" />
            Time &amp; Attendance Timesheets
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Verify clock-ins, lateness discrepancies, UK 12.07% statutory holiday
            accrual, and payroll exports.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Export Payroll CSV
        </button>
      </div>

      {/* Summary Strip */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[#e2e5ec] p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#555459]">
              Total Worked Hours
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.totalWorkedHours}h
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e5ec] p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#555459]">
              Total Payroll Cost
            </div>
            <div className="text-2xl font-extrabold text-[#0a65fc] mt-1">
              £{summary.totalLabourCost.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e5ec] p-4 shadow-sm">
            <div className="text-xs font-bold uppercase text-[#555459]">
              Approved Timesheets
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-1">
              {summary.approvedCount} / {timesheets.length}
            </div>
          </div>
        </div>
      )}

      {/* Manual Timesheet Entry */}
      {isManager && (
        <form
          onSubmit={handleAddTimesheet}
          className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Employee
            </label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Clock In
            </label>
            <input
              type="time"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Clock Out
            </label>
            <input
              type="time"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Break (Mins)
            </label>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Timesheet
          </button>
        </form>
      )}

      {/* Timesheets Table */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Employee</th>
              <th className="p-4">Date &amp; Location</th>
              <th className="p-4">Clock In / Out</th>
              <th className="p-4">Worked Hours</th>
              <th className="p-4">UK 12.07% Accrual</th>
              <th className="p-4">Pay (£)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#555459]">
                  No timesheets recorded yet. Clock in from the Dashboard, PIN
                  Terminal, or add a timesheet above.
                </td>
              </tr>
            ) : (
              timesheets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">
                    {t.user?.name}
                  </td>
                  <td className="p-4 text-xs">
                    <div className="font-bold">{t.date}</div>
                    <div className="text-[#555459]">{t.location?.name}</div>
                  </td>
                  <td className="p-4 text-xs font-mono">
                    {t.clockInTime || '—'} → {t.clockOutTime || 'Active'} (
                    {t.breakMinutes}m break)
                  </td>
                  <td className="p-4 font-bold">{t.workedHours}h</td>
                  <td className="p-4 text-xs text-[#0a65fc] font-bold">
                    +{t.ukHolidayAccrualHours}h holiday
                  </td>
                  <td className="p-4 font-bold">£{t.labourCost.toFixed(2)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {isManager && t.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(t.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
