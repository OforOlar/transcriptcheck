/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as _create } from '@supabase/supabase-js';

export function createClient(): any {
  if (typeof window === 'undefined') {
    // Server or build context.
    // During Docker build, NEXT_PUBLIC_* vars are not available.
    // Return a safe empty stub — client components never call
    // Supabase methods during prerendering, only in useEffect.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return {} as any;
    return _create(url, key);
  }
  // Browser context — use window global singleton
  if (!(window as any).__supabase_client) {
    (window as any).__supabase_client = _create(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return (window as any).__supabase_client;
}