'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Users,
  Palmtree,
  CheckSquare,
  PoundSterling,
  Settings,
  LogOut,
  Bell,
  FileText,
  Sparkles,
  CheckCircle2,
  Circle,
  X,
  Activity,
  Menu,
} from 'lucide-react';

export type WorkspaceContextData = {
  user: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    pin?: string | null;
    hourlyRate: number;
    weeklyHours: number;
    holidayAllowance: number;
  };
  workspace: {
    id: string;
    accountNumericId: number;
    name: string;
    industry: string;
    timezone: string;
    currencySymbol: string;
    planId: string;
    billingCycle: string;
    setupSteps: {
      accountCreated: boolean;
      locationsAdded: boolean;
      rolesAdded: boolean;
      employeesAdded: boolean;
      shiftPublished: boolean;
    };
  };
  locations: Array<{ id: string; name: string; timezone: string; address?: string | null }>;
  roles: Array<{
    id: string;
    name: string;
    colour: string;
    defaultBreak: number;
    defaultRate: number;
    payCode?: string | null;
  }>;
  groups: Array<{ id: string; name: string }>;
  pendingRequestsCount: number;
  pendingLeaveCount: number;
  pendingShiftRequestCount: number;
  memos: Array<{ id: string; title: string; content: string; createdAt: string }>;
  refreshWorkspace: () => Promise<void>;
};

