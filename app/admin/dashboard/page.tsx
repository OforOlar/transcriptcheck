'use client';
export const dynamic = 'force-dynamic';
// ══════════════════════════════════════════════════════════════
// TranscriptCheck — Admin Dashboard
// Unit 1 Sec 1.2  — Modular Design: dashboard is one self-contained module
// Unit 1 Sec 1.5  — RBAC: only admins reach this page; role enforced at load
// Unit 1 Sec 1.6  — SCM: flags form a complete audit trail with timestamps
// Unit 2 Sec 2.2.1 — Corrective Change: flag review is structured correction
// Unit 3 Sec 3.3.1 — Information Hiding: nav config separated from render
// Unit 3 Sec 3.4.1 — API Design: parallel data fetch via Promise.all
// Unit 3 Sec 3.4.5 — Error Handling: every failure state shown explicitly
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, Transcript, Flag } from '@/app/types';

// Unit 3 Sec 3.3.1 — Information Hiding: nav config hidden from JSX
const NAV = [
  { id: 'dashboard', label: 'Dashboard',        icon: '⊞' },
  { id: 'upload',    label: 'Upload Transcript', icon: '⬆' },
  { id: 'flags',     label: 'Manage Flags',      icon: '🚩' },
  { id: 'students',  label: 'Students',          icon: '👥' },
];

