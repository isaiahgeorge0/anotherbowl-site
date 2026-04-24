'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { getLastOrder } from '@/lib/orderStorage';
import type { StoredOrder } from '@/types/order';

const primaryButtonClass =
  'inline-flex items-center justify-center px-5 py-3 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'inline-flex items-center justify-center px-5 py-3 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';

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
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Order Confirmation</h1>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">This confirmation is part of the pre-launch test flow.</p>
          </div>

          {orderNumber ? (
            <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-3">
              <p className="text-gray-900">
                <span className="font-semibold">Order number:</span> {orderNumber}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Payment:</span> Payment integration coming soon
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Total:</span> GBP {total ?? '0.00'}
              </p>
            </div>
          ) : order ? (
            <div className="rounded-lg border border-gray-200 p-4 bg-white space-y-3">
              <p className="text-gray-900">
                <span className="font-semibold">Order number:</span> {order.orderNumber}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Name:</span> {order.checkout.customerName}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Order type:</span> {order.checkout.orderType}
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Payment:</span> Payment integration coming soon
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Total:</span> GBP {order.subtotal.toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-gray-700">No recent order found in local storage.</p>
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
