'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffLogoutButton from '@/components/StaffLogoutButton';
import StaffNav from '@/components/StaffNav';
import { supabaseServer } from '@/lib/supabaseServer';
import type { StaffRole } from '@/lib/staffAuth';

const cardClass =
  'rounded-2xl border border-stone-200/70 bg-light/90 p-5 shadow-[0_6px_28px_rgba(28,26,24,0.06)] sm:p-6';
const primaryLinkClass =
  'button-staff inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 shadow-sm';
const secondaryLinkClass =
  'button-staff inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-sm shadow-sm';

const staffActions = [
  {
    title: 'Orders',
    description: 'Live kitchen/staff view for incoming orders, statuses, and printing.',
    href: '/staff/orders',
    cta: 'Open Orders',
  },
  {
    title: 'Dashboard',
    description: 'Owner-level sales and activity summary from the order stream.',
    href: '/staff/dashboard',
    cta: 'Open Dashboard',
  },
  {
    title: 'Menu',
    description: 'Manage categories and products, including availability and pricing.',
    href: '/staff/menu',
    cta: 'Open Menu',
  },
  {
    title: 'Discounts',
    description: 'Create and manage discount codes for checkout promotions.',
    href: '/staff/discounts',
    cta: 'Open Discounts',
  },
] as const;

export default function StaffHomePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffRole, setStaffRole] = useState<StaffRole>('staff');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (!data.session) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        const token = data.session.access_token;
        try {
          const meResponse = await fetch('/api/staff/me', {
            cache: 'no-store',
            headers: { authorization: `Bearer ${token}` },
          });
          if (meResponse.ok) {
            const mePayload = (await meResponse.json()) as { role?: StaffRole };
            if (mePayload.role === 'owner' || mePayload.role === 'staff') {
              setStaffRole(mePayload.role);
            }
          }
        } catch {
          setStaffRole('staff');
        }
      }
      setAuthLoading(false);
    };

    void checkSession();

    const { data: authSubscription } = supabaseServer.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => authSubscription.subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
          <p className="text-stone-600">Checking staff session...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
          <section className={cardClass}>
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Staff Home</h1>
            <p className="mt-2 text-sm text-stone-600">
              Sign in to access staff tools: orders, dashboard, and menu management.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/staff/login" className={primaryLinkClass}>
                Go to staff login
              </Link>
              <button type="button" onClick={() => router.push('/')} className={secondaryLinkClass}>
                Back to site
              </button>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const visibleActions = staffActions.filter((action) =>
    action.href === '/staff/discounts' ? staffRole === 'owner' : true
  );

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
        <div className={cardClass}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Staff Home</h1>
              <p className="mt-1 text-sm text-stone-600">Quick access to day-to-day staff tools.</p>
            </div>
            <StaffLogoutButton className={secondaryLinkClass} />
          </div>

          <StaffNav />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleActions.map((action) => (
              <section key={action.href} className="rounded-xl border border-stone-200/80 bg-mint/20 p-4">
                <h2 className="text-lg font-bold text-stone-900">{action.title}</h2>
                <p className="mt-1 text-sm text-stone-600">{action.description}</p>
                <Link href={action.href} className={`${primaryLinkClass} mt-4 w-full`}>
                  {action.cta}
                </Link>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
