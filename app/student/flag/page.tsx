'use client';
// ============================================================
// Unit 3 Sec 3.3.7 — Construction Quality: all 4 fields
//   validated before any DB call; duplicate flags prevented
// Unit 3 Sec 3.4.5 — Error Handling: specific per-field errors
// Unit 2 Sec 2.2.1 — Corrective Change: flag = structured
//   correction request with full audit trail
// Unit 1 Sec 1.6  — SCM: every flag timestamped and traceable
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Transcript } from '@/app/types';

// Unit 3 Sec 3.3.1 — Information Hiding: error type list separated from render
const ERROR_TYPES = [
  'Wrong Full Name',
  'Wrong Date of Birth',
  'Wrong Matriculation Number',
  'Incorrect Grade / Mark',
  'Missing Course',
  'Wrong Course Code',
  'Incorrect GPA / CGPA',
  'Wrong Academic Year',
  'Wrong Department / Faculty',
  'Other Error',
];

export default function FlagErrorPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [form, setForm] = useState({
    error_type: '', wrong_value: '', correct_value: '', description: '',
  });
  const [loading, setLoading]   = useState(false);
  const [pageLoading, setPage]  = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

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

      // FIX: use created_at — transcripts has no uploaded_at column
      const { data: trans } = await supabase
        .from('transcripts').select('*')
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      setTranscript(trans ?? null);
      setPage(false);
    }
    load();
  }, []);

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Unit 3 Sec 3.3.7 — Construction Quality: validate all fields before DB call
    if (!transcript)             return setError('No transcript found. You can only flag errors after your transcript is uploaded.');
    if (!form.error_type)        return setError('Please select the type of error.');
    if (!form.wrong_value.trim())   return setError('Please enter the incorrect value currently on your transcript.');
    if (!form.correct_value.trim()) return setError('Please enter the correct value it should show.');
    if (!form.description.trim())   return setError('Please provide a brief description of the error.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired. Please log in again.');

      // Unit 3 Sec 3.3.7 — Prevent duplicate flags for same error type
      const { data: existing } = await supabase
        .from('flags')
        .select('id')
        .eq('transcript_id', transcript.id)
        .eq('student_id', session.user.id)
        .eq('error_type', form.error_type)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('You already have a pending flag for this error type. Please wait for the admin to respond before submitting again.');
      }

      // Unit 1 Sec 1.6 — SCM: flag record creates timestamped audit entry
      const { error: insertErr } = await supabase.from('flags').insert({
        transcript_id:  transcript.id,
        student_id:     session.user.id,
        error_type:     form.error_type,
        wrong_value:    form.wrong_value.trim(),
        correct_value:  form.correct_value.trim(),
        description:    form.description.trim(),
        status:         'pending',
        
      });
      if (insertErr) throw new Error('Failed to submit flag: ' + insertErr.message);

      // Notify admin via API route
      // Unit 2 Sec 2.2.1 — Corrective Change: admin notified immediately
       await fetch('/api/student/notify-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          error_type:    form.error_type,
          wrong_value:   form.wrong_value.trim(),
          correct_value: form.correct_value.trim(),
          description:   form.description.trim(),
        }),
      }).catch(() => {
        // Notification failure never blocks flag submission
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Segoe UI',system-ui,sans-serif",
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

  // Success screen
  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg,#050c08,#071210,#0a1810)',
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}>
        <style>{`
          @keyframes pop  { 0%{transform:scale(0.6);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
          @keyframes ring { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.6);opacity:0} }
        `}</style>
        <div style={{
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(20,184,166,0.2)', borderRadius: '24px',
          padding: '48px 40px', textAlign: 'center', maxWidth: '400px',
        }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 24px' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(20,184,166,0.15)', animation: 'ring 2s ease-out infinite',
            }} />
            <div style={{
              position: 'relative', width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
              fontSize: '28px',
            }}>🚩</div>
          </div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '22px', marginBottom: '10px' }}>
            Flag Submitted!</h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
            Your error report has been submitted and your faculty administrator
            has been notified. Track its status on your dashboard.
          </p>
          <a href="/student/dashboard" style={{
            display: 'block', width: '100%', padding: '13px',
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            color: 'white', fontWeight: 700, fontSize: '15px',
            borderRadius: '14px', textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(20,184,166,0.35)',
            textAlign: 'center',
          }}>Back to Dashboard →</a>
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
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .inp-f:focus{border-color:rgba(20,184,166,0.6)!important;background:rgba(20,184,166,0.06)!important}
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
            <span style={{ color: '#14b8a6', fontSize: '12px', marginLeft: '8px' }}>Flag an Error</span>
          </div>
        </div>
        <a href="/student/dashboard" style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#9ca3af', fontSize: '13px', fontWeight: 500,
          padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
        }}>← Dashboard</a>
      </nav>

      <main style={{
        maxWidth: '680px', margin: '0 auto', padding: '40px 2rem',
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ color: 'white', fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
            Report a Transcript Error
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.6 }}>
            Describe the error found on your transcript. Your administrator will review
            the report and take corrective action. This creates a formal audit trail
            per Unit 2 Section 2.2.1.
          </p>
        </div>

        {/* No transcript warning */}
        {!transcript && (
          <div style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '14px', padding: '16px 20px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#fcd34d', fontSize: '13px', lineHeight: 1.5 }}>
              No transcript has been uploaded for your account yet.
              You can only flag errors after your administrator uploads your transcript.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', padding: '32px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>

          {/* Error type */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'block', marginBottom: '10px',
            }}>Type of Error</label>
            <select name="error_type" value={form.error_type} onChange={onChange}
              disabled={!transcript}
              className="inp-f"
              style={{ ...inp, cursor: !transcript ? 'not-allowed' : 'pointer' }}>
              <option value="" style={{ background: '#0a1810' }}>— Select the type of error —</option>
              {ERROR_TYPES.map(t => (
                <option key={t} value={t} style={{ background: '#0a1810' }}>{t}</option>
              ))}
            </select>
          </div>

          {/* Wrong value */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'block', marginBottom: '10px',
            }}>Incorrect Value (what the transcript currently shows)</label>
            <input name="wrong_value" value={form.wrong_value} onChange={onChange}
              placeholder="e.g. OLAR OFOR GLORIA"
              disabled={!transcript}
              className="inp-f"
              style={{ ...inp, opacity: !transcript ? 0.5 : 1 }} />
          </div>

          {/* Correct value */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'block', marginBottom: '10px',
            }}>Correct Value (what it should say)</label>
            <input name="correct_value" value={form.correct_value} onChange={onChange}
              placeholder="e.g. OFOR GLORIA OLAR"
              disabled={!transcript}
              className="inp-f"
              style={{ ...inp, opacity: !transcript ? 0.5 : 1 }} />
          </div>

          {/* Description */}
          <div>
            <label style={{
              color: '#9ca3af', fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              display: 'block', marginBottom: '10px',
            }}>Description</label>
            <textarea name="description" value={form.description} onChange={onChange}
              rows={4}
              placeholder="Explain the error in your own words. Include any supporting details that will help the administrator verify and correct it."
              disabled={!transcript}
              className="inp-f"
              style={{
                ...inp, resize: 'none', opacity: !transcript ? 0.5 : 1,
                lineHeight: 1.6,
              }} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || !transcript} style={{
            width: '100%', padding: '15px',
            background: loading || !transcript
              ? 'rgba(20,184,166,0.3)'
              : 'linear-gradient(135deg,#14b8a6,#10b981)',
            color: 'white', fontWeight: 700, fontSize: '15px',
            border: 'none', borderRadius: '14px',
            cursor: loading || !transcript ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
            transition: 'all 0.25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading ? (
              <>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                  animation: 'spin 0.7s linear infinite', flexShrink: 0,
                }} />
                Submitting Flag...
              </>
            ) : '🚩 Submit Error Flag'}
          </button>

          <p style={{ color: '#4b5563', fontSize: '11px', textAlign: 'center', marginTop: '-8px' }}>
            Your administrator will be notified immediately when you submit.
          </p>
        </form>
      </main>
    </div>
  );
}