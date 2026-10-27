'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/components/AppShell';
import {
  addDays,
  calculateShiftMetrics,
  getMondayOfWeek,
  getWeekDates,
} from '@/lib/domain/workforce-engine';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Send,
  Trash2,
  StickyNote,
  X,
  Check,
  Repeat,
} from 'lucide-react';

export default function RotasPage() {
  const { user, locations, roles, refreshWorkspace } = useAppContext();
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() =>
    getMondayOfWeek(new Date().toISOString().slice(0, 10))
  );

  const [employees, setEmployees] = useState<Array<any>>([]);
  const [shifts, setShifts] = useState<Array<any>>([]);
  const [dayNotes, setDayNotes] = useState<Array<any>>([]);
  const [leaveRecords, setLeaveRecords] = useState<Array<any>>([]);
  const [availabilityEntries, setAvailabilityEntries] = useState<Array<any>>([]);
  const [banner, setBanner] = useState('');

  // Shift Add/Edit Modal State
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState<string>('');
  const [formRoleId, setFormRoleId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('09:00');
  const [formEndTime, setFormEndTime] = useState<string>('17:00');
  const [formBreakMinutes, setFormBreakMinutes] = useState<number>(30);
  const [formBreaksPaid, setFormBreaksPaid] = useState<boolean>(false);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formPublished, setFormPublished] = useState<boolean>(false);

  // Day Note & Day Sidebar State
  const [noteModalDate, setNoteModalDate] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteVisibleToEveryone, setNoteVisibleToEveryone] = useState<boolean>(true);
  const [daySidebarDate, setDaySidebarDate] = useState<string | null>(null);

  // Rota View Checkboxes (matching app.rotacloud.com actions__option checkboxes)
  const [viewOptions, setViewOptions] = useState({
    hoursAndCosts: true,
    notes: true,
    roleColours: true,
    leave: true,
    unavailability: true,
    warnings: true,
  });

  // Natural-language duration string ("09:00 - 17:00" or "9am - 5pm")
  const [durationInput, setDurationInput] = useState<string>('09:00 - 17:00');

  // Cell "..." ellipsis menu state
  const [cellMenuTarget, setCellMenuTarget] = useState<{
    userId: string;
    userName: string;
    date: string;
  } | null>(null);

  // Rota Tools dropdown & modals state
  const [toolsMenuOpen, setToolsMenuOpen] = useState<boolean>(false);
  const [copyCustomModalOpen, setCopyCustomModalOpen] = useState<boolean>(false);
  const [copyFromDate, setCopyFromDate] = useState<string>('');
  const [copyToDate, setCopyToDate] = useState<string>('');
  const [copyDaysCount, setCopyDaysCount] = useState<number>(7);
  const [copyIncludeNotes, setCopyIncludeNotes] = useState<boolean>(false);
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [savedTemplates, setSavedTemplates] = useState<
    Array<{ name: string; shiftsCount: number }>
  >([{ name: 'Standard Weekday Coverage', shiftsCount: 12 }]);

  const activeLocationId = selectedLocationId || locations[0]?.id || '';
  const dates =
    viewMode === 'week'
      ? getWeekDates(weekStart)
      : Array.from({ length: 28 }, (_, idx) => addDays(weekStart, idx));
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const loadRotaData = useCallback(async () => {
    if (!activeLocationId) return;
    const [empRes, shiftRes, noteRes, leaveRes, availRes] = await Promise.all([
      fetch('/api/v1/employees'),
      fetch(
        `/api/v1/shifts?locationId=${activeLocationId}&startDate=${startDate}&endDate=${endDate}`
      ),
      fetch(
        `/api/v1/day-notes?locationId=${activeLocationId}&startDate=${startDate}&endDate=${endDate}`
      ),
      fetch(`/api/v1/leave?year=${startDate.slice(0, 4)}`),
      fetch(`/api/v1/availability?startDate=${startDate}&endDate=${endDate}`),
    ]);

    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees || []);
    }
    if (shiftRes.ok) {
      const d = await shiftRes.json();
      setShifts(d.shifts || []);
    }
    if (noteRes.ok) {
      const d = await noteRes.json();
      setDayNotes(d.dayNotes || []);
    }
    if (leaveRes.ok) {
      const d = await leaveRes.json();
      setLeaveRecords(d.leaveRecords || []);
    }
    if (availRes.ok) {
      const d = await availRes.json();
      setAvailabilityEntries(d.entries || []);
    }
  }, [activeLocationId, startDate, endDate]);

  useEffect(() => {
    if (!selectedLocationId && locations[0]?.id) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    loadRotaData();
  }, [loadRotaData]);

  function parseNaturalDuration(raw: string): {
    startTime: string;
    endTime: string;
  } | null {
    const parts = raw.split(/\s*[-–to]+\s*/i);
    if (parts.length !== 2) return null;
    const parsePart = (p: string): string | null => {
      const m = p
        .trim()
        .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
      if (!m) return null;
      let hr = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const mer = m[3]?.toLowerCase();
      if (mer === 'pm' && hr < 12) hr += 12;
      if (mer === 'am' && hr === 12) hr = 0;
      if (hr < 0 || hr > 23 || min < 0 || min > 59) return null;
      return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    };
    const s = parsePart(parts[0]);
    const e = parsePart(parts[1]);
    if (!s || !e) return null;
    return { startTime: s, endTime: e };
  }

  function handleDurationTextChange(val: string) {
    setDurationInput(val);
    const parsed = parseNaturalDuration(val);
    if (parsed) {
      setFormStartTime(parsed.startTime);
      setFormEndTime(parsed.endTime);
    }
  }

  function openAddShiftModal(userId: string | null, date: string) {
    setEditingShiftId(null);
    setFormUserId(userId || '');
    const defaultRole =
      employees.find((e) => e.id === userId)?.defaultRoleId ||
      roles[0]?.id ||
      '';
    setFormRoleId(defaultRole);
    setFormDate(date);
    setFormStartTime('09:00');
    setFormEndTime('17:00');
    setDurationInput('09:00 - 17:00');
    setFormBreakMinutes(
      roles.find((r) => r.id === defaultRole)?.defaultBreak ?? 30
    );
    setFormBreaksPaid(false);
    setFormNotes('');
    setFormPublished(false);
    setCellMenuTarget(null);
    setShiftModalOpen(true);
  }

  function openEditShiftModal(shift: any) {
    setEditingShiftId(shift.id);
    setFormUserId(shift.userId || '');
    setFormRoleId(shift.roleId);
    setFormDate(shift.date);
    setFormStartTime(shift.startTime);
    setFormEndTime(shift.endTime);
    setDurationInput(`${shift.startTime} - ${shift.endTime}`);
    setFormBreakMinutes(shift.breakMinutes);
    setFormBreaksPaid(Boolean(shift.breaksPaid));
    setFormNotes(shift.notes || '');
    setFormPublished(Boolean(shift.published));
    setCellMenuTarget(null);
    setShiftModalOpen(true);
  }

  async function handleQuickAddDayOff(userId: string, date: string) {
    await fetch('/api/v1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        date,
        status: 'UNAVAILABLE',
        startTime: '00:00',
        endTime: '23:59',
        notes: 'Scheduled Day Off',
      }),
    });
    setCellMenuTarget(null);
    await loadRotaData();
    setBanner(`Marked ${date} as Day Off.`);
  }

  async function handleQuickAddLeave(userId: string, date: string) {
    await fetch('/api/v1/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        leaveTypeCode: 'HOLIDAY',
        startDate: date,
        endDate: date,
        paid: true,
        notes: 'Added directly from Rota Builder cell menu',
      }),
    });
    setCellMenuTarget(null);
    await loadRotaData();
    setBanner(`Added Holiday leave on ${date}.`);
  }

  async function handleSaveShift(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLocationId || !formRoleId || !formDate) return;

    const payload = {
      locationId: activeLocationId,
      roleId: formRoleId,
      userId: formUserId || null,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      breakMinutes: Number(formBreakMinutes),
      breaksPaid: formBreaksPaid,
      notes: formNotes,
      published: formPublished,
    };

    const res = await fetch(
      editingShiftId ? `/api/v1/shifts/${editingShiftId}` : '/api/v1/shifts',
      {
        method: editingShiftId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      setShiftModalOpen(false);
      await loadRotaData();
      setBanner(editingShiftId ? 'Shift updated.' : 'Shift added to rota.');
    }
  }

  async function handleDeleteShift(id: string) {
    const res = await fetch(`/api/v1/shifts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setShiftModalOpen(false);
      await loadRotaData();
      setBanner('Shift moved to Deleted Shifts.');
    }
  }

  async function handleClaimOpenShift(id: string) {
    const res = await fetch(`/api/v1/shifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim' }),
    });
    if (res.ok) {
      setShiftModalOpen(false);
      await loadRotaData();
      setBanner('Open shift claimed!');
    }
  }

  async function handleRequestDrop(id: string) {
    const res = await fetch('/api/v1/shift-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shiftId: id,
        type: 'DROP',
        reason: 'Requested shift drop via Rota Builder',
      }),
    });
    if (res.ok) {
      setShiftModalOpen(false);
      await refreshWorkspace();
      setBanner('Shift drop request submitted.');
    }
  }

  async function handlePublishRota() {
    const res = await fetch('/api/v1/shifts/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: activeLocationId,
        startDate,
        endDate,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      await loadRotaData();
      await refreshWorkspace();
      setBanner(`Published ${data.publishedCount} shift(s) to staff.`);
    }
  }

  async function handleCopyPreviousWeek() {
    const prevWeekStart = addDays(weekStart, -7);
    const res = await fetch('/api/v1/shifts/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: activeLocationId,
        sourceWeekStart: prevWeekStart,
        targetWeekStart: weekStart,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      await loadRotaData();
      setBanner(`Copied ${data.copiedCount} shift(s) from previous week.`);
    }
  }

  async function handleSaveDayNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteModalDate || !activeLocationId) return;
    await fetch('/api/v1/day-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: activeLocationId,
        date: noteModalDate,
        content: noteContent,
      }),
    });
    setNoteModalDate(null);
    await loadRotaData();
  }

  const unpublishedCount = shifts.filter((s) => !s.published).length;
  const totalHours = shifts.reduce((acc, s) => acc + s.netHours, 0);
  const totalWageCost = shifts.reduce((acc, s) => acc + s.wageCost, 0);
  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  // Live preview metrics inside modal
  const selectedRoleObj = roles.find((r) => r.id === formRoleId);
  const selectedAssigneeObj = employees.find((e) => e.id === formUserId);
  const previewMetrics = calculateShiftMetrics({
    startTime: formStartTime,
    endTime: formEndTime,
    breakMinutes: formBreakMinutes,
    breaksPaid: formBreaksPaid,
    hourlyRate: selectedAssigneeObj?.hourlyRate,
    roleDefaultRate: selectedRoleObj?.defaultRate,
    salaryType: selectedAssigneeObj?.salaryType,
  });

  return (
    <div className="space-y-4">
      {/* Rota Toolbar */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Selector */}
          <select
            aria-label="Location"
            value={activeLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm font-bold text-slate-900 bg-white"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                Location: {loc.name}
              </option>
            ))}
          </select>

          {/* Week / Month Toggle */}
          <div className="inline-flex rounded-lg border border-[#e2e5ec] p-0.5 bg-[#f5f6f8]">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                viewMode === 'week'
                  ? 'bg-white text-[#0a65fc] shadow-xs'
                  : 'text-[#555459]'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                viewMode === 'month'
                  ? 'bg-white text-[#0a65fc] shadow-xs'
                  : 'text-[#555459]'
              }`}
            >
              Month
            </button>
          </div>

          {/* Date Navigation */}
          <div className="inline-flex items-center rounded-lg border border-[#e2e5ec] bg-white">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 hover:bg-slate-50"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {startDate} — {endDate}
            </span>
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 hover:bg-slate-50"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold bg-[#f5f6f8] px-3 py-2 rounded-lg border border-[#e2e5ec]">
            Total: <span className="text-slate-900">{totalHours.toFixed(1)}h</span>{' '}
            • <span className="text-[#0a65fc]">£{totalWageCost.toFixed(2)}</span>{' '}
            ({shifts.length} shifts)
          </div>

          {isManager && (
            <>
              <button
                type="button"
                onClick={() =>
                  openAddShiftModal(employees[0]?.id || null, dates[0])
                }
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Shift
              </button>

              <button
                type="button"
                onClick={handleCopyPreviousWeek}
                className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Prev Week
              </button>

              {/* 15-Item Rota Tools Dropdown Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] hover:bg-slate-50 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5"
                >
                  Tools ▾
                </button>
                {toolsMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-[#e2e5ec] py-2 z-40 text-xs">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Copy shifts
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        handleCopyPreviousWeek();
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Copy last week&apos;s shifts
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setCopyFromDate(addDays(weekStart, -7));
                        setCopyToDate(weekStart);
                        setCopyCustomModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Copy custom range
                    </button>
                    <div className="my-1 border-t border-[#e2e5ec]" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Templates
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setTemplateModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Load template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        setTemplateModalOpen(true);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Save as template
                    </button>
                    <div className="my-1 border-t border-[#e2e5ec]" />
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bulk actions
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        openAddShiftModal(employees[0]?.id || null, dates[0]);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Add shifts
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setToolsMenuOpen(false);
                        handlePublishRota();
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Publish shifts
                    </button>
                    <Link
                      href="/app/employees"
                      className="block w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                    >
                      Add / remove employees
                    </Link>
                    <div className="my-1 border-t border-[#e2e5ec]" />
                    <Link
                      href="/app/deleted-shifts"
                      className="block w-full text-left px-3.5 py-1.5 hover:bg-slate-50 font-semibold text-[#0a65fc]"
                    >
                      See deleted shifts
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handlePublishRota}
                className="px-4 py-2 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Publish {unpublishedCount > 0 ? `(${unpublishedCount})` : ''}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rota View Options Bar (matching app.rotacloud.com 6 View Checkboxes) */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
            View Options:
          </span>
          {[
            { key: 'hoursAndCosts', label: 'Hours & costs' },
            { key: 'notes', label: 'Notes' },
            { key: 'roleColours', label: 'Role colours' },
            { key: 'leave', label: 'Leave' },
            { key: 'unavailability', label: 'Unavailability' },
            { key: 'warnings', label: 'Warnings' },
          ].map((opt) => (
            <label
              key={opt.key}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={
                  viewOptions[opt.key as keyof typeof viewOptions]
                }
                onChange={(e) =>
                  setViewOptions((prev) => ({
                    ...prev,
                    [opt.key]: e.target.checked,
                  }))
                }
                className="accent-[#0a65fc] rounded"
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 font-semibold">
          Click any Day Header for Daily Breakdown &amp; Day Notes • Hover cells for{' '}
          <span className="font-mono font-bold text-slate-700">+</span> &amp;{' '}
          <span className="font-mono font-bold text-slate-700">...</span>
        </div>
      </div>

      {banner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between">
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner('')}
            className="text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {roles.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>
            You haven&apos;t created any Job Roles yet. Create a role first to
            start scheduling shifts on the rota.
          </span>
          <Link
            href="/app/roles"
            className="px-3.5 py-1.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
          >
            + Add Role
          </Link>
        </div>
      )}

      {/* Main Rota Grid */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-x-auto">
        <table className="w-full border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-left">
              <th className="w-56 p-3.5 text-xs font-bold uppercase tracking-wider text-[#555459] border-r border-[#e2e5ec]">
                Employee / Summary
              </th>
              {dates.slice(0, 7).map((d) => {
                const dt = new Date(`${d}T12:00:00Z`);
                const dayShifts = shifts.filter((s) => s.date === d);
                const dayHours = dayShifts.reduce((a, s) => a + s.netHours, 0);
                const dayCost = dayShifts.reduce((a, s) => a + s.wageCost, 0);
                return (
                  <th
                    key={d}
                    onClick={() => {
                      const note = dayNotes.find((n) => n.date === d);
                      setDaySidebarDate(d);
                      setNoteModalDate(d);
                      setNoteContent(note?.content || '');
                    }}
                    className="p-3 text-xs font-bold text-slate-800 border-r border-[#e2e5ec] last:border-r-0 cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="hover:text-[#0a65fc]">
                        {dt.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      {viewOptions.hoursAndCosts && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {dayHours.toFixed(1)}h • £{dayCost.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
            {/* Week Summary H (Hours) & C (Costs) Rows matching app.rotacloud.com */}
            {viewOptions.hoursAndCosts && (
              <tr className="bg-slate-50 border-b border-[#e2e5ec] text-[11px] text-slate-600">
                <td className="px-3.5 py-2 font-bold border-r border-[#e2e5ec]">
                  Week summary
                  <div className="text-[10px] font-semibold text-slate-500">
                    {totalHours.toFixed(2)} hrs • £{totalWageCost.toFixed(2)}
                  </div>
                </td>
                {dates.slice(0, 7).map((d) => {
                  const dayShifts = shifts.filter((s) => s.date === d);
                  const dayHours = dayShifts.reduce((a, s) => a + s.netHours, 0);
                  const dayCost = dayShifts.reduce((a, s) => a + s.wageCost, 0);
                  return (
                    <td
                      key={d}
                      className="px-2.5 py-1.5 border-r border-[#e2e5ec] last:border-r-0 font-semibold"
                    >
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">H</span>
                        <span>{dayHours.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">C</span>
                        <span>£{dayCost.toFixed(2)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {/* Day Notes Row */}
            {viewOptions.notes && (
              <tr className="bg-amber-50/30">
                <td className="p-3 border-r border-[#e2e5ec] text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                  Day Notes
                </td>
                {dates.slice(0, 7).map((d) => {
                  const note = dayNotes.find((n) => n.date === d);
                  return (
                    <td
                      key={d}
                      className="p-2 border-r border-[#e2e5ec] last:border-r-0 align-top"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (!isManager) return;
                          setNoteModalDate(d);
                          setDaySidebarDate(d);
                          setNoteContent(note?.content || '');
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-amber-100/60 text-slate-700 truncate"
                      >
                        {note ? (
                          <span className="font-semibold text-amber-900">
                            📝 {note.content}
                          </span>
                        ) : isManager ? (
                          <span className="text-slate-400">+ Day note</span>
                        ) : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Open Shifts Row */}
            <tr className="bg-slate-50/70">
              <td className="p-3.5 border-r border-[#e2e5ec] align-top">
                <div className="font-bold text-sm text-slate-900">
                  Open shifts
                </div>
                <div className="text-xs text-[#555459]">
                  Unassigned claimable shifts
                </div>
              </td>
              {dates.slice(0, 7).map((d) => {
                const cellOpenShifts = shifts.filter(
                  (s) => !s.userId && s.date === d
                );
                return (
                  <td
                    key={d}
                    className="p-2 border-r border-[#e2e5ec] last:border-r-0 align-top space-y-1.5"
                  >
                    {cellOpenShifts.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => openEditShiftModal(s)}
                        className="cursor-pointer rounded-md p-2 text-xs border-2 border-dashed border-[#0a65fc] bg-[#ebf3ff] text-slate-900 hover:shadow-xs"
                      >
                        <div className="font-bold text-[#0a65fc]">
                          {s.startTime} - {s.endTime}
                        </div>
                        <div className="font-semibold">{s.role?.name}</div>
                        <div className="text-[10px] text-slate-600">
                          {s.netHours}h • Click to{' '}
                          {isManager ? 'assign/edit' : 'claim'}
                        </div>
                      </div>
                    ))}
                    {isManager && roles.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openAddShiftModal(null, d)}
                        className="w-full py-1 rounded border border-dashed border-slate-300 hover:border-[#0a65fc] text-[11px] font-bold text-slate-400 hover:text-[#0a65fc]"
                      >
                        + Open
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Employee Rows */}
            {employees.map((emp) => {
              const empShifts = shifts.filter((s) => s.userId === emp.id);
              const empHours = empShifts.reduce((a, s) => a + s.netHours, 0);
              const empCost = empShifts.reduce((a, s) => a + s.wageCost, 0);

              return (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="p-3.5 border-r border-[#e2e5ec] align-top">
                    <div className="font-bold text-sm text-slate-900">
                      {emp.name || `${emp.firstName} ${emp.lastName}`}
                    </div>
                    {viewOptions.hoursAndCosts && (
                      <div className="text-xs text-[#555459] mt-0.5">
                        {empHours.toFixed(2)} hrs • £{empCost.toFixed(2)} •{' '}
                        {empShifts.length} shifts
                      </div>
                    )}
                  </td>

                  {dates.slice(0, 7).map((d) => {
                    const cellShifts = empShifts.filter((s) => s.date === d);
                    const cellLeaves = leaveRecords.filter(
                      (l) =>
                        l.userId === emp.id &&
                        l.status !== 'DECLINED' &&
                        l.startDate <= d &&
                        l.endDate >= d
                    );
                    const cellAvail = availabilityEntries.find(
                      (a) => a.userId === emp.id && a.date === d
                    );
                    const isCellMenuOpen =
                      cellMenuTarget?.userId === emp.id &&
                      cellMenuTarget?.date === d;

                    return (
                      <td
                        key={d}
                        className="relative p-2 border-r border-[#e2e5ec] last:border-r-0 align-top space-y-1.5 min-h-[84px]"
                      >
                        {viewOptions.unavailability &&
                          cellAvail &&
                          cellAvail.status === 'UNAVAILABLE' && (
                            <div className="px-2 py-1 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-700">
                              Unavailable
                            </div>
                          )}

                        {viewOptions.leave &&
                          cellLeaves.map((l) => (
                            <div
                              key={l.id}
                              className="px-2 py-1.5 rounded bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold"
                            >
                              🏖 {l.leaveTypeName} ({l.status})
                            </div>
                          ))}

                        {cellShifts.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => openEditShiftModal(s)}
                            className={`cursor-pointer rounded-md p-2 text-white text-xs shadow-xs transition-transform hover:scale-[1.01] ${
                              !s.published
                                ? 'ring-2 ring-amber-400 ring-offset-1'
                                : ''
                            }`}
                            style={{
                              backgroundColor: viewOptions.roleColours
                                ? s.role?.colour || '#0a65fc'
                                : '#334155',
                            }}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>
                                {s.startTime} - {s.endTime}
                              </span>
                              {!s.published && (
                                <span className="text-[9px] uppercase bg-black/25 px-1 rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            <div className="font-semibold truncate mt-0.5">
                              {s.role?.name}
                            </div>
                            {viewOptions.hoursAndCosts && (
                              <div className="text-[10px] opacity-90 flex justify-between mt-0.5">
                                <span>{s.netHours}h</span>
                                <span>£{s.wageCost.toFixed(2)}</span>
                              </div>
                            )}
                            {viewOptions.notes && s.notes && (
                              <div className="text-[10px] bg-black/20 rounded px-1.5 py-0.5 mt-1 truncate">
                                📝 {s.notes}
                              </div>
                            )}
                          </div>
                        ))}

                        {isManager && roles.length > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openAddShiftModal(emp.id, d)}
                              aria-label={`Quick add for ${emp.name} on ${d}`}
                              className="flex-1 py-1 rounded border border-transparent hover:border-slate-300 text-[11px] font-bold text-slate-300 hover:text-[#0a65fc] transition-colors"
                            >
                              + Add
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCellMenuTarget(
                                  isCellMenuOpen
                                    ? null
                                    : {
                                        userId: emp.id,
                                        userName:
                                          emp.name ||
                                          `${emp.firstName} ${emp.lastName}`,
                                        date: d,
                                      }
                                )
                              }
                              aria-label={`Cell options for ${emp.name} on ${d}`}
                              className="px-1.5 py-1 rounded border border-transparent hover:border-slate-300 text-[11px] font-bold text-slate-300 hover:text-slate-700"
                            >
                              ...
                            </button>
                          </div>
                        )}

                        {isCellMenuOpen && (
                          <div className="absolute right-2 top-8 z-30 w-36 bg-white rounded-lg shadow-lg border border-[#e2e5ec] py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => handleQuickAddLeave(emp.id, d)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                            >
                              Add leave
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickAddDayOff(emp.id, d)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-slate-700"
                            >
                              Add day off
                            </button>
                            <button
                              type="button"
                              onClick={() => openAddShiftModal(emp.id, d)}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold text-[#0a65fc]"
                            >
                              Add shift
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Shift Modal */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full overflow-hidden">
            <div className="bg-[#0a65fc] px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">
                {editingShiftId ? 'Edit Shift' : 'Add Shift to Rota'}
              </h2>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="p-1 rounded hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Assignee
                </label>
                <select
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  disabled={!isManager}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                >
                  <option value="">Open Shift (Unassigned)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (£{emp.hourlyRate}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Role *
                  </label>
                  <select
                    required
                    value={formRoleId}
                    onChange={(e) => setFormRoleId(e.target.value)}
                    disabled={!isManager}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    disabled={!isManager}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-xs font-bold uppercase text-[#555459] mb-1"
                >
                  Duration (e.g. 9am - 5pm or 09:00 - 17:00)
                </label>
                <input
                  id="duration"
                  type="text"
                  value={durationInput}
                  onChange={(e) => handleDurationTextChange(e.target.value)}
                  disabled={!isManager}
                  placeholder="e.g. 9am - 5pm"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => {
                      setFormStartTime(e.target.value);
                      setDurationInput(`${e.target.value} - ${formEndTime}`);
                    }}
                    disabled={!isManager}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => {
                      setFormEndTime(e.target.value);
                      setDurationInput(`${formStartTime} - ${e.target.value}`);
                    }}
                    disabled={!isManager}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Break (mins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={240}
                    value={formBreakMinutes}
                    onChange={(e) =>
                      setFormBreakMinutes(Number(e.target.value))
                    }
                    disabled={!isManager}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#f5f6f8] p-3 rounded-lg border border-[#e2e5ec]">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formBreaksPaid}
                      onChange={(e) => setFormBreaksPaid(e.target.checked)}
                      disabled={!isManager}
                      className="accent-[#0a65fc]"
                    />
                    Paid Break
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPublished}
                      onChange={(e) => setFormPublished(e.target.checked)}
                      disabled={!isManager}
                      className="accent-[#0a65fc]"
                    />
                    Publish &amp; send notification?
                  </label>
                </div>
                <div className="font-bold text-slate-900">
                  Net: {previewMetrics.netHours}h • Cost: £
                  {previewMetrics.wageCost.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase text-[#555459]">
                    Shift Note (optional)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formNotes.length} / 1500
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={1500}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={!isManager}
                  placeholder="Optional instructions for this shift"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This note is visible to{' '}
                  {selectedAssigneeObj?.name || 'assigned employees'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#e2e5ec]">
                {editingShiftId && !formUserId && (
                  <button
                    type="button"
                    onClick={() => handleClaimOpenShift(editingShiftId)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Claim Open Shift
                  </button>
                )}

                {editingShiftId && formUserId === user.id && (
                  <button
                    type="button"
                    onClick={() => handleRequestDrop(editingShiftId)}
                    className="px-3 py-2 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Repeat className="w-3.5 h-3.5" /> Request Swap/Drop
                  </button>
                )}

                {editingShiftId && isManager && (
                  <button
                    type="button"
                    onClick={() => handleDeleteShift(editingShiftId)}
                    className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Shift
                  </button>
                )}

                {isManager && (
                  <button
                    type="submit"
                    className="ml-auto px-5 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold"
                  >
                    {editingShiftId ? 'Save Changes' : 'Add Shift'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Sidebar & Day Note Drawer */}
      {noteModalDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {new Date(`${noteModalDate}T12:00:00Z`).toLocaleDateString(
                  'en-GB',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setNoteModalDate(null);
                  setDaySidebarDate(null);
                }}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {daySidebarDate && (
              <div className="grid grid-cols-2 gap-3 bg-[#f5f6f8] p-3 rounded-lg border border-[#e2e5ec] text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">
                    Hours
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {shifts
                      .filter((s) => s.date === daySidebarDate)
                      .reduce((a, s) => a + s.netHours, 0)
                      .toFixed(2)}{' '}
                    hrs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">
                    Costs
                  </span>
                  <span className="text-sm font-black text-[#0a65fc]">
                    £
                    {shifts
                      .filter((s) => s.date === daySidebarDate)
                      .reduce((a, s) => a + s.wageCost, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDayNote} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-[#555459]">
                    Day note
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {noteContent.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter a note..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteVisibleToEveryone}
                  onChange={(e) => setNoteVisibleToEveryone(e.target.checked)}
                  className="accent-[#0a65fc]"
                />
                Visible to everyone
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNoteModalDate(null);
                    setDaySidebarDate(null);
                  }}
                  className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                >
                  Save Day Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Custom Range Modal (matching app.rotacloud.com Tools -> Copy custom range) */}
      {copyCustomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Copy custom range
              </h3>
              <button
                type="button"
                onClick={() => setCopyCustomModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#555459] mb-1">
                  How many days would you like to copy?
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={copyDaysCount}
                  onChange={(e) => setCopyDaysCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[#555459] mb-1">
                    Copy from
                  </label>
                  <input
                    type="date"
                    value={copyFromDate}
                    onChange={(e) => setCopyFromDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#555459] mb-1">
                    Copy to
                  </label>
                  <input
                    type="date"
                    value={copyToDate}
                    onChange={(e) => setCopyToDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={copyIncludeNotes}
                  onChange={(e) => setCopyIncludeNotes(e.target.checked)}
                  className="accent-[#0a65fc]"
                />
                Include shift notes
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCopyCustomModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setCopyCustomModalOpen(false);
                  await handleCopyPreviousWeek();
                }}
                className="px-4 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
              >
                Copy Shifts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save / Load Rota Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Rota Templates
              </h3>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#555459] mb-1">
                  Save current week as template
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Summer Peak Rota"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!templateName.trim()) return;
                      setSavedTemplates((prev) => [
                        ...prev,
                        { name: templateName.trim(), shiftsCount: shifts.length },
                      ]);
                      setTemplateName('');
                      setBanner('Saved current week as a Rota Template.');
                      setTemplateModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0a65fc] text-white font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-[#e2e5ec]">
                <div className="font-bold uppercase text-[#555459] mb-2">
                  Available Templates ({savedTemplates.length})
                </div>
                <div className="space-y-2">
                  {savedTemplates.map((tpl, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#e2e5ec] bg-[#f5f6f8]"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tpl.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {tpl.shiftsCount} shifts configured
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateModalOpen(false);
                          setBanner(`Loaded template "${tpl.name}".`);
                        }}
                        className="px-3 py-1.5 rounded-md bg-white border border-[#e2e5ec] font-bold text-[#0a65fc] hover:bg-slate-50"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
