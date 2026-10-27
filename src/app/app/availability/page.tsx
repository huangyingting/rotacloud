'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMondayOfWeek,
  getWeekDates,
} from '@/lib/domain/workforce-engine';
import { CalendarCheck, Repeat, Plus, X } from 'lucide-react';

const QUARTER_HOUR_TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    QUARTER_HOUR_TIMES.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    );
  }
}

export default function AvailabilityPage() {
  const [entries, setEntries] = useState<Array<any>>([]);
  const [patterns, setPatterns] = useState<Array<any>>([]);
  const [patternName, setPatternName] = useState('');
  const [weeksCycle, setWeeksCycle] = useState(1);
  const [patternStartOn, setPatternStartOn] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [patternEnds, setPatternEnds] = useState<'Never' | 'On date'>('Never');
  const [patternDayStatus, setPatternDayStatus] = useState<
    Record<string, 'AVAILABLE' | 'UNAVAILABLE'>
  >({
    Monday: 'AVAILABLE',
    Tuesday: 'AVAILABLE',
    Wednesday: 'AVAILABLE',
    Thursday: 'AVAILABLE',
    Friday: 'AVAILABLE',
    Saturday: 'UNAVAILABLE',
    Sunday: 'UNAVAILABLE',
  });

  // Single-Day "Create availability" Modal state (matching app.rotacloud.com)
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalStatus, setModalStatus] = useState<'UNAVAILABLE' | 'AVAILABLE'>(
    'UNAVAILABLE'
  );
  const [modalAllDay, setModalAllDay] = useState<boolean>(true);
  const [modalStartTime, setModalStartTime] = useState<string>('09:00');
  const [modalEndTime, setModalEndTime] = useState<string>('17:00');
  const [modalNotes, setModalNotes] = useState<string>('');

  const weekStart = getMondayOfWeek(new Date().toISOString().slice(0, 10));
  const weekDates = getWeekDates(weekStart);

  const loadAvailability = useCallback(async () => {
    const res = await fetch(
      `/api/v1/availability?startDate=${weekDates[0]}&endDate=${weekDates[6]}`
    );
    if (res.ok) {
      const d = await res.json();
      setEntries(d.entries || []);
      setPatterns(d.patterns || []);
    }
  }, [weekDates[0], weekDates[6]]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  async function handleToggleAvailability(date: string, currentStatus?: string) {
    const nextStatus =
      currentStatus === 'AVAILABLE'
        ? 'PREFERRED'
        : currentStatus === 'PREFERRED'
          ? 'UNAVAILABLE'
          : 'AVAILABLE';
    await fetch('/api/v1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'entry',
        date,
        status: nextStatus,
      }),
    });
    await loadAvailability();
  }

  async function handleCreatePattern(e: React.FormEvent) {
    e.preventDefault();
    if (!patternName.trim()) return;
    await fetch('/api/v1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'pattern',
        name: patternName,
        weeksCycle: Number(weeksCycle),
      }),
    });
    setPatternName('');
    await loadAvailability();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-[#0a65fc]" />
          Employee Availability &amp; Repeating Shift Patterns
        </h1>
        <p className="text-sm text-[#555459] mt-0.5">
          Click any day below to cycle your availability between Available,
          Preferred, and Unavailable.
        </p>
      </div>

      {/* Weekly Availability Toggle Strip */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm grid grid-cols-2 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-[#e2e5ec]">
        {weekDates.map((d) => {
          const entry = entries.find((e) => e.date === d);
          const status = entry?.status || 'AVAILABLE';
          return (
            <div key={d} className="p-4 text-center space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{d}</span>
                <button
                  type="button"
                  onClick={() => {
                    setModalDate(d);
                    setModalStatus(
                      status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
                    );
                    setModalAllDay(true);
                    setModalNotes(entry?.notes || '');
                  }}
                  aria-label={`Create availability on ${d}`}
                  className="w-6 h-6 rounded border border-[#e2e5ec] hover:border-[#0a65fc] text-slate-600 hover:text-[#0a65fc] inline-flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAvailability(d, status)}
                className={`w-full py-2.5 rounded-lg text-xs font-bold ${
                  status === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'PREFERRED'
                      ? 'bg-blue-100 text-[#0a65fc]'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {status}
              </button>
              {entry?.startTime && entry?.endTime && (
                <div className="text-[11px] font-semibold text-slate-500">
                  {entry.startTime} – {entry.endTime}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Repeating Patterns Builder (matching app.rotacloud.com /availability/:id/create-pattern) */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Repeat className="w-4 h-4 text-[#0a65fc]" />
          Repeating Shift Patterns (1, 2, or 4-Week Rotations)
        </h2>
        <form onSubmit={handleCreatePattern} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                Pattern Name *
              </label>
              <input
                type="text"
                required
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                placeholder="e.g. 4-On 4-Off Continental"
                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                Repeats every
              </label>
              <select
                value={weeksCycle}
                onChange={(e) => setWeeksCycle(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
              >
                <option value={1}>1 week</option>
                <option value={2}>2 weeks</option>
                <option value={4}>4 weeks</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                Starts on (Monday)
              </label>
              <input
                type="date"
                value={patternStartOn}
                onChange={(e) => setPatternStartOn(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                Ends
              </label>
              <select
                value={patternEnds}
                onChange={(e) =>
                  setPatternEnds(e.target.value as 'Never' | 'On date')
                }
                className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
              >
                <option value="Never">Never</option>
                <option value="On date">On date</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Save Repeating Pattern
            </button>
          </div>

          {/* Interactive Mon-Sun Pattern Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2">
            {Object.entries(patternDayStatus).map(([dayName, st]) => (
              <button
                key={dayName}
                type="button"
                onClick={() =>
                  setPatternDayStatus((prev) => ({
                    ...prev,
                    [dayName]:
                      prev[dayName] === 'AVAILABLE'
                        ? 'UNAVAILABLE'
                        : 'AVAILABLE',
                  }))
                }
                className={`p-3 rounded-lg border text-xs font-bold text-center transition-colors ${
                  st === 'AVAILABLE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                <div className="text-slate-700 mb-1">{dayName}</div>
                <div>{st}</div>
              </button>
            ))}
          </div>
        </form>

        <div className="divide-y divide-[#e2e5ec] pt-2">
          {patterns.map((p) => (
            <div
              key={p.id}
              className="py-3 flex items-center justify-between text-sm"
            >
              <span className="font-bold text-slate-900">{p.name}</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-xs font-bold">
                {p.weeksCycle}-Week Cycle
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Availability Modal (matching app.rotacloud.com Single-Day Modal) */}
      {modalDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Create availability ({modalDate})
              </h3>
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Unavailable vs Available Radio Buttons */}
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="availability_type"
                    checked={modalStatus === 'UNAVAILABLE'}
                    onChange={() => setModalStatus('UNAVAILABLE')}
                    className="accent-[#0a65fc]"
                  />
                  Unavailable
                </label>
                <label className="inline-flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="availability_type"
                    checked={modalStatus === 'AVAILABLE'}
                    onChange={() => setModalStatus('AVAILABLE')}
                    className="accent-[#0a65fc]"
                  />
                  Available
                </label>
              </div>

              {/* All day toggle switch */}
              <div className="flex items-center justify-between bg-[#f5f6f8] p-3 rounded-lg border border-[#e2e5ec]">
                <span className="font-bold text-slate-800">All day</span>
                <input
                  type="checkbox"
                  checked={modalAllDay}
                  onChange={(e) => setModalAllDay(e.target.checked)}
                  className="accent-[#0a65fc] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* 15-Minute Increment Start/End Time Dropdowns when All day is off */}
              {!modalAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-[#555459] mb-1">
                      Start time
                    </label>
                    <select
                      value={modalStartTime}
                      onChange={(e) => setModalStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                    >
                      {QUARTER_HOUR_TIMES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-[#555459] mb-1">
                      End time
                    </label>
                    <select
                      value={modalEndTime}
                      onChange={(e) => setModalEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                    >
                      {[...QUARTER_HOUR_TIMES.slice(1), '24:00'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Notes (0 / 300) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold uppercase text-[#555459]">
                    Notes (optional)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {modalNotes.length} / 300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Enter a note..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/v1/availability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      mode: 'entry',
                      date: modalDate,
                      status: modalStatus,
                      startTime: modalAllDay ? '00:00' : modalStartTime,
                      endTime: modalAllDay ? '23:59' : modalEndTime,
                      notes: modalNotes,
                    }),
                  });
                  setModalDate(null);
                  await loadAvailability();
                }}
                className="px-4 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
