'use client';
// Unit 3 Sec 3.8.2 — Automated Construction: AI scanner triggered on every upload
// Unit 3 Sec 3.4.1 — API Design: page calls API route which calls Storage + scanner
// Unit 3 Sec 3.4.5 — Error Handling: specific messages for every failure path
// Unit 3 Sec 3.4.4 — Defensive Programming: token passed in header for server auth

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Profile, AnomalyResult } from '@/app/types';

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
        .eq('faculty', prof.faculty)
        .eq('role', 'student')
        .order('full_name');
      setStudents(studs ?? []);
      setPageLoading(false);
    }
    load();
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped); setError(null);
    } else {
      setError('Only PDF files are accepted.');
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setAnomalies([]);

    if (!selectedStudent) return setError('Please select a student.');
    if (!file)            return setError('Please select a PDF file.');

    setLoading(true);
    try {
      const supabase = createClient();

      // Unit 3 Sec 3.4.4 — Defensive Programming:
      // API routes run on the server (no localStorage/cookies available there).
      // We pass the access token in the Authorization header so the API
      // route can verify the session server-side using supabase.auth.getUser(token).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('student_id', selectedStudent);
      fd.append('academic_year', academicYear);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          // Send Bearer token so the server-side API route can authenticate
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    high:   { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#fca5a5', badge: 'rgba(239,68,68,0.2)'  },
    medium: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#fcd34d', badge: 'rgba(245,158,11,0.2)' },
    low:    { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  text: '#fde68a', badge: 'rgba(234,179,8,0.2)'  },
  };

  if (pageLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#071210,#0a1810)',
      }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          border: '3px solid rgba(20,184,166,0.15)', borderTop: '3px solid #14b8a6',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    );
  }

  const selectedStudentObj = students.find(s => s.id === selectedStudent);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .back-btn:hover{color:#5eead4!important}
        .upload-btn:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(20,184,166,0.5)!important}
        select option{background:#0a1810;color:white}
      `}</style>

      <div style={{
        position: 'fixed', top: '-100px', right: '-100px',
        width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle,rgba(20,184,166,0.1) 0%,transparent 70%)',
      }} />

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
            <span style={{ color: '#14b8a6', fontSize: '12px', marginLeft: '8px' }}>Upload Transcript</span>
          </div>
        </div>
        <button onClick={() => router.push('/admin/dashboard')} className="back-btn" style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#9ca3af', fontSize: '13px', fontWeight: 500,
          padding: '7px 16px', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s',
        }}>
          ← Back to Dashboard
        </button>
      </nav>

      <main style={{
        maxWidth: '760px', margin: '0 auto', padding: '40px 2rem',
        animation: 'fadeUp 0.5s ease forwards', position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'white', fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
            Upload Transcript
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6, maxWidth: '540px' }}>
            Upload a student PDF transcript. The AI anomaly scanner automatically checks
            for GPA errors, impossible dates, and malformed course codes before the
            transcript becomes visible to the student.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { step: '01', icon: '⬆', label: 'Upload PDF',    desc: 'Select a student and upload their PDF' },
            { step: '02', icon: '🤖', label: 'AI Scan',       desc: 'Automated scanner checks for anomalies' },
            { step: '03', icon: '✅', label: 'Student Views', desc: 'Transcript becomes visible to the student' },
          ].map(item => (
            <div key={item.step} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{
                  color: '#14b8a6', fontSize: '10px', fontWeight: 700,
                  background: 'rgba(20,184,166,0.1)', padding: '2px 8px',
                  borderRadius: '6px', letterSpacing: '0.06em',
                }}>STEP {item.step}</span>
              </div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{item.label}</p>
              <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Success */}
        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>✅</span>
            <div>
              <p style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>Upload Successful</p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>{success}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* AI Anomaly Report */}
        {anomalies.length > 0 && (
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '20px', padding: '24px', marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(245,158,11,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
              }}>🤖</div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>
                  AI Anomaly Detection Report
                </p>
                <p style={{ color: '#f59e0b', fontSize: '13px' }}>
                  {anomalies.length} issue{anomalies.length > 1 ? 's' : ''} found — review before student sees the transcript
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {anomalies.map((a, i) => {
                const sev = sevStyle[a.severity] ?? sevStyle.low;
                return (
                  <div key={i} style={{
                    background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ color: sev.text, fontWeight: 700, fontSize: '13px' }}>
                        {a.type.replace(/_/g, ' ')}
                      </p>
                      <span style={{
                        background: sev.badge, color: sev.text, fontSize: '10px', fontWeight: 700,
                        padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase',
                      }}>{a.severity} severity</span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: a.detected_value ? '6px' : 0 }}>
                      {a.description}
                    </p>
                    {a.detected_value && (
                      <p style={{ color: '#6b7280', fontSize: '12px' }}>
                        Detected: <strong style={{ color: sev.text }}>{a.detected_value}</strong>
                        &nbsp;·&nbsp; Expected: {a.expected_range}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.08)', borderRadius: '10px', padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <p style={{ color: '#fcd34d', fontSize: '12px' }}>
                The transcript has been saved. Consider re-uploading a corrected version if these anomalies reflect real errors.
              </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', padding: '32px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: '24px',
        }}>

          {/* Student selector */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '10px',
            }}>Select Student</label>
            <select value={selectedStudent}
              onChange={e => { setSelected(e.target.value); setError(null); }}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: selectedStudent ? 'white' : '#6b7280', fontSize: '14px',
                outline: 'none', transition: 'all 0.2s', cursor: 'pointer',
              }}
              onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}>
              <option value="">— Choose a student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.matricule})</option>
              ))}
            </select>

            {selectedStudentObj && (
              <div style={{
                marginTop: '10px', padding: '12px 16px',
                background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '14px',
                }}>{selectedStudentObj.full_name?.charAt(0)}</div>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{selectedStudentObj.full_name}</p>
                  <p style={{ color: '#14b8a6', fontSize: '12px', fontFamily: 'monospace' }}>{selectedStudentObj.matricule}</p>
                </div>
              </div>
            )}

            {students.length === 0 && (
              <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '8px' }}>
                ⚠ No students registered in your faculty yet.
              </p>
            )}
          </div>

          {/* Academic year */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '10px',
            }}>Academic Year</label>
            <input value={academicYear}
              onChange={e => setAcYear(e.target.value)}
              placeholder="e.g. 2025/2026"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor='rgba(20,184,166,0.6)'; e.target.style.background='rgba(20,184,166,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.06)'; }}
            />
          </div>

          {/* Drop zone */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '10px',
            }}>Transcript PDF File</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'rgba(20,184,166,0.6)' : file ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '16px', padding: '40px 24px', textAlign: 'center',
                background: dragOver ? 'rgba(20,184,166,0.08)' : file ? 'rgba(20,184,166,0.05)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}>
              <input type="file" accept=".pdf" id="pdf-input"
                onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); }}
                style={{ display: 'none' }} />
              <label htmlFor="pdf-input" style={{ cursor: 'pointer', display: 'block' }}>
                {file ? (
                  <div>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
                      background: 'rgba(20,184,166,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>📑</div>
                    <p style={{ color: '#6ee7b7', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{file.name}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 14px',
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                    }}>📂</div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                      Drop PDF here or click to browse
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Only PDF files accepted</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="upload-btn" style={{
            width: '100%', padding: '15px',
            background: loading ? 'rgba(20,184,166,0.5)' : 'linear-gradient(135deg,#14b8a6,#10b981)',
            color: 'white', fontWeight: 700, fontSize: '15px',
            border: 'none', borderRadius: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(20,184,166,0.35)',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading ? (
              <>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                  animation: 'spin 0.7s linear infinite', flexShrink: 0,
                }} />
                Uploading & Running AI Scan...
              </>
            ) : (
              <>🤖 Upload Transcript + Run AI Scan</>
            )}
          </button>

          <p style={{ color: '#4b5563', fontSize: '11px', textAlign: 'center', marginTop: '-8px' }}>
            AI scanner checks for GPA errors, impossible dates, and malformed course codes.
          </p>
        </form>
      </main>
    </div>
  );
}