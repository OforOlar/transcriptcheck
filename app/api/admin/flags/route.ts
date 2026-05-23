// app/api/admin/flags/route.ts
// Unit 2 Sec 2.2.1 — Corrective Change: PATCH updates flag status
// Unit 1 Sec 1.5  — RBAC: admin role verified before any update
// Unit 1 Sec 1.6  — SCM: every status change part of audit trail
// Unit 3 Sec 3.4.4 — Defensive Programming: all inputs validated
// Unit 3 Sec 3.4.5 — Error Handling: always returns JSON, never HTML

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const VALID_STATUSES = ['resolved', 'rejected', 'under_review'];

export async function PATCH(req: NextRequest) {
  try {
    // Read Bearer token — API routes are server-side, no localStorage
    const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorised. Please log in.' },
        { status: 401 }
      );
    }

    // Authenticated client — all DB calls run as the logged-in admin
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Verify the token belongs to a real user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Unit 1 Sec 1.5 — RBAC: only admins can update flags
    const { data: prof } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!prof || prof.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Parse body
    const { flag_id, status, admin_response } = await req.json();

    // Unit 3 Sec 3.4.4 — Defensive Programming: validate inputs
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

    // Build update — only include admin_response if provided
    // NOTE: flags table has no updated_at column
    const update: Record<string, string | null> = { status };
    if (admin_response && admin_response.trim() !== '') {
      update.admin_response = admin_response.trim();
    }

    // Unit 2 Sec 2.2.1 — Corrective Change: persist the status update
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

    return NextResponse.json({ success: true, data });

  } catch (err: unknown) {
    // Unit 3 Sec 3.4.5 — always return JSON, never an HTML error page
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error.' },
      { status: 500 }
    );
  }
}