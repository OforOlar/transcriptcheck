'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

export default function StudentLoginPage() {
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
      router.push('/student/dashboard');
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
        .inp:focus { border-color:rgba(59,130,246,0.5)!important; background:rgba(59,130,246,0.06)!important; outline:none; }
        .btn-primary:hover:not(:disabled) { background:#2563eb!important; transform:translateY(-1px); }
        .lnk:hover { color:#93c5fd!important; }
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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              background: '#3b82f6',
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
            Student Portal
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.75, marginBottom: '40px' }}>
            Sign in to view your academic transcript, verify its contents,
            and formally report any errors before it is issued.
          </p>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { text: 'View your uploaded transcript PDF' },
              { text: 'Report errors directly to your administrator' },
              { text: 'Track the status of your flag in real time' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#60a5fa" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '40px 64px' }}>

        {/* Top nav */}
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between' }}>
          <p style={{ color: '#475569', fontSize: '13px' }}>
            No account?{' '}
            <a href="/student/register" className="lnk"
              style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none',
                transition: 'color 0.2s' }}>
              Register here
            </a>
          </p>
          <a href="/admin/login" className="lnk"
            style={{ color: '#475569', fontSize: '13px', textDecoration: 'none',
              transition: 'color 0.2s' }}>
            Admin Portal
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
            Sign in
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '32px' }}>
            Enter your credentials to access your student dashboard
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
              <input type="password" value={password}
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

            <button type="submit" disabled={loading} className="btn-primary"
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
                  Signing in...
                </>
              ) : 'Sign In'}
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
