'use client';
export const dynamic = 'force-dynamic';
// Unit 1 Sec 1.5  — RBAC: admin portal enforces role boundary at login
// Unit 3 Sec 3.4.5 — Error Handling: specific error messages per failure type
// Unit 3 Sec 3.4.4 — Defensive Programming: all inputs validated before auth call

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

    // Unit 3 Sec 3.4.4 — Defensive Programming: validate before any API call
    if (!email.trim())    return setError('Email is required.');
    if (!password.trim()) return setError('Password is required.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      // Unit 3 Sec 3.4.5 — Error Handling: specific message for auth failure
      if (authErr) throw new Error('Invalid email or password. Please try again.');

      // Redirect immediately — dashboard enforces role check (Unit 1 Sec 1.5 RBAC)
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  const inp =
    'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 ' +
    'bg-white/5 border border-white/10 text-white placeholder-gray-500 ' +
    'focus:border-teal-500/60 focus:bg-white/8 focus:ring-2 focus:ring-teal-500/20';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{opacity:.6} 50%{opacity:1} }
        .inp-wrap input::placeholder { color: #4b5563; }
        .signin-btn:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(20,184,166,0.5)!important; }
        .link-hover:hover { color:#5eead4!important; }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-150px', left: '-150px',
        width: '600px', height: '600px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)',
      }} />

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div style={{
        width: '45%', display: 'none', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', zIndex: 1,
      }} className="lg-panel">
        <style>{`.lg-panel { @media (min-width:1024px) { display:flex!important; } }`}</style>

        {/* Logo */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            boxShadow: '0 0 32px rgba(20,184,166,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '22px' }}>TC</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '2.2rem', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            TranscriptCheck
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>University of Buea</p>
        </div>

        {/* Info cards */}
        <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '🏛️', title: 'Faculty Administration', desc: 'Manage transcripts scoped to your faculty only' },
            { icon: '🤖', title: 'AI Anomaly Detection', desc: 'Transcripts are auto-scanned on every upload' },
            { icon: '📋', title: 'Flag Resolution', desc: 'Review and resolve student error reports with a full audit trail' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '16px',
              display: 'flex', alignItems: 'flex-start', gap: '12px',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>
                  {item.title}
                </p>
                <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* RBAC note */}
        <div style={{
          marginTop: '28px', padding: '12px 18px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '12px', maxWidth: '340px', width: '100%',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '16px' }}>🔐</span>
          {/* Unit 1 Sec 1.5 RBAC */}
          <p style={{ color: '#fbbf24', fontSize: '12px', lineHeight: 1.5 }}>
            <strong>Admin-only portal.</strong> Role-Based Access Control (RBAC) restricts access to verified administrators.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '24px', padding: '40px 36px',
            boxShadow: '0 0 80px rgba(20,184,166,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>

            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
              {/* Mobile logo */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', marginBottom: '20px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                boxShadow: '0 0 20px rgba(20,184,166,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '16px' }}>TC</span>
              </div>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.6rem', marginBottom: '6px', letterSpacing: '-0.01em' }}>
                Admin Sign In
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                University of Buea — Administrator Portal
              </p>
            </div>

            {/* Error — Unit 3 Sec 3.4.5 Error Handling */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
                <p style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="inp-wrap">
                <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  placeholder="admin@example.com"
                  className={inp}
                  autoComplete="off"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: '14px', outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                />
              </div>

              <div className="inp-wrap">
                <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  placeholder="Your password"
                  autoComplete="new-password"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: '14px', outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="signin-btn"
                style={{
                  width: '100%', padding: '14px',
                  background: loading
                    ? 'rgba(20,184,166,0.5)'
                    : 'linear-gradient(135deg,#14b8a6,#10b981)',
                  color: 'white', fontWeight: 700, fontSize: '15px',
                  border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 24px rgba(20,184,166,0.35)',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  marginTop: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Admin Portal →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{
              height: '1px', margin: '24px 0',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
            }} />

            {/* Footer links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                No admin account?{' '}
                <a href="/admin/register" className="link-hover" style={{ color: '#14b8a6', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>
                  Register here
                </a>
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                Are you a student?{' '}
                <a href="/student/login" className="link-hover" style={{ color: '#14b8a6', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}>
                  Student Portal
                </a>
              </p>
            </div>
          </div>

          {/* Below card */}
          <p style={{ color: '#374151', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
            TranscriptCheck · CEC418 Software Construction · University of Buea 2025/2026
          </p>
        </div>
      </div>
    </div>
  );
}