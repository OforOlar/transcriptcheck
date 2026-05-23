'use client';
// ============================================================
// Unit 3 Sec 3.3.6 — Construction with Reuse: browser's native
//   PDF rendering engine reused via <iframe> — no extra library
// Unit 3 Sec 3.4.8 — Runtime Configuration: signed URL expires
//   in 1 hour, generated fresh on each page load
// Unit 3 Sec 3.4.5 — Error Handling: every failure state shown
// Unit 1 Sec 1.5  — RBAC: session verified before any data load
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Transcript } from '@/app/types';

export default function TranscriptViewer() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

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
      if (!session) { router.push('/student/login'); return; }

      // Unit 3 Sec 3.3.6 — Construction with Reuse: Supabase client reused
      const { data: trans, error: transErr } = await supabase
        .from('transcripts')
        .select('*')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false }) // FIX: created_at not uploaded_at
        .limit(1)
        .maybeSingle();

      if (transErr) {
        setError('Could not load transcript record. Please try again.');
        setLoading(false);
        return;
      }
      if (!trans) { setLoading(false); return; }
      setTranscript(trans);

      // Unit 3 Sec 3.4.8 — Runtime Configuration: URL expires at runtime
      // Signed URL generated fresh — expires in 1 hour (3600 seconds)
      const { data: signed, error: signErr } = await supabase.storage
        .from('transcripts')
        .createSignedUrl(trans.file_path, 3600);

      if (signErr) {
        setError('Could not generate secure link. Please try again.');
      } else {
        setPdfUrl(signed.signedUrl);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Transcript status badge colours — matches actual DB constraint values
  const statusBadge: Record<string, { bg: string; text: string }> = {
    pending:   { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
    flagged:   { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
    confirmed: { bg: 'rgba(52,211,153,0.15)',  text: '#34d399' },
  };

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
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading your transcript...</p>
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
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

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
            <span style={{ color: '#14b8a6', fontSize: '12px', marginLeft: '8px' }}>My Transcript</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="/student/flag" style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5', fontSize: '13px', fontWeight: 600,
            padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
            transition: 'all 0.2s',
          }}>🚩 Flag an Error</a>
          <a href="/student/dashboard" style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#9ca3af', fontSize: '13px', fontWeight: 500,
            padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
          }}>← Dashboard</a>
        </div>
      </nav>

      <main style={{
        maxWidth: '1000px', margin: '0 auto', padding: '36px 2rem',
        animation: 'fadeUp 0.5s ease forwards',
      }}>

        {/* Error state — Unit 3 Sec 3.4.5 */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '24px',
          }}>
            <p style={{ color: '#fca5a5', fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', padding: '8px 20px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}>Retry</button>
          </div>
        )}

        {/* No transcript state */}
        {!error && !transcript && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '64px 20px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>📭</p>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
              No Transcript Available Yet</p>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '28px' }}>
              Your administrator has not uploaded your transcript. Please check back later.</p>
            <a href="/student/dashboard" style={{
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              color: 'white', fontWeight: 600, fontSize: '14px',
              padding: '11px 28px', borderRadius: '12px', textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(20,184,166,0.35)',
            }}>Back to Dashboard</a>
          </div>
        )}

        {/* Transcript loaded */}
        {transcript && (
          <>
            {/* Metadata bar */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(20,184,166,0.12)',
              borderRadius: '16px', padding: '20px 24px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '16px',
            }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                  {transcript.file_name}</p>
                <p style={{ color: '#6b7280', fontSize: '12px' }}>
                  Academic Year: {transcript.academic_year ?? '2025/2026'}
                  &nbsp;·&nbsp;
                  Uploaded: {new Date(transcript.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* AI anomalies badge */}
                {Array.isArray(transcript.ai_anomalies) && transcript.ai_anomalies.length > 0 && (
                  <span style={{
                    background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                    color: '#fbbf24', fontSize: '12px', fontWeight: 600,
                    padding: '5px 12px', borderRadius: '20px',
                  }}>
                    ⚠ {transcript.ai_anomalies.length} anomaly(ies) detected
                  </span>
                )}
                {/* Status badge — uses correct DB values */}
                {(() => {
                  const b = statusBadge[transcript.status] ?? { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af' };
                  return (
                    <span style={{
                      background: b.bg, color: b.text, fontSize: '11px', fontWeight: 700,
                      padding: '5px 12px', borderRadius: '20px', textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {transcript.status}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* PDF Viewer — Unit 3 Sec 3.3.6 Construction with Reuse */}
            {pdfUrl ? (
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', overflow: 'hidden',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              }}>
                {/* Unit 3 Sec 3.3.6: Browser's native PDF engine reused — no extra library */}
                <iframe
                  src={pdfUrl}
                  style={{ width: '100%', height: '82vh', border: 'none', display: 'block' }}
                  title="Academic Transcript PDF"
                />
              </div>
            ) : (
              !error && (
                <div style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '48px', textAlign: 'center',
                }}>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    Unable to load PDF preview. The signed link could not be generated.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}