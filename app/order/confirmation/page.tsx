'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { getLastOrder } from '@/lib/orderStorage';
import type { StoredOrder } from '@/types/order';

const primaryButtonClass =
  'button-order inline-flex min-h-[46px] items-center justify-center rounded-xl px-6 py-3 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-light active:scale-[0.98]';
const secondaryButtonClass =
  'button-primary inline-flex min-h-[46px] items-center justify-center rounded-xl px-6 py-3 font-semibold text-stone-900 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2';
const noticeBoxClass = 'rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-900/90';

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [total, setTotal] = useState<string | null>(null);
  useEffect(() => {
    setOrder(getLastOrder());
    const params = new URLSearchParams(window.location.search);
    setOrderNumber(params.get('orderNumber'));
    setTotal(params.get('total'));
  }, []);

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="mb-3 text-3xl font-black text-stone-900 sm:text-4xl">Order Confirmation</h1>
          {(orderNumber || order) && (
            <div className="mb-5 rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-emerald-900/90 shadow-sm">
              <p className="text-sm font-semibold">Thank you — we&apos;ve received your order.</p>
              <p className="mt-0.5 text-xs text-emerald-800/80">You&apos;ll see the details below.</p>
            </div>
          )}
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">This confirmation is part of the pre-launch test flow.</p>
          </div>

          {orderNumber ? (
            <div className="space-y-3 rounded-xl border border-stone-200/75 bg-mint/20 p-4">
              <p className="text-stone-900">
                <span className="font-semibold">Order number:</span> {orderNumber}
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Payment:</span> Payment integration coming soon
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Total:</span> GBP {total ?? '0.00'}
              </p>
            </div>
          ) : order ? (
            <div className="space-y-3 rounded-xl border border-stone-200/75 bg-mint/20 p-4">
              <p className="text-stone-900">
                <span className="font-semibold">Order number:</span> {order.orderNumber}
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Name:</span> {order.checkout.customerName}
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Order type:</span> {order.checkout.orderType}
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Payment:</span> Payment integration coming soon
              </p>
              <p className="text-stone-900">
                <span className="font-semibold">Total:</span> GBP {order.subtotal.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-stone-600">No recent order found in local storage.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/order"
              className={secondaryButtonClass}
            >
              Back to menu
            </Link>
            <Link
              href="/"
              className={primaryButtonClass}
            >
              Return home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
