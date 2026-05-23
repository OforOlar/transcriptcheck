'use client';
// ============================================================
// Unit 2 Sec 2.2.1 — Corrective Change: flag review is the
//   structured correction workflow — report → review → resolve
// Unit 1 Sec 1.6  — SCM: every flag has timestamp + status
//   forming a complete change management audit trail
// Unit 1 Sec 1.5  — RBAC: admin-only access enforced at load
// Unit 3 Sec 3.4.1 — API Design: flag updates via PATCH route
// Unit 3 Sec 3.4.5 — Error Handling: failures shown per-flag
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Flag } from '@/app/types';

type FlagWithStudent = Flag & {
  student_name?: string;
  student_matricule?: string;
};

// Unit 3 Sec 3.3.1 — Information Hiding: filter config separated from render
const FILTERS = ['all', 'pending', 'under_review', 'resolved', 'rejected'] as const;
type FilterVal = typeof FILTERS[number];

// Unit 1 Sec 1.6 — SCM: status badge colours reflect audit trail states
const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending:      { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  under_review: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  resolved:     { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
  rejected:     { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
};

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

      // Unit 3 Sec 3.4.5 — Fault Tolerance: retry session
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!session) { router.push('/admin/login'); return; }
      setToken(session.access_token);

      // Unit 1 Sec 1.5 — RBAC: verify admin role before data access
      const { data: prof } = await supabase
        .from('profiles').select('role,faculty').eq('id', session.user.id).maybeSingle();
      if (!prof || prof.role !== 'admin') { router.push('/admin/login'); return; }

      // Fetch all flags ordered by date — Unit 1 Sec 1.6 SCM
      const { data: flgs } = await supabase
        .from('flags').select('*').order('created_at', { ascending: false });

      if (flgs && flgs.length > 0) {
        // Enrich flags with student names — Unit 3 Sec 3.4.1 API Composition
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
      // Update local state without full reload
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#0a1810,#0d2218)',
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px',
            border: '3px solid rgba(20,184,166,0.15)', borderTop: '3px solid #14b8a6',
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .inp-f:focus { border-color:rgba(20,184,166,0.5)!important; background:rgba(20,184,166,0.06)!important; outline:none; }
        .filter-btn:hover { opacity: 0.85; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,12,8,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(20,184,166,0.08)',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            boxShadow: '0 0 16px rgba(20,184,166,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '13px' }}>TC</span>
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>TranscriptCheck</span>
            <span style={{ color: '#14b8a6', fontSize: '12px', marginLeft: '8px' }}>Flag Management</span>
          </div>
        </div>
        <a href="/admin/dashboard" style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#9ca3af', fontSize: '13px', fontWeight: 500,
          padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
        }}>← Dashboard</a>
      </nav>

      <main style={{
        maxWidth: '900px', margin: '0 auto', padding: '36px 2rem',
        animation: 'fadeUp 0.5s ease forwards',
      }}>

        {/* Header + filters */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h1 style={{ color: 'white', fontWeight: 700, fontSize: '1.6rem', marginBottom: '4px' }}>
              Error Flags
            </h1>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              {flags.length} total &nbsp;·&nbsp;
              {flags.filter(f => f.status === 'pending').length} pending review
            </p>
          </div>

          {/* Status filter buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FILTERS.map(s => {
              const count = s === 'all'
                ? flags.length
                : flags.filter(f => f.status === s).length;
              const active = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)} className="filter-btn" style={{
                  padding: '7px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  transition: 'all 0.2s',
                  background: active
                    ? 'linear-gradient(135deg,#14b8a6,#10b981)'
                    : 'rgba(255,255,255,0.06)',
                  color: active ? 'white' : '#6b7280',
                  boxShadow: active ? '0 4px 12px rgba(20,184,166,0.3)' : 'none',
                }}>
                  {s.replace('_', ' ')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '64px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '40px', marginBottom: '14px' }}>✅</p>
            <p style={{ color: '#9ca3af', fontWeight: 600, fontSize: '16px', marginBottom: '6px' }}>
              No flags with status:{' '}
              <strong style={{ color: 'white' }}>{filter.replace('_', ' ')}</strong>
            </p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>
              All flags in this category have been processed.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(flag => {
              const badge = STATUS_BADGE[flag.status] ??
                { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' };
              const isActionable =
                flag.status === 'pending' || flag.status === 'under_review';

              return (
                <div key={flag.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${isActionable
                    ? 'rgba(245,158,11,0.2)'
                    : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '20px', padding: '24px',
                  transition: 'border-color 0.2s',
                }}>

                  {/* Flag header */}
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px', marginBottom: '18px', flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginBottom: '6px', flexWrap: 'wrap',
                      }}>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>
                          {flag.error_type}
                        </p>
                        <span style={{
                          background: badge.bg, color: badge.text,
                          fontSize: '11px', fontWeight: 700,
                          padding: '3px 10px', borderRadius: '20px',
                          textTransform: 'capitalize',
                        }}>
                          {flag.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '3px' }}>
                        Student:{' '}
                        <strong style={{ color: 'white' }}>{flag.student_name}</strong>
                        {' '}
                        <span style={{ color: '#14b8a6', fontFamily: 'monospace' }}>
                          ({flag.student_matricule})
                        </span>
                      </p>
                      {/* Unit 1 Sec 1.6 — SCM: timestamp on every audit event */}
                      <p style={{ color: '#4b5563', fontSize: '12px' }}>
                        🕐 {new Date(flag.created_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Wrong → Correct values */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '12px', marginBottom: '16px',
                  }}>
                    <div style={{
                      background: 'rgba(239,68,68,0.07)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '12px', padding: '14px',
                    }}>
                      <p style={{
                        color: '#f87171', fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
                      }}>Currently on Transcript (Wrong)</p>
                      <p style={{ color: '#fca5a5', fontWeight: 600, fontSize: '14px' }}>
                        {flag.wrong_value}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(52,211,153,0.07)',
                      border: '1px solid rgba(52,211,153,0.2)',
                      borderRadius: '12px', padding: '14px',
                    }}>
                      <p style={{
                        color: '#34d399', fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
                      }}>Correct Value (Should Be)</p>
                      <p style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '14px' }}>
                        {flag.correct_value}
                      </p>
                    </div>
                  </div>

                  {/* Student description */}
                  <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px', padding: '14px', marginBottom: '16px',
                  }}>
                    <p style={{
                      color: '#6b7280', fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
                    }}>Student Description</p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.6 }}>
                      {flag.description}
                    </p>
                  </div>

                  {/* Previous admin response */}
                  {flag.admin_response && (
                    <div style={{
                      background: 'rgba(20,184,166,0.07)',
                      border: '1px solid rgba(20,184,166,0.2)',
                      borderRadius: '12px', padding: '14px', marginBottom: '16px',
                    }}>
                      <p style={{
                        color: '#14b8a6', fontSize: '10px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
                      }}>Your Previous Response</p>
                      <p style={{ color: '#5eead4', fontSize: '13px' }}>{flag.admin_response}</p>
                    </div>
                  )}

                  {/* Per-flag error */}
                  {errors[flag.id] && (
                    <div style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '10px', padding: '10px 14px', marginBottom: '14px',
                    }}>
                      <p style={{ color: '#fca5a5', fontSize: '13px' }}>{errors[flag.id]}</p>
                    </div>
                  )}

                  {/* Action panel — Unit 2 Sec 2.2.1 Corrective Change */}
                  {isActionable && (
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.07)',
                      paddingTop: '18px', marginTop: '4px',
                    }}>
                      <textarea
                        value={responses[flag.id] ?? ''}
                        onChange={e => setResponses(prev => ({
                          ...prev, [flag.id]: e.target.value,
                        }))}
                        placeholder="Optional: add a response for the student..."
                        rows={2}
                        className="inp-f"
                        style={{
                          width: '100%', padding: '10px 14px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px', color: 'white', fontSize: '13px',
                          resize: 'none', marginBottom: '12px',
                          fontFamily: "'Segoe UI',system-ui,sans-serif",
                          transition: 'all 0.2s', display: 'block',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => updateFlag(flag.id, 'under_review')}
                          disabled={working === flag.id}
                          className="action-btn"
                          style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: working === flag.id ? 0.6 : 1,
                          }}>
                          🔍 Mark Under Review
                        </button>
                        <button
                          onClick={() => updateFlag(flag.id, 'resolved')}
                          disabled={working === flag.id}
                          className="action-btn"
                          style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'rgba(52,211,153,0.15)', color: '#34d399',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: working === flag.id ? 0.6 : 1,
                          }}>
                          {working === flag.id ? 'Updating...' : '✓ Mark Resolved'}
                        </button>
                        <button
                          onClick={() => updateFlag(flag.id, 'rejected')}
                          disabled={working === flag.id}
                          className="action-btn"
                          style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none',
                            background: 'rgba(239,68,68,0.12)', color: '#f87171',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: working === flag.id ? 0.6 : 1,
                          }}>
                          ✗ Reject Flag
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