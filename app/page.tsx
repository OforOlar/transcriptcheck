'use client';

const STUDENT_STEPS = [
  { number: '01', title: 'Create Your Account', desc: 'Register with your matricule number and university email. Verify your account with the OTP code sent to your inbox.' },
  { number: '02', title: 'View Your Transcript', desc: 'Once your administrator uploads your transcript, log in to view the full PDF directly in your browser.' },
  { number: '03', title: 'Flag Any Errors', desc: 'Found a mistake? Submit a formal error flag with the incorrect value, the correct value, and a clear description.' },
  { number: '04', title: 'Track Your Flag', desc: 'Monitor the status of your flag in real time — from pending to under review to resolved — all on your dashboard.' },
];

const ADMIN_STEPS = [
  { number: '01', title: 'Register as Administrator', desc: 'Create your admin account linked to your faculty. You will only see students and transcripts within your faculty.' },
  { number: '02', title: 'Upload Student Transcripts', desc: 'Select a student and upload their PDF transcript. The AI scanner automatically checks for anomalies on every upload.' },
  { number: '03', title: 'Receive Flag Notifications', desc: 'When a student flags an error, you receive an instant email with the full details of the reported discrepancy.' },
  { number: '04', title: 'Review and Resolve', desc: 'Correct the transcript, re-upload the updated PDF, add a response for the student, and mark the flag resolved.' },
];

const FEATURES = [
  { title: 'Secure Role-Based Access', desc: 'Students and administrators each have separate, isolated portals. No cross-access is possible between roles.' },
  { title: 'AI Anomaly Detection', desc: 'Every uploaded transcript is automatically scanned for impossible GPA values, suspicious dates, and malformed course codes.' },
  { title: 'Real-Time Notifications', desc: 'Students are notified when their transcript is uploaded or corrected. Admins are notified the moment a flag is submitted.' },
  { title: 'Complete Audit Trail', desc: 'Every flag, status change, and admin response is permanently recorded with a timestamp for full traceability.' },
  { title: 'Signed PDF Viewing', desc: 'Transcript PDFs are stored privately. Access is only granted through secure signed links that expire after one hour.' },
  { title: 'Faculty-Scoped Management', desc: 'Administrators only see and manage students registered within their own faculty, keeping data clean and private.' },
];

