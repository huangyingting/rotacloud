'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);

  const loadReports = useCallback(async () => {
    const res = await fetch('/api/v1/reports');
    if (res.ok) {
      setData(await res.json());
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  function handleExportCsv() {
    if (!data?.employeeReports) return;
    const header =
      'Employee,Role,ScheduledHours,ScheduledCostGBP,WorkedHours,ActualCostGBP,SicknessSpells,SicknessDays,BradfordScore,BradfordRisk,WTDCompliant\n';
    const rows = data.employeeReports
      .map(
        (r: any) =>
          `"${r.name}","${r.role}",${r.scheduledHours},${r.scheduledCost},${r.workedHours},${r.actualCost},${r.sicknessSpells},${r.sicknessDays},${r.bradford.score},"${r.bradford.riskLevel}",${r.wtdCompliance.compliant}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rotacloud-workforce-report.csv';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0a65fc]" />
            Workforce Analytics, Bradford Factor &amp; WTD Compliance Reports
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Compare scheduled vs actual labour costs, Bradford Factor (S² × D)
            sickness scores, and 48h Working Time Directive limits.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
              <th className="p-4">Employee</th>
              <th className="p-4">Scheduled Hours &amp; Cost</th>
              <th className="p-4">Actual Worked &amp; Cost</th>
              <th className="p-4">Leave Taken</th>
              <th className="p-4">Bradford Factor (S² × D)</th>
              <th className="p-4">UK 48h WTD Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e5ec]">
            {(data?.employeeReports || []).map((r: any) => {
              const emp = r.employee || r;
              const workedCost = r.workedCost ?? r.actualCost ?? 0;
              const leaveDays = r.holidayUsedDays ?? r.leaveDaysTaken ?? 0;
              const severity =
                r.bradford?.severity || r.bradford?.riskLevel || 'Low';
              const wtdCompliant =
                r.wtd?.compliant ?? r.wtdCompliance?.compliant ?? true;
              return (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-900">
                    {emp.name}
                    <span className="block text-xs font-normal text-[#555459]">
                      {emp.email}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold">{r.scheduledHours}h</span> • £
                    {Number(r.scheduledCost || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className="font-bold">{r.workedHours}h</span> • £
                    {Number(workedCost).toFixed(2)}
                  </td>
                  <td className="p-4">{leaveDays} days</td>
                  <td className="p-4">
                    <span className="font-bold">
                      {r.bradford?.score ?? 0} pts
                    </span>{' '}
                    <span className="text-xs text-[#555459]">({severity})</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        wtdCompliant
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {wtdCompliant ? 'COMPLIANT' : 'EXCEEDS 48H'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
