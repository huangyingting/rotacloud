'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppShell';
import { Tablet, Plus, Delete } from 'lucide-react';

export default function TerminalsPage() {
  const { locations } = useAppContext();
  const [terminals, setTerminals] = useState<Array<any>>([]);
  const [name, setName] = useState('');
  const [locId, setLocId] = useState('');

  // Live Kiosk PIN Pad State
  const [pin, setPin] = useState('');
  const [kioskResult, setKioskResult] = useState<string>('');

  const loadTerminals = useCallback(async () => {
    const res = await fetch('/api/v1/terminals');
    if (res.ok) {
      const d = await res.json();
      setTerminals(d.terminals || []);
    }
  }, []);

  useEffect(() => {
    loadTerminals();
  }, [loadTerminals]);

  async function handleCreateTerminal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/v1/terminals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        locationId: locId || locations[0]?.id,
      }),
    });
    if (res.ok) {
      setName('');
      await loadTerminals();
    }
  }

  async function handlePinSubmit() {
    if (pin.length !== 4) return;
    setKioskResult('');
    const res = await fetch('/api/v1/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'pin_terminal',
        pinCode: pin,
        locationId: locId || locations[0]?.id,
      }),
    });
    const data = await res.json();
    setPin('');
    if (res.ok) {
      setKioskResult(
        data.action === 'clocked_in'
          ? `✅ ${data.employeeName} clocked IN at ${data.timesheet.clockInTime}`
          : `✅ ${data.employeeName} clocked OUT at ${data.timesheet.clockOutTime} (${data.timesheet.workedHours}h)`
      );
    } else {
      setKioskResult(`❌ ${data.error || 'Invalid PIN'}`);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tablet className="w-5 h-5 text-[#0a65fc]" />
            Tablet &amp; Kiosk Clocking Terminals
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Pair on-site tablets for 4-digit PIN staff clocking with photo
            verification.
          </p>
        </div>

        <form
          onSubmit={handleCreateTerminal}
          className="bg-white rounded-xl border border-[#e2e5ec] p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Terminal Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Desk iPad"
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
              Location
            </label>
            <select
              value={locId || locations[0]?.id || ''}
              onChange={(e) => setLocId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e2e5ec] text-sm"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#0a65fc] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Register Terminal
          </button>
        </form>

        <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                <th className="p-4">Terminal Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Pairing Code</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e5ec]">
              {terminals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#555459]">
                    No terminals paired yet.
                  </td>
                </tr>
              ) : (
                terminals.map((t) => (
                  <tr key={t.id}>
                    <td className="p-4 font-bold text-slate-900">{t.name}</td>
                    <td className="p-4">{t.location?.name}</td>
                    <td className="p-4 font-mono font-bold text-[#0a65fc]">
                      {t.pairingCode}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        ONLINE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Interactive 4-Digit PIN Kiosk Simulator */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Live Kiosk Terminal Mode
          </div>
          <h2 className="text-lg font-extrabold mt-1">
            Enter 4-Digit Staff PIN
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Find any employee&apos;s 4-digit PIN on the Employees page to clock
            in or out immediately.
          </p>

          <div className="my-5 bg-slate-800 border border-slate-700 rounded-xl py-4 text-center font-mono text-3xl tracking-[0.5em] font-extrabold text-white h-16 flex items-center justify-center">
            {pin.padEnd(4, '•')}
          </div>

          {kioskResult && (
            <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-center">
              {kioskResult}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => pin.length < 4 && setPin(pin + digit)}
                className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-lg"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase text-slate-400"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => pin.length < 4 && setPin(pin + '0')}
              className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-lg"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin(pin.slice(0, -1))}
              className="py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={pin.length !== 4}
          onClick={handlePinSubmit}
          className="mt-5 w-full py-3.5 rounded-xl bg-[#0a65fc] hover:bg-[#074fc7] disabled:opacity-40 font-bold text-sm"
        >
          Clock In / Out with PIN
        </button>
      </div>
    </div>
  );
}
