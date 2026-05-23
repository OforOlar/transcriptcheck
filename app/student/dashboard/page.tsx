'use client';

// ============================================================
// COURSE CONCEPTS APPLIED:
// • Unit 1, Sec 1.2  — Modular Design: NAV config, utility
//     functions, and data loading are separated from render.
// • Unit 1, Sec 1.5  — RBAC: role badge + student-only access.
// • Unit 1, Sec 1.6  — SCM Audit Trail: flags table shows
//     timestamped change history for every error report.
// • Unit 2, Sec 2.2.1 — Corrective Change: dashboard surfaces
//     the full corrective-change workflow (report→review→resolve).
// • Unit 3, Sec 3.4.1 — API Composition: Promise.all() fetches
//     profile, transcript, and flags in parallel.
// • Unit 3, Sec 3.3.1 — Information Hiding: all Supabase access
//     goes through a single createClient(); NAV config is
//     separated from JSX render logic.
// • Unit 3, Sec 3.4.5 — Error Handling: every auth failure
//     shows a specific error code, never a blank redirect.
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, Transcript, Flag } from '@/app/types';

// Unit 3 Sec 3.3.1 — Information Hiding: nav config separated from render
const NAV = [
  { icon: '⊞',  label: 'Dashboard',    href: '/student/dashboard', active: true  },
  { icon: '📄', label: 'My Transcript', href: '/student/transcript', active: false },
  { icon: '🚩', label: 'Flag an Error', href: '/student/flag',       active: false },
  { icon: '📋', label: 'My Flags',      href: '/student/flag',       active: false },
];

