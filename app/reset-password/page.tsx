'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]  = useState('');
  const [confirm, setConfirm]    = useState('');
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState<string | null>(null);
  const [success, setSuccess]    = useState(false);
  const [validSession, setValid] = useState(false);
  const [checking, setChecking]  = useState(true);

  useEffect(() => {
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
    if (password !== confirm)  return setError('Passwords do not match.');
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

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  if (checking) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:'40px', height:'40px', borderRadius:'50%',
          border:'2px solid rgba(59,130,246,0.2)', borderTop:'2px solid #3b82f6',
          animation:'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .inp:focus { border-color:rgba(59,130,246,0.5)!important; background:rgba(59,130,246,0.06)!important; outline:none; }
        .btn:hover:not(:disabled) { background:#2563eb!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '11px' }}>TC</span>
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px' }}>TranscriptCheck</span>
        </div>
      </nav>

      <div style={{
        maxWidth: '440px', margin: '80px auto', padding: '0 24px',
        animation: 'fadeIn 0.5s ease forwards',
      }}>
        {!validSession ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 24px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z"
                  stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem', marginBottom: '12px' }}>
              Invalid or Expired Link
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
              This reset link is no longer valid. Please request a new one.
            </p>
            <a href="/forgot-password" style={{
              display: 'inline-block', padding: '11px 28px', borderRadius: '8px',
              background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '14px',
              textDecoration: 'none',
            }}>Request New Reset Link</a>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 24px',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="#22c55e" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="#22c55e" strokeWidth="2"/>
              </svg>
            </div>
            <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem', marginBottom: '12px' }}>
              Password Updated
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7 }}>
              Your password has been successfully updated. Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.75rem',
              letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Set New Password
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '36px' }}>
              Choose a strong password for your account. Minimum 8 characters.
            </p>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', padding: '12px 16px', marginBottom: '24px',
              }}>
                <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'New Password', value: password, setter: setPassword,
                  placeholder: 'Minimum 8 characters' },
                { label: 'Confirm Password', value: confirm, setter: setConfirm,
                  placeholder: 'Re-enter your new password' },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'block', marginBottom: '8px' }}>
                    {field.label}
                  </label>
                  <input type="password" value={field.value}
                    onChange={e => { field.setter(e.target.value); setError(null); }}
                    placeholder={field.placeholder}
                    className="inp"
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f1f5f9', fontSize: '14px', transition: 'all 0.2s',
                    }}
                  />
                </div>
              ))}

              <button type="submit" disabled={loading} className="btn"
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
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
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
