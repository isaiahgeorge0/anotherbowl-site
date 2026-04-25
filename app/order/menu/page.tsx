'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderMenuAliasPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/ordering/status', { cache: 'no-store' });
        const payload = (await response.json()) as { paused?: boolean };
        if (cancelled) return;
        if (payload.paused) {
          router.replace('/order-paused');
          return;
        }
        router.replace('/order');
      } catch {
        if (!cancelled) router.replace('/order');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}

