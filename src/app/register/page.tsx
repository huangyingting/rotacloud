'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  KeyRound,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || searchParams.get('token') || '';

  const [invitationCode, setInvitationCode] = useState(initialCode);
  const [inspectState, setInspectState] = useState<{
    status?: string;
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function verifyCode(codeToVerify: string) {
    const trimmed = codeToVerify.trim();
    if (!trimmed) {
      setInspectState(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/auth/invitations/inspect?code=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (data.invitation) {
        setInspectState(data.invitation);
        if (data.invitation.status === 'pending') {
          if (data.invitation.email && !email) setEmail(data.invitation.email);
          if (data.invitation.firstName && !firstName)
            setFirstName(data.invitation.firstName);
          if (data.invitation.lastName && !lastName)
            setLastName(data.invitation.lastName);
        }
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (initialCode) {
      verifyCode(initialCode);
    }
  }, [initialCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationCode,
          email,
          password,
          firstName,
          lastName,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Check your invitation code.');
        setLoading(false);
        return;
      }
      router.push('/app/dashboard');
      router.refresh();
    } catch {
      setError('Network error while completing registration.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e5ec] p-8">
      <div className="mb-5 p-3 rounded-lg bg-[#ebf3ff] border border-[#0a65fc]/20 text-xs text-[#0a0e2f] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#0a65fc] shrink-0" />
        <span>
          <strong>Invite-Only Admission:</strong> Registration requires a
          valid, single-use invitation code issued by your workspace
          administrator.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reg-invite-code"
            className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
          >
            Single-Use Invitation Code *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-invite-code"
                type="text"
                required
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                onBlur={() => verifyCode(invitationCode)}
                placeholder="RC-XXXX-XXXX-XXXX"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] font-mono text-sm uppercase text-slate-900 focus:outline-none focus:border-[#0a65fc]"
              />
            </div>
            <button
              type="button"
              onClick={() => verifyCode(invitationCode)}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Verify
            </button>
          </div>
          {inspectState && inspectState.status === 'pending' && (
            <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid {inspectState.role} invitation for {inspectState.email}
            </div>
          )}
          {inspectState && inspectState.status !== 'pending' && (
            <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">
              Invitation status: <strong>{inspectState.status?.toUpperCase()}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="reg-first-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
            >
              First Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reg-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="reg-last-name"
              className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
            >
              Last Name *
            </label>
            <input
              id="reg-last-name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-email"
            className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
          >
            Invited Email Address *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-phone"
            className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
          >
            Mobile Phone (Optional)
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07700 900000"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reg-password"
            className="block text-xs font-bold uppercase tracking-wider text-[#555459] mb-1.5"
          >
            Create Password (Min 8 Characters) *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[#e2e5ec] text-sm text-slate-900 focus:outline-none focus:border-[#0a65fc]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[#0a65fc] hover:bg-[#074fc7] disabled:opacity-60 text-white font-bold text-sm shadow-sm transition-colors"
        >
          {loading ? 'Activating Account...' : 'Redeem Invitation & Create Account'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-[#e2e5ec] text-center text-xs text-[#555459]">
        Already activated your account?{' '}
        <Link href="/login" className="font-bold text-[#0a65fc] hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
            Activate your invited RotaCloud account
          </p>
        </div>

        <Suspense fallback={<div className="p-8 bg-white rounded-xl">Loading...</div>}>
          <RegisterFormContent />
        </Suspense>
      </div>
    </div>
  );
}
