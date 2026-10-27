import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import { Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RotaPlanningPage() {
  return (
    <MarketingShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf3ff] text-[#0a65fc] text-xs font-bold uppercase">
            <Calendar className="w-3.5 h-3.5" /> Rota Planning
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0a0e2f]">
            Build conflict-free rotas in a fraction of the time.
          </h1>
          <p className="text-lg text-[#0a0e2f]/75 leading-relaxed">
            Spot availability clashes and approved holiday before you schedule a
            single shift. Track hourly and salaried wage costs in real time, copy
            previous weeks, and publish directly to your team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Week & Month Rota Views',
              desc: 'Switch effortlessly between detailed weekly employee rows and full monthly coverage grids.',
            },
            {
              title: 'Open Shifts & Shift Swaps',
              desc: 'Post unassigned Open Shifts for qualified staff to claim, and approve peer-to-peer shift swaps and drops.',
            },
            {
              title: 'Deleted Shifts Audit & Recovery',
              desc: 'Every deleted shift is preserved with actor and timestamp metadata so managers can restore mistakes in one click.',
            },
            {
              title: 'Live Labour Costing & Day Notes',
              desc: 'See exact net hours (with paid/unpaid break deductions) and £ wage costs alongside daily manager notes.',
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

        <div>
          <Link
            href="/app/rotas"
            className="px-6 py-3.5 rounded-xl bg-[#0a65fc] text-white font-bold inline-flex items-center gap-2"
          >
            Open Interactive Rota Builder <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
