/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as _create } from '@supabase/supabase-js';

export function createClient(): any {
  // Use window as a true global so the same instance
  // is shared across all Next.js module instances
  if (typeof window === 'undefined') {
    // Server context — return a fresh client (no session needed server-side)
    return _create(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!(window as any).__supabase_client) {
    (window as any).__supabase_client = _create(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return (window as any).__supabase_client;
}