// Unit 1 Sec 1.6 — SCM: flag badge colours reflect audit trail states
const FLAG_BADGE: Record<string, { bg: string; text: string }> = {
  pending:      { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  under_review: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  resolved:     { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
  rejected:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [facultyName, setFacultyName] = useState('');
  const [students, setStudents]       = useState<Profile[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [flags, setFlags]             = useState<Flag[]>([]);
  const [loading, setLoading]         = useState(true);
  const [authError, setAuthError]     = useState<string | null>(null);
  const [active, setActive]           = useState('dashboard');
  const [search, setSearch]           = useState('');

  // Unit 3 Sec 3.4.1 — API Composition: four APIs in parallel
  // Unit 3 Sec 3.4.5 — Fault Tolerance: session retry loop
  useEffect(() => {
    async function load() {
      const supabase = createClient();

      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!session) { setAuthError('session_null'); setLoading(false); return; }

      // Unit 1 Sec 1.5 — RBAC: verify admin role before any data access
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!prof)               { setAuthError('profile_null'); setLoading(false); return; }
      if (prof.role !== 'admin') { setAuthError('wrong_role'); setLoading(false); return; }
      setProfile(prof);

      // Unit 3 Sec 3.4.1 — API Composition: four APIs fetched in parallel
      const [{ data: fac }, { data: studs }, { data: trans }, { data: flgs }] =
        await Promise.all([
          supabase.from('faculties').select('faculty_name').eq('id', prof.faculty).maybeSingle(),
          supabase.from('profiles').select('*')
            .eq('faculty', prof.faculty).eq('role', 'student').order('full_name'),
          // FIX: use created_at — transcripts table has no uploaded_at column
          supabase.from('transcripts').select('*').order('created_at', { ascending: false }),
          supabase.from('flags').select('*').order('created_at', { ascending: false }),
        ]);

      setFacultyName(fac?.faculty_name ?? 'Unknown Faculty');
      setStudents(studs ?? []);
      setTranscripts(trans ?? []);
      setFlags(flgs ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push('/');
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#0a1810,#0d2218,#071009)',
      }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 20px',
            border: '3px solid rgba(20,184,166,0.15)', borderTop: '3px solid #14b8a6',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: '#14b8a6', fontSize: '14px', fontWeight: 600, animation: 'pulse 2s infinite' }}>
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Auth Error — Unit 3 Sec 3.4.5 Error Handling ────────────
  if (authError) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#0a1810,#0d2218,#071009)',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px',
          padding: '40px', textAlign: 'center', maxWidth: '380px',
        }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</p>
          <p style={{ color: '#fca5a5', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Authentication Error
          </p>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '24px' }}>
            Code: <strong style={{ color: 'white' }}>{authError}</strong>
          </p>
          <button onClick={() => router.push('/admin/login')} style={{
            background: 'linear-gradient(135deg,#14b8a6,#10b981)', color: 'white',
            fontWeight: 700, padding: '10px 24px', borderRadius: '10px',
            border: 'none', cursor: 'pointer',
          }}>Back to Login</button>
        </div>
      </div>
    );
  }

  const pendingFlags     = flags.filter(f => f.status === 'pending').length;
  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .nav-item:hover   { background:rgba(20,184,166,0.12)!important; color:#5eead4!important; }
        .card-hover:hover { border-color:rgba(20,184,166,0.35)!important; transform:translateY(-2px); }
        .btn-primary:hover{ transform:translateY(-2px); box-shadow:0 12px 36px rgba(20,184,166,0.55)!important; }
        .btn-amber:hover  { transform:translateY(-2px); box-shadow:0 8px 24px rgba(245,158,11,0.4)!important; }
        .tr-hover:hover   { background:rgba(20,184,166,0.05)!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── SIDEBAR — Unit 3 Sec 3.3.1 Information Hiding ── */}
      <aside style={{
        width: '240px', flexShrink: 0, position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 200,
        background: 'rgba(5,12,8,0.97)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(20,184,166,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              boxShadow: '0 0 20px rgba(20,184,166,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>TC</span>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>
                TranscriptCheck</p>
              <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '3px' }}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Admin card */}
        <div style={{
          margin: '16px 12px',
          background: 'rgba(20,184,166,0.08)',
          border: '1px solid rgba(20,184,166,0.15)',
          borderRadius: '14px', padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 700, color: 'white',
            }}>
              {profile?.full_name?.charAt(0) ?? 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '13px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name}</p>
              <p style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>Administrator</p>
            </div>
          </div>
          <div style={{
            marginTop: '10px', padding: '6px 10px',
            background: 'rgba(20,184,166,0.1)', borderRadius: '8px',
            border: '1px solid rgba(20,184,166,0.2)',
          }}>
            <p style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '2px' }}>Faculty</p>
            <p style={{ color: '#5eead4', fontSize: '11px', fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {facultyName}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          <p style={{ color: '#374151', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '0 8px', marginBottom: '8px' }}>Management</p>
          {NAV.map(item => (
            <button key={item.id} className="nav-item"
              onClick={() => {
                setActive(item.id);
                if (item.id === 'upload') router.push('/admin/upload');
                if (item.id === 'flags')  router.push('/admin/flags');
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: active === item.id ? 'rgba(20,184,166,0.15)' : 'transparent',
                color: active === item.id ? '#5eead4' : '#6b7280',
                fontWeight: active === item.id ? 600 : 400,
                fontSize: '14px', textAlign: 'left',
                borderLeft: active === item.id ? '2px solid #14b8a6' : '2px solid transparent',
                transition: 'all 0.2s', marginBottom: '2px',
              }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
              {item.id === 'flags' && pendingFlags > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#ef4444', color: 'white',
                  fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                  borderRadius: '10px', minWidth: '20px', textAlign: 'center',
                }}>{pendingFlags}</span>
              )}
              {item.id === 'students' && (
                <span style={{
                  marginLeft: 'auto', background: 'rgba(20,184,166,0.2)', color: '#14b8a6',
                  fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                }}>{students.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#374151', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '0 8px', marginBottom: '8px' }}>2025/2026 Academic Year</p>
          <button onClick={handleSignOut} className="nav-item" style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#6b7280', fontSize: '14px',
            transition: 'all 0.2s', textAlign: 'left',
          }}>
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>↩</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* ── TOP NAVBAR ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(5,12,8,0.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(20,184,166,0.08)',
          padding: '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '18px', lineHeight: 1 }}>
              Welcome back,{' '}
              <span style={{
                background: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {profile?.full_name?.split(' ')[0]}
              </span>{' '}👋
            </p>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px' }}>
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pendingFlags > 0 && (
              <button onClick={() => router.push('/admin/flags')} style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '10px', padding: '6px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ fontSize: '14px' }}>🚩</span>
                <span style={{ color: '#fca5a5', fontSize: '12px', fontWeight: 600 }}>
                  {pendingFlags} pending
                </span>
              </button>
            )}
            <button onClick={() => router.push('/admin/upload')} className="btn-primary" style={{
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              color: 'white', fontWeight: 600, fontSize: '13px',
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 16px rgba(20,184,166,0.35)',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <span>⬆</span> Upload Transcript
            </button>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: 'white', fontSize: '14px',
              boxShadow: '0 0 14px rgba(245,158,11,0.4)',
            }}>
              {profile?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: '32px', animation: 'fadeIn 0.5s ease forwards' }}>

          {/* Stats — Unit 1 Sec 1.4 Constructing for Verification */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' }}>
            {[
              { icon: '👥', label: 'Students',      value: students.length,
                sub: `In ${facultyName.split(' ').slice(-2).join(' ')}`,
                accent: '#14b8a6', glow: 'rgba(20,184,166,0.15)' },
              { icon: '📄', label: 'Transcripts',   value: transcripts.length,
                sub: 'Total uploaded',
                accent: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
              { icon: '🚩', label: 'Pending Flags', value: pendingFlags,
                sub: pendingFlags > 0 ? 'Require attention' : 'All reviewed',
                accent: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
              { icon: '✅', label: 'Resolved',      value: flags.filter(f => f.status === 'resolved').length,
                sub: 'Successfully corrected',
                accent: '#10b981', glow: 'rgba(16,185,129,0.15)' },
            ].map((stat, i) => (
              <div key={i} className="card-hover" style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '18px', padding: '22px',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px', background: stat.glow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', marginBottom: '14px',
                }}>{stat.icon}</div>
                <p style={{ color: stat.accent, fontSize: '32px', fontWeight: 800, lineHeight: 1, marginBottom: '6px' }}>
                  {stat.value}</p>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{stat.label}</p>
                <p style={{ color: '#6b7280', fontSize: '11px' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Two-column: Pending flags + Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>

            {/* Pending Flags — Unit 2 Sec 2.2.1 Corrective Change */}
            <div className="card-hover" style={{
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px', padding: '24px',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', marginBottom: '3px' }}>
                    Pending Flags</h2>
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>
                    Corrective change requests awaiting review</p>
                </div>
                {pendingFlags > 0 && (
                  <button onClick={() => router.push('/admin/flags')} className="btn-amber" style={{
                    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                    color: 'white', fontWeight: 600, fontSize: '13px',
                    padding: '8px 16px', borderRadius: '10px', border: 'none',
                    cursor: 'pointer', transition: 'all 0.25s',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
                  }}>Review All →</button>
                )}
              </div>

              {pendingFlags === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px',
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px dashed rgba(16,185,129,0.2)', borderRadius: '14px' }}>
                  <p style={{ fontSize: '36px', marginBottom: '10px' }}>✅</p>
                  <p style={{ color: '#10b981', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>All Caught Up!</p>
                  <p style={{ color: '#6b7280', fontSize: '12px' }}>No pending flags require attention.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {flags.filter(f => f.status === 'pending').slice(0, 4).map(flag => (
                    <div key={flag.id} style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                          {flag.error_type}</p>
                        <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '2px' }}>
                          Wrong:{' '}
                          <span style={{ color: '#fca5a5', fontWeight: 600,
                            background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            {flag.wrong_value}</span>
                          <span style={{ color: '#4b5563', margin: '0 6px' }}>→</span>
                          Correct:{' '}
                          <span style={{ color: '#6ee7b7', fontWeight: 600,
                            background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                            {flag.correct_value}</span>
                        </p>
                        {/* Unit 1 Sec 1.6 — SCM: timestamp on every audit event */}
                        <p style={{ color: '#4b5563', fontSize: '11px' }}>
                          🕐 {new Date(flag.created_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {/* FIX: pure inline style — no mixed Tailwind classes */}
                      <span style={{
                        background: FLAG_BADGE.pending.bg, color: FLAG_BADGE.pending.text,
                        fontSize: '11px', fontWeight: 700, padding: '4px 10px',
                        borderRadius: '20px', flexShrink: 0, textTransform: 'capitalize',
                      }}>pending</span>
                    </div>
                  ))}
                  {pendingFlags > 4 && (
                    <button onClick={() => router.push('/admin/flags')} style={{
                      background: 'none', border: '1px dashed rgba(245,158,11,0.3)',
                      color: '#f59e0b', fontSize: '13px', fontWeight: 600,
                      padding: '10px', borderRadius: '12px', cursor: 'pointer',
                    }}>+ {pendingFlags - 4} more pending flags</button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="card-hover" style={{
                background: 'rgba(20,184,166,0.06)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(20,184,166,0.15)', borderRadius: '18px', padding: '20px',
                cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }} onClick={() => router.push('/admin/upload')}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>⬆️</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Upload Transcript</p>
                <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>
                  Upload a student PDF with AI anomaly scanning</p>
                <p style={{ color: '#14b8a6', fontSize: '12px', fontWeight: 600, marginTop: '10px' }}>Click to upload →</p>
              </div>

              <div className="card-hover" style={{
                background: 'rgba(245,158,11,0.06)', backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(245,158,11,0.15)', borderRadius: '18px', padding: '20px',
                cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }} onClick={() => router.push('/admin/flags')}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🚩</div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Manage Flags</p>
                <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>
                  Review, resolve or reject student error reports</p>
                <p style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, marginTop: '10px' }}>
                  {pendingFlags > 0 ? `${pendingFlags} awaiting action →` : 'No pending flags →'}
                </p>
              </div>

              {/* Coverage bars */}
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '18px', padding: '18px',
              }}>
                <p style={{ color: '#6b7280', fontSize: '11px', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: '12px' }}>Coverage</p>
                {[
                  { label: 'Transcripts uploaded',
                    value: students.length === 0 ? 0 : Math.round((transcripts.length / students.length) * 100),
                    color: '#14b8a6' },
                  { label: 'Flags resolved',
                    value: flags.length === 0 ? 100 : Math.round((flags.filter(f => f.status === 'resolved').length / flags.length) * 100),
                    color: '#10b981' },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>{bar.label}</span>
                      <span style={{ color: 'white', fontSize: '11px', fontWeight: 600 }}>{bar.value}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${bar.value}%`,
                        background: `linear-gradient(90deg,${bar.color},${bar.color}aa)`,
                        borderRadius: '3px', transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students table — Unit 1 Sec 1.5 RBAC faculty-scoped */}
          <div className="card-hover" style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px', padding: '24px',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', marginBottom: '3px' }}>
                  Registered Students</h2>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>
                  {facultyName} · {students.length} student{students.length !== 1 ? 's' : ''}
                </p>
              </div>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or matricule..."
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', padding: '8px 14px', color: 'white', fontSize: '13px',
                  outline: 'none', width: '240px',
                }} />
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px',
                background: 'rgba(255,255,255,0.02)', borderRadius: '14px',
                border: '1px dashed rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>👥</p>
                <p style={{ color: '#9ca3af', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                  {search ? 'No students match your search' : 'No Students Registered Yet'}</p>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>
                  {search ? 'Try a different name or matricule.'
                    : 'Students from your faculty will appear here once they register.'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['#', 'Student Name', 'Matricule', 'Transcript', 'Registered'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px',
                          color: '#6b7280', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                          {h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => {
                      const hasTrans     = transcripts.some(t => t.student_id === s.id);
                      const studentFlags = flags.filter(f => f.student_id === s.id);
                      return (
                        <tr key={s.id} className="tr-hover" style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'background 0.15s',
                        }}>
                          <td style={{ padding: '12px 14px', color: '#4b5563', fontSize: '13px' }}>
                            {i + 1}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '12px',
                              }}>{s.full_name?.charAt(0)}</div>
                              <div>
                                <p style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>
                                  {s.full_name}</p>
                                {studentFlags.length > 0 && (
                                  <p style={{ color: '#f59e0b', fontSize: '11px' }}>
                                    {studentFlags.length} flag{studentFlags.length > 1 ? 's' : ''}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ color: '#14b8a6', fontFamily: 'monospace',
                              fontSize: '13px', fontWeight: 600 }}>{s.matricule}</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '8px',
                              fontSize: '12px', fontWeight: 600,
                              background: hasTrans ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                              color: hasTrans ? '#6ee7b7' : '#9ca3af',
                              border: `1px solid ${hasTrans ? 'rgba(16,185,129,0.25)' : 'rgba(107,114,128,0.2)'}`,
                            }}>{hasTrans ? '✓ Uploaded' : '○ Missing'}</span>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '12px' }}>
                            {new Date(s.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}