'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const baseLinkClass =
  'button-staff inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 py-2 text-sm';

const activeClass = 'button-staff-active';
const inactiveClass = '';

const staffLinks = [
  { href: '/staff', label: 'Staff Home' },
  { href: '/staff/orders', label: 'Orders' },
  { href: '/staff/dashboard', label: 'Dashboard' },
  { href: '/staff/menu', label: 'Menu' },
] as const;

export default function StaffNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Staff navigation"
      className="mb-6 rounded-xl border border-stone-200/80 bg-light/80 p-3"
    >
      <div className="flex flex-wrap gap-2">
        {staffLinks.map((link) => {
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
