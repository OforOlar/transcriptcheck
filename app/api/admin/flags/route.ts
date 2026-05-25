// app/api/admin/flags/route.ts
// PATCH updates flag status and notifies the student via SendGrid
// when their flag is resolved or rejected.

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const VALID_STATUSES = ['resolved', 'rejected', 'under_review'];

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

function resolvedEmail(
  studentName: string,
  errorType: string,
  adminResponse: string,
  appUrl: string
) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f8;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .head{background:linear-gradient(135deg,#0f766e,#059669);padding:36px;text-align:center}
  .head h1{color:#fff;font-size:22px;margin:0 0 6px;font-weight:700}
  .head p{color:rgba(255,255,255,.85);font-size:14px;margin:0}
  .body{padding:36px}
  .greeting{font-size:16px;color:#111827;font-weight:600;margin-bottom:16px}
  .msg{font-size:15px;color:#374151;line-height:1.7;margin-bottom:24px}
  .box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px}
  .box p{margin:0;font-size:14px;color:#15803d;font-weight:600}
  .resp{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:28px}
  .resp .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px}
  .resp p{margin:0;font-size:14px;color:#374151;line-height:1.6}
  .cta{display:block;padding:14px;background:linear-gradient(135deg,#0f766e,#059669);color:#fff;text-align:center;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
  .foot{background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center}
  .foot p{font-size:12px;color:#9ca3af;margin:0}
</style></head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Your Flag Has Been Resolved</h1>
      <p>TranscriptCheck &nbsp;·&nbsp; University of Buea</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${studentName}!</p>
      <p class="msg">
        Good news! Your faculty administrator has reviewed and resolved the error
        flag you submitted regarding <strong>${errorType}</strong> on your academic transcript.
      </p>
      <div class="box">
        <p>Your flag has been marked as Resolved.</p>
      </div>
      ${adminResponse ? `
      <div class="resp">
        <div class="label">Administrator Response</div>
        <p>${adminResponse}</p>
      </div>` : ''}
      <p class="msg">
        Please log in to your student portal to view your updated transcript and
        confirm that all information is now correct.
      </p>
      <a href="${appUrl}/student/transcript" class="cta">View My Transcript</a>
    </div>
    <div class="foot">
      <p>Automated message from TranscriptCheck. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

function rejectedEmail(
  studentName: string,
  errorType: string,
  adminResponse: string,
  appUrl: string
) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f6f8;margin:0;padding:0}
  .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .head{background:linear-gradient(135deg,#dc2626,#b91c1c);padding:36px;text-align:center}
  .head h1{color:#fff;font-size:22px;margin:0 0 6px;font-weight:700}
  .head p{color:rgba(255,255,255,.85);font-size:14px;margin:0}
  .body{padding:36px}
  .greeting{font-size:16px;color:#111827;font-weight:600;margin-bottom:16px}
  .msg{font-size:15px;color:#374151;line-height:1.7;margin-bottom:24px}
  .box{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:24px}
  .box p{margin:0;font-size:14px;color:#dc2626;font-weight:600}
  .resp{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;margin-bottom:28px}
  .resp .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px}
  .resp p{margin:0;font-size:14px;color:#374151;line-height:1.6}
  .cta{display:block;padding:14px;background:linear-gradient(135deg,#0f766e,#059669);color:#fff;text-align:center;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px}
  .foot{background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center}
  .foot p{font-size:12px;color:#9ca3af;margin:0}
</style></head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Your Flag Has Been Reviewed</h1>
      <p>TranscriptCheck &nbsp;·&nbsp; University of Buea</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${studentName}!</p>
      <p class="msg">
        Your faculty administrator has reviewed your error flag regarding
        <strong>${errorType}</strong> and was unable to confirm the reported discrepancy.
        Your flag has been marked as rejected.
      </p>
      <div class="box">
        <p>Your flag has been marked as Rejected.</p>
      </div>
      ${adminResponse ? `
      <div class="resp">
        <div class="label">Administrator Response</div>
        <p>${adminResponse}</p>
      </div>` : ''}
      <p class="msg">
        If you believe this decision is incorrect, you may contact your faculty
        administrator directly or submit a new flag with additional supporting details.
      </p>
      <a href="${appUrl}/student/dashboard" class="cta">Go to My Dashboard</a>
    </div>
    <div class="foot">
      <p>Automated message from TranscriptCheck. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorised.' }, { status: 401 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Session expired.' }, { status: 401 }
      );
    }

    // Verify admin role
    const { data: prof } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!prof || prof.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied.' }, { status: 403 }
      );
    }

    const { flag_id, status, admin_response } = await req.json();

    if (!flag_id) {
      return NextResponse.json(
        { success: false, error: 'flag_id is required.' }, { status: 400 }
      );
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update payload — no updated_at column in flags table
    const update: Record<string, string | null> = { status };
    if (admin_response && admin_response.trim() !== '') {
      update.admin_response = admin_response.trim();
    }

    const { data, error } = await supabase
      .from('flags')
      .update(update)
      .eq('id', flag_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message }, { status: 500 }
      );
    }

    // Send student notification when flag is resolved or rejected
    if (status === 'resolved' || status === 'rejected') {
      try {
        // Get student profile
        const { data: studentProf } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.student_id)
          .maybeSingle();

        // Get student email via service role
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: authUser } = await adminClient.auth.admin.getUserById(data.student_id);
        const studentEmail = authUser?.user?.email;
        const studentName  = studentProf?.full_name ?? 'Student';
        const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const response     = admin_response?.trim() ?? '';

        if (studentEmail) {
          const subject = status === 'resolved'
            ? `Your Error Flag Has Been Resolved — ${data.error_type}`
            : `Your Error Flag Has Been Reviewed — ${data.error_type}`;

          const html = status === 'resolved'
            ? resolvedEmail(studentName, data.error_type, response, appUrl)
            : rejectedEmail(studentName, data.error_type, response, appUrl);

          await sendEmail(studentEmail, subject, html);
          console.log(`[flags] Notification sent to student ${studentEmail}`);
        }
      } catch (emailErr) {
        console.error('[flags] Email notification error:', emailErr);
      }
    }

    return NextResponse.json({ success: true, data });

  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error.' },
      { status: 500 }
    );
  }
}