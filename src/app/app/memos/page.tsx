'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { MessageSquare, Plus, Pin, Trash2 } from 'lucide-react';

export default function MemosPage() {
  const { refreshWorkspace } = useAppContext();
  const [memos, setMemos] = useState<Array<any>>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const loadMemos = useCallback(async () => {
    const res = await fetch('/api/v1/memos');
    if (res.ok) {
      const d = await res.json();
      setMemos(d.memos || []);
    }
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  async function handlePostMemo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await fetch('/api/v1/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, pinned }),
    });
    setTitle('');
    setContent('');
    setPinned(false);
    await loadMemos();
    await refreshWorkspace();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/memos?id=${id}`, { method: 'DELETE' });
    await loadMemos();
    await refreshWorkspace();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#0a65fc]" />
          Company Memos &amp; Announcements
        </h1>
        <p className="text-sm text-[#555459] mt-0.5">
          Broadcast news, policy updates, and shift announcements to your team.
        </p>
      </div>

      <form
        onSubmit={handlePostMemo}
        className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Memo Subject / Headline *"
            className="md:col-span-2 px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-[#0a65fc]"
            />
            <Pin className="w-3.5 h-3.5 text-[#0a65fc]" /> Pin to Top of Drawer
          </label>
        </div>
        <textarea
          rows={3}
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement message..."
          className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Publish Memo
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {memos.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                {m.pinned && (
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0a65fc] text-[10px] font-bold uppercase">
                    Pinned
                  </span>
                )}
                <h3 className="text-base font-bold text-slate-900">
                  {m.title}
                </h3>
              </div>
              <p className="text-sm text-[#555459] mt-1">{m.content}</p>
              <div className="text-xs text-slate-400 mt-2">
                Posted by {m.author?.name} •{' '}
                {new Date(m.createdAt).toLocaleString('en-GB')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              className="p-1.5 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
