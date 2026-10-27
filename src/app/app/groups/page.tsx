'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Array<any>>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadGroups = useCallback(async () => {
    const res = await fetch('/api/v1/groups');
    if (res.ok) {
      const d = await res.json();
      setGroups(d.groups || []);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch('/api/v1/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setName('');
    setDescription('');
    await loadGroups();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/groups?id=${id}`, { method: 'DELETE' });
    await loadGroups();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#0a65fc]" />
          Employee Groups
        </h1>
        <p className="text-sm text-[#555459] mt-0.5">
          Organise staff into teams for targeted memos, leave embargoes, and
          reporting.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Group Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. First Aid Qualified, Keyholders"
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </form>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Group Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Members</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#555459]">
                  No employee groups created yet.
                </td>
              </tr>
            ) : (
              groups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">{g.name}</td>
                  <td className="p-4 text-[#555459]">{g.description || '—'}</td>
                  <td className="p-4">{g.members?.length ?? 0} members</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
