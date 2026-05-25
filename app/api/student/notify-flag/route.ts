// app/api/student/notify-flag/route.ts
// Sends admin notification email via SendGrid HTTP API.
// SendGrid uses HTTPS (port 443) — never blocked by Railway.

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'oforolar824@gmail.com', name: 'TranscriptCheck' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ success: true });

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: true });

    const { error_type, wrong_value, correct_value, description } = await req.json();

    const { data: studentProf } = await supabase
      .from('profiles')
      .select('full_name, matricule, faculty')
      .eq('id', user.id)
      .maybeSingle();

    if (!studentProf) return NextResponse.json({ success: true });

    // Find all admins for this faculty
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('faculty', studentProf.faculty)
      .eq('role', 'admin');

    if (!adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Get admin emails via service role key
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const submittedAt = new Date().toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f8;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .head{background:linear-gradient(135deg,#b45309,#d97706);padding:32px 36px}
  .head h1{color:#fff;font-size:20px;margin:0 0 4px;font-weight:700}
  .head p{color:rgba(255,255,255,.85);font-size:13px;margin:0}
  .body{padding:32px 36px}
  .badge{display:inline-block;background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;margin-bottom:20px;text-transform:uppercase;letter-spacing:.06em}
  .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px}
  .value{font-size:15px;font-weight:600;color:#111827;margin-bottom:18px}
  .row{display:flex;gap:16px;margin-bottom:20px}
  .col{flex:1;padding:14px;border-radius:10px}
  .wrong{background:#fef2f2;border:1px solid #fecaca}
  .correct{background:#f0fdf4;border:1px solid #bbf7d0}
  .wrong .label{color:#dc2626}.correct .label{color:#16a34a}
  .wrong .val{color:#b91c1c;font-weight:600;font-size:14px;margin:0}
  .correct .val{color:#15803d;font-weight:600;font-size:14px;margin:0}
  .desc{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.6}
  .cta{display:block;padding:14px;background:linear-gradient(135deg,#b45309,#0f766e);color:#fff;text-align:center;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
  .foot{background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;text-align:center}
  .foot p{font-size:12px;color:#9ca3af;margin:0}
</style></head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>New Transcript Error Flag</h1>
      <p>TranscriptCheck &nbsp;·&nbsp; University of Buea &nbsp;·&nbsp; ${submittedAt}</p>
    </div>
    <div class="body">
      <span class="badge">Action Required</span>
      <div class="label">Student</div>
      <div class="value">${studentProf.full_name} &nbsp;·&nbsp;
        <span style="font-family:monospace;color:#0f766e">${studentProf.matricule}</span>
      </div>
      <div class="label">Error Type</div>
      <div class="value">${error_type}</div>
      <div class="row">
        <div class="col wrong">
          <div class="label">Wrong (on transcript)</div>
          <p class="val">${wrong_value ?? '—'}</p>
        </div>
        <div class="col correct">
          <div class="label">Correct (should be)</div>
          <p class="val">${correct_value ?? '—'}</p>
        </div>
      </div>
      <div class="label">Student Description</div>
      <div class="desc">${description ?? 'No description provided.'}</div>
      <a href="${appUrl}/admin/flags" class="cta">Review Flag in Admin Portal</a>
    </div>
    <div class="foot">
      <p>Automated notification from TranscriptCheck. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

    // Send to all admins in the faculty
    for (const admin of adminProfiles) {
      const { data: authUser } = await adminClient.auth.admin.getUserById(admin.id);
      const adminEmail = authUser?.user?.email;
      if (adminEmail) {
        await sendEmail(
          adminEmail,
          `New Error Flag — ${studentProf.full_name} (${studentProf.matricule})`,
          html
        ).then(() => {
          console.log(`[notify-flag] Email sent to ${adminEmail}`);
        }).catch(err => {
          console.error('[notify-flag] SendGrid error:', err);
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[notify-flag] Error:', err);
    return NextResponse.json({ success: true });
  }
}