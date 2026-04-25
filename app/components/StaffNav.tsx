'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabaseServer } from '@/lib/supabaseServer';
import type { StaffRole } from '@/lib/staffAuth';

const baseLinkClass =
  'button-staff inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2 text-sm';

const activeClass = 'button-staff-active';
const inactiveClass = '';

const staffLinks = [
  { href: '/staff', label: 'Staff Home' },
  { href: '/staff/orders', label: 'Orders' },
  { href: '/staff/dashboard', label: 'Dashboard' },
  { href: '/staff/menu', label: 'Menu' },
  { href: '/staff/discounts', label: 'Discounts' },
] as const;

export default function StaffNav() {
  const pathname = usePathname();
  const [staffRole, setStaffRole] = useState<StaffRole>('staff');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await supabaseServer.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const response = await fetch('/api/staff/me', {
          cache: 'no-store',
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { role?: StaffRole };
        if (!active) return;
        if (payload.role === 'owner' || payload.role === 'staff') {
          setStaffRole(payload.role);
        }
      } catch {
        if (active) setStaffRole('staff');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visibleLinks = useMemo(
    () =>
      staffLinks.filter((link) => {
        if (link.href === '/staff/discounts') return staffRole === 'owner';
        return true;
      }),
    [staffRole]
  );

  return (
    <nav
      aria-label="Staff navigation"
      className="mb-6 rounded-xl border border-stone-200/80 bg-light/80 p-3"
    >
      <div className="flex flex-wrap gap-2">
        {visibleLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/staff' && pathname.startsWith(`${link.href}/`));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${baseLinkClass} ${isActive ? activeClass : inactiveClass}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
