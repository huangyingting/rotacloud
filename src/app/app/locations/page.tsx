'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export default function LocationsPage() {
  const { user, refreshWorkspace } = useAppContext();
  const [locations, setLocations] = useState<Array<any>>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [postCode, setPostCode] = useState('');

  const loadLocations = useCallback(async () => {
    const res = await fetch('/api/v1/locations');
    if (res.ok) {
      const d = await res.json();
      setLocations(d.locations || []);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  async function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/v1/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, address, postCode }),
    });
    if (res.ok) {
      setName('');
      setAddress('');
      setPostCode('');
      await loadLocations();
      await refreshWorkspace();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/locations/${id}`, { method: 'DELETE' });
    await loadLocations();
    await refreshWorkspace();
  }

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0a65fc]" />
            Work Locations
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Configure sites, branches, and geofenced GPS coordinates.
          </p>
        </div>
      </div>

      {isManager && (
        <form
          onSubmit={handleCreateLocation}
          className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Location Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. York Flagship Store"
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Parliament Street"
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Post Code
            </label>
            <input
              type="text"
              value={postCode}
              onChange={(e) => setPostCode(e.target.value)}
              placeholder="YO1 8SG"
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Location
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Location Name</th>
              <th className="p-4">Address</th>
              <th className="p-4">Post Code</th>
              <th className="p-4">Assigned Staff</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{loc.name}</td>
                <td className="p-4 text-[#555459]">{loc.address || '—'}</td>
                <td className="p-4 text-[#555459]">{loc.postCode || '—'}</td>
                <td className="p-4 font-semibold">
                  {loc._count?.userLocations ?? 0} staff
                </td>
                <td className="p-4 text-right">
                  {isManager && locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(loc.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600"
                      title="Delete Location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
