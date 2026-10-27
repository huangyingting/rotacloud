import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import { Palmtree, CheckCircle2, ArrowRight } from 'lucide-react';
import { SYSTEM_LEAVE_TYPES } from '@/lib/domain/workforce-engine';

export default function HrSoftwarePage() {
  return (
    <MarketingShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf3ff] text-[#0a65fc] text-xs font-bold uppercase">
            <Palmtree className="w-3.5 h-3.5" /> Leave &amp; HR Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0a0e2f]">
            Centralised leave, TOIL, Bradford Factor, and employee records.
          </h1>
          <p className="text-lg text-[#0a0e2f]/75 leading-relaxed">
            Manage holiday allowances in days or hours, enforce seasonal leave
            embargoes, track sickness and Bradford Factor scores, and store
            signed HR documents in one secure workspace.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-[#e5dec9] shadow-sm">
          <h2 className="text-lg font-extrabold mb-4">
            All 14 Built-In RotaCloud Leave Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SYSTEM_LEAVE_TYPES.map((lt) => (
              <div
                key={lt.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#fbf6ee] border border-[#e5dec9] text-xs font-bold"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: lt.colour }}
                />
                <span>{lt.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Automatic Shift Clash Detection',
              desc: 'When an employee requests leave, RotaCloud checks for overlapping scheduled shifts and warns managers immediately.',
            },
            {
              title: 'Leave Embargoes & Blackout Dates',
              desc: 'Block holiday requests during peak trading dates across all locations or specific venues.',
            },
            {
              title: 'Time Off In Lieu (TOIL) Ledger',
              desc: 'Record banked overtime hours and track used and remaining TOIL balances per employee.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-6 border border-[#e5dec9] shadow-sm"
            >
              <div className="flex items-center gap-2 font-extrabold text-base mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#0a65fc]" />
                {card.title}
              </div>
              <p className="text-sm text-[#0a0e2f]/75 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        <div>
          <Link
            href="/app/leave"
            className="px-6 py-3.5 rounded-xl bg-[#0a65fc] text-white font-bold inline-flex items-center gap-2"
          >
            Open Leave &amp; HR Suite <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
