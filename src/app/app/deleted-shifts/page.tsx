'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

export default function DeletedShiftsPage() {
  const [deletedShifts, setDeletedShifts] = useState<Array<any>>([]);
  const [message, setMessage] = useState('');

  const loadDeletedShifts = useCallback(async () => {
    const res = await fetch('/api/v1/shifts?deleted=true');
    if (res.ok) {
      const data = await res.json();
      setDeletedShifts(data.shifts || []);
    }
  }, []);

  useEffect(() => {
    loadDeletedShifts();
  }, [loadDeletedShifts]);

  async function handleRestore(id: string) {
    const res = await fetch(`/api/v1/shifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    });
    if (res.ok) {
      setMessage('Shift restored to active rota.');
      await loadDeletedShifts();
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[#0a65fc]" />
            Deleted Shifts Audit &amp; Recovery
          </h1>
          <p className="text-sm text-[#555459] mt-1">
            Inspect shifts deleted from the Rota Builder and restore them back to
            the active schedule.
          </p>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-bold">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        {deletedShifts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#555459]">
            No deleted shifts found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                <th className="p-4">Shift Date &amp; Time</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Role &amp; Location</th>
                <th className="p-4">Deleted By</th>
                <th className="p-4">Deleted At</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e5ec]">
              {deletedShifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">
                    {s.date} ({s.startTime} – {s.endTime})
                  </td>
                  <td className="p-4">
                    {s.user?.name || 'Open Shift (Unassigned)'}
                  </td>
                  <td className="p-4">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                      style={{ backgroundColor: s.role?.colour || '#0a65fc' }}
                    />
                    {s.role?.name} • {s.location?.name}
                  </td>
                  <td className="p-4 text-xs">
                    {s.deletedBy?.name || s.deletedBy?.email || 'Manager'}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {s.deletedAt
                      ? new Date(s.deletedAt).toLocaleString('en-GB')
                      : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleRestore(s.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore Shift
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
