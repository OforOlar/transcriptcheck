'use client';
// Unit 3 Sec 3.8.2 — Automated Construction: AI scanner triggered on every upload
// Unit 3 Sec 3.4.1 — API Design: page calls API route which calls Storage + scanner
// Unit 3 Sec 3.4.5 — Error Handling: specific messages for every failure path
// Unit 3 Sec 3.4.4 — Defensive Programming: token passed in header for server auth

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, AnomalyResult } from '@/app/types';

const IcoUpload = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
  <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoScan = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  <circle cx="5.5" cy="9.5" r="1" fill="currentColor"/>
  <circle cx="10.5" cy="9.5" r="1" fill="currentColor"/>
  <path d="M6 12h4M8 2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  <circle cx="8" cy="2" r="1" fill="currentColor"/>
</svg>;

const IcoCheck = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
  <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoWarn = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

const IcoDoc = () => <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
  <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

export default function AdminUploadPage() {
  const router = useRouter();
  const [students, setStudents]        = useState<Profile[]>([]);
  const [selectedStudent, setSelected] = useState('');
  const [academicYear, setAcYear]      = useState('2025/2026');
  const [file, setFile]                = useState<File | null>(null);
  const [loading, setLoading]          = useState(false);
  const [pageLoading, setPageLoading]  = useState(true);
  const [error, setError]              = useState<string | null>(null);
  const [anomalies, setAnomalies]      = useState<AnomalyResult[]>([]);
  const [success, setSuccess]          = useState<string | null>(null);
  const [dragOver, setDragOver]        = useState(false);

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
      const { data: prof } = await supabase
        .from('profiles').select('faculty,role').eq('id', session.user.id).maybeSingle();
      if (!prof || prof.role !== 'admin') { router.push('/admin/login'); return; }
      const { data: studs } = await supabase
        .from('profiles').select('*')
        .eq('faculty', prof.faculty).eq('role', 'student').order('full_name');
      setStudents(studs ?? []);
      setPageLoading(false);
    }
    load();
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') { setFile(dropped); setError(null); }
    else setError('Only PDF files are accepted.');
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setAnomalies([]);
    if (!selectedStudent) return setError('Please select a student.');
    if (!file)            return setError('Please select a PDF file.');

    setLoading(true);
    try {
      const supabase = createClient();
      // Unit 3 Sec 3.4.4 — Defensive Programming: token in Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('student_id', selectedStudent);
      fd.append('academic_year', academicYear);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: fd,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess(data.message);
      const raw = data.data?.ai_anomalies ?? [];
      setAnomalies(Array.isArray(raw) ? raw : JSON.parse(raw));
      setFile(null);
      setSelected('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setLoading(false);
    }
  }

  const sevStyle: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    high:   { bg:'rgba(239,68,68,0.07)',  border:'rgba(239,68,68,0.2)',  text:'#fca5a5', badge:'rgba(239,68,68,0.15)' },
    medium: { bg:'rgba(245,158,11,0.07)', border:'rgba(245,158,11,0.2)', text:'#fcd34d', badge:'rgba(245,158,11,0.15)' },
    low:    { bg:'rgba(234,179,8,0.07)',  border:'rgba(234,179,8,0.2)',  text:'#fde68a', badge:'rgba(234,179,8,0.15)' },
  };

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';
  const inp = {
    width:'100%', padding:'10px 14px', borderRadius:'8px',
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
    color:'#f1f5f9', fontSize:'14px', outline:'none', transition:'all 0.2s',
    fontFamily:"'Segoe UI',system-ui,sans-serif",
  };

  if (pageLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:'40px', height:'40px', borderRadius:'50%',
          border:'2px solid rgba(59,130,246,0.15)', borderTop:'2px solid #3b82f6',
          animation:'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const selectedStudentObj = students.find(s => s.id === selectedStudent);

  return (
    <div style={{ minHeight:'100vh', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .inp:focus{border-color:rgba(59,130,246,0.5)!important;background:rgba(59,130,246,0.06)!important;outline:none}
        select option{background:#0d1530;color:#f1f5f9}
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
            <span style={{ color:'#475569', fontSize:'12px', marginLeft:'8px' }}>Upload Transcript</span>
          </div>
        </div>
        <button onClick={() => router.push('/admin/dashboard')} style={{
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          color:'#94a3b8', fontSize:'12px', fontWeight:500,
          padding:'6px 14px', borderRadius:'8px', cursor:'pointer',
        }}>Dashboard</button>
      </nav>

      <main style={{ maxWidth:'720px', margin:'0 auto', padding:'32px 28px',
        animation:'fadeUp 0.5s ease forwards' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ color:'#f1f5f9', fontSize:'1.5rem', fontWeight:700, marginBottom:'8px' }}>
            Upload Transcript
          </h1>
          <p style={{ color:'#475569', fontSize:'13px', lineHeight:1.7, maxWidth:'520px' }}>
            Upload a student PDF transcript. The AI anomaly scanner automatically
            checks for GPA errors, impossible dates, and malformed course codes
            before the transcript becomes visible to the student.
          </p>
        </div>

        {/* Steps */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'24px' }}>
          {[
            { step:'01', Icon: IcoUpload, label:'Upload PDF',    desc:'Select student and upload PDF' },
            { step:'02', Icon: IcoScan,  label:'AI Scan',       desc:'Automated anomaly detection' },
            { step:'03', Icon: IcoCheck, label:'Student Views', desc:'Transcript becomes visible' },
          ].map(item => (
            <div key={item.step} style={{
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'10px', padding:'14px',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ color:'#60a5fa' }}><item.Icon /></div>
                <span style={{ color:'#3b82f6', fontSize:'9px', fontWeight:700,
                  background:'rgba(59,130,246,0.1)', padding:'2px 7px',
                  borderRadius:'5px', letterSpacing:'0.06em' }}>STEP {item.step}</span>
              </div>
              <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'12px', marginBottom:'3px' }}>
                {item.label}</p>
              <p style={{ color:'#334155', fontSize:'11px', lineHeight:1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Success */}
        {success && (
          <div style={{
            background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)',
            borderRadius:'10px', padding:'14px 16px', marginBottom:'18px',
            display:'flex', alignItems:'flex-start', gap:'10px',
          }}>
            <div style={{ color:'#86efac', flexShrink:0, marginTop:'1px' }}><IcoCheck /></div>
            <div>
              <p style={{ color:'#86efac', fontWeight:600, fontSize:'13px', marginBottom:'2px' }}>
                Upload Successful</p>
              <p style={{ color:'#475569', fontSize:'12px' }}>{success}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:'10px', padding:'14px 16px', marginBottom:'18px',
            display:'flex', alignItems:'flex-start', gap:'10px', color:'#fca5a5',
          }}>
            <div style={{ flexShrink:0, marginTop:'1px' }}><IcoWarn /></div>
            <p style={{ fontSize:'13px' }}>{error}</p>
          </div>
        )}

        {/* AI Anomaly Report */}
        {anomalies.length > 0 && (
          <div style={{
            background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.18)',
            borderRadius:'12px', padding:'20px', marginBottom:'20px',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'8px', flexShrink:0,
                background:'rgba(245,158,11,0.12)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fbbf24' }}><IcoScan /></div>
              <div>
                <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px', marginBottom:'2px' }}>
                  AI Anomaly Detection Report</p>
                <p style={{ color:'#f59e0b', fontSize:'12px' }}>
                  {anomalies.length} issue{anomalies.length > 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
              {anomalies.map((a, i) => {
                const sev = sevStyle[a.severity] ?? sevStyle.low;
                return (
                  <div key={i} style={{
                    background: sev.bg, border:`1px solid ${sev.border}`,
                    borderRadius:'8px', padding:'12px 14px',
                  }}>
                    <div style={{ display:'flex', alignItems:'center',
                      justifyContent:'space-between', marginBottom:'5px' }}>
                      <p style={{ color: sev.text, fontWeight:700, fontSize:'12px' }}>
                        {a.type.replace(/_/g, ' ')}</p>
                      <span style={{ background: sev.badge, color: sev.text,
                        fontSize:'9px', fontWeight:700, padding:'2px 7px',
                        borderRadius:'5px', textTransform:'uppercase' }}>
                        {a.severity}
                      </span>
                    </div>
                    <p style={{ color:'#94a3b8', fontSize:'12px',
                      marginBottom: a.detected_value ? '4px' : 0 }}>
                      {a.description}</p>
                    {a.detected_value && (
                      <p style={{ color:'#475569', fontSize:'11px' }}>
                        Detected: <strong style={{ color: sev.text }}>{a.detected_value}</strong>
                        &nbsp;&middot;&nbsp;Expected: {a.expected_range}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ background:'rgba(245,158,11,0.07)', borderRadius:'8px',
              padding:'9px 12px', display:'flex', alignItems:'center', gap:'8px',
              color:'#fbbf24' }}>
              <IcoWarn />
              <p style={{ fontSize:'12px' }}>
                The transcript has been saved. Consider re-uploading a corrected version if these anomalies reflect real errors.
              </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} style={{ display:'flex', flexDirection:'column', gap:'22px' }}>

          {/* Student selector */}
          <div>
            <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.05em',
              display:'block', marginBottom:'8px' }}>Select Student</label>
            <select value={selectedStudent}
              onChange={e => { setSelected(e.target.value); setError(null); }}
              className="inp" style={{ ...inp, cursor:'pointer' }}
              onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}>
              <option value="">— Choose a student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.matricule})</option>
              ))}
            </select>

            {selectedStudentObj && (
              <div style={{
                marginTop:'10px', padding:'10px 14px',
                background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.15)',
                borderRadius:'8px', display:'flex', alignItems:'center', gap:'10px',
              }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', flexShrink:0,
                  background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#60a5fa', fontWeight:700, fontSize:'12px' }}>
                  {selectedStudentObj.full_name?.charAt(0)}
                </div>
                <div>
                  <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'12px' }}>
                    {selectedStudentObj.full_name}</p>
                  <p style={{ color:'#60a5fa', fontSize:'11px', fontFamily:'monospace' }}>
                    {selectedStudentObj.matricule}</p>
                </div>
              </div>
            )}

            {students.length === 0 && (
              <p style={{ color:'#fbbf24', fontSize:'12px', marginTop:'8px',
                display:'flex', alignItems:'center', gap:'6px' }}>
                <IcoWarn />
                No students registered in your faculty yet.
              </p>
            )}
          </div>

          {/* Academic year */}
          <div>
            <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.05em',
              display:'block', marginBottom:'8px' }}>Academic Year</label>
            <input value={academicYear}
              onChange={e => setAcYear(e.target.value)}
              placeholder="e.g. 2025/2026"
              className="inp" style={inp}
              onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
            />
          </div>

          {/* Drop zone */}
          <div>
            <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.05em',
              display:'block', marginBottom:'8px' }}>Transcript PDF File</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(59,130,246,0.6)' : file ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:'12px', padding:'36px 20px', textAlign:'center',
                background: dragOver ? 'rgba(59,130,246,0.06)' : file ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.02)',
                transition:'all 0.2s', cursor:'pointer',
              }}>
              <input type="file" accept=".pdf" id="pdf-input"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); }}
                style={{ display:'none' }} />
              <label htmlFor="pdf-input" style={{ cursor:'pointer', display:'block' }}>
                {file ? (
                  <div>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                      color:'#60a5fa' }}><IcoDoc /></div>
                    <p style={{ color:'#86efac', fontWeight:600, fontSize:'13px',
                      marginBottom:'4px' }}>{file.name}</p>
                    <p style={{ color:'#334155', fontSize:'11px' }}>
                      {(file.size / 1024).toFixed(1)} KB &middot; Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:'10px',
                      color:'#334155' }}><IcoDoc /></div>
                    <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'13px', marginBottom:'5px' }}>
                      Drop PDF here or click to browse
                    </p>
                    <p style={{ color:'#334155', fontSize:'11px' }}>Only PDF files accepted</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'12px', borderRadius:'8px', border:'none',
            background: loading ? 'rgba(245,158,11,0.5)' : '#f59e0b',
            color:'white', fontWeight:600, fontSize:'14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.2s', display:'flex', alignItems:'center',
            justifyContent:'center', gap:'8px',
          }}>
            {loading ? (
              <>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                  animation:'spin 0.7s linear infinite', flexShrink:0 }} />
                Uploading and Running AI Scan...
              </>
            ) : (
              <>
                <IcoScan />
                Upload Transcript and Run AI Scan
              </>
            )}
          </button>

          <p style={{ color:'#334155', fontSize:'11px', textAlign:'center', marginTop:'-10px' }}>
            AI scanner checks for GPA errors, impossible dates, and malformed course codes.
          </p>
        </form>
      </main>
    </div>
  );
}
