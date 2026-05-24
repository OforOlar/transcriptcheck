'use client';
// Reset Password page — handles the link clicked from the reset email.
// Supabase embeds a token in the URL which is automatically
// picked up and used to authenticate the password change.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [validSession, setValid]  = useState(false);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    // Supabase automatically processes the reset token from the URL
    // and establishes a session. We just check if the session exists.
    async function checkSession() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setValid(!!session);
      setChecking(false);
    }
    checkSession();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw new Error(updateErr.message);
      setSuccess(true);
      setTimeout(() => router.push('/student/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#071210,#0a1810)',
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: '3px solid rgba(20,184,166,0.15)', borderTop: '3px solid #14b8a6',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    );
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
              <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '3px' }}>Set New Password</p>
            </div>
          </div>

          {!validSession ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</p>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', marginBottom: '12px' }}>
                Invalid or Expired Link
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>
                This password reset link is no longer valid.
                Please request a new one.
              </p>
              <a href="/forgot-password" style={{
                display: 'block', padding: '13px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                borderRadius: '12px', textDecoration: 'none', textAlign: 'center',
              }}>Request New Reset Link</a>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', animation: 'pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
                boxShadow: '0 0 32px rgba(20,184,166,0.4)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.3rem', marginBottom: '12px' }}>
                Password Updated
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.7 }}>
                Your password has been successfully updated.
                Redirecting you to the login page in a moment...
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', marginBottom: '8px' }}>
                Set New Password
              </h2>
              <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.7, marginBottom: '24px' }}>
                Choose a strong password for your account.
                It must be at least 8 characters long.
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
                {[
                  { label: 'New Password',      value: password, setter: setPassword,
                    placeholder: 'Minimum 8 characters' },
                  { label: 'Confirm Password',  value: confirm,  setter: setConfirm,
                    placeholder: 'Re-enter your new password' },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      display: 'block', marginBottom: '8px' }}>
                      {field.label}
                    </label>
                    <input type="password" value={field.value}
                      onChange={e => { field.setter(e.target.value); setError(null); }}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                      onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}
                    />
                  </div>
                ))}

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
                      Updating Password...
                    </>
                  ) : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}