const AppContext = createContext<WorkspaceContextData | null>(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppShell');
  }
  return ctx;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<Omit<
    WorkspaceContextData,
    'refreshWorkspace'
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [memosOpen, setMemosOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/me', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center font-app text-sm text-[#555459]">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-[#e2e5ec]">
          <div className="w-5 h-5 rounded-full border-2 border-[#0a65fc] border-t-transparent animate-spin" />
          <span>Loading RotaCloud workspace...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.user) {
    return null;
  }

  const steps = data.workspace?.setupSteps || {
    accountCreated: true,
    locationsAdded: false,
    rolesAdded: false,
    employeesAdded: false,
    shiftPublished: false,
  };
  const completedStepsCount = Object.values(steps).filter(Boolean).length;

  const primaryNav = [
    {
      label: 'Dashboard',
      href: '/app/dashboard',
      active:
        pathname.startsWith('/app/dashboard') ||
        pathname.startsWith('/app/calendar'),
      subItems: [
        { label: 'Dashboard', href: '/app/dashboard' },
        { label: 'Calendar', href: '/app/calendar' },
      ],
    },
    {
      label: 'Rotas',
      href: '/app/rotas',
      active:
        pathname.startsWith('/app/rotas') ||
        pathname.startsWith('/app/deleted-shifts'),
      subItems: [
        { label: 'Rota Builder', href: '/app/rotas' },
        { label: 'Deleted Shifts', href: '/app/deleted-shifts' },
      ],
    },
    {
      label: 'Company',
      href: '/app/employees',
      active:
        pathname.startsWith('/app/employees') ||
        pathname.startsWith('/app/locations') ||
        pathname.startsWith('/app/roles') ||
        pathname.startsWith('/app/groups') ||
        pathname.startsWith('/app/documents') ||
        pathname.startsWith('/app/memos'),
      subItems: [
        { label: 'Employees', href: '/app/employees' },
        { label: 'Locations', href: '/app/locations' },
        { label: 'Roles', href: '/app/roles' },
        { label: 'Groups', href: '/app/groups' },
        { label: 'Documents', href: '/app/documents' },
        { label: 'Memos', href: '/app/memos' },
      ],
    },
    {
      label: 'Leave',
      href: '/app/leave',
      active: pathname.startsWith('/app/leave'),
      subItems: [{ label: 'Leave, Embargoes & TOIL', href: '/app/leave' }],
    },
    {
      label: 'Attendance',
      href: '/app/attendance',
      active:
        pathname.startsWith('/app/attendance') ||
        pathname.startsWith('/app/terminals'),
      subItems: [
        { label: 'Timesheets', href: '/app/attendance' },
        { label: 'Clocking Terminals', href: '/app/terminals' },
      ],
    },
    {
      label: 'Availability',
      href: '/app/availability',
      active: pathname.startsWith('/app/availability'),
      subItems: [
        { label: 'Availability & Patterns', href: '/app/availability' },
      ],
    },
    {
      label: 'Financials',
      href: '/app/budgets',
      active:
        pathname.startsWith('/app/budgets') ||
        pathname.startsWith('/app/reports'),
      subItems: [
        { label: 'Budgets & Forecasting', href: '/app/budgets' },
        { label: 'Reports', href: '/app/reports' },
      ],
    },
  ];

  const activeGroup = primaryNav.find((n) => n.active);

  return (
    <AppContext.Provider value={{ ...data, refreshWorkspace: fetchMe }}>
      <div className="min-h-screen bg-[#f5f6f8] text-[#555459] font-app flex flex-col">
        {/* Top Electric Blue Navbar (#0a65fc) matching app.rotacloud.com */}
        <header className="bg-[#0a65fc] text-white shadow-sm sticky top-0 z-30">
          <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/app/dashboard"
                className="flex items-center gap-2 font-extrabold text-lg tracking-tight text-white"
              >
                <span className="w-7 h-7 rounded bg-white text-[#0a65fc] flex items-center justify-center font-black text-sm">
                  R
                </span>
                <span>RotaCloud</span>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded ml-1">
                  {data.workspace?.name || 'MS'} #{data.workspace?.accountNumericId || 108044}
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {primaryNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors ${
                      item.active
                        ? 'bg-white/20 text-white'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Utility Bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors"
                title="Setup Wizard"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Setup ({completedStepsCount}/5)</span>
              </button>

              <button
                type="button"
                onClick={() => setMemosOpen(true)}
                className="p-2 rounded-md hover:bg-white/15 transition-colors relative"
                title="Company Memos"
              >
                <FileText className="w-4 h-4" />
                {data.memos.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 absolute top-1.5 right-1.5" />
                )}
              </button>

              <Link
                href="/app/leave"
                className="p-2 rounded-md hover:bg-white/15 transition-colors relative"
                title="Pending Requests"
              >
                <Bell className="w-4 h-4" />
                {data.pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold absolute -top-0.5 -right-0.5">
                    {data.pendingRequestsCount}
                  </span>
                )}
              </Link>

              <Link
                href="/app/activity"
                className={`p-2 rounded-md hover:bg-white/15 transition-colors ${
                  pathname.startsWith('/app/activity') ? 'bg-white/20' : ''
                }`}
                title="Activity & Audit Log"
              >
                <Activity className="w-4 h-4" />
              </Link>

              <Link
                href="/app/settings"
                className={`p-2 rounded-md hover:bg-white/15 transition-colors ${
                  pathname.startsWith('/app/settings') ? 'bg-white/20' : ''
                }`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/20 text-xs">
                <span className="font-bold truncate max-w-[120px]">
                  {data.user.name || `${data.user.firstName} ${data.user.lastName}`}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-extrabold uppercase">
                  {data.user.role}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-md hover:bg-white/15 transition-colors"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden p-2 rounded-md hover:bg-white/15"
                aria-label="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#074fc7] px-4 py-3 space-y-1 border-t border-white/15">
              {primaryNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded text-sm font-bold text-white hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/app/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded text-sm font-bold text-white hover:bg-white/10"
              >
                Settings &amp; Invitations
              </Link>
              <Link
                href="/app/activity"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded text-sm font-bold text-white hover:bg-white/10"
              >
                Activity &amp; Security Audit Log
              </Link>
            </div>
          )}
        </header>

        {/* Contextual Secondary Sub-Navigation Bar */}
        {activeGroup && activeGroup.subItems.length > 1 && (
          <div className="bg-white border-b border-[#e2e5ec]">
            <div className="max-w-[1600px] mx-auto px-4 flex items-center gap-6 overflow-x-auto">
              {activeGroup.subItems.map((sub) => {
                const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-colors ${
                      isSubActive
                        ? 'border-[#0a65fc] text-[#0a65fc]'
                        : 'border-transparent text-[#555459] hover:text-slate-900'
                    }`}
                  >
                    {sub.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
          {children}
        </main>

        {/* 5-Step Setup Wizard Modal (rc-setup-wizard replica) */}
        {wizardOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-[#e2e5ec] max-w-lg w-full overflow-hidden">
              <div className="bg-[#0a65fc] px-6 py-4 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Getting Started with RotaCloud
                  </h2>
                  <p className="text-xs text-white/80">
                    {completedStepsCount} of 5 onboarding steps completed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  className="p-1 rounded hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {[
                  {
                    key: 'accountCreated',
                    done: steps.accountCreated,
                    title: '1. Create your RotaCloud workspace',
                    desc: `Account ${data.workspace?.name} (#${data.workspace?.accountNumericId}) is active.`,
                    href: '/app/settings',
                  },
                  {
                    key: 'locationsAdded',
                    done: steps.locationsAdded,
                    title: '2. Add your Locations',
                    desc: 'Set up your workplaces, timezones, and clocking geofences.',
                    href: '/app/locations',
                  },
                  {
                    key: 'rolesAdded',
                    done: steps.rolesAdded,
                    title: '3. Create Job Roles',
                    desc: 'Add colour-coded roles with default break lengths and hourly rates.',
                    href: '/app/roles',
                  },
                  {
                    key: 'employeesAdded',
                    done: steps.employeesAdded,
                    title: '4. Invite or Add Employees',
                    desc: 'Issue single-use invitation codes or add team profiles.',
                    href: '/app/employees',
                  },
                  {
                    key: 'shiftPublished',
                    done: steps.shiftPublished,
                    title: '5. Build & Publish your first Rota',
                    desc: 'Schedule shifts on the Rota Builder and click Publish.',
                    href: '/app/rotas',
                  },
                ].map((s) => (
                  <Link
                    key={s.key}
                    href={s.href}
                    onClick={() => setWizardOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#e2e5ec] hover:border-[#0a65fc] transition-colors"
                  >
                    {s.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {s.title}
                      </div>
                      <div className="text-xs text-[#555459]">{s.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Memos Slide-over Drawer */}
        {memosOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-end">
            <div className="bg-white w-full max-w-md h-full shadow-xl border-l border-[#e2e5ec] flex flex-col">
              <div className="px-6 py-4 border-b border-[#e2e5ec] flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Company Memos &amp; Announcements
                </h2>
                <button
                  type="button"
                  onClick={() => setMemosOpen(false)}
                  className="p-1 rounded hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {data.memos.length === 0 ? (
                  <p className="text-sm text-[#555459]">
                    No company memos published yet.
                  </p>
                ) : (
                  data.memos.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-lg bg-[#f5f6f8] border border-[#e2e5ec]"
                    >
                      <div className="font-bold text-slate-900 text-sm">
                        {m.title}
                      </div>
                      <p className="text-xs text-[#555459] mt-1 whitespace-pre-wrap">
                        {m.content}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-2">
                        {new Date(m.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-[#e2e5ec]">
                <Link
                  href="/app/memos"
                  onClick={() => setMemosOpen(false)}
                  className="block w-full py-2.5 text-center rounded-lg bg-[#0a65fc] text-white text-xs font-bold"
                >
                  Manage Memos
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
