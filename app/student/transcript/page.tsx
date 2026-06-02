'use client';
// Unit 3 Sec 3.3.6 — Construction with Reuse: browser's native PDF engine via <iframe>
// Unit 3 Sec 3.4.8 — Runtime Configuration: signed URL expires in 1 hour
// Unit 3 Sec 3.4.5 — Error Handling: every failure state shown
// Unit 1 Sec 1.5  — RBAC: session verified before any data load

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Transcript } from '@/app/types';

const IcoDoc = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

const IcoFlag = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M3 14V2h9.5l-2.5 4 2.5 4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoWarn = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
  <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

export default function TranscriptViewer() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [pdfUrl, setPdfUrl]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) { session = data.session; break; }
        await new Promise(r => setTimeout(r, 400));
      }
      if (!session) { router.push('/student/login'); return; }

      const { data: trans, error: transErr } = await supabase
        .from('transcripts')
        .select('*')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transErr) { setError('Could not load transcript record. Please try again.'); setLoading(false); return; }
      if (!trans)   { setLoading(false); return; }
      setTranscript(trans);

      // Unit 3 Sec 3.4.8 — Signed URL expires in 1 hour (3600 seconds)
      const { data: signed, error: signErr } = await supabase.storage
        .from('transcripts')
        .createSignedUrl(trans.file_path, 3600);

      if (signErr) setError('Could not generate secure link. Please try again.');
      else setPdfUrl(signed.signedUrl);
      setLoading(false);
    }
    load();
  }, []);

  const statusBadge: Record<string, { bg: string; text: string }> = {
    pending:   { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
    flagged:   { bg: 'rgba(239,68,68,0.12)',   text: '#fca5a5' },
    confirmed: { bg: 'rgba(34,197,94,0.12)',   text: '#86efac' },
  };

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
          <p style={{ color:'#334155', fontSize:'13px' }}>Loading your transcript...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

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
            background:'#3b82f6',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:'11px' }}>TC</span>
          </div>
          <div>
            <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:'14px' }}>TranscriptCheck</span>
            <span style={{ color:'#475569', fontSize:'12px', marginLeft:'8px' }}>My Transcript</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <a href="/student/flag" style={{
            background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
            color:'#fca5a5', fontSize:'12px', fontWeight:600,
            padding:'6px 14px', borderRadius:'8px', textDecoration:'none',
            display:'flex', alignItems:'center', gap:'6px',
            transition:'all 0.2s',
          }}>
            <IcoFlag />
            Flag an Error
          </a>
          <a href="/student/dashboard" style={{
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            color:'#94a3b8', fontSize:'12px', fontWeight:500,
            padding:'6px 14px', borderRadius:'8px', textDecoration:'none',
          }}>Dashboard</a>
        </div>
      </nav>

      <main style={{ maxWidth:'1000px', margin:'0 auto', padding:'28px 28px',
        animation:'fadeUp 0.5s ease forwards' }}>

        {/* Error state */}
        {error && (
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:'10px', padding:'20px', textAlign:'center', marginBottom:'20px' }}>
            <p style={{ color:'#fca5a5', fontWeight:600, fontSize:'14px', marginBottom:'12px' }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{
              background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)',
              color:'#fca5a5', padding:'7px 18px', borderRadius:'7px',
              cursor:'pointer', fontSize:'12px', fontWeight:600,
            }}>Retry</button>
          </div>
        )}

        {/* No transcript */}
        {!error && !transcript && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'12px', padding:'56px 20px', textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'14px',
              color:'#334155' }}><IcoDoc /></div>
            <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'16px', marginBottom:'8px' }}>
              No Transcript Available Yet</p>
            <p style={{ color:'#475569', fontSize:'13px', marginBottom:'24px' }}>
              Your administrator has not uploaded your transcript. Please check back later.</p>
            <a href="/student/dashboard" style={{
              background:'#3b82f6', color:'white', fontWeight:600, fontSize:'13px',
              padding:'10px 24px', borderRadius:'8px', textDecoration:'none',
            }}>Back to Dashboard</a>
          </div>
        )}

        {/* Transcript loaded */}
        {transcript && (
          <>
            {/* Metadata bar */}
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(59,130,246,0.12)',
              borderRadius:'10px', padding:'16px 20px', marginBottom:'14px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              flexWrap:'wrap', gap:'12px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ color:'#60a5fa' }}><IcoDoc /></div>
                <div>
                  <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px', marginBottom:'3px' }}>
                    {transcript.file_name}</p>
                  <p style={{ color:'#334155', fontSize:'11px' }}>
                    Academic Year: {transcript.academic_year ?? '2025/2026'}
                    &nbsp;&middot;&nbsp;
                    Uploaded: {new Date(transcript.created_at).toLocaleDateString('en-GB', {
                      day:'numeric', month:'long', year:'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                {Array.isArray(transcript.ai_anomalies) && transcript.ai_anomalies.length > 0 && (
                  <span style={{
                    background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)',
                    color:'#fbbf24', fontSize:'11px', fontWeight:600,
                    padding:'4px 10px', borderRadius:'6px',
                    display:'flex', alignItems:'center', gap:'5px',
                  }}>
                    <IcoWarn />
                    {transcript.ai_anomalies.length} anomaly(ies) detected
                  </span>
                )}
                {(() => {
                  const b = statusBadge[transcript.status] ?? { bg:'rgba(100,116,139,0.12)', text:'#64748b' };
                  return (
                    <span style={{ background: b.bg, color: b.text, fontSize:'10px', fontWeight:700,
                      padding:'4px 10px', borderRadius:'6px', textTransform:'uppercase',
                      letterSpacing:'0.05em' }}>
                      {transcript.status}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* PDF Viewer — Unit 3 Sec 3.3.6 Construction with Reuse: browser's native PDF engine */}
            {pdfUrl ? (
              <div style={{ background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'12px', overflow:'hidden',
                boxShadow:'0 16px 48px rgba(0,0,0,0.4)' }}>
                <iframe
                  src={pdfUrl}
                  style={{ width:'100%', height:'82vh', border:'none', display:'block' }}
                  title="Academic Transcript PDF"
                />
              </div>
            ) : (
              !error && (
                <div style={{ background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:'12px', padding:'40px', textAlign:'center' }}>
                  <p style={{ color:'#475569', fontSize:'13px' }}>
                    Unable to load PDF preview. The signed link could not be generated.</p>
                </div>
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}
