'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAppContext } from '@/components/AppShell';
import {
  Users,
  UserPlus,
  KeyRound,
  Copy,
  Check,
  Edit3,
  UserX,
  RotateCcw,
  X,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, locations, roles, refreshWorkspace } = useAppContext();
  const [employees, setEmployees] = useState<Array<any>>([]);
  const [invitations, setInvitations] = useState<Array<any>>([]);
  const [tab, setTab] = useState<'active' | 'past' | 'invitations'>('active');
  const [search, setSearch] = useState('');

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>('EMPLOYEE');
  const [hourlyRate, setHourlyRate] = useState(12.5);
  const [salaryType, setSalaryType] = useState<'HOURLY' | 'ANNUAL_SALARY'>('HOURLY');
  const [weeklyStandardHours, setWeeklyStandardHours] = useState(40);
  const [annualLeaveAllowance, setAnnualLeaveAllowance] = useState(28);
  const [selectedLocIds, setSelectedLocIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [issueInviteOnly, setIssueInviteOnly] = useState(true);
  const [inviteDeliveryMode, setInviteDeliveryMode] = useState<
    'NONE' | 'INVITE_ONLY' | 'ONBOARDING'
  >('ONBOARDING');
  const [expiresInHours, setExpiresInHours] = useState(72);

  // Issued code banner
  const [issuedCodeInfo, setIssuedCodeInfo] = useState<{
    code: string;
    email: string;
    role: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    const [empRes, invRes] = await Promise.all([
      fetch(`/api/v1/employees?includePast=${tab === 'past'}`),
      fetch('/api/v1/invitations'),
    ]);
    if (empRes.ok) {
      const d = await empRes.json();
      setEmployees(d.employees || []);
    }
    if (invRes.ok) {
      const d = await invRes.json();
      setInvitations(d.invitations || []);
    }
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (issueInviteOnly) {
      const res = await fetch('/api/v1/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          invitedName: `${firstName} ${lastName}`.trim(),
          role,
          expiresInHours,
          locationIds: selectedLocIds.length
            ? selectedLocIds
            : locations.map((l) => l.id),
          roleIds: selectedRoleIds.length
            ? selectedRoleIds
            : roles.map((r) => r.id),
        }),
      });
      const data = await res.json();
      if (res.ok && data.code) {
        setIssuedCodeInfo({
          code: data.code,
          email: data.invitation.email,
          role: data.invitation.role,
        });
        setAddModalOpen(false);
        await loadData();
      }
      return;
    }

    const res = await fetch('/api/v1/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        role,
        hourlyRate: Number(hourlyRate),
        salaryType,
        weeklyStandardHours: Number(weeklyStandardHours),
        annualLeaveAllowance: Number(annualLeaveAllowance),
        locationIds: selectedLocIds.length
          ? selectedLocIds
          : locations.map((l) => l.id),
        roleIds: selectedRoleIds.length
          ? selectedRoleIds
          : roles.map((r) => r.id),
      }),
    });
    if (res.ok) {
      setAddModalOpen(false);
      await loadData();
      await refreshWorkspace();
    }
  }

  async function handleToggleActive(empId: string, isActive: boolean) {
    await fetch(`/api/v1/employees/${empId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isActive,
        leaveDate: isActive ? null : new Date().toISOString().slice(0, 10),
      }),
    });
    await loadData();
  }

  async function handleInvitationAction(
    id: string,
    action: 'revoke' | 'rotate'
  ) {
    const res = await fetch(`/api/v1/invitations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok && data.code) {
      setIssuedCodeInfo({
        code: data.code,
        email: data.invitation.email,
        role: data.invitation.role,
      });
    }
    await loadData();
  }

  const filteredEmployees = employees.filter((e) => {
    const matchesTab = tab === 'past' ? !e.isActive : e.isActive;
    const matchesSearch =
      !search ||
      `${e.name} ${e.email}`.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const isManager = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#e2e5ec] p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0a65fc]" />
            Employees &amp; Invite-Only Access
          </h1>
          <p className="text-sm text-[#555459] mt-0.5">
            Manage active staff, past employees, and single-use invitation codes.
          </p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={() => {
              setFirstName('');
              setLastName('');
              setEmail('');
              setAddModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add / Invite Employee
          </button>
        )}
      </div>

      {/* Newly Issued Single-Use Invite Code Banner */}
      {issuedCodeInfo && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" /> Single-Use Invitation Code Issued
            </div>
            <div className="text-sm text-emerald-950">
              Share this single-use invitation code with{' '}
              <strong>{issuedCodeInfo.email}</strong> ({issuedCodeInfo.role}). It
              will never be shown in plaintext again:
            </div>
            <div className="font-mono text-lg font-extrabold text-emerald-900 bg-white px-3 py-1.5 rounded border border-emerald-300 inline-block">
              {issuedCodeInfo.code}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/register?code=${issuedCodeInfo.code}`
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied Link
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Registration Link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIssuedCodeInfo(null)}
              className="px-3 py-2 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-[#e2e5ec] bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold ${
              tab === 'active'
                ? 'bg-[#0a65fc] text-white'
                : 'text-[#555459] hover:text-slate-900'
            }`}
          >
            Active Employees
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold ${
              tab === 'past'
                ? 'bg-[#0a65fc] text-white'
                : 'text-[#555459] hover:text-slate-900'
            }`}
          >
            Past Employees
          </button>
          <button
            type="button"
            onClick={() => setTab('invitations')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold ${
              tab === 'invitations'
                ? 'bg-[#0a65fc] text-white'
                : 'text-[#555459] hover:text-slate-900'
            }`}
          >
            Invitation Codes ({invitations.length})
          </button>
        </div>

        {tab !== 'invitations' && (
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="px-3.5 py-2 rounded-lg border border-[#e2e5ec] bg-white text-xs w-64"
          />
        )}
      </div>

      {/* Main Content */}
      {tab === 'invitations' ? (
        <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                <th className="p-4">Recipient Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Code Prefix</th>
                <th className="p-4">Status</th>
                <th className="p-4">Expires</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e5ec]">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555459]">
                    No invitations issued yet.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">
                      {inv.email}
                      {(inv.invitedName || inv.firstName) && (
                        <span className="block text-xs font-normal text-[#555459]">
                          {inv.invitedName ||
                            `${inv.firstName || ''} ${inv.lastName || ''}`.trim()}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-bold">
                        {inv.role}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-bold">
                      {inv.codePrefix}-••••
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          (inv.effectiveStatus || inv.status) === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : (inv.effectiveStatus || inv.status) === 'CONSUMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.effectiveStatus || inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-[#555459]">
                      {new Date(inv.expiresAt).toLocaleString('en-GB')}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {(inv.effectiveStatus || inv.status) === 'PENDING' &&
                        isManager && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleInvitationAction(inv.id, 'rotate')
                            }
                            className="px-2.5 py-1 rounded border border-[#e2e5ec] hover:bg-slate-100 text-xs font-bold text-[#0a65fc]"
                          >
                            Rotate Code
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleInvitationAction(inv.id, 'revoke')
                            }
                            className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e5ec] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f5f6f8] border-b border-[#e2e5ec] text-xs font-bold uppercase text-[#555459]">
                <th className="p-4">Employee</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Locations &amp; Roles</th>
                <th className="p-4">Wage / Contract</th>
                <th className="p-4">Terminal PIN</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e5ec]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-xs text-[#555459]">{emp.email}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ebf3ff] text-[#0a65fc]">
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="font-semibold text-slate-800">
                      {emp.userLocations
                        ?.map((ul: any) => ul.location?.name)
                        .join(', ') || 'All Locations'}
                    </div>
                    <div className="text-[#555459] mt-0.5">
                      {emp.userRoles
                        ?.map((ur: any) => ur.role?.name)
                        .join(', ') || 'No roles assigned'}
                    </div>
                  </td>
                  <td className="p-4 text-xs">
                    <div className="font-bold text-slate-900">
                      {emp.salaryType === 'ANNUAL_SALARY'
                        ? `£${emp.annualSalary}/yr`
                        : `£${emp.hourlyRate.toFixed(2)}/hr`}
                    </div>
                    <div className="text-[#555459]">
                      {emp.weeklyStandardHours}h/wk • {emp.annualLeaveAllowance}d
                      leave
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs font-bold text-slate-700">
                    {emp.pinCode || '—'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/app/employees/${emp.id}`}
                      className="px-3 py-1.5 rounded-lg border border-[#e2e5ec] hover:bg-slate-100 text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </Link>
                    {isManager && emp.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => handleToggleActive(emp.id, !emp.isActive)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold inline-flex items-center gap-1"
                      >
                        {emp.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5 text-red-600" /> Mark
                            Leaver
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />{' '}
                            Reinstate
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Invite Employee Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-lg w-full overflow-hidden">
            <div className="bg-[#0a65fc] px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">
                Add Employee / Issue Single-Use Invite
              </h2>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#555459] mb-1">
                    Access Level (RBAC)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e5ec] text-sm"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#f5f6f8] p-3.5 rounded-lg border border-[#e2e5ec] space-y-2.5">
                <div className="text-[11px] font-bold uppercase text-[#555459]">
                  Inviting employees (RotaCloud Onboarding Mode)
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="invite_mode"
                      checked={inviteDeliveryMode === 'NONE'}
                      onChange={() => {
                        setInviteDeliveryMode('NONE');
                        setIssueInviteOnly(false);
                      }}
                      className="accent-[#0a65fc]"
                    />
                    Don&apos;t invite — Add employee record without sending an
                    email
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="invite_mode"
                      checked={inviteDeliveryMode === 'INVITE_ONLY'}
                      onChange={() => {
                        setInviteDeliveryMode('INVITE_ONLY');
                        setIssueInviteOnly(true);
                      }}
                      className="accent-[#0a65fc]"
                    />
                    Send invite(s) only — Issue single-use login invitation code
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="invite_mode"
                      checked={inviteDeliveryMode === 'ONBOARDING'}
                      onChange={() => {
                        setInviteDeliveryMode('ONBOARDING');
                        setIssueInviteOnly(true);
                      }}
                      className="accent-[#0a65fc]"
                    />
                    Send onboarding invite to new hire(s) — Request personal &amp;
                    payroll details
                  </label>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer pt-1 border-t border-[#e2e5ec]">
                  <input
                    type="checkbox"
                    checked={issueInviteOnly}
                    onChange={(e) => setIssueInviteOnly(e.target.checked)}
                    className="accent-[#0a65fc]"
                  />
                  Issue Single-Use Invitation Code (Invite-Only Registration)
                </label>
                {issueInviteOnly ? (
                  <div className="flex items-center justify-between text-xs text-[#555459] pt-1">
                    <span>Invitation Expiry (Hours):</span>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={expiresInHours}
                      onChange={(e) =>
                        setExpiresInHours(Number(e.target.value))
                      }
                      className="w-24 px-2 py-1 rounded border border-[#e2e5ec] bg-white text-right font-bold"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#555459]">
                        Hourly Rate (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        className="w-full px-2 py-1 rounded border border-[#e2e5ec] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#555459]">
                        Weekly Hrs
                      </label>
                      <input
                        type="number"
                        value={weeklyStandardHours}
                        onChange={(e) =>
                          setWeeklyStandardHours(Number(e.target.value))
                        }
                        className="w-full px-2 py-1 rounded border border-[#e2e5ec] bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#555459]">
                        Leave (Days)
                      </label>
                      <input
                        type="number"
                        value={annualLeaveAllowance}
                        onChange={(e) =>
                          setAnnualLeaveAllowance(Number(e.target.value))
                        }
                        className="w-full px-2 py-1 rounded border border-[#e2e5ec] bg-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e5ec]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#e2e5ec] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-xs font-bold"
                >
                  {issueInviteOnly
                    ? 'Generate Single-Use Invite Code'
                    : 'Create Employee Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
