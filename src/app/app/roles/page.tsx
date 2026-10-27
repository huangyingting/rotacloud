'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

const COLOUR_SWATCHES = [
  '#0a65fc',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

export default function RolesPage() {
  const { user, refreshWorkspace } = useAppContext();
  const [roles, setRoles] = useState<Array<any>>([]);
  const [name, setName] = useState('');
  const [colour, setColour] = useState('#0a65fc');
  const [defaultRate, setDefaultRate] = useState(12.5);
  const [defaultBreak, setDefaultBreak] = useState(30);

  const loadRoles = useCallback(async () => {
    const res = await fetch('/api/v1/roles');
    if (res.ok) {
      const d = await res.json();
      setRoles(d.roles || []);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/v1/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        colour,
        defaultRate: Number(defaultRate),
        defaultBreak: Number(defaultBreak),
      }),
    });
    if (res.ok) {
      setName('');
      await loadRoles();
      await refreshWorkspace();
    }
  }

  async function handleDeleteRole(id: string) {
    await fetch(`/api/v1/roles/${id}`, { method: 'DELETE' });
    await loadRoles();
    await refreshWorkspace();
  }

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#0a65fc]" />
          Job Roles
        </h1>
        <p className="text-sm text-[#555459] mt-0.5">
          Define colour-coded rota roles, default hourly rates, and default
          unpaid break durations.
        </p>
      </div>

      {isManager && (
        <form
          onSubmit={handleCreateRole}
          className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barista, Shift Supervisor"
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Rota Colour
            </label>
            <div className="flex items-center gap-1.5 py-1.5">
              {COLOUR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColour(c)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    colour === c ? 'border-slate-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Default Rate (£/hr)
            </label>
            <input
              type="number"
              step="0.01"
              value={defaultRate}
              onChange={(e) => setDefaultRate(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Default Break (Mins)
            </label>
            <input
              type="number"
              value={defaultBreak}
              onChange={(e) => setDefaultBreak(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Role
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Role</th>
              <th className="p-4">Code</th>
              <th className="p-4">Default Rate</th>
              <th className="p-4">Default Break</th>
              <th className="p-4">Qualified Staff</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#555459]">
                  No job roles created yet. Add your first role above.
                </td>
              </tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: r.colour }}
                    />
                    {r.name}
                  </td>
                  <td className="p-4 font-mono text-xs">{r.code}</td>
                  <td className="p-4">£{r.defaultRate.toFixed(2)}/hr</td>
                  <td className="p-4">{r.defaultBreak} mins</td>
                  <td className="p-4">{r._count?.userRoles ?? 0} staff</td>
                  <td className="p-4 text-right">
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(r.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
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
