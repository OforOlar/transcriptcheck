'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

const OTP_LENGTH = 8;

export default function AdminRegisterPage() {
  const router = useRouter();
  const [step, setStep]       = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [otp, setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [faculties, setFaculties] = useState<{ id: string; faculty_name: string }[]>([]);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '', faculty: '',
  });

  useEffect(() => {
    createClient().from('faculties').select('id, faculty_name').order('faculty_name')
      .then(({ data }) => setFaculties(data ?? []));
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.email.trim())     return setError('Email address is required.');
    if (!form.faculty)          return setError('Please select your faculty.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: existingAdmin } = await supabase
        .from('profiles').select('id')
        .eq('faculty', form.faculty).eq('role', 'admin').maybeSingle();
      if (existingAdmin) {
        throw new Error(
          'This faculty already has a registered administrator. ' +
          'Only one administrator is permitted per faculty. ' +
          'To change the administrator, please contact the system team.'
        );
      }
      const { error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(), password: form.password,
        options: { emailRedirectTo: undefined },
      });
      if (signUpErr) throw new Error(signUpErr.message);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return setError('Please enter the full OTP code.');
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: form.email.trim().toLowerCase(), token: code, type: 'signup',
      });
      if (verifyErr || !data.user) throw new Error('Invalid or expired OTP. Please try again.');
      const { error: profErr } = await supabase.from('profiles').insert({
        id: data.user.id, full_name: form.full_name.trim(),
        role: 'admin', faculty: form.faculty, matricule: null,
      });
      if (profErr) throw new Error('Profile creation failed: ' + profErr.message);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  function onOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function onOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';
  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Segoe UI',system-ui,sans-serif",
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: BG,
      fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .inp:focus { border-color:rgba(245,158,11,0.5)!important; background:rgba(245,158,11,0.05)!important; outline:none; }
        .btn:hover:not(:disabled) { background:#d97706!important; }
        select option { background:#0d1530; color:#f1f5f9; }
        * { box-sizing:border-box; }
      `}</style>

      {/* LEFT — info */}
      <div style={{
        width: '40%', padding: '48px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px',
            background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '12px' }}>TC</span>
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px' }}>TranscriptCheck</span>
        </div>

        <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.6rem',
          letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '16px' }}>
          Admin Registration
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.75, marginBottom: '32px' }}>
          Create your faculty administrator account to start managing
          student transcripts and resolving error reports.
        </p>

        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '10px', padding: '16px 18px', marginBottom: '24px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}>
            <path d="M8 1l5.5 2.5v4.2C13.5 11 11 13.5 8 15 5 13.5 2.5 11 2.5 7.7V3.5L8 1z"
              stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M5.5 8l2 2 3-3" stroke="#f59e0b" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ color: '#fcd34d', fontSize: '13px', lineHeight: 1.6 }}>
            Only one administrator is permitted per faculty.
            A database constraint enforces this rule permanently.
          </p>
        </div>

        <p style={{ color: '#475569', fontSize: '13px' }}>
          Already have an account?{' '}
          <a href="/admin/login"
            style={{ color: '#fbbf24', fontWeight: 600, textDecoration: 'none' }}>
            Sign in here
          </a>
        </p>
      </div>

      {/* RIGHT — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '48px 56px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {step === 'form' ? (
            <>
              <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem',
                letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Create Admin Account
              </h1>
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '28px' }}>
                Complete all fields to register as a faculty administrator
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '8px', padding: '12px 16px', marginBottom: '24px',
                  display: 'flex', gap: '10px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'1px' }}>
                    <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z"
                      stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M8 6v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { name: 'full_name', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
                  { name: 'email', label: 'Email Address', placeholder: 'admin@example.com', type: 'email' },
                  { name: 'password', label: 'Password', placeholder: 'Minimum 8 characters', type: 'password' },
                  { name: 'confirm', label: 'Confirm Password', placeholder: 'Re-enter password', type: 'password' },
                ].map(field => (
                  <div key={field.name}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      display: 'block', marginBottom: '7px' }}>
                      {field.label}
                    </label>
                    <input type={field.type} name={field.name}
                      value={(form as any)[field.name]}
                      onChange={onChange} placeholder={field.placeholder}
                      className="inp" style={inp}
                      onFocus={e => { e.target.style.borderColor='rgba(245,158,11,0.5)'; e.target.style.background='rgba(245,158,11,0.05)'; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'block', marginBottom: '7px' }}>Faculty</label>
                  <select name="faculty" value={form.faculty} onChange={onChange}
                    className="inp" style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => { e.target.style.borderColor='rgba(245,158,11,0.5)'; e.target.style.background='rgba(245,158,11,0.05)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}>
                    <option value="">Select your faculty</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>{f.faculty_name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={loading} className="btn"
                  style={{
                    width: '100%', padding: '12px', marginTop: '4px',
                    borderRadius: '8px', border: 'none',
                    background: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                  }}>
                  {loading ? (
                    <>
                      <div style={{ width:'15px', height:'15px', borderRadius:'50%',
                        border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                        animation:'spin 0.7s linear infinite' }} />
                      Registering...
                    </>
                  ) : 'Create Admin Account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem',
                letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Verify Your Email
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                Enter the {OTP_LENGTH}-digit code sent to{' '}
                <strong style={{ color: '#f1f5f9' }}>{form.email}</strong>
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={e => onOtpChange(i, e.target.value)}
                    onKeyDown={e => onOtpKeyDown(i, e)}
                    style={{
                      width: '44px', height: '52px', textAlign: 'center',
                      fontSize: '20px', fontWeight: 700,
                      background: digit ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${digit ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>

              <button onClick={onVerifyOtp} disabled={loading} className="btn"
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                  background: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}>
                {loading ? (
                  <>
                    <div style={{ width:'15px', height:'15px', borderRadius:'50%',
                      border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                      animation:'spin 0.7s linear infinite' }} />
                    Verifying...
                  </>
                ) : 'Verify and Create Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
