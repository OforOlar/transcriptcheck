'use client';

const STUDENT_STEPS = [
  {
    number: '01',
    title: 'Create Your Account',
    desc: 'Register with your matricule number and university email. Verify your account with the OTP code sent to your inbox.',
  },
  {
    number: '02',
    title: 'View Your Transcript',
    desc: 'Once your administrator uploads your transcript, log in to view the full PDF directly in your browser.',
  },
  {
    number: '03',
    title: 'Flag Any Errors',
    desc: 'Found a mistake? Submit a formal error flag with the incorrect value, the correct value, and a clear description.',
  },
  {
    number: '04',
    title: 'Track Your Flag',
    desc: 'Monitor the status of your flag in real time; from pending to under review to resolved - all on your dashboard.',
  },
];

const ADMIN_STEPS = [
  {
    number: '01',
    title: 'Register as Administrator',
    desc: 'Create your admin account linked to your faculty. You will only see students and transcripts within your faculty.',
  },
  {
    number: '02',
    title: 'Upload Student Transcripts',
    desc: 'Select a student and upload their PDF transcript. The AI scanner automatically checks for anomalies on every upload.',
  },
  {
    number: '03',
    title: 'Receive Flag Notifications',
    desc: 'When a student flags an error, you receive an instant email with the full details of the reported discrepancy.',
  },
  {
    number: '04',
    title: 'Review and Resolve',
    desc: 'Correct the transcript, re-upload the updated PDF, add a response for the student, and mark the flag resolved.',
  },
];

