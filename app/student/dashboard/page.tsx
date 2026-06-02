'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, Transcript, Flag } from '@/app/types';

// SVG icons
const IcoGrid = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
</svg>;
const IcoDoc = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;
const IcoFlag = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M3 14V2h9.5l-2.5 4 2.5 4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;
const IcoOut = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M6 14H2a1 1 0 01-1-1V3a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;
const IcoWarn = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
  <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;
const IcoMenu = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

const NAV = [
  { icon: IcoGrid, label: 'Dashboard',    href: '/student/dashboard', active: true  },
  { icon: IcoDoc,  label: 'My Transcript', href: '/student/transcript', active: false },
  { icon: IcoFlag, label: 'Flag an Error', href: '/student/flag',       active: false },
];

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
      const uid = session.user.id;
      const [{ data: prof }, { data: trans }, { data: flgs }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('transcripts').select('*').eq('student_id', uid)
          .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('flags').select('*').eq('student_id', uid)
          .order('created_at', { ascending: false }),
      ]);
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

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background: BG }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 14px',
          border:'2px solid rgba(59,130,246,0.15)', borderTop:'2px solid #3b82f6',
          animation:'spin 0.9s linear infinite' }} />
        <p style={{ color:'#334155', fontSize:'13px' }}>Loading dashboard...</p>
      </div>
    </div>
  );

  if (authError) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background: BG }}>
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(239,68,68,0.3)',
        borderRadius:'12px', padding:'28px', textAlign:'center', maxWidth:'360px' }}>
        <p style={{ color:'#fca5a5', fontSize:'14px', fontWeight:600, marginBottom:'8px' }}>
          Authentication Error</p>
        <p style={{ color:'#475569', fontSize:'13px', marginBottom:'20px' }}>
          Code: <strong style={{ color:'#f1f5f9' }}>{authError}</strong></p>
        <button onClick={() => router.push('/student/login')} style={{
          background:'#3b82f6', color:'white', fontWeight:600, fontSize:'13px',
          padding:'9px 20px', borderRadius:'8px', border:'none', cursor:'pointer',
        }}>Back to Login</button>
      </div>
    </div>
  );

  const pendingFlags  = flags.filter(f => f.status === 'pending').length;
  const resolvedFlags = flags.filter(f => f.status === 'resolved').length;

  const flagBadge: Record<string, { bg: string; text: string }> = {
    pending:      { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
    under_review: { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd' },
    resolved:     { bg: 'rgba(34,197,94,0.12)',   text: '#86efac' },
    rejected:     { bg: 'rgba(239,68,68,0.12)',   text: '#fca5a5' },
  };

  const tBadge: Record<string, { bg: string; text: string }> = {
    pending:   { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24' },
    flagged:   { bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5' },
    confirmed: { bg: 'rgba(34,197,94,0.12)',  text: '#86efac' },
  };

  const tStatus = transcript
    ? (tBadge[transcript.status] ?? { bg: 'rgba(100,116,139,0.12)', text: '#64748b' })
    : { bg: 'rgba(100,116,139,0.12)', text: '#64748b' };

  const SW = sidebarOpen ? 228 : 64;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .nv:hover { background:rgba(255,255,255,0.06)!important; }
        .card:hover { border-color:rgba(59,130,246,0.2)!important; }
        .tr:hover { background:rgba(255,255,255,0.03)!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: SW, minHeight:'100vh', flexShrink:0,
        background:'rgba(6,11,24,0.95)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderRight:'1px solid rgba(255,255,255,0.05)',
        display:'flex', flexDirection:'column',
        transition:'width 0.3s cubic-bezier(0.16,1,0.3,1)',
        position:'sticky', top:0, height:'100vh', overflow:'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? '18px 16px 14px' : '18px 14px 14px',
          display:'flex', alignItems:'center', gap:'10px',
          borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px', flexShrink:0,
            background:'#3b82f6',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:'11px' }}>TC</span>
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:'13px', lineHeight:1 }}>
                TranscriptCheck</p>
              <p style={{ color:'#3b82f6', fontSize:'10px', marginTop:'2px', fontWeight:600 }}>
                Student Portal</p>
            </div>
          )}
        </div>

        {/* Matricule badge */}
        {sidebarOpen && (
          <div style={{ padding:'10px 12px 4px' }}>
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)',
              borderRadius:'8px', padding:'8px 10px',
              display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%',
                background:'#3b82f6', flexShrink:0 }} />
              <div>
                <p style={{ color:'#60a5fa', fontSize:'9px', fontWeight:700,
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>STUDENT</p>
                <p style={{ color:'#475569', fontSize:'10px', marginTop:'1px', fontFamily:'monospace' }}>
                  {profile?.matricule}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 8px' }}>
          {sidebarOpen && (
            <p style={{ color:'#334155', fontSize:'9px', fontWeight:600,
              letterSpacing:'0.1em', textTransform:'uppercase',
              padding:'8px 8px 5px' }}>Menu</p>
          )}
          {NAV.map(item => (
            <a key={item.label} href={item.href} className="nv" style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding: sidebarOpen ? '9px 10px' : '11px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              borderRadius:'8px', textDecoration:'none', marginBottom:'2px',
              borderLeft:`2px solid ${item.active ? '#3b82f6' : 'transparent'}`,
              background: item.active ? 'rgba(59,130,246,0.1)' : 'transparent',
              transition:'all 0.15s', color: item.active ? '#93c5fd' : '#475569',
            }}>
              <span style={{ flexShrink:0 }}><item.icon /></span>
              {sidebarOpen && (
                <span style={{ fontSize:'13px', fontWeight: item.active ? 600 : 400 }}>
                  {item.label}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User bottom */}
        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px',
            padding:'8px 10px', borderRadius:'8px',
            background:'rgba(255,255,255,0.03)' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0,
              background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'11px', fontWeight:700, color:'#60a5fa' }}>
              {profile ? initials(profile.full_name) : '?'}
            </div>
            {sidebarOpen && (
              <>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'#f1f5f9', fontSize:'11px', fontWeight:600,
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {profile?.full_name}</p>
                  <p style={{ color:'#334155', fontSize:'10px' }}>Student</p>
                </div>
                <button onClick={signOut} title="Sign out" style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'#334155', padding:'3px', flexShrink:0, transition:'color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#334155'; }}>
                  <IcoOut />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* TOP BAR */}
        <header style={{
          height:'60px', flexShrink:0,
          background:'rgba(6,11,24,0.8)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 24px', position:'sticky', top:0, zIndex:50,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <button onClick={() => setSidebar(s => !s)} style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'7px', width:'32px', height:'32px',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', color:'#475569', transition:'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(59,130,246,0.3)'; e.currentTarget.style.color='#60a5fa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='#475569'; }}>
              <IcoMenu />
            </button>
            <div>
              <p style={{ color:'#f1f5f9', fontSize:'14px', fontWeight:600, lineHeight:1 }}>
                {getGreeting()}, {profile?.full_name?.split(' ')[1] ?? profile?.full_name}
              </p>
              <p style={{ color:'#334155', fontSize:'11px', marginTop:'2px' }}>
                {new Date().toLocaleDateString('en-GB', {
                  weekday:'long', day:'numeric', month:'long', year:'numeric',
                })}
              </p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{
              background: tStatus.bg, color: tStatus.text,
              fontSize:'10px', fontWeight:700, padding:'4px 10px',
              borderRadius:'6px', textTransform:'uppercase', letterSpacing:'0.05em',
            }}>
              {transcript ? transcript.status : 'No Transcript'}
            </span>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%',
              background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'11px', fontWeight:700, color:'#60a5fa' }}>
              {profile ? initials(profile.full_name) : '?'}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex:1, padding:'24px 28px', overflowY:'auto' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', animation:'fadeUp 0.5s ease forwards' }}>

            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
              gap:'14px', marginBottom:'20px' }}>
              {([
                { label:'Transcript', accent:'#60a5fa', delay:'0ms',
                  value: transcript ? transcript.status : 'Not Uploaded',
                  sub: transcript
                    ? `Uploaded ${new Date(transcript.created_at).toLocaleDateString('en-GB')}`
                    : 'Awaiting admin upload', small: true },
                { label:'Total Flags', accent:'#a78bfa', delay:'60ms',
                  value: String(flags.length), sub:`${resolvedFlags} resolved`, small: false },
                { label:'Pending Review', accent:'#fbbf24', delay:'120ms',
                  value: String(pendingFlags),
                  sub: pendingFlags > 0 ? 'Awaiting response' : 'All clear', small: false },
                { label:'Academic Year', accent:'#86efac', delay:'180ms',
                  value: '2025/2026', sub:'Level 400 · COT', small: true },
              ] as const).map(s => (
                <div key={s.label} className="card" style={{
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:'12px', padding:'18px 20px',
                  transition:'border-color 0.2s', animationDelay: s.delay,
                }}>
                  <p style={{ color:'#334155', fontSize:'10px', textTransform:'uppercase',
                    letterSpacing:'0.07em', marginBottom:'10px' }}>{s.label}</p>
                  <p style={{ color:'#f1f5f9', fontWeight:700, marginBottom:'4px',
                    fontSize: s.small ? '13px' : '26px', textTransform:'capitalize' }}>
                    {s.value}</p>
                  <p style={{ color:'#334155', fontSize:'11px' }}>{s.sub}</p>
                  <div style={{ height:'2px', borderRadius:'2px', marginTop:'12px',
                    background:`linear-gradient(90deg,${s.accent},transparent)`,
                    opacity: 0.4 }} />
                </div>
              ))}
            </div>

            {/* Transcript + Profile */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 280px',
              gap:'16px', marginBottom:'16px' }}>

              {/* Transcript card */}
              <div className="card" style={{
                background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'12px', padding:'22px', transition:'border-color 0.2s',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  marginBottom:'18px' }}>
                  <h2 style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px' }}>
                    My Transcript</h2>
                  {transcript && (
                    <span style={{ background: tStatus.bg, color: tStatus.text,
                      fontSize:'10px', fontWeight:700, padding:'3px 8px',
                      borderRadius:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {transcript.status}
                    </span>
                  )}
                </div>

                {transcript ? (
                  <div>
                    <div style={{ background:'rgba(59,130,246,0.06)',
                      border:'1px solid rgba(59,130,246,0.12)',
                      borderRadius:'10px', padding:'14px 16px', marginBottom:'16px',
                      display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'8px', flexShrink:0,
                        background:'rgba(59,130,246,0.12)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#60a5fa' }}>
                        <IcoDoc />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'13px',
                          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {transcript.file_name}</p>
                        <p style={{ color:'#334155', fontSize:'11px', marginTop:'2px' }}>
                          Uploaded {new Date(transcript.created_at).toLocaleDateString('en-GB', {
                            day:'numeric', month:'short', year:'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {Array.isArray(transcript.ai_anomalies) && transcript.ai_anomalies.length > 0 && (
                      <div style={{ background:'rgba(245,158,11,0.06)',
                        border:'1px solid rgba(245,158,11,0.15)',
                        borderRadius:'8px', padding:'10px 14px', marginBottom:'14px',
                        display:'flex', alignItems:'center', gap:'8px',
                        color:'#fbbf24' }}>
                        <IcoWarn />
                        <p style={{ fontSize:'12px' }}>
                          <strong>{transcript.ai_anomalies.length}</strong> anomaly(ies) detected by AI scan
                        </p>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:'10px' }}>
                      <a href="/student/transcript" style={{
                        flex:1, textAlign:'center',
                        background:'#3b82f6', color:'white', fontWeight:600, fontSize:'13px',
                        padding:'10px', borderRadius:'8px', textDecoration:'none',
                        transition:'all 0.2s', display:'block',
                      }}>View Transcript</a>
                      <a href="/student/flag" style={{
                        flex:1, textAlign:'center',
                        background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                        color:'#fca5a5', fontWeight:600, fontSize:'13px',
                        padding:'10px', borderRadius:'8px', textDecoration:'none',
                        transition:'all 0.2s', display:'block',
                      }}>Flag an Error</a>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'32px 16px',
                    border:'1px dashed rgba(255,255,255,0.06)', borderRadius:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                      color:'#334155' }}><IcoDoc /></div>
                    <p style={{ color:'#475569', fontWeight:500, fontSize:'13px', marginBottom:'5px' }}>
                      No transcript uploaded yet</p>
                    <p style={{ color:'#334155', fontSize:'12px' }}>
                      Your faculty administrator will upload your transcript.</p>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {/* Profile */}
                <div className="card" style={{
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:'12px', padding:'18px', transition:'border-color 0.2s',
                }}>
                  <p style={{ color:'#334155', fontSize:'10px', textTransform:'uppercase',
                    letterSpacing:'0.07em', marginBottom:'12px' }}>Student Profile</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
                      background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.2)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'13px', fontWeight:700, color:'#60a5fa' }}>
                      {profile ? initials(profile.full_name) : '?'}
                    </div>
                    <div>
                      <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'13px', lineHeight:1.3 }}>
                        {profile?.full_name}</p>
                      <p style={{ color:'#60a5fa', fontSize:'11px', marginTop:'2px',
                        fontFamily:'monospace' }}>
                        {profile?.matricule}</p>
                    </div>
                  </div>
                  {[
                    ['Dept.',   'Computer Engineering'],
                    ['Faculty', 'College of Technology'],
                    ['Level',   'Level 400'],
                    ['Year',    '2025/2026'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between',
                      padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color:'#334155', fontSize:'11px' }}>{k}</span>
                      <span style={{ color:'#94a3b8', fontSize:'11px', fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* How it works */}
                <div style={{ background:'rgba(59,130,246,0.05)',
                  border:'1px solid rgba(59,130,246,0.12)',
                  borderRadius:'12px', padding:'16px' }}>
                  <p style={{ color:'#60a5fa', fontWeight:600, fontSize:'12px', marginBottom:'10px' }}>
                    How it works</p>
                  <ol style={{ color:'#334155', fontSize:'11px', lineHeight:1.9,
                    paddingLeft:'14px', margin:0 }}>
                    <li>Admin uploads your transcript PDF</li>
                    <li>AI scanner checks for anomalies</li>
                    <li>You review and flag any errors</li>
                    <li>Admin corrects and re-uploads</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Flags table */}
            <div className="card" style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'12px', padding:'22px', transition:'border-color 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:'18px' }}>
                <div>
                  <h2 style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>
                    Error Flag History</h2>
                  <p style={{ color:'#334155', fontSize:'11px' }}>
                    All correction requests you have submitted</p>
                </div>
                <a href="/student/flag" style={{
                  background:'#3b82f6', color:'white', fontWeight:600, fontSize:'12px',
                  padding:'7px 14px', borderRadius:'8px', textDecoration:'none',
                }}>+ New Flag</a>
              </div>

              {flags.length === 0 ? (
                <div style={{ textAlign:'center', padding:'28px 16px',
                  border:'1px dashed rgba(255,255,255,0.05)', borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                    color:'#334155' }}><IcoFlag /></div>
                  <p style={{ color:'#475569', fontSize:'13px', fontWeight:500, marginBottom:'5px' }}>
                    No flags submitted yet</p>
                  <p style={{ color:'#334155', fontSize:'12px' }}>
                    Use "Flag an Error" if you find any discrepancies.</p>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['Error Type', 'Wrong Value', 'Correct Value', 'Status', 'Date', 'Admin Response'].map(h => (
                          <th key={h} style={{ textAlign:'left', padding:'8px 12px',
                            color:'#334155', fontSize:'10px', fontWeight:600,
                            textTransform:'uppercase', letterSpacing:'0.07em',
                            borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flags.map(flag => {
                        const b = flagBadge[flag.status] ?? { bg:'rgba(100,116,139,0.12)', text:'#64748b' };
                        return (
                          <tr key={flag.id} className="tr" style={{
                            borderBottom:'1px solid rgba(255,255,255,0.03)',
                            transition:'background 0.15s',
                          }}>
                            <td style={{ padding:'12px 12px', color:'#f1f5f9',
                              fontSize:'12px', fontWeight:500 }}>{flag.error_type}</td>
                            <td style={{ padding:'12px 12px' }}>
                              <span style={{ color:'#fca5a5', fontSize:'11px',
                                background:'rgba(239,68,68,0.08)',
                                padding:'2px 6px', borderRadius:'4px' }}>
                                {flag.wrong_value}</span>
                            </td>
                            <td style={{ padding:'12px 12px' }}>
                              <span style={{ color:'#86efac', fontSize:'11px',
                                background:'rgba(34,197,94,0.08)',
                                padding:'2px 6px', borderRadius:'4px' }}>
                                {flag.correct_value}</span>
                            </td>
                            <td style={{ padding:'12px 12px' }}>
                              <span style={{ background: b.bg, color: b.text,
                                fontSize:'10px', fontWeight:600,
                                padding:'3px 8px', borderRadius:'6px',
                                textTransform:'capitalize' }}>
                                {flag.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style={{ padding:'12px 12px', color:'#334155', fontSize:'11px' }}>
                              {new Date(flag.created_at).toLocaleDateString('en-GB', {
                                day:'numeric', month:'short', year:'numeric',
                              })}
                            </td>
                            <td style={{ padding:'12px 12px', color:'#475569', fontSize:'11px' }}>
                              {flag.admin_response ?? (
                                <span style={{ color:'#334155', fontStyle:'italic' }}>
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
        <footer style={{ padding:'12px 28px',
          borderTop:'1px solid rgba(255,255,255,0.04)',
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ color:'#1e3a5f', fontSize:'11px' }}>
            TranscriptCheck &middot; CEC418 Software Construction &middot; University of Buea &middot; 2025/2026</p>
          <p style={{ color:'#1e3a5f', fontSize:'11px' }}>
            {profile?.full_name} &middot; {profile?.matricule}</p>
        </footer>
      </div>
    </div>
  );
}
