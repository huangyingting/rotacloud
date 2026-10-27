'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ActivityAuditLogPage() {
  const [logs, setLogs] = useState<Array<any>>([]);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = useCallback(async () => {
    const res = await fetch(
      `/api/v1/audit-logs${actionFilter ? `?action=${actionFilter}` : ''}`
    );
    if (res.ok) {
      const d = await res.json();
      setLogs(d.auditLogs || []);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0a65fc]" />
            Security &amp; Operational Audit Trail
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Immutable audit log recording authentication events, single-use
            invitation issuance/consumption/revocation, shift publishing, and
            payroll changes.
          </p>
        </div>

        <input
          type="search"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          placeholder="Filter by action (e.g. INVITE, SHIFT)..."
          className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-xs w-64"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Target</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-4 text-xs text-slate-500 font-mono">
                  {new Date(log.createdAt).toLocaleString('en-GB')}
                </td>
                <td className="p-4 font-mono text-xs font-bold text-[#0a65fc]">
                  {log.action}
                </td>
                <td className="p-4 text-xs">
                  {log.actor?.name || log.actorEmail || 'System'}
                </td>
                <td className="p-4 text-xs">
                  {log.summary ||
                    `${log.targetType}: ${log.targetLabel || log.targetId || '—'}`}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      (log.status || 'SUCCESS') === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status || 'SUCCESS'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
