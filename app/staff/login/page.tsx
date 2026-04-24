'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { supabaseServer } from '@/lib/supabaseServer';

const primaryButtonClass =
  'px-4 py-2 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:opacity-60';
const inputClass =
  'w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (data.session) {
        router.replace('/staff/orders');
      }
    };
    checkSession();
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const { data, error: signInError } = await supabaseServer.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError || !data.session) {
      setError('Login failed. Please check your staff credentials.');
      return;
    }

    router.replace('/staff/orders');
  };

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Staff Login</h1>
          <p className="text-sm text-gray-600 mb-6">Sign in to access internal staff dashboards.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
