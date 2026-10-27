'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import { calculateStairstepSubscriptionCost } from '@/lib/domain/workforce-engine';
import { Check, HelpCircle } from 'lucide-react';

export default function PricingPage() {
  const [employeeCount, setEmployeeCount] = useState(12);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [addonAttendance, setAddonAttendance] = useState(true);
  const [smsCreditsBundle, setSmsCreditsBundle] = useState(100);

  const standardCalc = calculateStairstepSubscriptionCost({
    employeeCount,
    planId: 'plan-standard',
    billingCycle,
    addonTimeAndAttendance: addonAttendance,
    smsCreditsBundle,
  });

  const proCalc = calculateStairstepSubscriptionCost({
    employeeCount,
    planId: 'plan-pro',
    billingCycle,
    addonTimeAndAttendance: addonAttendance,
    smsCreditsBundle,
  });

  return (
    <MarketingShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0a0e2f]">
            Simple, transparent stairstep pricing
          </h1>
          <p className="mt-4 text-lg text-[#0a0e2f]/75">
            Priced in bands of 5 employees. Save 16.7% with annual billing.
          </p>
        </div>

        {/* Interactive Calculator Controls */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e5dec9] shadow-sm mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div>
              <label className="block text-sm font-bold text-[#0a0e2f] mb-2">
                How many staff do you schedule? ({employeeCount} staff — Band up to{' '}
                {standardCalc.bandMaxEmployees})
              </label>
              <input
                type="range"
                min={1}
                max={150}
                value={employeeCount}
                onChange={(e) => setEmployeeCount(Number(e.target.value))}
                className="w-full accent-[#0a65fc]"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1–5 staff</span>
                <span>50 staff</span>
                <span>150+ staff</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0a0e2f] mb-2">
                Billing Frequency
              </label>
              <div className="inline-flex rounded-xl bg-[#f2ede2] p-1 w-full">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-[#0a0e2f] shadow-sm'
                      : 'text-[#0a0e2f]/70'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    billingCycle === 'annual'
                      ? 'bg-[#0a65fc] text-white shadow-sm'
                      : 'text-[#0a0e2f]/70'
                  }`}
                >
                  Annual (-16.7%)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-sm font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={addonAttendance}
                  onChange={(e) => setAddonAttendance(e.target.checked)}
                  className="w-4 h-4 accent-[#0a65fc] rounded"
                />
                Include Time &amp; Attendance Add-on (+£5/band)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">SMS Credits:</span>
                {[0, 100, 500].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSmsCreditsBundle(qty)}
                    className={`px-2.5 py-1 rounded border font-bold ${
                      smsCreditsBundle === qty
                        ? 'bg-[#0a65fc] text-white border-[#0a65fc]'
                        : 'bg-[#fbf6ee] border-[#e5dec9]'
                    }`}
                  >
                    {qty === 0 ? 'None' : `${qty} (£${(qty / 100) * 6})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">Standard</h2>
                <span className="px-3 py-1 rounded-full bg-[#f2ede2] text-xs font-bold">
                  £10 / 5 staff band
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Core rota planning, shift notifications, and annual leave
                management.
              </p>
              <div className="my-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-extrabold text-[#0a0e2f]">
                  £{standardCalc.effectiveMonthlyGBP.toFixed(2)}
                </span>
                <span className="text-sm text-slate-500 font-semibold">
                  {' '}
                  / month + VAT
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  Covers up to {standardCalc.bandMaxEmployees} employees (
                  {standardCalc.bandsCount} bands)
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Unlimited rotas, locations, and roles',
                  'Real-time hourly & salaried wage costing',
                  '14 leave types & annual leave matrix',
                  'Staff mobile availability & shift acknowledgements',
                  'Document storage & company memos',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#0a65fc]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3.5 rounded-xl bg-[#0a0e2f] hover:bg-[#0a65fc] text-white font-bold text-center transition-colors"
            >
              Select Standard Plan
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 border-2 border-[#0a65fc] shadow-md flex flex-col justify-between relative">
            <span className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-[#0a65fc] text-white text-xs font-extrabold uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold">Pro</h2>
                <span className="px-3 py-1 rounded-full bg-[#ebf3ff] text-[#0a65fc] text-xs font-bold">
                  £15 / 5 staff band
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Advanced workforce automation, open shifts, swaps, embargoes,
                TOIL, budgets, and REST API.
              </p>
              <div className="my-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-extrabold text-[#0a65fc]">
                  £{proCalc.effectiveMonthlyGBP.toFixed(2)}
                </span>
                <span className="text-sm text-slate-500 font-semibold">
                  {' '}
                  / month + VAT
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  Covers up to {proCalc.bandMaxEmployees} employees (
                  {proCalc.bandsCount} bands)
                </div>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  'Everything in Standard, plus:',
                  'Open Shifts claiming & Shift Swaps/Drops',
                  'Leave Embargoes & Time Off In Lieu (TOIL)',
                  '1, 2 & 4-week repeating availability patterns',
                  'Revenue budgets, labour forecasting & Bradford Factor',
                  'REST API keys & Webhook endpoints',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#0a65fc]" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/login"
              className="mt-8 w-full py-3.5 rounded-xl bg-[#0a65fc] hover:bg-[#074fc7] text-white font-bold text-center transition-colors"
            >
              Select Pro Plan
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
