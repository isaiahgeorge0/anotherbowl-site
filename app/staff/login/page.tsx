'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { supabaseServer } from '@/lib/supabaseServer';

const primaryButtonClass =
  'rounded-2xl bg-primary px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-light active:scale-[0.98] disabled:opacity-60';
const inputClass =
  'w-full rounded-xl border border-stone-200/90 bg-light/90 px-3 py-2 font-medium text-stone-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-brandGreen/30';

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
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="max-w-xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="mb-2 text-3xl font-black text-stone-900">Staff Login</h1>
          <p className="mb-6 text-sm text-stone-600">Sign in to access internal staff dashboards.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-800">Email</label>
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
              <label className="mb-1 block text-sm font-semibold text-stone-800">Password</label>
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
