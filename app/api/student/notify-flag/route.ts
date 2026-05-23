// app/api/student/notify-flag/route.ts
// ============================================================
// Unit 2 Sec 2.2.1 — Corrective Change: admin notified the
//   moment a student submits an error flag — triggers the
//   formal correction workflow immediately
// Unit 1 Sec 1.5  — RBAC: only authenticated students can call
//   this route; faculty scoping ensures right admin notified
// Unit 3 Sec 3.4.5 — Error Handling: email failure never blocks
//   the flag submission — best-effort, non-blocking
// Unit 3 Sec 3.3.1 — Information Hiding: email transport config
//   hidden in this module; caller only calls fetch()
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// ── Email transport — Unit 3 Sec 3.4.8 Runtime Configuration ──
// Credentials loaded from environment at runtime, never hardcoded
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    // ── 1. Verify student session via Bearer token ─────────
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ success: true }); // silent fail

    // Standard client — verify the student's token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: true }); // silent fail

    // ── 2. Get flag details from request body ──────────────
    const { error_type, wrong_value, correct_value, description } = await req.json();

    // ── 3. Get student profile (name + faculty) ────────────
    const { data: studentProf } = await supabase
      .from('profiles')
      .select('full_name, matricule, faculty')
      .eq('id', user.id)
      .maybeSingle();

    if (!studentProf) return NextResponse.json({ success: true });

    // ── 4. Find all admins for this faculty ────────────────
    // Unit 1 Sec 1.5 — RBAC: faculty-scoped admin lookup
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('faculty', studentProf.faculty)
      .eq('role', 'admin');

    if (!adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({ success: true }); // no admin — non-blocking
    }

    // ── 5. Get admin emails from auth.users ────────────────
    // Requires service role key — full access to auth.users
    // Unit 3 Sec 3.3.1 — Information Hiding: service role key
    //   never exposed to client; only used server-side here
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const adminEmails: string[] = [];
    for (const admin of adminProfiles) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(admin.id);
      if (authUser?.user?.email) {
        adminEmails.push(authUser.user.email);
      }
    }

    if (adminEmails.length === 0) {
      return NextResponse.json({ success: true }); // no emails found — non-blocking
    }

    // ── 6. Send notification email to each admin ───────────
    // Unit 2 Sec 2.2.1 — Corrective Change: email triggers the
    //   correction workflow — admin can act immediately
    const submittedAt = new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
          .wrapper { max-width: 560px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f766e, #059669); padding: 32px 36px; }
          .header h1 { color: white; font-size: 20px; margin: 0 0 4px; font-weight: 700; }
          .header p  { color: rgba(255,255,255,0.8); font-size: 13px; margin: 0; }
          .body { padding: 32px 36px; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.06em; }
          .section { margin-bottom: 20px; }
          .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 600; color: #111827; }
          .row { display: flex; gap: 16px; margin-bottom: 20px; }
          .col { flex: 1; padding: 16px; border-radius: 10px; }
          .col.wrong   { background: #fef2f2; border: 1px solid #fecaca; }
          .col.correct { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .col.wrong   .label { color: #dc2626; }
          .col.correct .label { color: #16a34a; }
          .col.wrong   .value { color: #b91c1c; }
          .col.correct .value { color: #15803d; }
          .desc-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #374151; line-height: 1.6; }
          .cta { display: block; width: 100%; padding: 14px; background: linear-gradient(135deg, #0f766e, #059669); color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; box-sizing: border-box; }
          .footer { background: #f9fafb; padding: 20px 36px; border-top: 1px solid #e5e7eb; }
          .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <h1>🚩 New Transcript Error Flag</h1>
            <p>TranscriptCheck · University of Buea · ${submittedAt}</p>
          </div>
          <div class="body">
            <span class="badge">Action Required</span>

            <div class="section">
              <div class="label">Student</div>
              <div class="value">${studentProf.full_name} &nbsp;·&nbsp; <span style="font-family:monospace;color:#0f766e">${studentProf.matricule}</span></div>
            </div>

            <div class="section">
              <div class="label">Error Type</div>
              <div class="value">${error_type}</div>
            </div>

            <div class="row">
              <div class="col wrong">
                <div class="label">Wrong Value (on transcript)</div>
                <div class="value">${wrong_value ?? '—'}</div>
              </div>
              <div class="col correct">
                <div class="label">Correct Value (should be)</div>
                <div class="value">${correct_value ?? '—'}</div>
              </div>
            </div>

            <div class="label">Student&apos;s Description</div>
            <div class="desc-box">${description ?? 'No description provided.'}</div>

            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/flags" class="cta">
              Review Flag in Admin Portal →
            </a>
          </div>
          <div class="footer">
            <p>This is an automated notification from TranscriptCheck. Do not reply to this email.</p>
            <p style="margin-top:4px">CEC418 Software Construction &amp; Evolution · University of Buea 2025/2026</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to all admins in parallel — Unit 3 Sec 3.4.1 API Composition
    await Promise.all(
      adminEmails.map(adminEmail =>
        transporter.sendMail({
          from:    `"TranscriptCheck" <${process.env.GMAIL_USER}>`,
          to:      adminEmail,
          subject: `🚩 New Error Flag — ${studentProf.full_name} (${studentProf.matricule})`,
          html:    htmlBody,
        })
      )
    );

    return NextResponse.json({ success: true });

  } catch (err) {
    // Unit 3 Sec 3.4.5 — Error Handling: notification failure is
    // completely silent — flag was already saved successfully
    console.error('[notify-flag] Email error:', err);
    return NextResponse.json({ success: true }); // always return success
  }
}