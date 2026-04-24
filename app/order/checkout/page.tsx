'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { clearBasket, getBasket } from '@/lib/orderStorage';
import type { BasketItem, CheckoutDetails, CheckoutOrderType } from '@/types/order';

type FormErrors = Partial<Record<keyof CheckoutDetails, string>>;
const primaryButtonClass =
  'inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';

export default function CheckoutPage() {
  const router = useRouter();
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [details, setDetails] = useState<CheckoutDetails>({
    customerName: '',
    email: '',
    phone: '',
    orderType: 'collection',
    collectionTime: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBasket(getBasket());
  }, []);

  const subtotal = useMemo(
    () => basket.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [basket]
  );

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!details.customerName.trim()) nextErrors.customerName = 'Name is required.';
    if (!details.email.trim()) nextErrors.email = 'Email is required.';
    if (!details.phone.trim()) nextErrors.phone = 'Phone is required.';

    if (details.orderType === 'table' && !details.tableNumber?.trim()) {
      nextErrors.tableNumber = 'Table number is required for table orders.';
    }
    if (details.orderType === 'collection' && !details.collectionTime?.trim()) {
      nextErrors.collectionTime = 'Collection time is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOrderTypeChange = (orderType: CheckoutOrderType) => {
    setDetails((prev) => ({
      ...prev,
      orderType,
      tableNumber: orderType === 'table' ? prev.tableNumber ?? '' : '',
      collectionTime: orderType === 'collection' ? prev.collectionTime ?? '' : '',
    }));
  };

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (basket.length === 0) return;
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);

    const orderNumber = `AB-${Date.now().toString().slice(-6)}`;
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          customerName: details.customerName,
          email: details.email,
          phone: details.phone,
          orderType: details.orderType,
          tableNumber: details.orderType === 'table' ? details.tableNumber : undefined,
          collectionTime: details.orderType === 'collection' ? details.collectionTime : undefined,
          items: basket,
          total: subtotal,
          notes: details.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Could not place order.');
      }

      clearBasket();
      router.push(`/order/confirmation?orderNumber=${encodeURIComponent(orderNumber)}&total=${subtotal.toFixed(2)}`);
    } catch {
      setSubmitError('Could not place order right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Checkout</h1>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">Orders can be placed for testing, but payment is placeholder-only.</p>
          </div>

          {basket.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-5 bg-white">
              <p className="text-gray-700 mb-3">Your basket is currently empty.</p>
              <Link href="/order" className="text-primary font-semibold hover:underline">
                Back to order menu
              </Link>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={submitOrder} className="space-y-5 pb-24 md:pb-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Customer name
                  </label>
                  <input
                    id="customerName"
                    value={details.customerName}
                    onChange={(e) => setDetails((prev) => ({ ...prev, customerName: e.target.value }))}
                    className={inputClass}
                  />
                  {errors.customerName && <p className="text-sm text-red-600 mt-1">{errors.customerName}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  value={details.phone}
                  onChange={(e) => setDetails((prev) => ({ ...prev, phone: e.target.value }))}
                  className={inputClass}
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Order type</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('collection')}
                    className={`min-h-[44px] min-w-[44px] px-5 rounded-lg border font-semibold ${
                      details.orderType === 'collection'
                        ? 'border-slate-900 text-white bg-slate-900'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('table')}
                    className={`min-h-[44px] min-w-[44px] px-5 rounded-lg border font-semibold ${
                      details.orderType === 'table'
                        ? 'border-slate-900 text-white bg-slate-900'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>

              {details.orderType === 'table' ? (
                <div>
                  <label htmlFor="tableNumber" className="block text-sm font-semibold text-gray-900 mb-2">
                    Table number
                  </label>
                  <input
                    id="tableNumber"
                    value={details.tableNumber ?? ''}
                    onChange={(e) => setDetails((prev) => ({ ...prev, tableNumber: e.target.value }))}
                    className={inputClass}
                  />
                  {errors.tableNumber && <p className="text-sm text-red-600 mt-1">{errors.tableNumber}</p>}
                </div>
              ) : (
                <div>
                  <label htmlFor="collectionTime" className="block text-sm font-semibold text-gray-900 mb-2">
                    Collection time
                  </label>
                  <input
                    id="collectionTime"
                    type="time"
                    value={details.collectionTime ?? ''}
                    onChange={(e) => setDetails((prev) => ({ ...prev, collectionTime: e.target.value }))}
                    className={inputClass}
                  />
                  {errors.collectionTime && (
                    <p className="text-sm text-red-600 mt-1">{errors.collectionTime}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
                  Order notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={details.notes ?? ''}
                  onChange={(e) => setDetails((prev) => ({ ...prev, notes: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="rounded-lg border border-gray-200 p-4 bg-white">
                <h2 className="font-bold text-gray-900 mb-2">Order summary</h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {basket.map((entry) => (
                    <li key={entry.item.id} className="flex justify-between">
                      <span>
                        {entry.quantity} x {entry.item.name}
                      </span>
                      <span>GBP {(entry.item.price * entry.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>GBP {subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`${primaryButtonClass} hidden min-h-[44px] w-full disabled:opacity-60 md:inline-flex`}
              >
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
              {submitError && (
                <p className="hidden text-sm text-red-600 md:block">{submitError}</p>
              )}
            </form>
          )}
        </div>
      </main>

      {basket.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm md:hidden pb-[max(1rem,env(safe-area-inset-bottom))]"
          role="region"
          aria-label="Place order"
        >
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className={`${primaryButtonClass} min-h-[44px] w-full disabled:opacity-60`}
          >
            {submitting ? 'Placing order...' : 'Place order'}
          </button>
          {submitError && <p className="mt-2 text-center text-sm text-red-600">{submitError}</p>}
        </div>
      )}

      <Footer />
    </div>
  );
}