export default function HomePage() {
  const BG = 'linear-gradient(135deg,#060b18 0%,#0d1530 50%,#0b1228 100%)';

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column',
      background: BG, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .btn-primary:hover { background:#2563eb!important; transform:translateY(-1px); }
        .btn-ghost:hover { background:rgba(255,255,255,0.09)!important; }
        .nav-link:hover { color:#93c5fd!important; }
        .feature-card:hover { border-color:rgba(59,130,246,0.2)!important; }
        .footer-link:hover { color:#60a5fa!important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* HEADER */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'rgba(6,11,24,0.85)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        padding:'0 3rem', height:'60px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px',
            background:'#3b82f6',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:'11px' }}>TC</span>
          </div>
          <div>
            <span style={{ color:'#f1f5f9', fontWeight:700, fontSize:'15px' }}>TranscriptCheck</span>
            <span style={{ color:'#334155', fontSize:'12px', marginLeft:'8px' }}>University of Buea</span>
          </div>
        </div>
        <nav style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <a href="/student/login" className="nav-link" style={{
            color:'#475569', fontSize:'13px', fontWeight:500,
            padding:'6px 14px', borderRadius:'7px', textDecoration:'none',
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            transition:'color 0.2s',
          }}>Student Login</a>
          <a href="/admin/login" className="nav-link" style={{
            color:'#475569', fontSize:'13px', fontWeight:500,
            padding:'6px 14px', borderRadius:'7px', textDecoration:'none',
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
            transition:'color 0.2s',
          }}>Admin Login</a>
        </nav>
      </header>

      <main style={{ flex:1 }}>

        {/* HERO */}
        <section style={{
          maxWidth:'740px', margin:'0 auto',
          padding:'96px 2rem 72px', textAlign:'center',
          animation:'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
            borderRadius:'20px', padding:'5px 16px', marginBottom:'32px',
          }}>
            <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#3b82f6' }} />
            <span style={{ color:'#93c5fd', fontSize:'12px', fontWeight:600, letterSpacing:'0.03em' }}>
              Level 400 Students &nbsp;&bull;&nbsp; CT23 and below &nbsp;&bull;&nbsp; 2025/2026
            </span>
          </div>

          <h1 style={{ color:'#f1f5f9', fontWeight:800,
            fontSize:'clamp(2rem,5vw,3.2rem)',
            letterSpacing:'-0.03em', lineHeight:1.15, marginBottom:'20px' }}>
            Verify Your Transcript
            <br />
            <span style={{ color:'#60a5fa' }}>Before It Is Issued.</span>
          </h1>

          <p style={{ color:'#94a3b8', fontSize:'1.05rem', lineHeight:1.8,
            maxWidth:'540px', margin:'0 auto 48px' }}>
            TranscriptCheck gives University of Buea students full visibility into their
            academic records and a formal, structured process to report and correct
            errors before transcripts are printed and issued.
          </p>

          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/student/register" className="btn-primary" style={{
              padding:'12px 32px', background:'#3b82f6',
              color:'white', fontWeight:700, fontSize:'14px',
              borderRadius:'8px', textDecoration:'none',
              transition:'all 0.2s',
              display:'inline-flex', alignItems:'center', gap:'8px',
            }}>
              Get Started as Student
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 4l4 3-4 3" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="/admin/login" className="btn-ghost" style={{
              padding:'12px 32px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              color:'#f1f5f9', fontWeight:700, fontSize:'14px',
              borderRadius:'8px', textDecoration:'none',
              transition:'all 0.2s',
              display:'inline-flex', alignItems:'center', gap:'8px',
            }}>
              Admin Portal
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 4l4 3-4 3" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 2rem',
          height:'1px', background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.2),transparent)' }} />

        {/* STUDENT STEPS */}
        <section style={{ maxWidth:'1060px', margin:'0 auto', padding:'72px 2rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'start' }}>
            <div style={{ paddingTop:'8px' }}>
              <div style={{
                display:'inline-block',
                background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)',
                borderRadius:'6px', padding:'3px 10px', marginBottom:'18px',
              }}>
                <span style={{ color:'#60a5fa', fontSize:'10px', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.08em' }}>For Students</span>
              </div>
              <h2 style={{ color:'#f1f5f9', fontWeight:700,
                fontSize:'clamp(1.4rem,2.5vw,1.9rem)',
                letterSpacing:'-0.02em', lineHeight:1.3, marginBottom:'16px' }}>
                Take control of your academic record
              </h2>
              <p style={{ color:'#475569', fontSize:'14px', lineHeight:1.8, marginBottom:'28px' }}>
                Your transcript is one of the most important documents you will receive
                from the university. TranscriptCheck ensures you can review it,
                verify every detail, and formally report any discrepancy
                before it is officially printed and issued.
              </p>
              <a href="/student/register" style={{
                display:'inline-flex', alignItems:'center', gap:'7px',
                padding:'10px 22px', background:'#3b82f6',
                color:'white', fontWeight:600, fontSize:'13px',
                borderRadius:'8px', textDecoration:'none',
                transition:'all 0.2s',
              }}>
                Register Now
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

            <div style={{ display:'flex', flexDirection:'column' }}>
              {STUDENT_STEPS.map((step, i) => (
                <div key={step.number} style={{ display:'flex', gap:'16px',
                  paddingBottom: i < STUDENT_STEPS.length - 1 ? '24px' : '0' }}>
                  <div style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', flexShrink:0 }}>
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'50%',
                      background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      <span style={{ color:'#60a5fa', fontWeight:700, fontSize:'11px' }}>
                        {step.number}</span>
                    </div>
                    {i < STUDENT_STEPS.length - 1 && (
                      <div style={{ width:'1px', flex:1, marginTop:'6px',
                        background:'linear-gradient(180deg,rgba(59,130,246,0.25),rgba(59,130,246,0.04))' }} />
                    )}
                  </div>
                  <div style={{ paddingTop:'6px',
                    paddingBottom: i < STUDENT_STEPS.length - 1 ? '12px' : '0' }}>
                    <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px',
                      marginBottom:'5px' }}>{step.title}</p>
                    <p style={{ color:'#475569', fontSize:'13px', lineHeight:1.7 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 2rem',
          height:'1px', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)' }} />

        {/* ADMIN STEPS */}
        <section style={{ maxWidth:'1060px', margin:'0 auto', padding:'72px 2rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'60px', alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {ADMIN_STEPS.map((step, i) => (
                <div key={step.number} style={{ display:'flex', gap:'16px',
                  paddingBottom: i < ADMIN_STEPS.length - 1 ? '24px' : '0' }}>
                  <div style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', flexShrink:0 }}>
                    <div style={{
                      width:'36px', height:'36px', borderRadius:'50%',
                      background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      <span style={{ color:'#fbbf24', fontWeight:700, fontSize:'11px' }}>
                        {step.number}</span>
                    </div>
                    {i < ADMIN_STEPS.length - 1 && (
                      <div style={{ width:'1px', flex:1, marginTop:'6px',
                        background:'linear-gradient(180deg,rgba(245,158,11,0.2),rgba(245,158,11,0.03))' }} />
                    )}
                  </div>
                  <div style={{ paddingTop:'6px',
                    paddingBottom: i < ADMIN_STEPS.length - 1 ? '12px' : '0' }}>
                    <p style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px',
                      marginBottom:'5px' }}>{step.title}</p>
                    <p style={{ color:'#475569', fontSize:'13px', lineHeight:1.7 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop:'8px' }}>
              <div style={{
                display:'inline-block',
                background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
                borderRadius:'6px', padding:'3px 10px', marginBottom:'18px',
              }}>
                <span style={{ color:'#fbbf24', fontSize:'10px', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.08em' }}>For Administrators</span>
              </div>
              <h2 style={{ color:'#f1f5f9', fontWeight:700,
                fontSize:'clamp(1.4rem,2.5vw,1.9rem)',
                letterSpacing:'-0.02em', lineHeight:1.3, marginBottom:'16px' }}>
                Manage transcripts for your entire faculty
              </h2>
              <p style={{ color:'#475569', fontSize:'14px', lineHeight:1.8, marginBottom:'28px' }}>
                TranscriptCheck gives faculty administrators a dedicated portal to upload,
                manage, and correct student transcripts. Every action is tracked,
                every flag is logged, and students are notified automatically.
              </p>
              <a href="/admin/register" style={{
                display:'inline-flex', alignItems:'center', gap:'7px',
                padding:'10px 22px',
                background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.22)',
                color:'#fbbf24', fontWeight:600, fontSize:'13px',
                borderRadius:'8px', textDecoration:'none',
                transition:'all 0.2s',
              }}>
                Admin Register
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 2rem',
          height:'1px', background:'linear-gradient(90deg,transparent,rgba(59,130,246,0.15),transparent)' }} />

        {/* FEATURES */}
        <section style={{ maxWidth:'1060px', margin:'0 auto', padding:'72px 2rem' }}>
          <div style={{ textAlign:'center', marginBottom:'48px' }}>
            <h2 style={{ color:'#f1f5f9', fontWeight:700,
              fontSize:'clamp(1.3rem,2.5vw,1.8rem)',
              letterSpacing:'-0.02em', marginBottom:'12px' }}>
              Built for accuracy. Designed for trust.
            </h2>
            <p style={{ color:'#475569', fontSize:'14px', maxWidth:'480px',
              margin:'0 auto', lineHeight:1.8 }}>
              Every feature in TranscriptCheck exists to ensure your academic
              record is correct, secure, and always under your control.
            </p>
          </div>

          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:'12px' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:'10px', padding:'20px',
                transition:'border-color 0.2s',
              }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%',
                  background:'#3b82f6', marginBottom:'14px' }} />
                <h3 style={{ color:'#f1f5f9', fontWeight:600, fontSize:'14px',
                  marginBottom:'8px' }}>{f.title}</h3>
                <p style={{ color:'#475569', fontSize:'13px', lineHeight:1.75 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth:'620px', margin:'0 auto', padding:'0 2rem 88px', textAlign:'center' }}>
          <div style={{ background:'rgba(59,130,246,0.05)',
            border:'1px solid rgba(59,130,246,0.14)',
            borderRadius:'16px', padding:'48px 36px' }}>
            <h2 style={{ color:'#f1f5f9', fontWeight:700,
              fontSize:'clamp(1.2rem,2.5vw,1.6rem)',
              letterSpacing:'-0.02em', marginBottom:'14px' }}>
              Ready to check your transcript?
            </h2>
            <p style={{ color:'#94a3b8', fontSize:'14px', lineHeight:1.8, marginBottom:'32px' }}>
              Register your student account today. Your administrator will upload
              your transcript once it is ready, and you will be notified by email immediately.
            </p>
            <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
              <a href="/student/register" className="btn-primary" style={{
                padding:'11px 26px', background:'#3b82f6',
                color:'white', fontWeight:700, fontSize:'13px',
                borderRadius:'8px', textDecoration:'none',
                transition:'all 0.2s',
              }}>Register as Student</a>
              <a href="/student/login" className="btn-ghost" style={{
                padding:'11px 26px',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
                color:'#f1f5f9', fontWeight:700, fontSize:'13px',
                borderRadius:'8px', textDecoration:'none',
                transition:'all 0.2s',
              }}>Student Login</a>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)',
        padding:'20px 3rem',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:'10px' }}>
        <p style={{ color:'#1e3a5f', fontSize:'12px' }}>
          TranscriptCheck &nbsp;&bull;&nbsp; University of Buea, College of Technology &nbsp;&bull;&nbsp; 2025/2026
        </p>
        <div style={{ display:'flex', gap:'18px' }}>
          {[
            { label:'Student Login',    href:'/student/login'    },
            { label:'Student Register', href:'/student/register' },
            { label:'Admin Login',      href:'/admin/login'      },
          ].map(link => (
            <a key={link.href} href={link.href} className="footer-link" style={{
              color:'#1e3a5f', fontSize:'12px', textDecoration:'none', transition:'color 0.2s',
            }}>
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
