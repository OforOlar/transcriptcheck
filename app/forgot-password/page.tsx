'use client';
// Forgot Password page — sends a password reset link via email.
// Works for both students and admins since Supabase handles auth
// at the user level, not the role level.

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Please enter your email address.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (resetErr) throw new Error(resetErr.message);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif", padding: '32px 16px',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pop    { 0%{transform:scale(0.7);opacity:0} 80%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '420px',
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
              <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '3px' }}>
                Password Reset
              </p>
            </div>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', animation: 'pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
                boxShadow: '0 0 32px rgba(20,184,166,0.4)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="white"/>
                </svg>
              </div>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', marginBottom: '12px' }}>
                Check Your Email
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
                We sent a password reset link to{' '}
                <strong style={{ color: 'white' }}>{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>
                Did not receive the email? Check your spam folder or try again.
              </p>
              <button onClick={() => setSent(false)} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontWeight: 600, fontSize: '14px',
                padding: '11px 24px', borderRadius: '12px', cursor: 'pointer',
                width: '100%', transition: 'all 0.2s',
              }}>
                Try a Different Email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', marginBottom: '8px' }}>
                Forgot Your Password?
              </h2>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.7, marginBottom: '24px' }}>
                Enter the email address associated with your account.
                We will send you a secure link to reset your password.
              </p>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                }}>
                  <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder="your.email@example.com"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                    onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}
                  />
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px',
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
                      Sending Reset Link...
                    </>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ height: '1px', margin: '24px 0',
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <a href="/student/login" style={{ color: '#6b7280', fontSize: '13px',
                  textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#14b8a6'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                  Student Login
                </a>
                <span style={{ color: '#374151' }}>|</span>
                <a href="/admin/login" style={{ color: '#6b7280', fontSize: '13px',
                  textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#14b8a6'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                  Admin Login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}