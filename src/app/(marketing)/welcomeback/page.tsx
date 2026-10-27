import Link from 'next/link';
import { MarketingShell } from '@/components/MarketingShell';
import { ArrowRight, KeyRound, LogIn, ShieldCheck } from 'lucide-react';

export default function WelcomeBackPage() {
  return (
    <MarketingShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ebf3ff] text-[#0a65fc] text-xs font-bold uppercase">
          <ShieldCheck className="w-4 h-4" /> Welcome Back to RotaCloud
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0a0e2f]">
          Ready to check your next shift or publish this week&apos;s rota?
        </h1>
        <p className="text-lg text-[#0a0e2f]/75 max-w-2xl mx-auto">
          Sign in to your existing RotaCloud workspace or redeem a single-use
          invitation code from your manager.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left pt-4">
          <div className="bg-white rounded-2xl p-7 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
            <div>
              <LogIn className="w-8 h-8 text-[#0a65fc] mb-4" />
              <h2 className="text-xl font-extrabold mb-2">Existing Member</h2>
              <p className="text-sm text-slate-600 mb-6">
                Sign in with your email address and password to access your
                dashboard, rotas, leave, and timesheets.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-[#0a65fc] hover:bg-[#074fc7] text-white font-bold text-center inline-flex items-center justify-center gap-2"
            >
              Go to Log In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-7 border border-[#e5dec9] shadow-sm flex flex-col justify-between">
            <div>
              <KeyRound className="w-8 h-8 text-[#0a65fc] mb-4" />
              <h2 className="text-xl font-extrabold mb-2">Invited Staff</h2>
              <p className="text-sm text-slate-600 mb-6">
                Have a single-use invitation code (e.g.{' '}
                <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  RC-XXXX-XXXX-XXXX
                </code>
                )? Redeem it here to activate your account.
              </p>
            </div>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-[#0a0e2f] hover:bg-[#0a65fc] text-white font-bold text-center inline-flex items-center justify-center gap-2 transition-colors"
            >
              Redeem Invitation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
