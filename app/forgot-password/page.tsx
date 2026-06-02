'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Please enter your email address.');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetErr) throw new Error(resetErr.message);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  return (
    <div style={{ minHeight: '100vh', background: BG,
      fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .inp:focus { border-color:rgba(59,130,246,0.5)!important; background:rgba(59,130,246,0.06)!important; outline:none; }
        .btn:hover:not(:disabled) { background:#2563eb!important; }
        .lnk:hover { color:#93c5fd!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/student/login" className="lnk"
            style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}>
            Student Login
          </a>
          <a href="/admin/login" className="lnk"
            style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}>
            Admin Login
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: '440px', margin: '80px auto', padding: '0 24px',
        animation: 'fadeIn 0.5s ease forwards',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 24px',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  fill="#22c55e"/>
              </svg>
            </div>
            <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.5rem',
              marginBottom: '12px' }}>Check Your Email</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '8px' }}>
              We sent a password reset link to
            </p>
            <p style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px', marginBottom: '32px' }}>
              {email}
            </p>
            <p style={{ color: '#475569', fontSize: '13px', marginBottom: '28px' }}>
              Click the link in the email to set a new password. Check your spam folder if you do not see it.
            </p>
            <button onClick={() => setSent(false)} style={{
              padding: '10px 24px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}>
              Try a Different Email
            </button>
          </div>
        ) : (
          <>
            <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.75rem',
              letterSpacing: '-0.02em', marginBottom: '12px' }}>
              Reset Your Password
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '36px' }}>
              Enter the email address linked to your account.
              We will send you a secure link to set a new password.
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
              <div>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  display: 'block', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="your.email@example.com"
                  className="inp"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f1f5f9', fontSize: '14px', transition: 'all 0.2s',
                  }}
                />
              </div>

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
                    Sending...
                  </>
                ) : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
