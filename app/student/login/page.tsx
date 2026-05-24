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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .link-h:hover { color:#5eead4!important; }
      `}</style>

      {/* Left panel */}
      <div style={{
        width: '45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px',
        background: 'rgba(20,184,166,0.04)',
        borderRight: '1px solid rgba(20,184,166,0.08)',
      }}>
        <div style={{ maxWidth: '340px', width: '100%' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', marginBottom: '24px',
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            boxShadow: '0 0 28px rgba(20,184,166,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '20px' }}>TC</span>
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: '2rem',
            letterSpacing: '-0.02em', marginBottom: '12px' }}>
            TranscriptCheck
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
            Log in to view and verify your academic transcript before it is officially issued.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'View your uploaded transcript PDF',
              'Flag any errors directly to your admin',
              'Track the status of your error reports',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                  background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#14b8a6" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '24px', padding: '40px 36px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem',
              marginBottom: '6px' }}>Student Login</h2>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '28px' }}>
              University of Buea
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
                { label: 'Email Address', value: email, setter: setEmail,
                  type: 'email', placeholder: 'your.email@example.com' },
                { label: 'Password', value: password, setter: setPassword,
                  type: 'password', placeholder: 'Your password' },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    display: 'block', marginBottom: '8px' }}>
                    {field.label}
                  </label>
                  <input type={field.type} value={field.value}
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

              {/* Forgot password link */}
              <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                <a href="/forgot-password" className="link-h"
                  style={{ color: '#6b7280', fontSize: '13px', textDecoration: 'none',
                    transition: 'color 0.2s' }}>
                  Forgot your password?
                </a>
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
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div style={{ height: '1px', margin: '24px 0',
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                No account?{' '}
                <a href="/student/register" className="link-h"
                  style={{ color: '#14b8a6', fontWeight: 600, textDecoration: 'none' }}>
                  Register here
                </a>
              </p>
              <p style={{ color: '#6b7280', fontSize: '13px' }}>
                Are you an admin?{' '}
                <a href="/admin/login" className="link-h"
                  style={{ color: '#14b8a6', fontWeight: 600, textDecoration: 'none' }}>
                  Admin Portal
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}