import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import { Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TimeAndAttendancePage() {
  return (
    <MarketingShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf3ff] text-[#0a65fc] text-xs font-bold uppercase">
            <Clock className="w-3.5 h-3.5" /> Time &amp; Attendance
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0a0e2f]">
            Accurate clocking and stress-free payroll timesheets.
          </h1>
          <p className="text-lg text-[#0a0e2f]/75 leading-relaxed">
            Compare scheduled shifts with actual clock-in/out times automatically.
            Flag lateness, calculate UK 12.07% statutory holiday accrual, and
            approve timesheets for payroll export in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: '4-Digit PIN Clocking Terminals',
              desc: 'Set up dedicated on-site tablet or web terminals where staff clock in and out using their unique 4-digit PIN.',
            },
            {
              title: 'Geofenced & IP-Verified Clocking',
              desc: 'Configure location coordinates, geofence radius in meters, and authorized workplace IP addresses.',
            },
            {
              title: 'Automatic Variance & Lateness Flags',
              desc: 'Instantly highlight LATE_IN, EARLY_OUT, MISSING_CLOCK_OUT, and unscheduled shifts on the timesheet ledger.',
            },
            {
              title: 'Statutory 12.07% Holiday Accrual',
              desc: 'Automatically accrue statutory holiday hours for casual and irregular-hours staff as they work.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-7 border border-[#e5dec9] shadow-sm"
            >
              <div className="flex items-center gap-2 font-extrabold text-lg mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#0a65fc]" />
                {card.title}
              </div>
              <p className="text-sm text-[#0a0e2f]/75 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/app/attendance"
            className="px-6 py-3.5 rounded-xl bg-[#0a65fc] text-white font-bold inline-flex items-center gap-2"
          >
            Open Attendance &amp; Timesheets <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/app/terminals"
            className="px-6 py-3.5 rounded-xl bg-[#f2ede2] text-[#0a0e2f] font-bold inline-flex items-center gap-2"
          >
            Launch PIN Clocking Terminal
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
