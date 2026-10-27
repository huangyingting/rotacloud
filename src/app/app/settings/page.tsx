'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { calculateSubscriptionQuote } from '@/lib/domain/workforce-engine';
import { Settings as SettingsIcon, Key, Webhook, Save, Check } from 'lucide-react';

const SETTINGS_TABS = [
  'Account & Rota Settings',
  'Time & Attendance Rules',
  'Billing & Plan Calculator',
  'API Keys & Webhooks',
] as const;

export default function SettingsPage() {
  const { refreshWorkspace } = useAppContext();
  const [activeTab, setActiveTab] = useState<(typeof SETTINGS_TABS)[number]>(
    'Account & Rota Settings'
  );
  const [workspace, setWorkspace] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<Array<any>>([]);
  const [webhooks, setWebhooks] = useState<Array<any>>([]);
  const [newPlainApiKey, setNewPlainApiKey] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [weekStartsOn, setWeekStartsOn] = useState('MONDAY');
  const [defaultBreakMinutes, setDefaultBreakMinutes] = useState(30);
  const [clockInBufferMins, setClockInBufferMins] = useState(15);
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState(150);

  // Plan calculator
  const [planTier, setPlanTier] = useState<'standard' | 'pro'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [headcount, setHeadcount] = useState(15);
  const [terminals, setTerminals] = useState(1);

  // API & Webhook inputs
  const [apiKeyLabel, setApiKeyLabel] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/v1/settings');
    if (res.ok) {
      const d = await res.json();
      setWorkspace(d.workspace);
      setApiKeys(d.apiKeys || []);
      setWebhooks(d.webhooks || []);
      if (d.workspace) {
        setCompanyName(d.workspace.name || '');
        setWeekStartsOn(d.workspace.weekStartsOn || 'MONDAY');
        setDefaultBreakMinutes(d.workspace.defaultBreakMinutes ?? 30);
        setClockInBufferMins(d.workspace.clockInBufferMins ?? 15);
        setGeofenceRadiusMeters(d.workspace.geofenceRadiusMeters ?? 150);
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/v1/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: companyName,
        weekStartsOn,
        defaultBreakMinutes: Number(defaultBreakMinutes),
        clockInBufferMins: Number(clockInBufferMins),
        geofenceRadiusMeters: Number(geofenceRadiusMeters),
      }),
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
    await loadSettings();
    await refreshWorkspace();
  }

  async function handleGenerateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyLabel.trim()) return;
    const res = await fetch('/api/v1/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_api_key', name: apiKeyLabel }),
    });
    const d = await res.json();
    if (res.ok && d.plainKey) {
      setNewPlainApiKey(d.plainKey);
      setApiKeyLabel('');
      await loadSettings();
    }
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    await fetch('/api/v1/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_webhook',
        targetUrl: webhookUrl,
        events: 'shift.published,leave.approved,timesheet.approved',
      }),
    });
    setWebhookUrl('');
    await loadSettings();
  }

  const quote = calculateSubscriptionQuote({
    plan: planTier,
    cycle: billingCycle,
    employeesCount: headcount,
    includeTimeAndAttendance: true,
    terminalsCount: terminals,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0a65fc]" />
            Account Settings, Compliance &amp; Integrations
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Account #{workspace?.accountNumericId} • Configure scheduling rules,
            clocking geofences, billing, and API keys.
          </p>
        </div>
        {savedBanner && (
          <span className="px-3.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1">
            <Check className="w-4 h-4" /> Settings Saved
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
        <div className="border-b border-[#e2e5ec] px-6 flex flex-wrap gap-6 bg-[#f5f6f8]">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`py-3.5 text-xs font-bold border-b-2 ${
                activeTab === t
                  ? 'border-[#0a65fc] text-[#0a65fc]'
                  : 'border-transparent text-[#555459]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {(activeTab === 'Account & Rota Settings' ||
            activeTab === 'Time & Attendance Rules') && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                  Company / Account Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Rota Week Starts On
                  </label>
                  <select
                    value={weekStartsOn}
                    onChange={(e) => setWeekStartsOn(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="SUNDAY">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Default Unpaid Break (Mins)
                  </label>
                  <input
                    type="number"
                    value={defaultBreakMinutes}
                    onChange={(e) =>
                      setDefaultBreakMinutes(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Early Clock-In Buffer (Mins)
                  </label>
                  <input
                    type="number"
                    value={clockInBufferMins}
                    onChange={(e) =>
                      setClockInBufferMins(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    GPS Geofence Radius (Meters)
                  </label>
                  <input
                    type="number"
                    value={geofenceRadiusMeters}
                    onChange={(e) =>
                      setGeofenceRadiusMeters(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Account Settings
              </button>
            </form>
          )}

          {activeTab === 'Billing & Plan Calculator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    <option value="standard">Standard Plan</option>
                    <option value="pro">Pro Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    <option value="annual">Annual (Discounted)</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Active Employees ({headcount}) — Charged at Stairstep Tier{' '}
                    {quote.billedEmployeesBracket}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={150}
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full accent-[#0a65fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Clocking Terminals ({terminals})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={terminals}
                    onChange={(e) => setTerminals(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                <div className="text-xs font-bold uppercase text-blue-400">
                  Stairstep Subscription Quote
                </div>
                <div className="text-3xl font-extrabold">
                  £{quote.totalMonthlyGBP.toFixed(2)}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    / month
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                  <div>
                    Billed Bracket: {quote.billedEmployeesBracket} employees
                  </div>
                  <div>Rota Base Cost: £{quote.rotaMonthlyGBP.toFixed(2)}</div>
                  <div>
                    Time &amp; Attendance Add-on: £
                    {quote.attendanceMonthlyGBP.toFixed(2)}
                  </div>
                  <div>
                    Terminals Add-on: £{quote.terminalsMonthlyGBP.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'API Keys & Webhooks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#0a65fc]" /> REST API Keys
                </h3>
                {newPlainApiKey && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-900">
                    New API Key: {newPlainApiKey}
                  </div>
                )}
                <form onSubmit={handleGenerateApiKey} className="flex gap-2">
                  <input
                    type="text"
                    value={apiKeyLabel}
                    onChange={(e) => setApiKeyLabel(e.target.value)}
                    placeholder="Key Label (e.g. Xero Payroll Sync)"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                  >
                    Generate Key
                  </button>
                </form>
                <div className="divide-y divide-[#e2e5ec] text-xs">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <span className="font-bold">{k.name}</span>
                      <span className="font-mono text-slate-500">
                        {k.keyPrefix}••••
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Webhook className="w-4 h-4 text-[#0a65fc]" /> Outbound
                  Webhooks
                </h3>
                <form onSubmit={handleCreateWebhook} className="flex gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhooks/rotacloud"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#e2e5ec] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                  >
                    Add Webhook
                  </button>
                </form>
                <div className="divide-y divide-[#e2e5ec] text-xs">
                  {webhooks.map((w) => (
                    <div key={w.id} className="py-2">
                      <div className="font-bold truncate">{w.targetUrl}</div>
                      <div className="text-slate-400">{w.events}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
