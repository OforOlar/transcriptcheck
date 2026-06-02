'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Faculty, Department } from '@/app/types';

function validateMatricule(mat: string): { isValid: boolean; error: string | null } {
  const upper = mat.trim().toUpperCase();
  const pattern = /^CT(\d{2})[A-Z]\d{3}$/;
  if (!pattern.test(upper)) {
    return {
      isValid: false,
      error: 'Matricule must follow the format CT23A137 (CT + 2-digit year + one letter + 3 digits).',
    };
  }
  const year = parseInt(upper.slice(2, 4), 10);
  if (year > 23) {
    return {
      isValid: false,
      error: `CT${String(year).padStart(2, '0')} students are not eligible. Only CT23 and below (Level 400+) may register.`,
    };
  }
  return { isValid: true, error: null };
}

function OtpScreen({ email, onVerified, onBack }: {
  email: string; onVerified: () => void; onBack: () => void;
}) {
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
      const { error: verifyErr } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
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

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: BG,
      fontFamily: "'Segoe UI',system-ui,sans-serif", padding: '24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        {/* Mail icon */}
        <div style={{
          width: '60px', height: '60px', borderRadius: '12px', margin: '0 auto 24px',
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              fill="#60a5fa"/>
          </svg>
        </div>

        <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem', marginBottom: '10px' }}>
          Check Your Email
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '6px' }}>
          We sent an 8-digit verification code to
        </p>
        <p style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600,
          marginBottom: '32px', wordBreak: 'break-all' }}>
          {email}
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
          {otp.map((digit, i) => (
            <input key={i}
              ref={el => { inputs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={{
                width: '44px', height: '52px', textAlign: 'center',
                fontSize: '20px', fontWeight: 700,
                background: digit ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${digit ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px', color: '#f1f5f9', outline: 'none', transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.7)';
                e.target.style.background='rgba(59,130,246,0.1)'; }}
              onBlur={e => { e.target.style.borderColor = digit ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'; }}
            />
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            color: '#fca5a5', fontSize: '13px',
          }}>{error}</div>
        )}

        {resent && (
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            color: '#86efac', fontSize: '13px',
          }}>New code sent. Check your inbox.</div>
        )}

        <button onClick={handleVerify} disabled={loading || otp.join('').length < 8}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
            background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '14px',
            cursor: (loading || otp.join('').length < 8) ? 'not-allowed' : 'pointer',
            opacity: (loading || otp.join('').length < 8) ? 0.6 : 1,
            marginBottom: '16px', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          {loading ? (
            <>
              <div style={{ width:'14px', height:'14px', borderRadius:'50%',
                border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                animation:'spin 0.7s linear infinite' }} />
              Verifying...
            </>
          ) : 'Verify and Continue'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: '#475569',
            fontSize: '13px', cursor: 'pointer', padding: 0,
          }}>Back</button>
          <button onClick={handleResend} disabled={resending} style={{
            background: 'none', border: 'none', color: '#60a5fa',
            fontSize: '13px', cursor: 'pointer', padding: 0,
            opacity: resending ? 0.6 : 1,
          }}>{resending ? 'Sending...' : 'Resend code'}</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({
    full_name: '', email: '', matricule: '',
    faculty_id: '', department_id: '', password: '', confirm_password: '',
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

  useEffect(() => {
    if (!form.faculty_id) { setDepartments([]); return; }
    supabase.from('departments').select('*').eq('faculty_id', form.faculty_id).order('department_name')
      .then(({ data }) => {
        if (data) setDepartments(data.map(d => ({
          id: d.id, name: d.department_name, code: d.department_code, faculty_id: d.faculty_id,
        })));
      });
  }, [form.faculty_id]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value, ...(name === 'faculty_id' ? { department_id: '' } : {}) }));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (!form.faculty_id) return setError('Please select your faculty.');
    if (!form.department_id) return setError('Please select your department.');
    const mv = validateMatricule(form.matricule);
    if (!mv.isValid) return setError(mv.error);
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
      if (!auth.user) throw new Error('Registration failed. Please try again.');
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
      const { data: existing } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!existing) {
        const { error: profErr } = await supabase.from('profiles').insert({
          id: user.id, role: 'student',
          full_name: form.full_name.trim(),
          matricule: form.matricule.trim().toUpperCase(),
          faculty: form.faculty_id, department: form.department_id,
        });
        if (profErr) throw new Error('This matricule is already registered. Please log in instead.');
      }
      router.push('/student/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong after verification.');
      setStep('form');
    }
  }

  if (step === 'otp') {
    return (
      <OtpScreen email={form.email.trim().toLowerCase()}
        onVerified={onVerified} onBack={() => setStep('form')} />
    );
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
        .inp:focus { border-color:rgba(59,130,246,0.5)!important; background:rgba(59,130,246,0.06)!important; outline:none; }
        .btn:hover:not(:disabled) { background:#2563eb!important; }
        select option { background:#0d1530; color:#f1f5f9; }
        * { box-sizing:border-box; }
      `}</style>

      {/* LEFT — info panel */}
      <div style={{
        width: '40%', padding: '48px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px',
            background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '12px' }}>TC</span>
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px' }}>TranscriptCheck</span>
        </div>

        <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.6rem',
          letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '16px' }}>
          Create Your Student Account
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.75, marginBottom: '36px' }}>
          Register to access your academic transcript portal and verify
          your records before they are officially issued.
        </p>

        <div style={{
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)',
          borderRadius: '10px', padding: '16px 18px', marginBottom: '24px',
        }}>
          <p style={{ color: '#93c5fd', fontSize: '12px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Eligibility Requirements
          </p>
          {[
            'Matricule CT23 or below (Level 400+)',
            'Enrolled at University of Buea',
            'Valid university email address',
          ].map(req => (
            <div key={req} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#60a5fa" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>{req}</p>
            </div>
          ))}
        </div>

        <p style={{ color: '#475569', fontSize: '13px' }}>
          Already have an account?{' '}
          <a href="/student/login"
            style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
            Sign in here
          </a>
        </p>
      </div>

      {/* RIGHT — form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 56px' }}>
        <div style={{ maxWidth: '480px' }}>
          <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem',
            letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Registration Form
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', marginBottom: '28px' }}>
            All fields are required. Your details must match your official university records.
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
              { name: 'full_name', label: 'Full Name', placeholder: 'As on official documents', type: 'text' },
              { name: 'email', label: 'Email Address', placeholder: 'your.email@example.com', type: 'email' },
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
                  className="inp" autoComplete="off" style={inp}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                />
              </div>
            ))}

            <div>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                display: 'block', marginBottom: '7px' }}>
                Matriculation Number
              </label>
              <input type="text" name="matricule" value={form.matricule}
                onChange={onChange} placeholder="e.g. CT23A137"
                className="inp" autoComplete="off"
                style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.1em' }}
                onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  display: 'block', marginBottom: '7px' }}>Faculty</label>
                <select name="faculty_id" value={form.faculty_id} onChange={onChange}
                  className="inp" style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}>
                  <option value="">Select faculty</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  display: 'block', marginBottom: '7px' }}>Department</label>
                <select name="department_id" value={form.department_id} onChange={onChange}
                  disabled={!form.faculty_id} className="inp"
                  style={{ ...inp, cursor: !form.faculty_id ? 'not-allowed' : 'pointer',
                    opacity: !form.faculty_id ? 0.5 : 1 }}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}>
                  <option value="">{form.faculty_id ? 'Select dept.' : 'Select faculty first'}</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { name: 'password', label: 'Password', placeholder: 'Min. 8 characters' },
                { name: 'confirm_password', label: 'Confirm Password', placeholder: 'Re-enter password' },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'block', marginBottom: '7px' }}>
                    {field.label}
                  </label>
                  <input type="password" name={field.name}
                    value={(form as any)[field.name]}
                    onChange={onChange} placeholder={field.placeholder}
                    autoComplete="new-password" className="inp" style={inp}
                    onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                  />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="btn"
              style={{
                width: '100%', padding: '12px', marginTop: '4px',
                borderRadius: '8px', border: 'none',
                background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
              }}>
              {loading ? (
                <>
                  <div style={{ width:'15px', height:'15px', borderRadius:'50%',
                    border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                    animation:'spin 0.7s linear infinite' }} />
                  Creating Account...
                </>
              ) : 'Create Account and Verify Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
