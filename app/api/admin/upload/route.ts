// app/api/admin/upload/route.ts
// Unit 3 Sec 3.8.2 — Automated Construction: AI scanner + email on every upload
// Unit 3 Sec 3.4.1 — API Design: clean layered interface
// Unit 3 Sec 3.4.4 — Defensive Programming: authenticated client for all ops
// Unit 3 Sec 3.4.8 — Runtime Configuration: email credentials from environment
// Unit 2 Sec 2.2.1 — Corrective Change: student notified when transcript corrected

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// ── Email transport — Unit 3 Sec 3.4.8 Runtime Configuration ──
const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── AI Anomaly Detection — Unit 3 Sec 3.8.2 ──────────────────
function scanTranscriptText(text: string) {
  const anomalies: Array<{
    type: string; description: string; severity: string;
    detected_value?: string; expected_range?: string;
  }> = [];

  const gpaMatches = text.match(/GPA[:\s]+([0-9]+\.?[0-9]*)/gi);
  if (gpaMatches) {
    for (const match of gpaMatches) {
      const val = parseFloat(match.replace(/[^0-9.]/g, ''));
      if (!isNaN(val) && val > 4.0) {
        anomalies.push({
          type: 'GPA_EXCEEDS_MAXIMUM',
          description: 'A GPA value exceeds the maximum possible value of 4.0 at UB.',
          severity: 'high', detected_value: String(val), expected_range: '0.0 – 4.0',
        });
      }
    }
  }

  const yearMatches = text.match(/\b(19[0-8][0-9]|1[5-8][0-9]{2}|20[2-9][0-9])\b/g);
  if (yearMatches) {
    for (const yr of yearMatches) {
      const y = parseInt(yr, 10);
      if (y < 1990 || y > 2007) {
        anomalies.push({
          type: 'SUSPICIOUS_DATE_OF_BIRTH',
          description: `Year ${y} is outside the expected range for a current UB student.`,
          severity: 'medium', detected_value: String(y), expected_range: '1990 – 2007',
        });
        break;
      }
    }
  }

  const suspiciousCodes = text.match(/\b[A-Z]{5,}\d{3,}\b/g);
  if (suspiciousCodes && suspiciousCodes.length > 0) {
    anomalies.push({
      type: 'MALFORMED_COURSE_CODE',
      description: `Possible malformed course code(s): ${suspiciousCodes.slice(0, 3).join(', ')}`,
      severity: 'low',
      detected_value: suspiciousCodes.slice(0, 3).join(', '),
      expected_range: '2-4 letters + 3-4 digits (e.g. CEC418)',
    });
  }

  return anomalies;
}

// ── Email Templates ───────────────────────────────────────────

