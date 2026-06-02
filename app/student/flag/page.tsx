'use client';
// Unit 3 Sec 3.3.7 — Construction Quality: all 4 fields validated before any DB call
// Unit 3 Sec 3.4.5 — Error Handling: specific per-field errors
// Unit 2 Sec 2.2.1 — Corrective Change: flag = structured correction request
// Unit 1 Sec 1.6  — SCM: every flag timestamped and traceable

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';
import type { Transcript } from '@/app/types';

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

const IcoFlag = () => <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
  <path d="M3 14V2h9.5l-2.5 4 2.5 4H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoCheck = () => <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
  <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>;

const IcoWarn = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path d="M7.1 2.2a1 1 0 011.8 0l5 9a1 1 0 01-.9 1.5H2a1 1 0 01-.9-1.5l5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  <path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
</svg>;

export default function FlagErrorPage() {
  const router = useRouter();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [form, setForm] = useState({
    error_type: '', wrong_value: '', correct_value: '', description: '',
  });
  const [loading, setLoading]  = useState(false);
  const [pageLoading, setPage] = useState(true);
  const [error, setError]      = useState<string | null>(null);
  const [success, setSuccess]  = useState(false);

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

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        .from('flags').select('id')
        .eq('transcript_id', transcript.id)
        .eq('student_id', session.user.id)
        .eq('error_type', form.error_type)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('You already have a pending flag for this error type. Please wait for the admin to respond before submitting again.');
      }

      // Unit 1 Sec 1.6 — SCM: flag creates timestamped audit entry
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

      // Unit 2 Sec 2.2.1 — Corrective Change: notify admin immediately
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
      }).catch(() => {});

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setLoading(false);
    }
  }

  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 60%,#0b1228 100%)';
  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: '#f1f5f9', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
    fontFamily: "'Segoe UI',system-ui,sans-serif",
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

  if (success) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background: BG,
        fontFamily:"'Segoe UI',system-ui,sans-serif", padding:'24px' }}>
        <style>{`@keyframes pop{0%{transform:scale(0.6);opacity:0}80%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ width:'100%', maxWidth:'400px', textAlign:'center' }}>
          <div style={{
            width:'72px', height:'72px', borderRadius:'16px', margin:'0 auto 24px',
            background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            animation:'pop 0.5s cubic-bezier(0.16,1,0.3,1) forwards', color:'#86efac',
          }}>
            <IcoCheck />
          </div>
          <h2 style={{ color:'#f1f5f9', fontWeight:700, fontSize:'1.4rem', marginBottom:'10px' }}>
            Flag Submitted</h2>
          <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.7, marginBottom:'28px' }}>
            Your error report has been submitted and your faculty administrator
            has been notified. Track its status on your dashboard.
          </p>
          <a href="/student/dashboard" style={{
            display:'block', width:'100%', padding:'12px',
            background:'#3b82f6', color:'white', fontWeight:600, fontSize:'14px',
            borderRadius:'8px', textDecoration:'none', textAlign:'center',
          }}>Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background: BG,
      fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp:focus{border-color:rgba(59,130,246,0.5)!important;background:rgba(59,130,246,0.06)!important}
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
            background:'#3b82f6',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:'11px' }}>TC</span>
          </div>
          <div>
            <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:'14px' }}>TranscriptCheck</span>
            <span style={{ color:'#475569', fontSize:'12px', marginLeft:'8px' }}>Flag an Error</span>
          </div>
        </div>
        <a href="/student/dashboard" style={{
          background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
          color:'#94a3b8', fontSize:'12px', fontWeight:500,
          padding:'6px 14px', borderRadius:'8px', textDecoration:'none',
        }}>Dashboard</a>
      </nav>

      <main style={{ maxWidth:'660px', margin:'0 auto', padding:'32px 28px',
        animation:'fadeUp 0.5s ease forwards' }}>

        {/* Header */}
        <div style={{ marginBottom:'24px' }}>
          <h1 style={{ color:'#f1f5f9', fontSize:'1.5rem', fontWeight:700, marginBottom:'8px' }}>
            Report a Transcript Error
          </h1>
          <p style={{ color:'#475569', fontSize:'13px', lineHeight:1.7 }}>
            Describe the error found on your transcript. Your administrator will review the
            report and take corrective action — forming a formal audit trail per Unit 2 Section 2.2.1.
          </p>
        </div>

        {/* No transcript warning */}
        {!transcript && (
          <div style={{
            background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)',
            borderRadius:'10px', padding:'14px 16px', marginBottom:'18px',
            display:'flex', alignItems:'flex-start', gap:'10px', color:'#fbbf24',
          }}>
            <div style={{ flexShrink:0, marginTop:'1px' }}><IcoWarn /></div>
            <p style={{ fontSize:'13px', lineHeight:1.5 }}>
              No transcript has been uploaded for your account yet.
              You can only flag errors after your administrator uploads your transcript.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{
            background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)',
            borderRadius:'10px', padding:'12px 16px', marginBottom:'18px',
            display:'flex', alignItems:'flex-start', gap:'10px', color:'#fca5a5',
          }}>
            <div style={{ flexShrink:0, marginTop:'1px' }}><IcoWarn /></div>
            <p style={{ fontSize:'13px', lineHeight:1.5 }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Error type */}
          <div>
            <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.05em',
              display:'block', marginBottom:'8px' }}>Type of Error</label>
            <select name="error_type" value={form.error_type} onChange={onChange}
              disabled={!transcript} className="inp"
              style={{ ...inp, cursor: !transcript ? 'not-allowed' : 'pointer',
                opacity: !transcript ? 0.5 : 1 }}
              onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}>
              <option value="">— Select the type of error —</option>
              {ERROR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {[
              { name:'wrong_value', label:'Incorrect Value (on transcript)', placeholder:'e.g. OLAR OFOR GLORIA' },
              { name:'correct_value', label:'Correct Value (should be)', placeholder:'e.g. OFOR GLORIA OLAR' },
            ].map(field => (
              <div key={field.name}>
                <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.05em',
                  display:'block', marginBottom:'8px' }}>{field.label}</label>
                <input name={field.name}
                  value={(form as any)[field.name]} onChange={onChange}
                  placeholder={field.placeholder}
                  disabled={!transcript} className="inp"
                  style={{ ...inp, opacity: !transcript ? 0.5 : 1 }}
                  onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label style={{ color:'#94a3b8', fontSize:'11px', fontWeight:600,
              textTransform:'uppercase', letterSpacing:'0.05em',
              display:'block', marginBottom:'8px' }}>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={4}
              placeholder="Explain the error in your own words. Include supporting details that will help the administrator verify and correct it."
              disabled={!transcript} className="inp"
              style={{ ...inp, resize:'none', opacity: !transcript ? 0.5 : 1, lineHeight:1.6 }}
              onFocus={e => { e.target.style.borderColor='rgba(59,130,246,0.5)'; e.target.style.background='rgba(59,130,246,0.06)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.08)'; e.target.style.background='rgba(255,255,255,0.05)'; }}
            />
          </div>

          <button type="submit" disabled={loading || !transcript} style={{
            width:'100%', padding:'12px', borderRadius:'8px', border:'none',
            background: (loading || !transcript) ? 'rgba(59,130,246,0.35)' : '#3b82f6',
            color:'white', fontWeight:600, fontSize:'14px',
            cursor: (loading || !transcript) ? 'not-allowed' : 'pointer',
            transition:'all 0.2s', display:'flex', alignItems:'center',
            justifyContent:'center', gap:'8px',
          }}>
            {loading ? (
              <>
                <div style={{ width:'15px', height:'15px', borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid white',
                  animation:'spin 0.7s linear infinite', flexShrink:0 }} />
                Submitting...
              </>
            ) : (
              <>
                <IcoFlag />
                Submit Error Flag
              </>
            )}
          </button>

          <p style={{ color:'#334155', fontSize:'11px', textAlign:'center', marginTop:'-8px' }}>
            Your administrator will be notified immediately when you submit.
          </p>
        </form>
      </main>
    </div>
  );
}
