'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { ORDER_MENU_BY_CATEGORY } from '@/data/orderMenu';
import { getBasket, saveBasket } from '@/lib/orderStorage';
import type { BasketItem, OrderMenuItem } from '@/types/order';

const slugifyCategory = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const primaryButtonClass =
  'inline-flex items-center justify-center min-h-[44px] px-4 py-3 rounded-lg font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const qtyButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-800 bg-white text-lg font-semibold leading-none hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
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

  const basketItemCount = useMemo(
    () => basket.reduce((sum, entry) => sum + entry.quantity, 0),
    [basket]
  );

  const categories = useMemo(() => Object.keys(ORDER_MENU_BY_CATEGORY), []);

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main
        className={`max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16 ${basket.length > 0 ? 'pb-28 lg:pb-16' : ''}`}
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Online Ordering</h1>
          <div className={`${noticeBoxClass} mb-8`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">
              Hidden pre-launch ordering foundation. This flow is for internal testing only.
            </p>
          </div>

          <nav
            aria-label="Jump to menu category"
            className="lg:hidden sticky top-16 sm:top-20 z-30 -mx-6 sm:-mx-8 mb-6 border-b border-gray-200 bg-white/95 px-4 py-2 backdrop-blur-sm sm:px-6"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Categories</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => {
                const anchor = `order-category-${slugifyCategory(category)}`;
                return (
                  <a
                    key={category}
                    href={`#${anchor}`}
                    className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 min-h-[44px] inline-flex items-center hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  >
                    {category}
                  </a>
                );
              })}
            </div>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <section className="order-2 space-y-6 lg:order-1">
              {Object.entries(ORDER_MENU_BY_CATEGORY).map(([category, items]) => (
                <div
                  key={category}
                  id={`order-category-${slugifyCategory(category)}`}
                  className="scroll-mt-28 sm:scroll-mt-32 rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                >
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

            <aside
              id="order-basket"
              className="order-1 h-fit rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:order-2"
            >
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
                          type="button"
                          onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
                          className={qtyButtonClass}
                          aria-label={`Decrease ${entry.item.name} quantity`}
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{entry.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)}
                          className={qtyButtonClass}
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
                  <Link href="/order/checkout" className={`w-full ${primaryButtonClass}`}>
                    Continue to checkout
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {basket.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          role="region"
          aria-label="Basket summary"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {basketItemCount} {basketItemCount === 1 ? 'item' : 'items'}
              </p>
              <p className="text-xs text-gray-600">Subtotal GBP {subtotal.toFixed(2)}</p>
            </div>
            <a
              href="#order-basket"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Basket
            </a>
            <Link
              href="/order/checkout"
              className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400`}
            >
              Checkout
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
