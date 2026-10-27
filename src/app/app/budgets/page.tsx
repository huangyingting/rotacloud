'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { getMondayOfWeek } from '@/lib/domain/workforce-engine';
import { PoundSterling, Save } from 'lucide-react';

export default function BudgetsPage() {
  const { locations } = useAppContext();
  const [selectedLocId, setSelectedLocId] = useState('');
  const [weekStart, setWeekStart] = useState(() =>
    getMondayOfWeek(new Date().toISOString().slice(0, 10))
  );
  const [forecastRevenue, setForecastRevenue] = useState(15000);
  const [targetLabourPct, setTargetLabourPct] = useState(28);
  const [includeSalaried, setIncludeSalaried] = useState(true);
  const [scheduledCost, setScheduledCost] = useState(0);
  const [savedBanner, setSavedBanner] = useState(false);

  const activeLocId = selectedLocId || locations[0]?.id || '';

  const loadBudget = useCallback(async () => {
    if (!activeLocId) return;
    const [bRes, sRes] = await Promise.all([
      fetch(`/api/v1/budgets?locationId=${activeLocId}&weekStartDate=${weekStart}`),
      fetch(`/api/v1/shifts?locationId=${activeLocId}`),
    ]);
    if (bRes.ok) {
      const d = await bRes.json();
      const existing = d.budgets?.[0];
      if (existing) {
        setForecastRevenue(existing.forecastRevenue);
        setTargetLabourPct(existing.targetLabourPct);
        setIncludeSalaried(existing.includeSalaried);
      }
    }
    if (sRes.ok) {
      const d = await sRes.json();
      const total = (d.shifts || []).reduce(
        (acc: number, s: any) => acc + s.wageCost,
        0
      );
      setScheduledCost(total);
    }
  }, [activeLocId, weekStart]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: activeLocId,
        weekStartDate: weekStart,
        forecastRevenue: Number(forecastRevenue),
        targetLabourPct: Number(targetLabourPct),
        includeSalaried,
      }),
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  }

  const targetBudgetGBP = (forecastRevenue * targetLabourPct) / 100;
  const actualLabourPct =
    forecastRevenue > 0 ? (scheduledCost / forecastRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PoundSterling className="w-5 h-5 text-[#0a65fc]" />
            Revenue Budgets &amp; Labour Cost % Targets
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Set weekly revenue forecasts and target labour percentages per site.
          </p>
        </div>
        {savedBanner && (
          <span className="px-3 py-1.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
            Budget Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-[#555459]">
            Target Weekly Labour Budget
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            £{targetBudgetGBP.toFixed(2)} ({targetLabourPct}%)
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-[#555459]">
            Scheduled Rota Wage Cost
          </div>
          <div className="text-2xl font-extrabold text-[#0a65fc] mt-1">
            £{scheduledCost.toFixed(2)} ({actualLabourPct.toFixed(1)}%)
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-[#555459]">
            Budget Variance
          </div>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              scheduledCost <= targetBudgetGBP
                ? 'text-emerald-700'
                : 'text-red-600'
            }`}
          >
            £{(targetBudgetGBP - scheduledCost).toFixed(2)}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Location
          </label>
          <select
            value={activeLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Forecast Weekly Revenue (£)
          </label>
          <input
            type="number"
            value={forecastRevenue}
            onChange={(e) => setForecastRevenue(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
            Target Labour Cost (%)
          </label>
          <input
            type="number"
            step="0.5"
            value={targetLabourPct}
            onChange={(e) => setTargetLabourPct(Number(e.target.value))}
            className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" /> Save Budget Target
        </button>
      </form>
    </div>
  );
}
