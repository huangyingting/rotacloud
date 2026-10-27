'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import {
  addDays,
  getMondayOfWeek,
  getWeekDates,
} from '@/lib/domain/workforce-engine';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
  const { locations, roles } = useAppContext();
  const [weekStart, setWeekStart] = useState(() =>
    getMondayOfWeek(new Date().toISOString().slice(0, 10))
  );
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [shifts, setShifts] = useState<Array<any>>([]);
  const [leaves, setLeaves] = useState<Array<any>>([]);

  const weekDates = getWeekDates(weekStart);

  const loadData = useCallback(async () => {
    const [sRes, lRes] = await Promise.all([
      fetch(
        `/api/v1/shifts?startDate=${weekDates[0]}&endDate=${weekDates[6]}${
          selectedLocationId ? `&locationId=${selectedLocationId}` : ''
        }`
      ),
      fetch(`/api/v1/leave?year=${weekDates[0].slice(0, 4)}`),
    ]);
    if (sRes.ok) {
      const d = await sRes.json();
      setShifts(d.shifts || []);
    }
    if (lRes.ok) {
      const d = await lRes.json();
      setLeaves(d.leaveRecords || []);
    }
  }, [weekDates[0], weekDates[6], selectedLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredShifts = selectedRoleId
    ? shifts.filter((s) => s.roleId === selectedRoleId)
    : shifts;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-[#0a65fc]" />
          <h1 className="text-xl font-bold text-slate-900">
            Coverage Calendar
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold bg-white"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold bg-white"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-lg border border-[#e2e5ec] overflow-hidden">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold">
              {weekDates[0]} – {weekDates[6]}
            </span>
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#e2e5ec]">
        {weekDates.map((d) => {
          const dayShifts = filteredShifts.filter((s) => s.date === d);
          const dayLeaves = leaves.filter(
            (l) =>
              l.status === 'APPROVED' && l.startDate <= d && l.endDate >= d
          );
          const dt = new Date(`${d}T12:00:00Z`);

          return (
            <div key={d} className="p-4 min-h-[340px] space-y-2.5">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">
                  {dt.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  {dayShifts.length} shifts
                </span>
              </div>

              {dayLeaves.map((l) => (
                <div
                  key={l.id}
                  className="p-2 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900"
                >
                  <div className="font-bold">{l.user?.name}</div>
                  <div className="text-[11px]">{l.leaveTypeName}</div>
                </div>
              ))}

              {dayShifts.map((s) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-md text-white text-xs shadow-xs"
                  style={{ backgroundColor: s.role?.colour || '#0a65fc' }}
                >
                  <div className="font-bold">
                    {s.startTime} - {s.endTime}
                  </div>
                  <div className="font-semibold mt-0.5">
                    {s.user?.name || 'Open Shift'}
                  </div>
                  <div className="text-[11px] opacity-90">{s.role?.name}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