const FEATURES = [
  {
    title: 'Secure Role-Based Access',
    desc: 'Students and administrators each have separate, isolated portals. No cross-access is possible between roles.',
  },
  {
    title: 'AI Anomaly Detection',
    desc: 'Every uploaded transcript is automatically scanned for impossible GPA values, suspicious dates, and malformed course codes.',
  },
  {
    title: 'Real-Time Notifications',
    desc: 'Students are notified when their transcript is uploaded or corrected. Admins are notified the moment a flag is submitted.',
  },
  {
    title: 'Complete Audit Trail',
    desc: 'Every flag, status change, and admin response is permanently recorded with a timestamp for full traceability.',
  },
  {
    title: 'Signed PDF Viewing',
    desc: 'Transcript PDFs are stored privately. Access is only granted through secure signed links that expire after one hour.',
  },
  {
    title: 'Faculty-Scoped Management',
    desc: 'Administrators only see and manage students registered within their own faculty, keeping data clean and private.',
  },
];

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(145deg,#050c08 0%,#071210 40%,#0a1810 70%,#050c08 100%)',
      fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .portal-student:hover { transform:translateY(-3px); box-shadow:0 16px 48px rgba(20,184,166,0.55)!important; }
        .portal-admin:hover   { transform:translateY(-3px); background:rgba(255,255,255,0.1)!important; }
        .nav-link:hover       { color:#5eead4!important; }
        .feature-card:hover   { border-color:rgba(20,184,166,0.3)!important; transform:translateY(-2px); }
        .footer-link:hover    { color:#14b8a6!important; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-120px', left: '-120px',
        width: '500px', height: '500px', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle,rgba(20,184,166,0.1) 0%,transparent 70%)',
        animation: 'pulse 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '-100px', right: '-100px',
        width: '450px', height: '450px', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)',
      }} />

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,12,8,0.85)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(20,184,166,0.08)',
        padding: '0 3rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '9px',
            background: 'linear-gradient(135deg,#14b8a6,#10b981)',
            boxShadow: '0 0 18px rgba(20,184,166,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '13px' }}>TC</span>
          </div>
          <div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              TranscriptCheck
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: '8px' }}>
              University of Buea
            </span>
          </div>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/student/login" className="nav-link" style={{
            color: '#9ca3af', fontSize: '13px', fontWeight: 500,
            padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'color 0.2s',
          }}>Student Login</a>
          <a href="/admin/login" className="nav-link" style={{
            color: '#9ca3af', fontSize: '13px', fontWeight: 500,
            padding: '7px 16px', borderRadius: '8px', textDecoration: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'color 0.2s',
          }}>Admin Login</a>
        </nav>
      </header>

      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <section style={{
          maxWidth: '780px', margin: '0 auto',
          padding: '100px 2rem 80px', textAlign: 'center',
          animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: '20px', padding: '6px 18px', marginBottom: '36px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#14b8a6', boxShadow: '0 0 8px #14b8a6',
            }} />
            <span style={{ color: '#5eead4', fontSize: '12px', fontWeight: 600,
              letterSpacing: '0.04em' }}>
              Level 400 Students &nbsp;&bull;&nbsp; CT23 and below &nbsp;&bull;&nbsp; 2025/2026
            </span>
          </div>

          <h1 style={{
            color: 'white', fontWeight: 800,
            fontSize: 'clamp(2.2rem,5vw,3.5rem)',
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '24px',
          }}>
            Verify Your Transcript
            <br />
            <span style={{
              background: 'linear-gradient(90deg,#14b8a6,#34d399)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Before It Is Issued.
            </span>
          </h1>

          <p style={{
            color: '#9ca3af', fontSize: '1.15rem', lineHeight: 1.8,
            maxWidth: '580px', margin: '0 auto 56px',
          }}>
            TranscriptCheck gives University of Buea students full visibility
            into their academic records and a formal, structured process to
            report and correct errors before transcripts are printed and issued.
          </p>

          <div style={{
            display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <a href="/student/register" className="portal-student" style={{
              padding: '15px 36px',
              background: 'linear-gradient(135deg,#14b8a6,#10b981)',
              color: 'white', fontWeight: 700, fontSize: '15px',
              borderRadius: '14px', textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(20,184,166,0.4)',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              Get Started as Student
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="/admin/login" className="portal-admin" style={{
              padding: '15px 36px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white', fontWeight: 700, fontSize: '15px',
              borderRadius: '14px', textDecoration: 'none',
              transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              backdropFilter: 'blur(12px)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}>
              Admin Portal
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div style={{
          maxWidth: '900px', margin: '0 auto', padding: '0 2rem',
          height: '1px',
          background: 'linear-gradient(90deg,transparent,rgba(20,184,166,0.2),transparent)',
        }} />

        {/* ── STUDENT STEPS ── */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 2rem' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '64px', alignItems: 'start',
          }}>
            <div style={{ paddingTop: '8px' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(20,184,166,0.1)',
                border: '1px solid rgba(20,184,166,0.2)',
                borderRadius: '8px', padding: '4px 12px', marginBottom: '20px',
              }}>
                <span style={{ color: '#14b8a6', fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  For Students
                </span>
              </div>
              <h2 style={{
                color: 'white', fontWeight: 700,
                fontSize: 'clamp(1.5rem,3vw,2.1rem)',
                letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '20px',
              }}>
                Take control of your academic record
              </h2>
              <p style={{
                color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: '32px',
              }}>
                Your transcript is one of the most important documents you will
                receive from the university. TranscriptCheck ensures you can
                review it, verify every detail, and formally report any
                discrepancy before it is officially printed and issued.
              </p>
              <a href="/student/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 24px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                color: 'white', fontWeight: 600, fontSize: '14px',
                borderRadius: '10px', textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                transition: 'all 0.2s',
              }}>
                Register Now
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STUDENT_STEPS.map((step, i) => (
                <div key={step.number} style={{
                  display: 'flex', gap: '20px',
                  paddingBottom: i < STUDENT_STEPS.length - 1 ? '28px' : '0',
                }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', flexShrink: 0,
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'rgba(20,184,166,0.12)',
                      border: '1px solid rgba(20,184,166,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: '#14b8a6', fontWeight: 700, fontSize: '13px' }}>
                        {step.number}
                      </span>
                    </div>
                    {i < STUDENT_STEPS.length - 1 && (
                      <div style={{
                        width: '1px', flex: 1, marginTop: '8px',
                        background: 'linear-gradient(180deg,rgba(20,184,166,0.3),rgba(20,184,166,0.05))',
                      }} />
                    )}
                  </div>
                  <div style={{
                    paddingTop: '8px',
                    paddingBottom: i < STUDENT_STEPS.length - 1 ? '16px' : '0',
                  }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '15px',
                      marginBottom: '6px' }}>{step.title}</p>
                    <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.7 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div style={{
          maxWidth: '900px', margin: '0 auto', padding: '0 2rem',
          height: '1px',
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)',
        }} />

        {/* ── ADMIN STEPS ── */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 2rem' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '64px', alignItems: 'start',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ADMIN_STEPS.map((step, i) => (
                <div key={step.number} style={{
                  display: 'flex', gap: '20px',
                  paddingBottom: i < ADMIN_STEPS.length - 1 ? '28px' : '0',
                }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', flexShrink: 0,
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '13px' }}>
                        {step.number}
                      </span>
                    </div>
                    {i < ADMIN_STEPS.length - 1 && (
                      <div style={{
                        width: '1px', flex: 1, marginTop: '8px',
                        background: 'linear-gradient(180deg,rgba(245,158,11,0.25),rgba(245,158,11,0.05))',
                      }} />
                    )}
                  </div>
                  <div style={{
                    paddingTop: '8px',
                    paddingBottom: i < ADMIN_STEPS.length - 1 ? '16px' : '0',
                  }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '15px',
                      marginBottom: '6px' }}>{step.title}</p>
                    <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.7 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: '8px' }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '8px', padding: '4px 12px', marginBottom: '20px',
              }}>
                <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  For Administrators
                </span>
              </div>
              <h2 style={{
                color: 'white', fontWeight: 700,
                fontSize: 'clamp(1.5rem,3vw,2.1rem)',
                letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '20px',
              }}>
                Manage transcripts for your entire faculty
              </h2>
              <p style={{
                color: '#6b7280', fontSize: '1rem', lineHeight: 1.8, marginBottom: '32px',
              }}>
                TranscriptCheck gives faculty administrators a dedicated portal
                to upload, manage, and correct student transcripts. Every action
                is tracked, every flag is logged, and students are notified
                automatically, keeping the process transparent and efficient.
              </p>
              <a href="/admin/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 24px',
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#fbbf24', fontWeight: 600, fontSize: '14px',
                borderRadius: '10px', textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                Admin Register
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="#fbbf24" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <div style={{
          maxWidth: '900px', margin: '0 auto', padding: '0 2rem',
          height: '1px',
          background: 'linear-gradient(90deg,transparent,rgba(20,184,166,0.2),transparent)',
        }} />

        {/* ── FEATURES ── */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{
              color: 'white', fontWeight: 700,
              fontSize: 'clamp(1.4rem,3vw,2rem)',
              letterSpacing: '-0.02em', marginBottom: '16px',
            }}>
              Built for accuracy. Designed for trust.
            </h2>
            <p style={{
              color: '#6b7280', fontSize: '1rem', maxWidth: '520px',
              margin: '0 auto', lineHeight: 1.8,
            }}>
              Every feature in TranscriptCheck exists to ensure your academic
              record is correct, secure, and always under your control.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
            gap: '16px',
          }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card" style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '24px',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                  marginBottom: '16px',
                }} />
                <h3 style={{ color: 'white', fontWeight: 600, fontSize: '15px',
                  marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: 1.75 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section style={{
          maxWidth: '680px', margin: '0 auto', padding: '0 2rem 100px',
          textAlign: 'center',
        }}>
          <div style={{
            background: 'rgba(20,184,166,0.05)',
            border: '1px solid rgba(20,184,166,0.15)',
            borderRadius: '24px', padding: '52px 40px',
          }}>
            <h2 style={{
              color: 'white', fontWeight: 700,
              fontSize: 'clamp(1.3rem,3vw,1.8rem)',
              letterSpacing: '-0.02em', marginBottom: '16px',
            }}>
              Ready to check your transcript?
            </h2>
            <p style={{
              color: '#9ca3af', fontSize: '1rem', lineHeight: 1.8, marginBottom: '36px',
            }}>
              Register your student account today. Your administrator will
              upload your transcript once it is ready, and you will be
              notified by email immediately.
            </p>
            <div style={{
              display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
            }}>
              <a href="/student/register" style={{
                padding: '13px 28px',
                background: 'linear-gradient(135deg,#14b8a6,#10b981)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                borderRadius: '12px', textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(20,184,166,0.35)',
                transition: 'all 0.25s',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                Register as Student
              </a>
              <a href="/student/login" style={{
                padding: '13px 28px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontWeight: 700, fontSize: '14px',
                borderRadius: '12px', textDecoration: 'none',
                transition: 'all 0.25s',
              }}>
                Student Login
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 1,
      }}>
        <p style={{ color: '#374151', fontSize: '13px' }}>
          TranscriptCheck &nbsp;&bull;&nbsp; University of Buea, College of Technology &nbsp;&bull;&nbsp; 2025/2026
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'Student Login',    href: '/student/login'    },
            { label: 'Student Register', href: '/student/register' },
            { label: 'Admin Login',      href: '/admin/login'      },
          ].map(link => (
            <a key={link.href} href={link.href} className="footer-link" style={{
              color: '#374151', fontSize: '13px', textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}