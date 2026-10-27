'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex flex-col justify-center items-center px-4 py-12 font-app">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[#e2e5ec] p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Reset your password
        </h1>
        <p className="text-sm text-[#555459] mb-6">
          Enter the email address associated with your RotaCloud account, or
          contact your workspace administrator to issue a password reset.
        </p>

        {submitted ? (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              If an active account exists for <strong>{email}</strong>, password
              recovery instructions have been logged for your workspace.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] text-white font-bold text-sm"
            >
              Request Password Reset
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-[#e2e5ec]">
          <Link
            href="/login"
            className="text-xs font-bold text-[#0a65fc] inline-flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
