'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { ORDER_MENU_BY_CATEGORY } from '@/data/orderMenu';
import { getBasket, saveBasket } from '@/lib/orderStorage';
import type { BasketItem, OrderMenuItem } from '@/types/order';

const primaryButtonClass =
  'inline-flex items-center justify-center px-4 py-3 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';

export default function OrderPage() {
  const [basket, setBasket] = useState<BasketItem[]>([]);

  useEffect(() => {
    setBasket(getBasket());
  }, []);

  useEffect(() => {
    saveBasket(basket);
  }, [basket]);

  const addToBasket = (item: OrderMenuItem) => {
    setBasket((prev) => {
      const existing = prev.find((entry) => entry.item.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, nextQuantity: number) => {
    setBasket((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((entry) => entry.item.id !== itemId);
      }
      return prev.map((entry) =>
        entry.item.id === itemId ? { ...entry, quantity: nextQuantity } : entry
      );
    });
  };

  const subtotal = useMemo(
    () => basket.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [basket]
  );

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Online Ordering</h1>
          <div className={`${noticeBoxClass} mb-8`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">
              Hidden pre-launch ordering foundation. This flow is for internal testing only.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <section className="space-y-6">
              {Object.entries(ORDER_MENU_BY_CATEGORY).map(([category, items]) => (
                <div key={category} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <article key={item.id} className="rounded-lg border border-gray-200 p-4 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <span className="font-bold text-gray-900">GBP {item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Status: {item.available ? 'Available' : 'Unavailable'}
                        </p>
                        <button
                          onClick={() => addToBasket(item)}
                          disabled={!item.available}
                          className={`mt-4 w-full ${primaryButtonClass} disabled:opacity-50`}
                        >
                          Add to basket
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <aside className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basket</h2>
              {basket.length === 0 ? (
                <p className="text-gray-600 text-sm">No items yet.</p>
              ) : (
                <div className="space-y-3">
                  {basket.map((entry) => (
                    <div key={entry.item.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{entry.item.name}</p>
                      <p className="text-sm text-gray-600">GBP {entry.item.price.toFixed(2)} each</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                          className={`w-8 h-8 ${secondaryButtonClass} px-0 py-0`}
                          aria-label={`Decrease ${entry.item.name} quantity`}
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold min-w-6 text-center">{entry.quantity}</span>
                        <button
                          onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                          className={`w-8 h-8 ${secondaryButtonClass} px-0 py-0`}
                          aria-label={`Increase ${entry.item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Subtotal</span>
                    <span className="font-bold text-gray-900">GBP {subtotal.toFixed(2)}</span>
                  </div>
                  <Link
                    href="/order/checkout"
                    className={`w-full ${primaryButtonClass}`}
                  >
                    Continue to checkout
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