function firstUploadEmail(studentName: string, academicYear: string, appUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
  .wrapper { max-width: 560px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0f766e, #059669); padding: 36px; text-align: center; }
  .header h1 { color: white; font-size: 22px; margin: 0 0 6px; font-weight: 700; }
  .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
  .body { padding: 36px; }
  .greeting { font-size: 16px; color: #111827; font-weight: 600; margin-bottom: 16px; }
  .message  { font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 24px; }
  .highlight { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
  .highlight p { margin: 0; font-size: 14px; color: #15803d; font-weight: 600; }
  .cta { display: block; padding: 14px; background: linear-gradient(135deg, #0f766e, #059669); color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
  .footer { background: #f9fafb; padding: 20px 36px; border-top: 1px solid #e5e7eb; text-align: center; }
  .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Your Transcript is Ready</h1>
      <p>TranscriptCheck · University of Buea</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${studentName}!</p>
      <p class="message">
        We are pleased to inform you that your official academic transcript for the
        <strong>${academicYear}</strong> academic year has been successfully uploaded
        to your student portal by your faculty administrator.
      </p>
      <div class="highlight">
        <p>Your transcript is now available for review in your student portal.</p>
      </div>
      <p class="message">
        Please log in to view your transcript carefully. If you notice any discrepancies
        or errors — such as incorrect grades, wrong personal details, or missing courses —
        you can submit an error flag directly from your dashboard and your administrator
        will be notified immediately.
      </p>
      <a href="${appUrl}/student/transcript" class="cta">View My Transcript →</a>
    </div>
    <div class="footer">
      <p>This is an automated message from TranscriptCheck. Please do not reply to this email.</p>
      <p style="margin-top:4px">CEC418 Software Construction &amp; Evolution · University of Buea ${academicYear}</p>
    </div>
  </div>
</body>
</html>`;
}

function correctionEmail(studentName: string, academicYear: string, appUrl: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
  .wrapper { max-width: 560px; margin: 32px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1d4ed8, #0f766e); padding: 36px; text-align: center; }
  .header h1 { color: white; font-size: 22px; margin: 0 0 6px; font-weight: 700; }
  .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
  .body { padding: 36px; }
  .greeting { font-size: 16px; color: #111827; font-weight: 600; margin-bottom: 16px; }
  .message  { font-size: 15px; color: #374151; line-height: 1.7; margin-bottom: 24px; }
  .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
  .highlight p { margin: 0; font-size: 14px; color: #1d4ed8; font-weight: 600; }
  .steps { background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 28px; }
  .steps p { margin: 0 0 8px; font-size: 14px; color: #374151; }
  .steps p:last-child { margin: 0; }
  .cta { display: block; padding: 14px; background: linear-gradient(135deg, #1d4ed8, #0f766e); color: white; text-align: center; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
  .footer { background: #f9fafb; padding: 20px 36px; border-top: 1px solid #e5e7eb; text-align: center; }
  .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
</style></head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1> Transcript Updated</h1>
      <p>TranscriptCheck · University of Buea</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${studentName}!</p>
      <p class="message">
        Great news — your faculty administrator has reviewed the error you reported on
        your academic transcript and has uploaded a corrected version to your student portal.
      </p>
      <div class="highlight">
        <p> Your ${academicYear} transcript has been updated based on your flagged error.</p>
      </div>
      <p class="message">
        We kindly ask you to log in and review your updated transcript to confirm that
        all the information is now accurate and complete. If you notice any remaining
        discrepancies, do not hesitate to submit a new error flag from your dashboard.
      </p>
      <div class="steps">
        <p> <strong>What to do next:</strong></p>
        <p>1. Log in to your student portal</p>
        <p>2. Click <strong>"View Transcript"</strong> to review the updated PDF</p>
        <p>3. If everything looks correct, no further action is needed</p>
        <p>4. If you spot another issue, submit a new error flag</p>
      </div>
      <a href="${appUrl}/student/transcript" class="cta">Review My Updated Transcript →</a>
    </div>
    <div class="footer">
      <p>This is an automated message from TranscriptCheck. Please do not reply to this email.</p>
      <p style="margin-top:4px">CEC418 Software Construction &amp; Evolution · University of Buea ${academicYear}</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main POST handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Unit 3 Sec 3.4.4 — Defensive Programming: Bearer token auth
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorised. Please log in.' }, { status: 401 }
      );
    }

    // Authenticated Supabase client — all operations run as logged-in user
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please log in again.' }, { status: 401 }
      );
    }

    const formData     = await req.formData();
    const file         = formData.get('file') as File | null;
    const student_id   = formData.get('student_id') as string;
    const academic_year = formData.get('academic_year') as string;

    if (!file || !student_id || !academic_year) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' }, { status: 400 }
      );
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are accepted.' }, { status: 400 }
      );
    }

    // ── Check if transcript already exists (first upload vs correction) ──
    // Unit 2 Sec 2.2.1 — Corrective Change: determines which email to send
    const { data: existingTranscript } = await supabase
      .from('transcripts')
      .select('id')
      .eq('student_id', student_id)
      .maybeSingle();

    const isCorrection = !!existingTranscript;

    // ── Upload PDF to Supabase Storage ────────────────────────
    const fileName   = `${student_id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from('transcripts')
      .upload(fileName, fileBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadErr) {
      return NextResponse.json(
        { success: false, error: 'File upload failed: ' + uploadErr.message }, { status: 500 }
      );
    }

    // ── AI Anomaly Scan — Unit 3 Sec 3.8.2 ───────────────────
    const textContent = await file.text().catch(() => '');
    const anomalies   = scanTranscriptText(textContent);

    // ── Save transcript record ────────────────────────────────
    const { data: transcript, error: dbErr } = await supabase
      .from('transcripts')
      .upsert({
        student_id,
        file_path:     fileName,
        file_name:     file.name,
        academic_year,
        status:        'pending',
        ai_scanned:    true,
        ai_anomalies:  anomalies,
        uploaded_by:   user.id,
        created_at:    new Date().toISOString(),
      }, { onConflict: 'student_id' })
      .select()
      .single();

    if (dbErr) {
      return NextResponse.json(
        { success: false, error: 'Database error: ' + dbErr.message }, { status: 500 }
      );
    }

    // ── Send student notification email ───────────────────────
    // Unit 3 Sec 3.4.8 — Runtime Configuration: app URL from env
    // Unit 2 Sec 2.2.1 — Corrective Change: different email per upload type
    try {
      // Use service role to get student's email from auth.users
      const adminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', student_id)
        .maybeSingle();

      const { data: authUser } = await adminClient.auth.admin.getUserById(student_id);
      const studentEmail = authUser?.user?.email;
      const studentName  = studentProfile?.full_name ?? 'Student';
      const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

      if (studentEmail) {
        const subject = isCorrection
          ? `Your Transcript Has Been Updated — ${academic_year}`
          : `Your Academic Transcript is Now Available — ${academic_year}`;

        const html = isCorrection
          ? correctionEmail(studentName, academic_year, appUrl)
          : firstUploadEmail(studentName, academic_year, appUrl);

        await transporter.sendMail({
          from:    `"TranscriptCheck" <${process.env.GMAIL_USER}>`,
          to:      studentEmail,
          subject,
          html,
        });
      }
    } catch (emailErr) {
      // Unit 3 Sec 3.4.5 — Error Handling: email failure never blocks upload
      console.error('[upload] Student email notification failed:', emailErr);
    }

    return NextResponse.json({
      success: true,
      data: transcript,
      message: anomalies.length > 0
        ? `Transcript ${isCorrection ? 'updated' : 'uploaded'}. ${anomalies.length} anomaly(ies) detected by AI scan. Student has been notified.`
        : `Transcript ${isCorrection ? 'updated' : 'uploaded'} successfully. No anomalies detected. Student has been notified.`,
    });

  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error.' },
      { status: 500 }
    );
  }
}