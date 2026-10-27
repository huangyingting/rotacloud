import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import {
  Calendar,
  Clock,
  Palmtree,
  CheckCircle2,
  ArrowRight,
  PoundSterling,
  Smartphone,
  ShieldCheck,
  Users,
} from 'lucide-react';

export default function HomePage() {
  return (
    <MarketingShell>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f2ede2] text-[#0a0e2f] text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-[#0a65fc]" />
              UK&apos;s Favourite Rota &amp; Workforce Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0a0e2f] leading-[1.08]">
              Workforce management software that makes work{' '}
              <span className="text-[#0a65fc] underline decoration-[#0a65fc]/30">
                simple
              </span>
              .
            </h1>
            <p className="text-lg sm:text-xl text-[#0a0e2f]/75 max-w-2xl leading-relaxed">
              Plan rotas in minutes, track attendance and timesheets with GPS or
              PIN terminals, and manage annual leave, TOIL, and labour budgets in
              one place.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                className="px-7 py-4 rounded-xl bg-[#0a65fc] hover:bg-[#074fc7] text-white font-bold text-base shadow-md transition-all inline-flex items-center gap-2"
              >
                Sign In to RotaCloud
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="px-7 py-4 rounded-xl bg-[#f2ede2] hover:bg-[#e5dec9] text-[#0a0e2f] font-bold text-base transition-all"
              >
                Explore Pricing
              </Link>
            </div>
            <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg text-sm font-semibold text-[#0a0e2f]/75">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0a65fc]" />
                Real-time Wage Costing
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0a65fc]" />
                14 Leave Categories
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0a65fc]" />
                Invite-Only Security
              </div>
            </div>
          </div>

          {/* Interactive Rota Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xl border border-[#e5dec9] overflow-hidden">
              <div className="bg-[#0a65fc] px-5 py-3.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Calendar className="w-4 h-4" />
                  Rota Builder — Main Venue
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  Published
                </span>
              </div>
              <div className="p-5 space-y-4 font-app text-sm">
                <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-500 border-b pb-2">
                  <div>Employee</div>
                  <div>Mon 26</div>
                  <div>Tue 27</div>
                  <div>Weekly Cost</div>
                </div>
                {[
                  {
                    name: 'Jack Wolf',
                    role: 'Shift Supervisor',
                    color: '#0a65fc',
                    mon: '09:00 - 17:00',
                    tue: '09:00 - 17:00',
                    cost: '£225.00',
                    hours: '15.0h',
                  },
                  {
                    name: 'Sarah Jenkins',
                    role: 'Front of House',
                    color: '#1ec076',
                    mon: '10:00 - 18:00',
                    tue: 'Holiday',
                    cost: '£93.75',
                    hours: '7.5h',
                  },
                  {
                    name: 'Open Shifts',
                    role: 'Barista',
                    color: '#f5b827',
                    mon: '12:00 - 20:00',
                    tue: '08:00 - 16:00',
                    cost: '£180.00',
                    hours: '15.0h',
                  },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-4 gap-2 items-center py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.role}</div>
                    </div>
                    <div
                      className="rounded px-2 py-1.5 text-xs font-bold text-white"
                      style={{ backgroundColor: row.color }}
                    >
                      {row.mon}
                    </div>
                    <div
                      className="rounded px-2 py-1.5 text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          row.tue === 'Holiday' ? '#2B9AF4' : row.color,
                      }}
                    >
                      {row.tue}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{row.cost}</div>
                      <div className="text-xs text-slate-500">{row.hours}</div>
                    </div>
                  </div>
                ))}
                <div className="bg-[#f5f6f8] rounded-lg p-3 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Labour Target: 24.2% of £2,050 Forecast</span>
                  <span className="text-emerald-600 font-bold">On Budget</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="bg-[#f2ede2] py-20 border-y border-[#e5dec9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0a0e2f]">
              Everything you need to run your shift-based team
            </h2>
            <p className="mt-3 text-[#0a0e2f]/75 text-lg">
              No more spreadsheets, paper holiday forms, or manual payroll
              calculations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#fbf6ee] rounded-2xl p-8 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0a65fc]/10 text-[#0a65fc] flex items-center justify-center mb-5">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold mb-3">
                  Drag-and-Drop Rota Planning
                </h3>
                <p className="text-sm text-[#0a0e2f]/75 leading-relaxed mb-6">
                  Build weekly or monthly rotas with live hourly &amp; salaried
                  labour costs, open shift claiming, shift swaps, day notes, and
                  instant publishing notifications.
                </p>
              </div>
              <Link
                href="/rota-planning"
                className="text-sm font-bold text-[#0a65fc] inline-flex items-center gap-1.5 hover:underline"
              >
                Explore Rota Planning <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-[#fbf6ee] rounded-2xl p-8 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0a65fc]/10 text-[#0a65fc] flex items-center justify-center mb-5">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold mb-3">
                  Time &amp; Attendance Tracking
                </h3>
                <p className="text-sm text-[#0a0e2f]/75 leading-relaxed mb-6">
                  Staff clock in via geofenced mobile app or 4-digit PIN
                  terminals. Automatically flag lateness, compute UK 12.07%
                  statutory holiday accrual, and export payroll-ready timesheets.
                </p>
              </div>
              <Link
                href="/time-and-attendance"
                className="text-sm font-bold text-[#0a65fc] inline-flex items-center gap-1.5 hover:underline"
              >
                Explore Time &amp; Attendance <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-[#fbf6ee] rounded-2xl p-8 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0a65fc]/10 text-[#0a65fc] flex items-center justify-center mb-5">
                  <Palmtree className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold mb-3">
                  Leave, TOIL &amp; HR Documents
                </h3>
                <p className="text-sm text-[#0a0e2f]/75 leading-relaxed mb-6">
                  Track 14 leave types, set seasonal leave embargoes, detect
                  clashing shifts automatically, monitor Bradford Factor scores,
                  and manage employee documents and memos.
                </p>
              </div>
              <Link
                href="/hr-software"
                className="text-sm font-bold text-[#0a65fc] inline-flex items-center gap-1.5 hover:underline"
              >
                Explore Leave &amp; HR <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Financial & Security Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: PoundSterling,
              title: 'Labour Forecasting',
              desc: 'Compare scheduled wage cost against weekly revenue targets and labour % budgets.',
            },
            {
              icon: Smartphone,
              title: 'Self-Service Availability',
              desc: 'Staff submit date-specific availability or 1, 2, and 4-week repeating patterns.',
            },
            {
              icon: Users,
              title: 'Role-Based Access Control',
              desc: 'Granular Admin, Manager, and Employee permissions across every location.',
            },
            {
              icon: ShieldCheck,
              title: 'Invite-Only & Audited',
              desc: 'Single-use expiring invitation codes, instant revocation, and immutable audit logs.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 border border-[#e5dec9] shadow-sm"
            >
              <item.icon className="w-7 h-7 text-[#0a65fc] mb-3" />
              <h4 className="font-extrabold text-base mb-1.5">{item.title}</h4>
              <p className="text-xs text-[#0a0e2f]/70 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
