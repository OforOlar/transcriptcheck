'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, Transcript, Flag } from '@/app/types';

// SVG icon components — no emojis
const IcoGrid = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
</svg>;

const IcoUpload = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoFlag = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M3 14V2h9.5l-2.5 4 2.5 4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoUsers = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M11 2a2 2 0 010 4M14 13a3 3 0 00-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
</svg>;

const IcoOut = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M6 14H2a1 1 0 01-1-1V3a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoDoc = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

const IcoCheck = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoWarn = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
  <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

const IcoClock = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const NAV = [
  { id: 'dashboard', label: 'Dashboard',        Icon: IcoGrid   },
  { id: 'upload',    label: 'Upload Transcript', Icon: IcoUpload },
  { id: 'flags',     label: 'Manage Flags',      Icon: IcoFlag   },
  { id: 'students',  label: 'Students',          Icon: IcoUsers  },
];

const FLAG_BADGE: Record<string, { bg: string; text: string }> = {
  pending:      { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  under_review: { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd' },
  resolved:     { bg: 'rgba(34,197,94,0.15)',   text: '#86efac' },
  rejected:     { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5' },
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
      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (!prof)               { setAuthError('profile_null'); setLoading(false); return; }
      if (prof.role !== 'admin') { setAuthError('wrong_role'); setLoading(false); return; }
      setProfile(prof);
      const [{ data: fac }, { data: studs }, { data: trans }, { data: flgs }] =
        await Promise.all([
          supabase.from('faculties').select('faculty_name').eq('id', prof.faculty).maybeSingle(),
          supabase.from('profiles').select('*').eq('faculty', prof.faculty).eq('role', 'student').order('full_name'),
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

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'50%', margin:'0 auto 16px',
            border:'2px solid rgba(59,130,246,0.15)', borderTop:'2px solid #3b82f6',
            animation:'spin 0.9s linear infinite' }} />
          <p style={{ color:'#475569', fontSize:'13px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG }}>
        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(239,68,68,0.3)',
          borderRadius:'12px', padding:'32px', textAlign:'center', maxWidth:'360px' }}>
          <p style={{ color:'#fca5a5', fontSize:'15px', fontWeight:600, marginBottom:'8px' }}>
            Authentication Error</p>
          <p style={{ color:'#475569', fontSize:'13px', marginBottom:'20px' }}>
            Code: <strong style={{ color:'#f1f5f9' }}>{authError}</strong></p>
          <button onClick={() => router.push('/admin/login')} style={{
            background:'#3b82f6', color:'white', fontWeight:600, padding:'9px 20px',
            borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px',
          }}>Back to Login</button>
        </div>
      </div>
    );
  }

  const pendingFlags = flags.filter(f => f.status === 'pending').length;
  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .nv:hover { background:rgba(255,255,255,0.06)!important; color:#f1f5f9!important; }
        .card:hover { border-color:rgba(59,130,246,0.25)!important; }
        .tr:hover { background:rgba(255,255,255,0.03)!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width:'232px', flexShrink:0, position:'fixed', top:0, left:0, height:'100vh', zIndex:200,
        background:'rgba(6,11,24,0.97)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderRight:'1px solid rgba(255,255,255,0.06)',
        display:'flex', flexDirection:'column',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0,
              background:'#f59e0b',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontWeight:900, fontSize:'12px' }}>TC</span>
            </div>
            <div>
              <p style={{ color:'#f1f5f9', fontWeight:700, fontSize:'14px', lineHeight:1 }}>
                TranscriptCheck</p>
              <p style={{ color:'#f59e0b', fontSize:'10px', marginTop:'3px', fontWeight:600 }}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Admin card */}
        <div style={{ margin:'12px 10px',
          background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)',
          borderRadius:'10px', padding:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', flexShrink:0,
              background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fbbf24', fontWeight:700, fontSize:'13px' }}>
              {profile?.full_name?.charAt(0) ?? 'A'}
            </div>
            <div style={{ overflow:'hidden' }}>
              <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'12px',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {profile?.full_name}</p>
              <p style={{ color:'#f59e0b', fontSize:'10px', fontWeight:600 }}>Administrator</p>
            </div>
          </div>
          <div style={{ marginTop:'8px', padding:'5px 8px',
            background:'rgba(255,255,255,0.04)', borderRadius:'6px' }}>
            <p style={{ color:'#475569', fontSize:'9px', textTransform:'uppercase',
              letterSpacing:'0.06em', marginBottom:'2px' }}>Faculty</p>
            <p style={{ color:'#94a3b8', fontSize:'11px', fontWeight:500,
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {facultyName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'6px 10px' }}>
          <p style={{ color:'#334155', fontSize:'9px', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.1em',
            padding:'0 8px', marginBottom:'6px' }}>Management</p>
          {NAV.map(item => (
            <button key={item.id} className="nv"
              onClick={() => {
                setActive(item.id);
                if (item.id === 'upload') router.push('/admin/upload');
                if (item.id === 'flags')  router.push('/admin/flags');
              }}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:'9px',
                padding:'9px 10px', borderRadius:'8px', border:'none', cursor:'pointer',
                background: active === item.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active === item.id ? '#93c5fd' : '#475569',
                fontWeight: active === item.id ? 600 : 400,
                fontSize:'13px', textAlign:'left',
                borderLeft: active === item.id ? '2px solid #3b82f6' : '2px solid transparent',
                transition:'all 0.15s', marginBottom:'2px',
              }}>
              <span style={{ color:'currentColor', flexShrink:0 }}><item.Icon /></span>
              {item.label}
              {item.id === 'flags' && pendingFlags > 0 && (
                <span style={{ marginLeft:'auto', background:'#ef4444', color:'white',
                  fontSize:'10px', fontWeight:700, padding:'1px 6px',
                  borderRadius:'10px', minWidth:'18px', textAlign:'center' }}>
                  {pendingFlags}
                </span>
              )}
              {item.id === 'students' && (
                <span style={{ marginLeft:'auto', background:'rgba(59,130,246,0.15)',
                  color:'#93c5fd', fontSize:'10px', fontWeight:600,
                  padding:'1px 6px', borderRadius:'10px' }}>
                  {students.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'10px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color:'#334155', fontSize:'9px', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.1em',
            padding:'0 8px', marginBottom:'6px' }}>2025/2026</p>
          <button onClick={handleSignOut} className="nv" style={{
            width:'100%', display:'flex', alignItems:'center', gap:'9px',
            padding:'9px 10px', borderRadius:'8px', border:'none', cursor:'pointer',
            background:'transparent', color:'#475569', fontSize:'13px',
            transition:'all 0.15s', textAlign:'left',
          }}>
            <IcoOut />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ marginLeft:'232px', flex:1, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* TOP BAR */}
        <header style={{
          position:'sticky', top:0, zIndex:100,
          background:'rgba(6,11,24,0.85)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          padding:'0 28px', height:'60px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'16px', lineHeight:1 }}>
              Welcome back, {profile?.full_name?.split(' ')[0]}
            </p>
            <p style={{ color:'#334155', fontSize:'11px', marginTop:'3px' }}>
              {new Date().toLocaleDateString('en-GB', {
                weekday:'long', day:'numeric', month:'long', year:'numeric',
              })}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {pendingFlags > 0 && (
              <button onClick={() => router.push('/admin/flags')} style={{
                background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                borderRadius:'8px', padding:'6px 12px', cursor:'pointer',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
                <IcoFlag />
                <span style={{ color:'#fca5a5', fontSize:'12px', fontWeight:600 }}>
                  {pendingFlags} pending
                </span>
              </button>
            )}
            <button onClick={() => router.push('/admin/upload')} style={{
              background:'#3b82f6', color:'white', fontWeight:600, fontSize:'12px',
              padding:'7px 14px', borderRadius:'8px', border:'none',
              cursor:'pointer', display:'flex', alignItems:'center', gap:'6px',
              transition:'all 0.2s',
            }}>
              <IcoUpload />
              Upload Transcript
            </button>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%',
              background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, color:'#fbbf24', fontSize:'13px' }}>
              {profile?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex:1, padding:'28px', animation:'fadeIn 0.5s ease forwards' }}>

          {/* Stat cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
            {[
              { Icon: IcoUsers, label:'Students', value: students.length,
                sub:`In ${facultyName.split(' ').slice(-2).join(' ')}`,
                accent:'#60a5fa', dim:'rgba(59,130,246,0.1)' },
              { Icon: IcoDoc, label:'Transcripts', value: transcripts.length,
                sub:'Total uploaded',
                accent:'#a78bfa', dim:'rgba(167,139,250,0.1)' },
              { Icon: IcoFlag, label:'Pending Flags', value: pendingFlags,
                sub: pendingFlags > 0 ? 'Require attention' : 'All reviewed',
                accent:'#fbbf24', dim:'rgba(251,191,36,0.1)' },
              { Icon: IcoCheck, label:'Resolved', value: flags.filter(f => f.status === 'resolved').length,
                sub:'Successfully corrected',
                accent:'#86efac', dim:'rgba(34,197,94,0.1)' },
            ].map((stat, i) => (
              <div key={i} className="card" style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'12px', padding:'18px',
                transition:'border-color 0.2s',
              }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'8px',
                  background: stat.dim,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  marginBottom:'12px', color: stat.accent }}>
                  <stat.Icon />
                </div>
                <p style={{ color: stat.accent, fontSize:'28px', fontWeight:800,
                  lineHeight:1, marginBottom:'4px' }}>{stat.value}</p>
                <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'12px', marginBottom:'2px' }}>
                  {stat.label}</p>
                <p style={{ color:'#334155', fontSize:'11px' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Two-column: flags + actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px', marginBottom:'20px' }}>

            {/* Pending flags */}
            <div className="card" style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'12px', padding:'20px', transition:'border-color 0.2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                <div>
                  <h2 style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>
                    Pending Flags</h2>
                  <p style={{ color:'#334155', fontSize:'11px' }}>Awaiting admin review</p>
                </div>
                {pendingFlags > 0 && (
                  <button onClick={() => router.push('/admin/flags')} style={{
                    background:'#f59e0b', color:'white', fontWeight:600, fontSize:'12px',
                    padding:'7px 14px', borderRadius:'8px', border:'none',
                    cursor:'pointer', transition:'all 0.2s',
                  }}>Review All</button>
                )}
              </div>

              {pendingFlags === 0 ? (
                <div style={{ textAlign:'center', padding:'32px 16px',
                  background:'rgba(34,197,94,0.04)',
                  border:'1px dashed rgba(34,197,94,0.15)', borderRadius:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                    color:'#86efac' }}>
                    <IcoCheck />
                  </div>
                  <p style={{ color:'#86efac', fontWeight:600, fontSize:'13px', marginBottom:'4px' }}>
                    All Caught Up</p>
                  <p style={{ color:'#334155', fontSize:'12px' }}>No pending flags.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {flags.filter(f => f.status === 'pending').slice(0, 4).map(flag => (
                    <div key={flag.id} style={{
                      background:'rgba(245,158,11,0.05)',
                      border:'1px solid rgba(245,158,11,0.15)',
                      borderRadius:'8px', padding:'12px 14px',
                      display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px',
                    }}>
                      <div style={{ flex:1 }}>
                        <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'12px', marginBottom:'4px' }}>
                          {flag.error_type}</p>
                        <p style={{ color:'#475569', fontSize:'11px', marginBottom:'2px' }}>
                          Wrong:{' '}
                          <span style={{ color:'#fca5a5', fontWeight:600 }}>{flag.wrong_value}</span>
                          <span style={{ margin:'0 4px', color:'#334155' }}>→</span>
                          Correct:{' '}
                          <span style={{ color:'#86efac', fontWeight:600 }}>{flag.correct_value}</span>
                        </p>
                        <p style={{ color:'#334155', fontSize:'10px',
                          display:'flex', alignItems:'center', gap:'4px' }}>
                          <IcoClock />
                          {new Date(flag.created_at).toLocaleString('en-GB', {
                            day:'numeric', month:'short', hour:'2-digit', minute:'2-digit',
                          })}
                        </p>
                      </div>
                      <span style={{
                        background: FLAG_BADGE.pending.bg, color: FLAG_BADGE.pending.text,
                        fontSize:'10px', fontWeight:700, padding:'3px 8px',
                        borderRadius:'6px', flexShrink:0, textTransform:'capitalize',
                      }}>pending</span>
                    </div>
                  ))}
                  {pendingFlags > 4 && (
                    <button onClick={() => router.push('/admin/flags')} style={{
                      background:'none', border:'1px dashed rgba(245,158,11,0.2)',
                      color:'#f59e0b', fontSize:'12px', fontWeight:500,
                      padding:'9px', borderRadius:'8px', cursor:'pointer',
                    }}>+ {pendingFlags - 4} more pending flags</button>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div className="card" style={{
                background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.12)',
                borderRadius:'12px', padding:'18px', cursor:'pointer',
                transition:'border-color 0.2s',
              }} onClick={() => router.push('/admin/upload')}>
                <div style={{ color:'#60a5fa', marginBottom:'10px' }}><IcoUpload /></div>
                <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'13px', marginBottom:'4px' }}>
                  Upload Transcript</p>
                <p style={{ color:'#334155', fontSize:'11px', lineHeight:1.5, marginBottom:'8px' }}>
                  Upload a PDF with AI anomaly scanning</p>
                <p style={{ color:'#60a5fa', fontSize:'11px', fontWeight:600 }}>Open upload page</p>
              </div>

              <div className="card" style={{
                background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.12)',
                borderRadius:'12px', padding:'18px', cursor:'pointer',
                transition:'border-color 0.2s',
              }} onClick={() => router.push('/admin/flags')}>
                <div style={{ color:'#fbbf24', marginBottom:'10px' }}><IcoFlag /></div>
                <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'13px', marginBottom:'4px' }}>
                  Manage Flags</p>
                <p style={{ color:'#334155', fontSize:'11px', lineHeight:1.5, marginBottom:'8px' }}>
                  Review and resolve student error reports</p>
                <p style={{ color:'#fbbf24', fontSize:'11px', fontWeight:600 }}>
                  {pendingFlags > 0 ? `${pendingFlags} awaiting action` : 'No pending flags'}
                </p>
              </div>

              {/* Coverage */}
              <div style={{
                background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:'12px', padding:'16px',
              }}>
                <p style={{ color:'#334155', fontSize:'10px', textTransform:'uppercase',
                  letterSpacing:'0.08em', marginBottom:'12px' }}>Coverage</p>
                {[
                  { label:'Transcripts uploaded',
                    value: students.length === 0 ? 0 : Math.round((transcripts.length / students.length) * 100),
                    color:'#60a5fa' },
                  { label:'Flags resolved',
                    value: flags.length === 0 ? 100 : Math.round((flags.filter(f => f.status === 'resolved').length / flags.length) * 100),
                    color:'#86efac' },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ color:'#475569', fontSize:'11px' }}>{bar.label}</span>
                      <span style={{ color:'#f1f5f9', fontSize:'11px', fontWeight:600 }}>
                        {bar.value}%</span>
                    </div>
                    <div style={{ height:'5px', background:'rgba(255,255,255,0.05)',
                      borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{
                        height:'100%', width:`${bar.value}%`,
                        background: bar.color, borderRadius:'3px',
                        transition:'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Students table */}
          <div className="card" style={{
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'12px', padding:'20px', transition:'border-color 0.2s',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
              <div>
                <h2 style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>
                  Registered Students</h2>
                <p style={{ color:'#334155', fontSize:'11px' }}>
                  {facultyName} &middot; {students.length} student{students.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:'8px', padding:'7px 12px' }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#475569" strokeWidth="1.5"/>
                  <path d="M11 11l3 3" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search students..."
                  style={{ background:'none', border:'none', color:'#f1f5f9', fontSize:'13px',
                    outline:'none', width:'180px' }} />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 16px',
                background:'rgba(255,255,255,0.02)', borderRadius:'10px',
                border:'1px dashed rgba(255,255,255,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                  color:'#334155' }}><IcoUsers /></div>
                <p style={{ color:'#475569', fontSize:'13px', fontWeight:500, marginBottom:'5px' }}>
                  {search ? 'No students match your search' : 'No Students Registered Yet'}</p>
                <p style={{ color:'#334155', fontSize:'12px' }}>
                  {search ? 'Try a different name or matricule.'
                    : 'Students from your faculty will appear here once they register.'}</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                      {['#', 'Student Name', 'Matricule', 'Transcript', 'Registered'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 12px',
                          color:'#334155', fontSize:'10px',
                          textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600 }}>
                          {h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => {
                      const hasTrans = transcripts.some(t => t.student_id === s.id);
                      const studentFlags = flags.filter(f => f.student_id === s.id);
                      return (
                        <tr key={s.id} className="tr" style={{
                          borderBottom:'1px solid rgba(255,255,255,0.03)',
                          transition:'background 0.15s',
                        }}>
                          <td style={{ padding:'11px 12px', color:'#334155', fontSize:'12px' }}>
                            {i + 1}</td>
                          <td style={{ padding:'11px 12px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                              <div style={{ width:'30px', height:'30px', borderRadius:'50%',
                                flexShrink:0, background:'rgba(59,130,246,0.15)',
                                border:'1px solid rgba(59,130,246,0.2)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                color:'#60a5fa', fontWeight:700, fontSize:'11px' }}>
                                {s.full_name?.charAt(0)}
                              </div>
                              <div>
                                <p style={{ color:'#f1f5f9', fontWeight:500, fontSize:'12px' }}>
                                  {s.full_name}</p>
                                {studentFlags.length > 0 && (
                                  <p style={{ color:'#fbbf24', fontSize:'10px' }}>
                                    {studentFlags.length} flag{studentFlags.length > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'11px 12px' }}>
                            <span style={{ color:'#60a5fa', fontFamily:'monospace',
                              fontSize:'12px', fontWeight:600 }}>{s.matricule}</span>
                          </td>
                          <td style={{ padding:'11px 12px' }}>
                            <span style={{
                              padding:'3px 8px', borderRadius:'6px',
                              fontSize:'11px', fontWeight:600,
                              background: hasTrans ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
                              color: hasTrans ? '#86efac' : '#64748b',
                              border: `1px solid ${hasTrans ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)'}`,
                            }}>
                              {hasTrans ? 'Uploaded' : 'Missing'}
                            </span>
                          </td>
                          <td style={{ padding:'11px 12px', color:'#334155', fontSize:'11px' }}>
                            {new Date(s.created_at).toLocaleDateString('en-GB', {
                              day:'numeric', month:'short', year:'numeric',
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
