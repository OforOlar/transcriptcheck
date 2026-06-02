'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim())    return setError('Email is required.');
    if (!password.trim()) return setError('Password is required.');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authErr) throw new Error('Invalid email or password. Please try again.');
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: BG,
      fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        .inp:focus { border-color:rgba(245,158,11,0.5)!important; background:rgba(245,158,11,0.05)!important; outline:none; }
        .btn-amber:hover:not(:disabled) { background:#d97706!important; transform:translateY(-1px); }
        .lnk:hover { color:#fcd34d!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* LEFT — branding panel */}
      <div style={{
        width: '44%', padding: '0 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ animation: 'slideIn 0.6s ease forwards' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              background: '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '15px' }}>TC</span>
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px', lineHeight: 1 }}>TranscriptCheck</p>
              <p style={{ color: '#475569', fontSize: '12px', marginTop: '3px' }}>University of Buea</p>
            </div>
          </div>

          <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '2rem',
            letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
            Admin Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.75, marginBottom: '40px' }}>
            Faculty administrator access for uploading transcripts,
            managing student records, and resolving error flags.
          </p>

          {/* Security notice */}
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px', padding: '16px 18px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'1px' }}>
              <path d="M8 1l5.5 2.5v4.2C13.5 11 11 13.5 8 15 5 13.5 2.5 11 2.5 7.7V3.5L8 1z"
                stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5.5 8l2 2 3-3" stroke="#f59e0b" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ color: '#fcd34d', fontSize: '13px', lineHeight: 1.6 }}>
              Access is restricted. Only one administrator is permitted per faculty.
              Role-based access control is enforced on every page.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '40px 64px' }}>

        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            No admin account?{' '}
            <a href="/admin/register" className="lnk"
              style={{ color: '#fbbf24', fontWeight: 600, textDecoration: 'none',
                transition: 'color 0.2s' }}>
              Register here
            </a>
          </p>
          <a href="/student/login" className="lnk"
            style={{ color: '#475569', fontSize: '13px', textDecoration: 'none',
              transition: 'color 0.2s' }}>
            Student Portal
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        <div style={{ maxWidth: '400px' }}>
          <h1 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.75rem',
            letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Administrator Sign In
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '32px' }}>
            Enter your admin credentials to access the management portal
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '24px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'1px' }}>
                <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z"
                  stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                display: 'block', marginBottom: '8px' }}>
                Email Address
              </label>
              <input type="email" value={email} autoComplete="new-password"
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="admin@example.com"
                className="inp"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f1f5f9', fontSize: '14px', transition: 'all 0.2s',
                }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600,
                  letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <a href="/forgot-password" className="lnk"
                  style={{ color: '#475569', fontSize: '12px', textDecoration: 'none',
                    transition: 'color 0.2s' }}>
                  Forgot password?
                </a>
              </div>
              <input type="password" value={password} autoComplete="new-password"
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="Your password"
                className="inp"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f1f5f9', fontSize: '14px', transition: 'all 0.2s',
                }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-amber"
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
                  Signing in...
                </>
              ) : 'Sign In to Admin Portal'}
            </button>
          </form>
        </div>

        <p style={{ color: '#1e3a5f', fontSize: '12px', marginTop: 'auto', paddingTop: '40px' }}>
          TranscriptCheck &middot; University of Buea &middot; 2025/2026
        </p>
      </div>
    </div>
  );
}
