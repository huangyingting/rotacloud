'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Calendar,
  Clock,
  Palmtree,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbf6ee] text-[#0a0e2f] font-marketing flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#fbf6ee]/95 backdrop-blur border-b border-[#e5dec9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[#0a0e2f]"
            >
              <span className="w-9 h-9 rounded-lg bg-[#0a65fc] text-white flex items-center justify-center font-black shadow-sm">
                R
              </span>
              <span>RotaCloud</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#0a0e2f]/80">
              <Link
                href="/rota-planning"
                className={`hover:text-[#0a65fc] transition-colors flex items-center gap-1.5 ${
                  pathname === '/rota-planning' ? 'text-[#0a65fc]' : ''
                }`}
              >
                <Calendar className="w-4 h-4 text-[#0a65fc]" />
                Rota Planning
              </Link>
              <Link
                href="/time-and-attendance"
                className={`hover:text-[#0a65fc] transition-colors flex items-center gap-1.5 ${
                  pathname === '/time-and-attendance' ? 'text-[#0a65fc]' : ''
                }`}
              >
                <Clock className="w-4 h-4 text-[#0a65fc]" />
                Time &amp; Attendance
              </Link>
              <Link
                href="/hr-software"
                className={`hover:text-[#0a65fc] transition-colors flex items-center gap-1.5 ${
                  pathname === '/hr-software' ? 'text-[#0a65fc]' : ''
                }`}
              >
                <Palmtree className="w-4 h-4 text-[#0a65fc]" />
                Leave &amp; HR
              </Link>
              <Link
                href="/pricing"
                className={`hover:text-[#0a65fc] transition-colors ${
                  pathname === '/pricing' ? 'text-[#0a65fc]' : ''
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/welcomeback"
                className={`hover:text-[#0a65fc] transition-colors ${
                  pathname === '/welcomeback' ? 'text-[#0a65fc]' : ''
                }`}
              >
                Welcome Back
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2.5 text-sm font-bold text-[#0a0e2f] hover:text-[#0a65fc] transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white text-sm font-bold shadow-sm transition-colors inline-flex items-center gap-2"
            >
              Redeem Invite Code
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-[#0a0e2f] hover:bg-[#f2ede2]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-[#fbf6ee] border-b border-[#e5dec9] px-4 py-4 space-y-3">
            <Link
              href="/rota-planning"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-semibold text-[#0a0e2f]"
            >
              Rota Planning
            </Link>
            <Link
              href="/time-and-attendance"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-semibold text-[#0a0e2f]"
            >
              Time &amp; Attendance
            </Link>
            <Link
              href="/hr-software"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-semibold text-[#0a0e2f]"
            >
              Leave &amp; HR Software
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-semibold text-[#0a0e2f]"
            >
              Pricing
            </Link>
            <Link
              href="/welcomeback"
              onClick={() => setMobileOpen(false)}
              className="block py-2 font-semibold text-[#0a0e2f]"
            >
              Welcome Back
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-2.5 text-center rounded-lg border border-[#0a0e2f]/20 font-bold"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 text-center rounded-lg bg-[#0a65fc] text-white font-bold"
              >
                Redeem Invite Code
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0a0e2f] text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 text-xl font-extrabold mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#0a65fc] text-white flex items-center justify-center font-black">
                R
              </span>
              <span>RotaCloud</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Workforce management software built for hospitality, retail, care,
              and shift-based teams across the UK.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-400 bg-white/5 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-4 h-4" />
              Invite-Only Admission &amp; Audit Enabled
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">
              Features
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/rota-planning" className="hover:text-white">
                  Rota Planning &amp; Costing
                </Link>
              </li>
              <li>
                <Link href="/time-and-attendance" className="hover:text-white">
                  Time &amp; Attendance
                </Link>
              </li>
              <li>
                <Link href="/hr-software" className="hover:text-white">
                  Leave &amp; HR Management
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Stairstep Pricing Calculator
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">
              Application
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <Link href="/login" className="hover:text-white">
                  Staff &amp; Manager Log In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Redeem Invitation Code
                </Link>
              </li>
              <li>
                <Link href="/welcomeback" className="hover:text-white">
                  Welcome Back Hub
                </Link>
              </li>
              <li>
                <Link href="/app/dashboard" className="hover:text-white">
                  Web App Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-4">
              UK Support
            </h3>
            <p className="text-sm text-white/75 leading-relaxed">
              York, United Kingdom
              <br />
              01904 500 660
              <br />
              support@rotacloud.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
