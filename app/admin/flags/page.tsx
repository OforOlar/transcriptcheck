'use client';
// Unit 2 Sec 2.2.1 — Corrective Change: flag review is structured correction workflow
// Unit 1 Sec 1.6  — SCM: every flag has timestamp + status forming audit trail
// Unit 1 Sec 1.5  — RBAC: admin-only access enforced at load
// Unit 3 Sec 3.4.1 — API Design: flag updates via PATCH route

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Flag } from '@/app/types';

type FlagWithStudent = Flag & {
  student_name?: string;
  student_matricule?: string;
};

const FILTERS = ['all', 'pending', 'under_review', 'resolved', 'rejected'] as const;
type FilterVal = typeof FILTERS[number];

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending:      { bg:'rgba(245,158,11,0.12)',  text:'#fbbf24' },
  under_review: { bg:'rgba(59,130,246,0.12)',  text:'#93c5fd' },
  resolved:     { bg:'rgba(34,197,94,0.12)',   text:'#86efac' },
  rejected:     { bg:'rgba(239,68,68,0.12)',   text:'#fca5a5' },
};

const IcoClock = () => <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

export default function AdminFlagsPage() {
  const router = useRouter();
  const [flags, setFlags]         = useState<FlagWithStudent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterVal>('pending');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [working, setWorking]     = useState<string | null>(null);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [token, setToken]         = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!session) { router.push('/admin/login'); return; }
      setToken(session.access_token);
      const { data: prof } = await supabase
        .from('profiles').select('role,faculty').eq('id', session.user.id).maybeSingle();
      if (!prof || prof.role !== 'admin') { router.push('/admin/login'); return; }

      const { data: flgs } = await supabase
        .from('flags').select('*').order('created_at', { ascending: false });

      if (flgs && flgs.length > 0) {
        const studentIds = [...new Set(flgs.map(f => f.student_id))];
        const { data: studs } = await supabase
          .from('profiles').select('id,full_name,matricule').in('id', studentIds);
        const studMap = Object.fromEntries((studs ?? []).map(s => [s.id, s]));
        setFlags(flgs.map(f => ({
          ...f,
          student_name:      studMap[f.student_id]?.full_name ?? 'Unknown',
          student_matricule: studMap[f.student_id]?.matricule ?? '—',
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  // Unit 3 Sec 3.4.1 — API Design: PATCH via route with Bearer token
  async function updateFlag(flagId: string, status: 'resolved' | 'rejected' | 'under_review') {
    setWorking(flagId);
    setErrors(prev => ({ ...prev, [flagId]: '' }));
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          flag_id:        flagId,
          status,
          admin_response: responses[flagId] ?? '',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, ...data.data } : f));
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [flagId]: err instanceof Error ? err.message : 'Update failed.',
      }));
    } finally {
      setWorking(null);
    }
  }

  const filtered = filter === 'all' ? flags : flags.filter(f => f.status === filter);

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', margin:'0 auto 14px',
            border:'2px solid rgba(59,130,246,0.15)', borderTop:'2px solid #3b82f6',
            animation:'spin 0.9s linear infinite' }} />
          <p style={{ color:'#334155', fontSize:'13px' }}>Loading flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .inp:focus{border-color:rgba(59,130,246,0.5)!important;background:rgba(59,130,246,0.06)!important;outline:none}
        * { box-sizing:border-box; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(6,11,24,0.88)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        padding:'0 28px', height:'60px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px',
            background:'#f59e0b',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:'11px' }}>TC</span>
          </div>
          <div>
            <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:'14px' }}>TranscriptCheck</span>
            <span style={{ color:'#475569', fontSize:'12px', marginLeft:'8px' }}>Flag Management</span>
          </div>
        </div>
        <a href="/admin/dashboard" style={{
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          color:'#94a3b8', fontSize:'12px', fontWeight:500,
          padding:'6px 14px', borderRadius:'8px', textDecoration:'none',
        }}>Dashboard</a>
      </nav>

      <main style={{ maxWidth:'880px', margin:'0 auto', padding:'28px 28px',
        animation:'fadeUp 0.5s ease forwards' }}>

        {/* Header + filters */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          marginBottom:'24px', flexWrap:'wrap', gap:'14px' }}>
          <div>
            <h1 style={{ color:'#f1f5f9', fontWeight:700, fontSize:'1.4rem', marginBottom:'4px' }}>
              Error Flags
            </h1>
            <p style={{ color:'#475569', fontSize:'13px' }}>
              {flags.length} total &nbsp;&middot;&nbsp;
              {flags.filter(f => f.status === 'pending').length} pending review
            </p>
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {FILTERS.map(s => {
              const count = s === 'all' ? flags.length : flags.filter(f => f.status === s).length;
              const active = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding:'6px 12px', borderRadius:'6px', border:'none',
                  cursor:'pointer', fontSize:'12px', fontWeight:active ? 600 : 400,
                  transition:'all 0.15s',
                  background: active ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                  color: active ? 'white' : '#475569',
                }}>
                  {s.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'12px', padding:'56px 20px', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'12px',
              color:'#334155' }}><IcoCheck /></div>
            <p style={{ color:'#94a3b8', fontWeight:600, fontSize:'14px', marginBottom:'5px' }}>
              No flags with status: <strong style={{ color:'#f1f5f9' }}>{filter.replace('_', ' ')}</strong>
            </p>
            <p style={{ color:'#334155', fontSize:'12px' }}>
              All flags in this category have been processed.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {filtered.map(flag => {
              const badge = STATUS_BADGE[flag.status] ?? { bg:'rgba(100,116,139,0.12)', text:'#64748b' };
              const isActionable = flag.status === 'pending' || flag.status === 'under_review';

              return (
                <div key={flag.id} style={{
                  background:'rgba(255,255,255,0.04)',
                  border:`1px solid ${isActionable ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius:'12px', padding:'20px',
                  transition:'border-color 0.2s',
                }}>
                  {/* Flag header */}
                  <div style={{ display:'flex', alignItems:'flex-start',
                    justifyContent:'space-between', gap:'14px',
                    marginBottom:'16px', flexWrap:'wrap' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px',
                        marginBottom:'5px', flexWrap:'wrap' }}>
                        <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px' }}>
                          {flag.error_type}
                        </p>
                        <span style={{ background: badge.bg, color: badge.text,
                          fontSize:'10px', fontWeight:700, padding:'3px 8px',
                          borderRadius:'6px', textTransform:'capitalize' }}>
                          {flag.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ color:'#475569', fontSize:'12px', marginBottom:'3px' }}>
                        Student:{' '}
                        <strong style={{ color:'#f1f5f9' }}>{flag.student_name}</strong>
                        {' '}
                        <span style={{ color:'#60a5fa', fontFamily:'monospace' }}>
                          ({flag.student_matricule})
                        </span>
                      </p>
                      {/* Unit 1 Sec 1.6 — SCM: timestamp on every audit event */}
                      <p style={{ color:'#334155', fontSize:'11px',
                        display:'flex', alignItems:'center', gap:'4px' }}>
                        <IcoClock />
                        {new Date(flag.created_at).toLocaleString('en-GB', {
                          day:'numeric', month:'short', year:'numeric',
                          hour:'2-digit', minute:'2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Wrong → Correct */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                    gap:'10px', marginBottom:'14px' }}>
                    <div style={{ background:'rgba(239,68,68,0.06)',
                      border:'1px solid rgba(239,68,68,0.18)',
                      borderRadius:'8px', padding:'12px' }}>
                      <p style={{ color:'#f87171', fontSize:'9px', fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>
                        Currently on Transcript (Wrong)
                      </p>
                      <p style={{ color:'#fca5a5', fontWeight:600, fontSize:'13px' }}>
                        {flag.wrong_value}
                      </p>
                    </div>
                    <div style={{ background:'rgba(34,197,94,0.06)',
                      border:'1px solid rgba(34,197,94,0.18)',
                      borderRadius:'8px', padding:'12px' }}>
                      <p style={{ color:'#86efac', fontSize:'9px', fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>
                        Correct Value (Should Be)
                      </p>
                      <p style={{ color:'#86efac', fontWeight:600, fontSize:'13px' }}>
                        {flag.correct_value}
                      </p>
                    </div>
                  </div>

                  {/* Student description */}
                  <div style={{ background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.06)',
                    borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
                    <p style={{ color:'#334155', fontSize:'9px', fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>
                      Student Description
                    </p>
                    <p style={{ color:'#94a3b8', fontSize:'12px', lineHeight:1.6 }}>
                      {flag.description}
                    </p>
                  </div>

                  {/* Previous admin response */}
                  {flag.admin_response && (
                    <div style={{ background:'rgba(59,130,246,0.06)',
                      border:'1px solid rgba(59,130,246,0.15)',
                      borderRadius:'8px', padding:'12px', marginBottom:'12px' }}>
                      <p style={{ color:'#60a5fa', fontSize:'9px', fontWeight:700,
                        textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'5px' }}>
                        Your Previous Response
                      </p>
                      <p style={{ color:'#93c5fd', fontSize:'12px' }}>{flag.admin_response}</p>
                    </div>
                  )}

                  {/* Per-flag error */}
                  {errors[flag.id] && (
                    <div style={{ background:'rgba(239,68,68,0.07)',
                      border:'1px solid rgba(239,68,68,0.2)',
                      borderRadius:'8px', padding:'9px 12px', marginBottom:'12px' }}>
                      <p style={{ color:'#fca5a5', fontSize:'12px' }}>{errors[flag.id]}</p>
                    </div>
                  )}

                  {/* Action panel — Unit 2 Sec 2.2.1 Corrective Change */}
                  {isActionable && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)',
                      paddingTop:'16px', marginTop:'4px' }}>
                      <textarea
                        value={responses[flag.id] ?? ''}
                        onChange={e => setResponses(prev => ({ ...prev, [flag.id]: e.target.value }))}
                        placeholder="Optional: add a response for the student..."
                        rows={2}
                        className="inp"
                        style={{
                          width:'100%', padding:'9px 12px',
                          background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                          borderRadius:'8px', color:'#f1f5f9', fontSize:'12px',
                          resize:'none', marginBottom:'10px',
                          fontFamily:"'Segoe UI',system-ui,sans-serif",
                          transition:'all 0.2s', display:'block',
                        }}
                      />
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <button
                          onClick={() => updateFlag(flag.id, 'under_review')}
                          disabled={working === flag.id}
                          style={{
                            padding:'8px 16px', borderRadius:'8px', border:'none',
                            background:'rgba(59,130,246,0.12)', color:'#93c5fd',
                            fontSize:'12px', fontWeight:600, cursor:'pointer',
                            transition:'all 0.15s',
                            opacity: working === flag.id ? 0.5 : 1,
                            display:'flex', alignItems:'center', gap:'6px',
                          }}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Mark Under Review
                        </button>
                        <button
                          onClick={() => updateFlag(flag.id, 'resolved')}
                          disabled={working === flag.id}
                          style={{
                            padding:'8px 16px', borderRadius:'8px', border:'none',
                            background:'rgba(34,197,94,0.12)', color:'#86efac',
                            fontSize:'12px', fontWeight:600, cursor:'pointer',
                            transition:'all 0.15s',
                            opacity: working === flag.id ? 0.5 : 1,
                            display:'flex', alignItems:'center', gap:'6px',
                          }}>
                          <IcoCheck />
                          {working === flag.id ? 'Updating...' : 'Mark Resolved'}
                        </button>
                        <button
                          onClick={() => updateFlag(flag.id, 'rejected')}
                          disabled={working === flag.id}
                          style={{
                            padding:'8px 16px', borderRadius:'8px', border:'none',
                            background:'rgba(239,68,68,0.1)', color:'#fca5a5',
                            fontSize:'12px', fontWeight:600, cursor:'pointer',
                            transition:'all 0.15s',
                            opacity: working === flag.id ? 0.5 : 1,
                            display:'flex', alignItems:'center', gap:'6px',
                          }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                          Reject Flag
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
