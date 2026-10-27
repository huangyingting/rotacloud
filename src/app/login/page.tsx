'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect email address or password.');
        setLoading(false);
        return;
      }
      router.push('/app/dashboard');
      router.refresh();
    } catch {
      setError('Unable to reach server. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex flex-col justify-center items-center px-4 py-12 font-app">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-3xl font-extrabold text-[#0a0e2f]"
          >
            <span className="w-10 h-10 rounded-xl bg-[#0a65fc] text-white flex items-center justify-center font-black shadow">
              R
            </span>
            <span>RotaCloud</span>
          </Link>
          <p className="text-sm text-[#555459] mt-2">
            Log in to your RotaCloud workforce account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e2e5ec] p-8">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[#555459]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#0a65fc] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'Log In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e5ec] text-center text-xs text-[#555459]">
            Have an invitation code from your administrator?{' '}
            <Link
              href="/register"
              className="font-bold text-[#0a65fc] hover:underline"
            >
              Redeem Invitation Code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