// Unit 1 Sec 1.2 — Modular Design: utility functions extracted
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function StudentDashboard() {
  const router = useRouter();
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [flags, setFlags]           = useState<Flag[]>([]);
  const [loading, setLoading]       = useState(true);
  const [authError, setAuthError]   = useState<string | null>(null);
  const [sidebarOpen, setSidebar]   = useState(true);

  // Unit 3 Sec 3.4.1 — API Composition: parallel data fetch
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      // Unit 3 Sec 3.4.5 — Fault Tolerance: retry session up to 5 times
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!session) { setAuthError('session_null'); setLoading(false); return; }

      const uid = session.user.id;

      // Unit 3 Sec 3.4.1 — API Composition: three APIs in parallel
      const [{ data: prof }, { data: trans }, { data: flgs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('transcripts').select('*').eq('student_id', uid)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('flags').select('*').eq('student_id', uid)
          .order('created_at', { ascending: false }),
      ]);

      // Unit 1 Sec 1.5 — RBAC: verify student role before loading any data
      if (!prof)                   { setAuthError('profile_null'); setLoading(false); return; }
      if (prof.role !== 'student') { setAuthError('wrong_role');   setLoading(false); return; }

      setProfile(prof);
      setTranscript(trans ?? null);
      setFlags(flgs ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg,#050c08,#0a1810,#0d2218)' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%',
          margin: '0 auto 16px',
          border: '3px solid rgba(20,184,166,0.15)', borderTop: '3px solid #14b8a6',
          animation: 'spin 0.9s linear infinite' }} />
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading your dashboard…</p>
      </div>
    </div>
  );

  // ── Auth Error — Unit 3 Sec 3.4.5 Error Handling ──────────
  if (authError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg,#050c08,#0a1810,#0d2218)' }}>
      <div style={{ background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '380px' }}>
        <p style={{ color: '#fca5a5', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Authentication Error</p>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
          Code: <strong style={{ color: 'white' }}>{authError}</strong></p>
        <button onClick={() => router.push('/student/login')} style={{
          background: 'linear-gradient(135deg,#14b8a6,#10b981)', color: 'white',
          fontWeight: 700, fontSize: '14px', padding: '10px 24px',
          borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
          Back to Login
        </button>
      </div>
    </div>
  );

  const pendingFlags  = flags.filter(f => f.status === 'pending').length;
  const resolvedFlags = flags.filter(f => f.status === 'resolved').length;

  // Unit 1 Sec 1.6 — SCM: flag status colours reflect audit trail states
  const flagBadge: Record<string, { bg: string; text: string }> = {
    pending:      { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
    under_review: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
    resolved:     { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
    rejected:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  };

  // Transcript status badge — updated to match actual DB values
  const tBadge: Record<string, { bg: string; text: string }> = {
    pending:   { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
    flagged:   { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
    confirmed: { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
  };

  const tStatus = transcript
    ? (tBadge[transcript.status] ?? { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' })
    : { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' };

  const SW = sidebarOpen ? 260 : 72;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'linear-gradient(145deg,#050c08 0%,#0a1810 40%,#0d2218 70%,#071009 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .dc  { animation:fadeUp 0.55s ease forwards; opacity:0; }
        .nv:hover { background:rgba(20,184,166,0.1)!important; }
        .ab:hover { opacity:0.88; transform:translateY(-1px)!important; }
        .fr:hover { background:rgba(255,255,255,0.05)!important; }
      `}</style>

      {/* ══ SIDEBAR — Unit 3 Sec 3.3.1 Information Hiding ══ */}
      <aside style={{
        width: SW, minHeight: '100vh', flexShrink: 0,
        background: 'rgba(5,10,7,0.85)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(20,184,166,0.1)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
        position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? '24px 20px 18px' : '24px 18px 18px',
          display: 'flex', alignItems: 'center', gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            boxShadow: '0 0 20px rgba(20,184,166,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>TC</span>
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>
                TranscriptCheck</p>
              <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '3px' }}>
                Student Portal</p>
            </div>
          )}
        </div>

        {/* Unit 1 Sec 1.5 — RBAC role badge */}
        {sidebarOpen && (
          <div style={{ padding: '14px 16px 6px' }}>
            <div style={{
              background: 'rgba(20,184,166,0.08)',
              border: '1px solid rgba(20,184,166,0.18)',
              borderRadius: '10px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%',
                background: '#14b8a6', boxShadow: '0 0 8px #14b8a6', flexShrink: 0 }} />
              <div>
                <p style={{ color: '#5eead4', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.08em' }}>STUDENT ACCOUNT</p>
                <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px',
                  fontFamily: 'monospace' }}>
                  {profile?.matricule}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav — Unit 1 Sec 1.2 Modular Design */}
        <nav style={{ flex: 1, padding: '10px' }}>
          {sidebarOpen && (
            <p style={{ color: '#374151', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '10px 10px 6px' }}>Menu</p>
          )}
          {NAV.map(item => (
            <a key={item.label} href={item.href} className="nv" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: sidebarOpen ? '10px 12px' : '12px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              borderRadius: '10px', textDecoration: 'none', marginBottom: '3px',
              borderLeft: `3px solid ${item.active ? '#14b8a6' : 'transparent'}`,
              background: item.active ? 'rgba(20,184,166,0.12)' : 'transparent',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <span style={{
                  color: item.active ? '#5eead4' : '#9ca3af',
                  fontSize: '14px', fontWeight: item.active ? 600 : 400,
                }}>
                  {item.label}
                </span>
              )}
              {item.active && sidebarOpen && (
                <div style={{ marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: '#14b8a6',
                  boxShadow: '0 0 6px #14b8a6' }} />
              )}
            </a>
          ))}
        </nav>

        {/* Bottom user card */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#14b8a6,#0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white',
            }}>
              {profile ? initials(profile.full_name) : '?'}
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '13px', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile?.full_name}</p>
                  <p style={{ color: '#6b7280', fontSize: '11px' }}>Student</p>
                </div>
                <button onClick={signOut} title="Sign out" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6b7280', fontSize: '18px', padding: '4px', flexShrink: 0,
                  transition: 'color 0.2s', lineHeight: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; }}>
                  ⏻
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── TOP BAR ── */}
        <header style={{
          height: '64px', flexShrink: 0,
          background: 'rgba(5,12,8,0.75)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(20,184,166,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setSidebar(s => !s)} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#9ca3af', fontSize: '15px', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)'; e.currentTarget.style.color = '#14b8a6'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9ca3af'; }}>
              ☰
            </button>
            <div>
              <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>
                {getGreeting()},{' '}
                {profile?.full_name?.split(' ')[1] ?? profile?.full_name} 👋
              </p>
              <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '3px' }}>
                {new Date().toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: tStatus.bg,
              border: `1px solid ${tStatus.text}35`,
              borderRadius: '20px', padding: '5px 14px',
              display: 'flex', alignItems: 'center', gap: '7px',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%',
                background: tStatus.text, flexShrink: 0 }} />
              <span style={{ color: tStatus.text, fontSize: '11px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {transcript ? transcript.status : 'No Transcript'}
              </span>
            </div>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#14b8a6,#0d9488)',
              boxShadow: '0 0 14px rgba(20,184,166,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white',
            }}>
              {profile ? initials(profile.full_name) : '?'}
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{
            position: 'fixed', top: '15%', right: '-80px',
            width: '380px', height: '380px', borderRadius: '50%',
            pointerEvents: 'none', zIndex: 0,
            background: 'radial-gradient(circle,rgba(20,184,166,0.06) 0%,transparent 70%)',
          }} />
          <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

            {/* ── STAT CARDS — Unit 3 Sec 3.4.1 API Composition ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: '16px', marginBottom: '24px' }}>
              {([
                { label: 'Transcript', icon: '📄', accent: '#14b8a6', delay: '0ms',
                  value: transcript ? transcript.status : 'Not Uploaded',
                  sub: transcript
                    ? `Uploaded ${new Date(transcript.created_at).toLocaleDateString('en-GB')}`
                    : 'Awaiting admin upload', small: true },
                { label: 'Total Flags', icon: '🚩', accent: '#60a5fa', delay: '80ms',
                  value: String(flags.length), sub: `${resolvedFlags} resolved`, small: false },
                { label: 'Pending Review', icon: '⏳', accent: '#fbbf24', delay: '160ms',
                  value: String(pendingFlags),
                  sub: pendingFlags > 0 ? 'Awaiting admin response' : 'All clear ✓', small: false },
                { label: 'Academic Year', icon: '🎓', accent: '#a78bfa', delay: '240ms',
                  value: '2025/2026', sub: 'Level 400 · COT', small: true },
              ] as const).map(s => (
                <div key={s.label} className="dc" style={{ animationDelay: s.delay,
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px', padding: '20px 22px',
                  transition: 'all 0.25s', cursor: 'default' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = s.accent + '40';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${s.accent}18`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase',
                      letterSpacing: '0.07em' }}>{s.label}</p>
                    <span style={{ fontSize: '18px', background: `${s.accent}18`,
                      borderRadius: '8px', padding: '4px 7px' }}>{s.icon}</span>
                  </div>
                  <p style={{ color: 'white', fontWeight: 700, marginBottom: '4px',
                    fontSize: s.small ? '14px' : '28px', textTransform: 'capitalize' }}>
                    {s.value}</p>
                  <p style={{ color: '#4b5563', fontSize: '11px' }}>{s.sub}</p>
                  <div style={{ height: '2px', borderRadius: '2px', marginTop: '14px',
                    background: `linear-gradient(90deg,${s.accent},transparent)`,
                    opacity: 0.5 }} />
                </div>
              ))}
            </div>

            {/* ── TRANSCRIPT + PROFILE ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px',
              gap: '18px', marginBottom: '18px' }}>

              {/* Transcript card */}
              <div className="dc" style={{ animationDelay: '100ms',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(20,184,166,0.12)',
                borderRadius: '20px', padding: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
                    My Transcript</h2>
                  {transcript && (
                    <span style={{ background: tStatus.bg, color: tStatus.text,
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                      borderRadius: '20px', textTransform: 'uppercase',
                      letterSpacing: '0.05em' }}>
                      {transcript.status}
                    </span>
                  )}
                </div>

                {transcript ? (
                  <div>
                    <div style={{ background: 'rgba(20,184,166,0.06)',
                      border: '1px solid rgba(20,184,166,0.15)',
                      borderRadius: '12px', padding: '16px 18px', marginBottom: '18px',
                      display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px',
                        background: 'rgba(20,184,166,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0 }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '14px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {transcript.file_name}</p>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>
                          Uploaded {new Date(transcript.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {Array.isArray(transcript.ai_anomalies) && transcript.ai_anomalies.length > 0 && (
                      <div style={{ background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
                        display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>⚠️</span>
                        <p style={{ color: '#fbbf24', fontSize: '13px' }}>
                          <strong>{transcript.ai_anomalies.length}</strong> anomaly(ies) detected by AI scan
                        </p>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <a href="/student/transcript" className="ab" style={{
                        flex: 1, textAlign: 'center',
                        background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                        color: 'white', fontWeight: 600, fontSize: '14px',
                        padding: '11px', borderRadius: '10px', textDecoration: 'none',
                        boxShadow: '0 4px 18px rgba(20,184,166,0.3)',
                        transition: 'all 0.2s', display: 'block' }}>
                        View Transcript →
                      </a>
                      <a href="/student/flag" className="ab" style={{
                        flex: 1, textAlign: 'center',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.22)',
                        color: '#f87171', fontWeight: 600, fontSize: '14px',
                        padding: '11px', borderRadius: '10px', textDecoration: 'none',
                        transition: 'all 0.2s', display: 'block' }}>
                        Flag an Error
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px 20px',
                    border: '2px dashed rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                    <p style={{ fontSize: '34px', marginBottom: '12px' }}>📭</p>
                    <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '15px',
                      marginBottom: '6px' }}>No transcript uploaded yet</p>
                    <p style={{ color: '#4b5563', fontSize: '13px' }}>
                      Your faculty administrator will upload your transcript.</p>
                  </div>
                )}
              </div>

              {/* Right panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Profile card */}
                <div className="dc" style={{ animationDelay: '150ms',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '22px' }}>
                  <p style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase',
                    letterSpacing: '0.07em', marginBottom: '14px' }}>Student Profile</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: '16px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#14b8a6,#0d9488)',
                      boxShadow: '0 0 16px rgba(20,184,166,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: 700, color: 'white' }}>
                      {profile ? initials(profile.full_name) : '?'}
                    </div>
                    <div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.3 }}>
                        {profile?.full_name}</p>
                      <p style={{ color: '#14b8a6', fontSize: '12px', marginTop: '3px',
                        fontFamily: 'monospace' }}>
                        {profile?.matricule}</p>
                    </div>
                  </div>
                  {[
                    ['Dept.',   'Computer Engineering'],
                    ['Faculty', 'College of Technology'],
                    ['Level',   'Level 400'],
                    ['Year',    '2025/2026'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#6b7280', fontSize: '12px' }}>{k}</span>
                      <span style={{ color: '#d1fae5', fontSize: '12px', fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* How it works */}
                <div className="dc" style={{ animationDelay: '200ms',
                  background: 'rgba(20,184,166,0.06)',
                  border: '1px solid rgba(20,184,166,0.14)',
                  borderRadius: '20px', padding: '18px' }}>
                  <p style={{ color: '#5eead4', fontWeight: 600, fontSize: '13px',
                    marginBottom: '10px' }}>💡 How it works</p>
                  <ol style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.9,
                    paddingLeft: '16px', margin: 0 }}>
                    <li>Admin uploads your transcript PDF</li>
                    <li>AI scanner checks for anomalies</li>
                    <li>You review and confirm or flag errors</li>
                    <li>Admin resolves and re-uploads corrections</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* ── FLAGS TABLE — Unit 1 Sec 1.6 SCM Audit Trail ── */}
            {/* Unit 2 Sec 2.2.1 — Corrective Change workflow */}
            <div className="dc" style={{ animationDelay: '220ms',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '26px' }}>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', marginBottom: '3px' }}>
                    Error Flag History</h2>
                  <p style={{ color: '#4b5563', fontSize: '12px' }}>
                    SCM audit trail of all correction requests · Unit 1, Sec 1.6</p>
                </div>
                <a href="/student/flag" style={{
                  background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                  color: 'white', fontWeight: 600, fontSize: '13px',
                  padding: '8px 16px', borderRadius: '8px', textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(20,184,166,0.3)' }}>
                  + New Flag
                </a>
              </div>

              {flags.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px',
                  border: '2px dashed rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>✅</p>
                  <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>
                    No flags submitted yet</p>
                  <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>
                    Use &quot;Flag an Error&quot; if you find any discrepancies.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Error Type', 'Wrong Value', 'Correct Value', 'Status', 'Date', 'Admin Response'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px',
                            color: '#4b5563', fontSize: '11px', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.07em',
                            borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map(flag => {
                        const b = flagBadge[flag.status] ?? { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' };
                        return (
                          <tr key={flag.id} className="fr" style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            transition: 'background 0.15s',
                          }}>
                            <td style={{ padding: '14px 16px', color: 'white',
                              fontSize: '13px', fontWeight: 500 }}>{flag.error_type}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ color: '#f87171', fontSize: '12px',
                                background: 'rgba(239,68,68,0.1)',
                                padding: '2px 8px', borderRadius: '4px' }}>
                                {flag.wrong_value}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ color: '#34d399', fontSize: '12px',
                                background: 'rgba(52,211,153,0.1)',
                                padding: '2px 8px', borderRadius: '4px' }}>
                                {flag.correct_value}</span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ background: b.bg, color: b.text,
                                fontSize: '11px', fontWeight: 600,
                                padding: '4px 10px', borderRadius: '20px',
                                textTransform: 'capitalize' }}>
                                {flag.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '12px' }}>
                              {new Date(flag.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: '12px' }}>
                              {flag.admin_response ?? (
                                <span style={{ color: '#374151', fontStyle: 'italic' }}>
                                  Awaiting response</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer style={{ padding: '14px 32px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: '#1f2937', fontSize: '11px' }}>
            TranscriptCheck · CEC418 Software Construction · University of Buea · 2025/2026</p>
          <p style={{ color: '#1f2937', fontSize: '11px' }}>
            {profile?.full_name} · {profile?.matricule}</p>
        </footer>
      </div>
    </div>
  );
}