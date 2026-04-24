'use client';

import { useRouter } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';

type StaffLogoutButtonProps = {
  className?: string;
};

export default function StaffLogoutButton({ className }: StaffLogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseServer.auth.signOut();
    router.replace('/staff/login');
  };

  return (
    <button onClick={handleLogout} className={className}>
      Logout
    </button>
  );
}
