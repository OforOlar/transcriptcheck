'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Faculty } from '@/app/types';

function OtpScreen({
  email, onVerified, onBack,
}: { email: string; onVerified: () => void; onBack: () => void; }) {
  const supabase = createClient();
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError(null);
    if (value && index < 7) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    const next = [...otp];
    paste.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputs.current[Math.min(paste.length, 7)]?.focus();
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 8) return setError('Please enter the complete 8-digit code.');
    setLoading(true);
    setError(null);
    try {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email, token: code, type: 'signup',
      });
      if (verifyErr) throw new Error('Invalid or expired code. Please try again.');
      onVerified();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await supabase.auth.resend({ type: 'signup', email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #050c08 0%, #0a1810 35%, #0d2218 65%, #071009 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(20,184,166,0.25)',
        borderRadius: '28px', padding: '52px 44px', textAlign: 'center',
        maxWidth: '500px', width: '90%',
        boxShadow: '0 0 80px rgba(20,184,166,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(16,185,129,0.1))',
          border: '1px solid rgba(20,184,166,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
        }}>✉️</div>
        <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.6rem', marginBottom: '10px' }}>
          Check Your Email
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, marginBottom: '6px' }}>
          We sent an 8-digit verification code to
        </p>
        <p style={{ color: '#14b8a6', fontSize: '14px', fontWeight: 600, marginBottom: '32px', wordBreak: 'break-all' }}>
          {email}
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
          {otp.map((digit, i) => (
            <input key={i} ref={el => { inputs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
              style={{
                width: '44px', height: '52px', textAlign: 'center',
                fontSize: '20px', fontWeight: 700,
                background: digit ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${digit ? 'rgba(20,184,166,0.6)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '12px', color: 'white', outline: 'none', transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(20,184,166,0.8)'; e.target.style.background = 'rgba(20,184,166,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = digit ? 'rgba(20,184,166,0.6)' : 'rgba(255,255,255,0.12)'; }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            color: '#fca5a5', fontSize: '13px',
          }}>{error}</div>
        )}
        {resent && (
          <div style={{
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)',
            borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
            color: '#5eead4', fontSize: '13px',
          }}>New code sent! Check your inbox.</div>
        )}

        <button onClick={handleVerify} disabled={loading || otp.join('').length < 8}
          style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #14b8a6, #10b981)',
            color: 'white', fontWeight: 700, fontSize: '15px',
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(20,184,166,0.4)',
            marginBottom: '16px', opacity: loading ? 0.7 : 1, transition: 'all 0.25s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
          {loading ? 'Verifying...' : 'Verify & Continue →'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: 0 }}>
            ← Back
          </button>
          <button onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', color: '#14b8a6', fontSize: '13px', cursor: 'pointer', padding: 0, opacity: resending ? 0.6 : 1 }}>
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
        <p style={{ color: '#374151', fontSize: '11px', marginTop: '20px' }}>
          TranscriptCheck · University of Buea
        </p>
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [form, setForm] = useState({
    full_name: '', email: '', faculty_id: '', password: '', confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');

  useEffect(() => {
    supabase.from('faculties').select('*').order('faculty_name')
      .then(({ data }) => {
        if (data) setFaculties(data.map(f => ({ id: f.id, name: f.faculty_name, code: f.faculty_code })));
      });
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (!form.faculty_id) return setError('Please select your faculty.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm_password) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (authErr) throw new Error(authErr.message);
      if (auth.user && auth.user.identities && auth.user.identities.length === 0) {
        throw new Error('This email is already registered. Please log in instead.');
      }
      if (!auth.user) throw new Error('Registration failed.');
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerified() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session not found after verification.');

      const { data: existing } = await supabase
        .from('profiles').select('id').eq('id', user.id).maybeSingle();

      if (!existing) {
        const { error: profErr } = await supabase.from('profiles').insert({
          id: user.id,
          role: 'admin',
          full_name: form.full_name.trim(),
          faculty: form.faculty_id,
          matricule: null,
          department: null,
        });
        if (profErr) throw new Error('Profile creation failed: ' + profErr.message);
      }
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong after verification.');
      setStep('form');
    }
  }

  if (step === 'otp') {
    return (
      <OtpScreen
        email={form.email.trim().toLowerCase()}
        onVerified={onVerified}
        onBack={() => setStep('form')}
      />
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-2/5 bg-teal-900 flex-col justify-center items-center p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">TranscriptCheck</h1>
        <p className="text-teal-200 text-lg mb-8">Administrator Portal Registration</p>
        <div className="bg-teal-800 rounded-xl p-6 text-teal-100 text-sm space-y-3 w-full max-w-xs text-left">
          <p className="font-semibold text-white">Admin Account Rules</p>
          <p>✓ Select the faculty you administer</p>
          <p>✓ You will only see students from your faculty</p>
          <p>✓ Password minimum 8 characters</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Registration</h2>
          <p className="text-gray-400 text-sm mb-6">University of Buea</p>
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="full_name" value={form.full_name} onChange={onChange}
                placeholder="Your full name" className={inputCls} autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={onChange}
                placeholder="admin@ubuea.cm" className={inputCls} autoComplete="off" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty (you will manage this faculty's transcripts)
              </label>
              <select name="faculty_id" value={form.faculty_id} onChange={onChange}
                className={inputCls + ' bg-white'}>
                <option value="">— Select your Faculty —</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={onChange}
                placeholder="Minimum 8 characters" className={inputCls} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" name="confirm_password" value={form.confirm_password}
                onChange={onChange} placeholder="Repeat password"
                className={inputCls} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-teal-700 text-white rounded-lg font-semibold
                         hover:bg-teal-800 transition disabled:opacity-50 mt-2">
              {loading ? 'Creating Account...' : 'Create Admin Account & Verify Email'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{' '}
            <a href="/admin/login" className="text-teal-700 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}