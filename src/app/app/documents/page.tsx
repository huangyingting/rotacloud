'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, CheckCircle2, Trash2 } from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Array<any>>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CONTRACT');
  const [requiresAck, setRequiresAck] = useState(true);

  const loadDocuments = useCallback(async () => {
    const res = await fetch('/api/v1/documents');
    if (res.ok) {
      const d = await res.json();
      setDocuments(d.documents || []);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/v1/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        fileSizeBytes: 245760,
        requiresAck,
      }),
    });
    setTitle('');
    await loadDocuments();
  }

  async function handleAck(id: string) {
    await fetch('/api/v1/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await loadDocuments();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v1/documents?id=${id}`, { method: 'DELETE' });
    await loadDocuments();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0a65fc]" />
            Employee Documents Vault (10 GB Storage)
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Store contracts, staff handbooks, and right-to-work files with read
            acknowledgement tracking.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleUpload}
        className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Document Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2026 Staff Handbook"
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          >
            <option value="CONTRACT">Employment Contract</option>
            <option value="POLICY">Company Policy / Handbook</option>
            <option value="RIGHT_TO_WORK">Right to Work Check</option>
            <option value="CERTIFICATION">Training Certificate</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
            className="accent-[#0a65fc]"
          />
          Require Staff Read Receipt
        </label>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </form>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Document</th>
              <th className="p-4">Category</th>
              <th className="p-4">Uploaded By</th>
              <th className="p-4">Acknowledgement</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#555459]">
                  No HR documents uploaded yet.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">
                    {doc.title}
                    <span className="block text-xs font-normal text-[#555459]">
                      {doc.fileName}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-bold">{doc.category}</td>
                  <td className="p-4 text-xs">{doc.uploadedBy?.name}</td>
                  <td className="p-4 text-xs">
                    {doc.acknowledgedAt ? (
                      <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAck(doc.id)}
                        className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-bold"
                      >
                        Acknowledge Receipt
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
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
