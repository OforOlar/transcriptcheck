'use client';

import { useState, useEffect, useRef } from 'react';

// ─── tiny inline SVG icons ───────────────────────────────────────────────────
const IcoShield = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 1l5.5 2.5v4.2C13.5 11 11 13.5 8 15 5 13.5 2.5 11 2.5 7.7V3.5L8 1z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoDoc = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoRobot = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="5.5" cy="10" r="1" fill="currentColor"/>
    <circle cx="10.5" cy="10" r="1" fill="currentColor"/>
    <path d="M6 13h4M8 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="2" r="1.2" fill="currentColor"/>
  </svg>
);
const IcoClock = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoMail = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5h9M8 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoUser = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3 19c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IcoAdmin = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2l7.5 3.4v5.7c0 4.5-3.7 7.5-7.5 9.5-3.8-2-7.5-5-7.5-9.5V5.4L11 2z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FEATURES = [
  { Icon: IcoShield, title: 'Role Based Access Control',
    desc: 'Students and admins live in completely isolated portals. No cross-access is possible at any layer of the system.' },
  { Icon: IcoRobot, title: 'AI Anomaly Detection',
    desc: 'Every upload triggers an automated scan that catches impossible GPA values, suspicious dates, and malformed course codes.' },
  { Icon: IcoDoc, title: 'Secure PDF Viewer',
    desc: 'Transcripts are stored privately. Students view them through signed links that expire after one hour. Never publicly accessible.' },
  { Icon: () => (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M3 14V2h9.5l-2.5 4 2.5 4H3" stroke="currentColor" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 14v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ), title: 'Structured Error Flags',
    desc: 'Students formally report errors with the incorrect value, correct value, and a description — creating a documented correction request.' },
  { Icon: IcoClock, title: 'Complete Audit Trail',
    desc: 'Every flag, status change, and admin response is permanently timestamped. A full change history per Unit 1 Section 1.6.' },
  { Icon: IcoMail, title: 'Email Notifications',
    desc: 'Admins are emailed the moment a student flags an error. Students are notified when their transcript is uploaded or a flag is resolved.' },
];

const STUDENT_STEPS = [
  { n: '01', title: 'Register',      desc: 'Create your account with your matricule (CT23 or below) and verify your email.' },
  { n: '02', title: 'View',          desc: 'Once your administrator uploads your transcript, view the full PDF in your browser.' },
  { n: '03', title: 'Flag',          desc: 'Found a mistake? Submit a formal error flag with the incorrect and correct values.' },
  { n: '04', title: 'Track',         desc: 'Monitor your flag from pending to under review to resolved, all on your dashboard.' },
];
const ADMIN_STEPS = [
  { n: '01', title: 'Register',      desc: 'Create your faculty administrator account. One admin per faculty is enforced.' },
  { n: '02', title: 'Upload',        desc: 'Select a student and upload their PDF. The AI scanner runs automatically on every upload.' },
  { n: '03', title: 'Receive',       desc: 'Get an instant email notification the moment a student submits an error flag.' },
  { n: '04', title: 'Resolve',       desc: 'Review the flag, respond to the student, re-upload the corrected transcript, and close the flag.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled]   = useState(false);
  const heroRef  = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);

  // Sticky nav + parallax
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
      if (heroBgRef.current) {
        heroBgRef.current.style.transform =
          `scale(1.0) translateY(${window.scrollY * 0.18}px)`;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const delay = parseFloat(
              (entry.target as HTMLElement).style.transitionDelay || '0'
            ) * 1000;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const S = {
    // common inline style helpers
    surface:  { background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' },
    tag: (gold?: boolean) => ({
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      padding: '4px 12px', borderRadius: '4px', marginBottom: '16px',
      background: gold ? 'rgba(201,148,42,0.1)' : 'rgba(59,130,246,0.1)',
      border: `1px solid ${gold ? 'rgba(201,148,42,0.22)' : 'rgba(59,130,246,0.2)'}`,
      color: gold ? '#f0b429' : '#60a5fa',
    }),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#040810', color: '#f8fafc',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── GOOGLE FONTS ── */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
        rel="stylesheet" />

      {/* ── GLOBAL CSS (animations, hover states, media queries) ── */}
      <style>{`
        :root {
          --navy-deepest: #040810;
          --navy-deep:    #060c1a;
          --blue:         #2563eb;
          --blue-bright:  #3b82f6;
          --blue-glow:    #60a5fa;
          --gold:         #c9942a;
          --gold-bright:  #f0b429;
          --gold-light:   #fcd34d;
          --text-muted:   #94a3b8;
          --text-dim:     #475569;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #040810; }
        ::-webkit-scrollbar-thumb { background: #112147; border-radius: 3px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes badgeSlide {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Scroll reveal */
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
                      transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        /* Hero headline gold shimmer */
        .headline-gold {
          background: linear-gradient(135deg, #f0b429 0%, #fcd34d 50%, #c9942a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        /* Pulse dot */
        .pulse-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--blue-bright);
          position: relative; display: inline-block;
        }
        .pulse-dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--blue-bright);
          animation: pulseRing 2s ease-out infinite;
        }

        /* Buttons */
        .btn { display: inline-flex; align-items: center; gap: 9px;
          padding: 13px 28px; border-radius: 10px; font-size: 14px;
          font-weight: 700; text-decoration: none; cursor: pointer;
          border: none; white-space: nowrap; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
        .btn-gold {
          background: linear-gradient(135deg, #c9942a, #f0b429);
          color: #1a0e00;
          box-shadow: 0 8px 28px rgba(201,148,42,0.35); }
        .btn-gold:hover { transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(240,180,41,0.45); }
        .btn-blue {
          background: var(--blue);
          color: white;
          box-shadow: 0 8px 28px rgba(37,99,235,0.38); }
        .btn-blue:hover { background: var(--blue-bright);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(59,130,246,0.42); }
        .btn-ghost {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.13);
          color: rgba(255,255,255,0.85);
          backdrop-filter: blur(10px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px); color: white; }

        /* Nav link */
        .nav-link { color: #475569; font-size: 13px; font-weight: 500;
          padding: 7px 15px; border-radius: 8px; text-decoration: none;
          transition: color 0.2s, background 0.2s;
          border: 1px solid transparent; }
        .nav-link:hover { color: #f8fafc; background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.08); }
        .nav-link.cta { background: var(--blue); color: white;
          border-color: transparent; font-weight: 600; }
        .nav-link.cta:hover { background: var(--blue-bright); }

        /* Trust strip icon item */
        .trust-item { display: flex; align-items: center; gap: 9px;
          color: #475569; font-size: 12px; font-weight: 500;
          letter-spacing: 0.04em; }
        .trust-item svg { color: #c9942a; flex-shrink: 0; }

        /* Portal cards */
        .portal-card { border-radius: 20px; padding: 36px;
          position: relative; overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .portal-card:hover { transform: translateY(-4px); }
        .portal-student { background: linear-gradient(135deg,rgba(37,99,235,0.12) 0%,rgba(59,130,246,0.05) 100%);
          border: 1px solid rgba(59,130,246,0.2); }
        .portal-admin { background: linear-gradient(135deg,rgba(201,148,42,0.1) 0%,rgba(240,180,41,0.04) 100%);
          border: 1px solid rgba(201,148,42,0.22); }

        /* Feature cards */
        .feature-card { background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 26px;
          position: relative; overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .feature-card::before { content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg,transparent,#3b82f6,transparent);
          opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { border-color: rgba(59,130,246,0.25);
          transform: translateY(-3px);
          background: rgba(255,255,255,0.06); }
        .feature-card:hover::before { opacity: 1; }

        /* Footer links */
        .footer-link { color: #475569; font-size: 12px; text-decoration: none;
          transition: color 0.2s; }
        .footer-link:hover { color: #60a5fa; }

        /* Scroll hint */
        @keyframes scrollBob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(4px); }
        }
        .scroll-wheel { animation: scrollBob 1.5s ease-in-out infinite; }

        /* Section heading font */
        .serif { font-family: 'Playfair Display', Georgia, serif; }

        /* Responsive */
        @media (max-width: 900px) {
          .who-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-stats { flex-direction: column !important; gap: 12px !important; }
          .stat-div::before { display: none !important; }
          footer { flex-direction: column; align-items: flex-start !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-ctas { flex-direction: column; align-items: center; }
          .trust-strip { gap: 20px !important; flex-wrap: wrap; }
          .cta-btns { flex-direction: column; align-items: center; }
        }
      `}</style>

      {/* ╔═══════════════════════════════════════╗
          ║              NAVIGATION               ║
          ╚═══════════════════════════════════════╝ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        padding: '0 3rem', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(4,8,16,0.93)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.4s ease',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '13px',
          textDecoration: 'none' }}>
          {/* UB Logo — borderRadius 50% makes it round like the crest shape */}
          <img
            src="/images/ub-logo.png"
            alt="University of Buea"
            style={{
              width: '42px', height: '42px', objectFit: 'cover',
              borderRadius: '50%',
              filter: 'drop-shadow(0 0 10px rgba(201,148,42,0.4))',
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '17px',
              lineHeight: 1, fontFamily: "'Playfair Display', serif",
              letterSpacing: '-0.01em' }}>
              TranscriptCheck
            </p>
            <p style={{ color: '#f0b429', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '3px' }}>
              University of Buea
            </p>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <a href="/student/login"    className="nav-link">Student Login</a>
          <a href="/admin/login"      className="nav-link">Admin Login</a>
          <a href="/student/register" className="nav-link cta">Get Started</a>
        </div>
      </nav>

      {/* ╔═══════════════════════════════════════╗
          ║                 HERO                  ║
          ╚═══════════════════════════════════════╝ */}
      <section ref={heroRef} style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', padding: '88px 2rem 60px',
      }}>
        {/* Campus background — center 62% shows the UB sign */}
        <div ref={heroBgRef} style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/ub-campus.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 62%',
          backgroundRepeat: 'no-repeat',
          transform: 'scale(1.0)',
          willChange: 'transform',
        }} />

        {/* Multi-layer dark overlay for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            linear-gradient(to bottom,
              rgba(4,8,16,0.60) 0%,
              rgba(4,8,16,0.35) 35%,
              rgba(4,8,16,0.62) 70%,
              rgba(4,8,16,0.97) 100%
            ),
            linear-gradient(135deg,
              rgba(6,12,26,0.65) 0%,
              transparent 50%,
              rgba(6,12,26,0.45) 100%
            )`,
        }} />

        {/* Fine grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom,transparent 0%,black 20%,black 70%,transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom,transparent 0%,black 20%,black 70%,transparent 100%)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2, textAlign: 'center',
          maxWidth: '820px', width: '100%',
          animation: 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}>
          {/* Headline */}
          <h1 className="serif" style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.03em',
            color: '#f8fafc', textShadow: '0 2px 40px rgba(0,0,0,0.8)',
            marginBottom: '20px',
          }}>
            Your Transcript,<br />
            <span className="headline-gold">Verified Before Issue.</span>
          </h1>

          {/* Sub — includes former eyebrow info */}
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.18rem)', color: 'rgba(248,250,252,0.82)',
            lineHeight: 1.78, maxWidth: '600px', margin: '0 auto 48px',
            textShadow: '0 1px 12px rgba(0,0,0,0.6)', fontWeight: 300,
          }}>
            TranscriptCheck gives University of Buea students full visibility
            into their academic records and a structured, formal process to
            identify and correct errors before transcripts are printed and sealed.
            Open to Level 400 students on matricule CT23 and below.
            Academic year 2025&sol;2026.
          </p>

          {/* CTAs */}
          <div className="hero-ctas" style={{
            display: 'flex', gap: '12px', justifyContent: 'center',
            flexWrap: 'wrap', marginBottom: '64px',
          }}>
            <a href="/student/register" className="btn btn-gold">
              <IcoUser />
              Register as Student
            </a>
            <a href="/student/login" className="btn btn-blue">
              Sign In
              <IcoArrow />
            </a>
            <a href="/admin/login" className="btn btn-ghost">Admin Portal</a>
          </div>

          {/* Stats bar */}
          <div className="hero-stats" style={{
            display: 'flex', justifyContent: 'center',
            animation: 'fadeUp 1s ease 0.7s both',
          }}>
            {[
              { val: '5+',   label: 'Faculties' },
              { val: 'AI',   label: 'Anomaly Scan' },
              { val: '100%', label: 'Secure PDFs' },
              { val: 'Live', label: 'Flag Tracking' },
            ].map((s, i) => (
              <div key={s.label} className="stat-div" style={{
                padding: '14px 28px', textAlign: 'center', position: 'relative',
              }}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', height: '60%',
                    width: '1px', background: 'rgba(255,255,255,0.12)',
                  }} />
                )}
                <p className="serif" style={{
                  fontSize: '28px', fontWeight: 900, color: '#fcd34d',
                  lineHeight: 1, marginBottom: '4px',
                }}>{s.val}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          color: 'rgba(255,255,255,0.28)', fontSize: '10px',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          animation: 'fadeUp 1s ease 1.4s both',
        }}>
          <div style={{
            width: '20px', height: '32px', borderRadius: '10px',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex', justifyContent: 'center', paddingTop: '6px',
          }}>
            <div className="scroll-wheel" style={{
              width: '3px', height: '6px',
              background: 'rgba(255,255,255,0.4)', borderRadius: '2px',
            }} />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════╗
          ║             TRUST STRIP               ║
          ╚═══════════════════════════════════════╝ */}
      <div className="trust-strip" style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '28px 2rem', background: '#060c1a',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '44px', flexWrap: 'wrap',
      }}>
        {[
          { Icon: IcoShield, text: 'Role Based Access Control' },
          { Icon: IcoDoc,    text: 'Signed URL PDF Viewer' },
          { Icon: IcoRobot,  text: 'AI Anomaly Detection' },
          { Icon: IcoClock,  text: 'Full Audit Trail' },
          { Icon: IcoMail,   text: 'Email Notifications' },
        ].map(item => (
          <div key={item.text} className="trust-item">
            <item.Icon />
            {item.text}
          </div>
        ))}
      </div>

      {/* ╔═══════════════════════════════════════╗
          ║          TWO PORTALS SECTION          ║
          ╚═══════════════════════════════════════╝ */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '88px 2rem' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ ...S.tag(), justifyContent: 'center', width: 'fit-content',
            margin: '0 auto 16px' }}>
            Two Portals. One System.
          </div>
          <h2 className="serif" style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800,
            letterSpacing: '-0.025em', color: '#f8fafc', marginBottom: '14px',
          }}>
            Built for everyone at UB
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.8,
            maxWidth: '540px', margin: '0 auto', fontWeight: 300 }}>
            Whether you are a student checking your grades or a faculty admin managing
            hundreds of transcripts, TranscriptCheck has a dedicated, secure portal for you.
          </p>
        </div>

        <div className="who-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
        }}>
          {/* Student card */}
          <div className="portal-card portal-student reveal">
            <div style={{
              position: 'absolute', width: '200px', height: '200px',
              borderRadius: '50%', top: '-60px', right: '-60px',
              background: 'rgba(59,130,246,0.14)', filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '18px', color: '#60a5fa',
            }}>
              <IcoUser />
            </div>
            <div style={S.tag()}>For Students</div>
            <h3 className="serif" style={{
              fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc',
              marginBottom: '10px', letterSpacing: '-0.02em',
            }}>Student Portal</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.75,
              marginBottom: '26px', fontWeight: 300 }}>
              Register, view your uploaded transcript, review every grade and detail,
              then formally report any errors, all tracked in real time.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px',
              marginBottom: '30px' }}>
              {STUDENT_STEPS.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: '#60a5fa', marginTop: '1px',
                    fontFamily: "'DM Mono', monospace",
                  }}>{s.n}</span>
                  <p style={{ fontSize: '13px', color: 'rgba(248,250,252,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#f8fafc' }}>{s.title}</strong>{' '}
                    {s.desc.slice(s.title.length)}
                  </p>
                </div>
              ))}
            </div>
            <a href="/student/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '8px', textDecoration: 'none',
              background: '#2563eb', color: 'white', fontWeight: 700, fontSize: '13px',
              boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              transition: 'all 0.2s',
            }}>
              Create Student Account
              <IcoArrow />
            </a>
          </div>

          {/* Admin card */}
          <div className="portal-card portal-admin reveal" style={{ transitionDelay: '0.12s' }}>
            <div style={{
              position: 'absolute', width: '200px', height: '200px',
              borderRadius: '50%', top: '-60px', right: '-60px',
              background: 'rgba(201,148,42,0.14)', filter: 'blur(60px)',
              pointerEvents: 'none',
            }} />
            <div style={{
              width: '50px', height: '50px', borderRadius: '14px',
              background: 'rgba(201,148,42,0.12)', border: '1px solid rgba(201,148,42,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '18px', color: '#f0b429',
            }}>
              <IcoAdmin />
            </div>
            <div style={S.tag(true)}>For Administrators</div>
            <h3 className="serif" style={{
              fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc',
              marginBottom: '10px', letterSpacing: '-0.02em',
            }}>Admin Portal</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.75,
              marginBottom: '26px', fontWeight: 300 }}>
              Upload student transcripts with AI scanning, manage flags from your entire faculty,
              and notify students automatically at every step.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px',
              marginBottom: '30px' }}>
              {ADMIN_STEPS.map(s => (
                <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                    background: 'rgba(201,148,42,0.1)', border: '1px solid rgba(201,148,42,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 800, color: '#f0b429', marginTop: '1px',
                    fontFamily: "'DM Mono', monospace",
                  }}>{s.n}</span>
                  <p style={{ fontSize: '13px', color: 'rgba(248,250,252,0.75)', lineHeight: 1.6 }}>
                    <strong style={{ color: '#f8fafc' }}>{s.title}</strong>{' '}
                    {s.desc.slice(s.title.length)}
                  </p>
                </div>
              ))}
            </div>
            <a href="/admin/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 22px', borderRadius: '8px', textDecoration: 'none',
              background: 'linear-gradient(135deg, #c9942a, #f0b429)',
              color: '#1a0e00', fontWeight: 700, fontSize: '13px',
              boxShadow: '0 4px 16px rgba(201,148,42,0.3)',
              transition: 'all 0.2s',
            }}>
              Admin Sign In
              <IcoArrow />
            </a>
          </div>
        </div>
      </section>

      {/* ── divider ── */}
      <div style={{ height: '1px', background:
        'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)' }} />

      {/* ╔═══════════════════════════════════════╗
          ║             FEATURES GRID             ║
          ╚═══════════════════════════════════════╝ */}
      <div style={{
        background: 'linear-gradient(180deg,#040810 0%,#060c1a 50%,#040810 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingBottom: '16px',
      }}>
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 2rem 56px' }}>
          <div className="reveal" style={{ marginBottom: '52px' }}>
            <div style={S.tag()}>Platform Features</div>
            <h2 className="serif" style={{
              fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800,
              letterSpacing: '-0.025em', color: '#f8fafc', marginBottom: '14px',
            }}>
              Engineered for accuracy.<br />Secured for trust.
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', lineHeight: 1.8,
              maxWidth: '520px', fontWeight: 300 }}>
              Every feature was designed around one goal. Making sure your academic
              record reflects your real achievement, with full traceability and zero guesswork.
            </p>
          </div>

          <div className="features-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px',
          }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card reveal"
                style={{ transitionDelay: `${i * 0.07}s` }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '11px',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px', color: '#60a5fa',
                }}>
                  <f.Icon />
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc',
                  marginBottom: '8px', letterSpacing: '-0.01em' }}>
                  {f.title}
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.72,
                  fontWeight: 300 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── divider ── */}
      <div style={{ height: '1px', background:
        'linear-gradient(90deg,transparent,rgba(59,130,246,0.15),transparent)' }} />

      
        
      <section className="reveal" style={{
        textAlign: 'center', padding: '72px 2rem 64px', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse,rgba(37,99,235,0.1) 0%,transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <h2 className="serif" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#f8fafc',
            letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.1,
          }}>
            Ready to verify your<br />academic record?
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '460px',
            margin: '0 auto 44px', lineHeight: 1.78, fontWeight: 300 }}>
            Register your account today. Your administrator will upload your transcript
            and you will be notified immediately when it is ready to review.
          </p>
          <div className="cta-btns" style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <a href="/student/register" className="btn btn-gold">
              <IcoUser />
              Register as Student
            </a>
            <a href="/student/login"    className="btn btn-blue">Student Login</a>
            <a href="/admin/login"      className="btn btn-ghost">Admin Portal</a>
          </div>
        </div>
      </section>

     
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '36px 3rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Footer logo — round too */}
          <img src="/images/ub-logo.png" alt="UB"
            style={{
              width: '30px', height: '30px', objectFit: 'cover',
              borderRadius: '50%',
              filter: 'drop-shadow(0 0 6px rgba(201,148,42,0.3))',
            }}
          />
          <div>
            <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
              TranscriptCheck
            </p>
            <p style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
              University of Buea &bull; College of Technology &bull; 2025&sol;2026
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          {[
            { label: 'Student Login',    href: '/student/login'    },
            { label: 'Register',         href: '/student/register' },
            { label: 'Admin Login',      href: '/admin/login'      },
            { label: 'Admin Register',   href: '/admin/register'   },
          ].map(l => (
            <a key={l.href} href={l.href} className="footer-link">{l.label}</a>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(71,85,105,0.55)', fontSize: '11px' }}>
            CEC418 Software Construction &amp; Evolution
          </p>
          <p style={{ color: 'rgba(71,85,105,0.55)', fontSize: '11px', marginTop: '3px' }}>
            OFOR GLORIA OLAR &bull; CT23A137
          </p>
        </div>
      </footer>
    </div>
  );
}