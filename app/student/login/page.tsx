'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase';

export default function StudentLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required.');
    if (!password.trim()) return setError('Password is required.');
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authErr) throw new Error('Invalid email or password. Please try again.');
      // Redirect immediately — the dashboard checks role and redirects if wrong
      router.push('/student/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  const inp =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm ' +
    'focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-2/5 bg-teal-900 flex-col justify-center items-center p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">TranscriptCheck</h1>
        <p className="text-teal-200 text-lg mb-8">
          Log in to view and verify your academic transcript.
        </p>
        <div className="bg-teal-800 rounded-xl p-6 text-teal-100 text-sm space-y-3 w-full max-w-xs text-left">
          <p className="font-semibold text-white">Student Portal</p>
          <p>✓ View your uploaded transcript</p>
          <p>✓ Flag any errors you find</p>
          <p>✓ Track your flag status</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Student Login</h2>
          <p className="text-gray-400 text-sm mb-6">University of Buea</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                placeholder="your.email@example.com"
                className={inp}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null); }}
                placeholder="Your password"
                className={inp}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            No account?{' '}
            <a href="/student/register" className="text-teal-700 font-medium hover:underline">
              Register here
            </a>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Are you an admin?{' '}
            <a href="/admin/login" className="text-teal-700 font-medium hover:underline">
              Admin Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}