'use client';
// Security: Only one admin can be registered per faculty.
// If a faculty already has an admin, registration is blocked.
// To change admin, contact the system administrator.

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
    full_name: '',
    email:     '',
    password:  '',
    confirm:   '',
    faculty:   '',
  });

  useEffect(() => {
    async function loadFaculties() {
      const supabase = createClient();
      const { data } = await supabase
        .from('faculties').select('id, faculty_name').order('faculty_name');
      setFaculties(data ?? []);
    }
    loadFaculties();
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

      // Security check: block if faculty already has an admin
      const { data: existingAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('faculty', form.faculty)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingAdmin) {
        throw new Error(
          'This faculty already has a registered administrator. ' +
          'Only one administrator is permitted per faculty. ' +
          'To change the administrator, please contact the system team.'
        );
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options:  { emailRedirectTo: undefined },
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
        email: form.email.trim().toLowerCase(),
        token: code,
        type:  'signup',
      });
      if (verifyErr || !data.user) throw new Error('Invalid or expired OTP. Please try again.');

      const { error: profErr } = await supabase.from('profiles').insert({
        id:        data.user.id,
        full_name: form.full_name.trim(),
        role:      'admin',
        faculty:   form.faculty,
        matricule: null,
      });

      if (profErr) {
        throw new Error('Profile creation failed: ' + profErr.message);
      }

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

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Segoe UI',system-ui,sans-serif",
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif", padding: '32px 16px',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .inp-f:focus { border-color:rgba(20,184,166,0.6)!important; background:rgba(20,184,166,0.06)!important; }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '460px',
        animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '24px', padding: '40px 36px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '11px',
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              boxShadow: '0 0 20px rgba(20,184,166,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>TC</span>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>
                TranscriptCheck</p>
              <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '3px' }}>Admin Registration</p>
            </div>
          </div>

          {step === 'form' ? (
            <>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem',
                marginBottom: '6px' }}>Create Admin Account</h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px',
                lineHeight: 1.6 }}>
                One administrator per faculty. If your faculty already has an
                administrator, contact the system team to make changes.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                  display: 'flex', gap: '10px',
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'full_name', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
                  { name: 'email',     label: 'Email Address', placeholder: 'admin@example.com', type: 'email' },
                  { name: 'password',  label: 'Password', placeholder: 'Minimum 8 characters', type: 'password' },
                  { name: 'confirm',   label: 'Confirm Password', placeholder: 'Re-enter password', type: 'password' },
                ].map(field => (
                  <div key={field.name}>
                    <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      display: 'block', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <input type={field.type} name={field.name}
                      value={(form as any)[field.name]}
                      onChange={onChange} placeholder={field.placeholder}
                      className="inp-f" style={inp}
                      onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}
                    />
                  </div>
                ))}

                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: '8px' }}>Faculty</label>
                  <select name="faculty" value={form.faculty} onChange={onChange}
                    className="inp-f"
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}>
                    <option value="" style={{ background: '#0a1810' }}>Select your faculty</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id} style={{ background: '#0a1810' }}>
                        {f.faculty_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', marginTop: '4px',
                  background: loading ? 'rgba(20,184,166,0.4)' : 'linear-gradient(135deg,#14b8a6,#10b981)',
                  color: 'white', fontWeight: 700, fontSize: '15px',
                  border: 'none', borderRadius: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
                  transition: 'all 0.25s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                  {loading ? (
                    <>
                      <div style={{ width:'16px', height:'16px', borderRadius:'50%',
                        border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                        animation:'spin 0.7s linear infinite' }} />
                      Registering...
                    </>
                  ) : 'Create Admin Account'}
                </button>
              </form>

              <div style={{ height: '1px', margin: '24px 0',
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />
              <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>
                Already have an account?{' '}
                <a href="/admin/login" style={{ color: '#14b8a6', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in here
                </a>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', marginBottom: '6px' }}>
                Verify Your Email</h2>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
                Enter the {OTP_LENGTH}-digit code sent to{' '}
                <strong style={{ color: 'white' }}>{form.email}</strong>
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
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
                      background: 'rgba(255,255,255,0.06)',
                      border: `2px solid ${digit ? 'rgba(20,184,166,0.6)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '10px', color: 'white', outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>

              <button onClick={onVerifyOtp} disabled={loading} style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(20,184,166,0.4)' : 'linear-gradient(135deg,#14b8a6,#10b981)',
                color: 'white', fontWeight: 700, fontSize: '15px',
                border: 'none', borderRadius: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}>
                {loading ? (
                  <>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%',
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