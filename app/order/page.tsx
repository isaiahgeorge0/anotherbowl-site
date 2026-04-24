'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/* Shared layout: ring+offset reserved on add buttons so "Added" state does not change dimensions */
const addToBasketButtonBaseClass =
  'mt-4 flex w-full min-h-[48px] box-border items-center justify-center rounded-lg border-2 border-transparent px-4 py-3.5 text-center text-base font-bold text-white shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';

const primaryButtonClass =
  'inline-flex items-center justify-center min-h-[44px] px-4 py-3.5 rounded-lg font-bold text-white bg-slate-900 shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-[0.98] active:bg-slate-950 active:shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400';
const qtyButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-800 bg-white text-lg font-semibold leading-none shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-slate-50 hover:shadow-md active:scale-[0.92] active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';

const menuItemCardClass =
  'group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_14px_rgba(15,23,42,0.05)] transition-all duration-200 hover:border-slate-300/90 hover:shadow-md active:scale-[0.99] active:shadow-sm';

const availabilityBadge = (available: boolean) => (
  <span
    className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      available
        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20'
        : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/25'
    }`}
  >
    {available ? 'Available' : 'Unavailable'}
  </span>
);

export default function OrderPage() {
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => Object.keys(ORDER_MENU_BY_CATEGORY)[0] ?? ''
  );
  const [miniBarEntered, setMiniBarEntered] = useState(false);
  const [basketDrawerOpen, setBasketDrawerOpen] = useState(false);
  const [basketSheetEntered, setBasketSheetEntered] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categorySheetEntered, setCategorySheetEntered] = useState(false);
  const [orderingPaused, setOrderingPaused] = useState(false);
  const addFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBasketLenRef = useRef(0);
  const closeDrawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeCategoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeBasketDrawer = useCallback(() => {
    setBasketSheetEntered(false);
    if (closeDrawerTimeoutRef.current) clearTimeout(closeDrawerTimeoutRef.current);
    closeDrawerTimeoutRef.current = setTimeout(() => {
      setBasketDrawerOpen(false);
      closeDrawerTimeoutRef.current = null;
    }, 300);
  }, []);

  const closeCategoryPicker = useCallback(() => {
    setCategorySheetEntered(false);
    if (closeCategoryTimeoutRef.current) clearTimeout(closeCategoryTimeoutRef.current);
    closeCategoryTimeoutRef.current = setTimeout(() => {
      setCategoryPickerOpen(false);
      closeCategoryTimeoutRef.current = null;
    }, 300);
  }, []);


  useEffect(() => {
    setBasket(getBasket());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/ordering/status', { cache: 'no-store' });
        const j = (await r.json()) as { paused?: boolean };
        if (!cancelled) setOrderingPaused(Boolean(j.paused));
      } catch {
        if (!cancelled) setOrderingPaused(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const handleAddToBasket = (item: OrderMenuItem) => {
    if (orderingPaused) return;
    addToBasket(item);
    setJustAddedId(item.id);
    if (addFeedbackTimerRef.current) clearTimeout(addFeedbackTimerRef.current);
    addFeedbackTimerRef.current = setTimeout(() => setJustAddedId(null), 1500);
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

  const itemsForSelectedMobileCategory = useMemo(
    () =>
      selectedCategory && ORDER_MENU_BY_CATEGORY[selectedCategory]
        ? ORDER_MENU_BY_CATEGORY[selectedCategory]
        : null,
    [selectedCategory]
  );

  useEffect(() => {
    const len = basket.length;
    const wasEmpty = prevBasketLenRef.current === 0;
    if (len > 0 && wasEmpty) {
      setMiniBarEntered(false);
      const t = window.setTimeout(() => setMiniBarEntered(true), 20);
      prevBasketLenRef.current = len;
      return () => clearTimeout(t);
    }
    if (len === 0) setMiniBarEntered(false);
    prevBasketLenRef.current = len;
  }, [basket.length]);

  useEffect(() => {
    return () => {
      if (addFeedbackTimerRef.current) clearTimeout(addFeedbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!basketDrawerOpen) {
      setBasketSheetEntered(false);
      return;
    }
    setBasketSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setBasketSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [basketDrawerOpen]);

  useEffect(() => {
    if (!categoryPickerOpen) {
      setCategorySheetEntered(false);
      return;
    }
    setCategorySheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setCategorySheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [categoryPickerOpen]);

  useEffect(() => {
    if (!basketDrawerOpen && !categoryPickerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (categoryPickerOpen) closeCategoryPicker();
      else if (basketDrawerOpen) closeBasketDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [basketDrawerOpen, categoryPickerOpen, closeBasketDrawer, closeCategoryPicker]);

  useEffect(() => {
    if (basket.length === 0) {
      setBasketSheetEntered(false);
      setBasketDrawerOpen(false);
    }
  }, [basket.length]);

  useEffect(() => {
    return () => {
      if (closeDrawerTimeoutRef.current) clearTimeout(closeDrawerTimeoutRef.current);
      if (closeCategoryTimeoutRef.current) clearTimeout(closeCategoryTimeoutRef.current);
    };
  }, []);

  const addButtonStateClass = (isAdded: boolean) =>
    isAdded
      ? 'border-emerald-400/60 bg-emerald-800 hover:border-emerald-300 hover:bg-emerald-800'
      : 'bg-slate-900 hover:border-gray-500 hover:bg-slate-800 active:scale-[0.98] active:bg-slate-950 active:shadow-inner';

  const addButtonContent = (item: OrderMenuItem) =>
    justAddedId === item.id ? (
      <span className="inline-flex items-center justify-center gap-2">
        <svg
          className="h-5 w-5 shrink-0 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
        Added
      </span>
    ) : (
      'Add to basket'
    );

  const renderMenuItemCard = (item: OrderMenuItem) => {
    const isAdded = justAddedId === item.id;
    return (
      <article key={item.id} className={menuItemCardClass}>
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <h3 className="min-w-0 flex-1 pr-1 text-base font-semibold leading-snug text-slate-900">
            {item.name}
          </h3>
          <p className="shrink-0 text-right text-base font-bold tabular-nums text-slate-900">GBP {item.price.toFixed(2)}</p>
        </div>
        <div className="mt-2.5">{availabilityBadge(item.available)}</div>
        {item.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
        )}
        <button
          type="button"
          onClick={() => handleAddToBasket(item)}
          disabled={!item.available || orderingPaused}
          className={`${addToBasketButtonBaseClass} disabled:pointer-events-none disabled:opacity-50 ${addButtonStateClass(isAdded)}`}
        >
          {addButtonContent(item)}
        </button>
      </article>
    );
  };

  const renderBasketLineItems = () =>
    basket.map((entry) => (
      <div
        key={entry.item.id}
        className="rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-sm"
      >
        <p className="font-semibold text-slate-900">{entry.item.name}</p>
        <p className="text-sm text-slate-600">GBP {entry.item.price.toFixed(2)} each</p>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
            className={qtyButtonClass}
            aria-label={`Decrease ${entry.item.name} quantity`}
          >
            -
          </button>
          <span className="min-w-8 text-center text-sm font-semibold text-slate-900">
            {entry.quantity}
          </span>
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
    ));

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16 pb-28 lg:pb-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Online Ordering</h1>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">
              Hidden pre-launch ordering foundation. This flow is for internal testing only.
            </p>
          </div>
          {orderingPaused && (
            <div
              className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-950"
              role="status"
            >
              <p className="text-sm font-bold">Online ordering is currently paused</p>
              <p className="text-sm mt-1">
                We are not taking new orders right now. You can still browse the menu; checkout is
                disabled until we reopen.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <section className="order-2 space-y-6 lg:order-1">
              <div className="sticky z-20 -mx-6 mb-3 border-b border-stone-200/50 bg-stone-50/95 px-4 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-sm sm:-mx-8 sm:px-6 top-16 sm:top-20 lg:hidden">
                <span id="order-category-picker-label" className="sr-only">
                  Select menu category
                </span>
                <button
                  type="button"
                  id="order-category-picker-trigger"
                  aria-haspopup="dialog"
                  aria-controls="order-category-picker-dialog"
                  aria-expanded={categoryPickerOpen}
                  aria-labelledby="order-category-picker-label"
                  onClick={() => setCategoryPickerOpen(true)}
                  className="flex w-full min-h-10 max-w-full items-center justify-between gap-2 rounded-lg border border-stone-200/80 bg-[#fbfaf7] px-3 py-2 text-left text-sm text-slate-800 shadow-sm transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 focus-visible:ring-offset-2"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-slate-500">Category: </span>
                    <span className="font-semibold text-slate-900">{selectedCategory || '—'}</span>
                  </span>
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6 lg:hidden">
                {itemsForSelectedMobileCategory && selectedCategory && (
                  <div
                    id={`order-category-${slugifyCategory(selectedCategory)}`}
                    className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedCategory}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      {itemsForSelectedMobileCategory.map((item) => renderMenuItemCard(item))}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden lg:contents">
                {Object.entries(ORDER_MENU_BY_CATEGORY).map(([category, items]) => (
                  <div
                    key={category}
                    id={`order-category-${slugifyCategory(category)}`}
                    className="scroll-mt-28 sm:scroll-mt-32 rounded-xl border border-gray-200 bg-white p-4 sm:p-5"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-4">{category}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      {items.map((item) => renderMenuItemCard(item))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside
              id="order-basket"
              className="order-1 hidden h-fit rounded-xl border-2 border-slate-300/90 bg-slate-50/90 p-5 shadow-md sm:p-6 lg:order-2 lg:block"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">Basket</h2>
              {basket.length === 0 ? (
                <p className="text-slate-600 text-sm">No items yet.</p>
              ) : (
                <div className="space-y-3">
                  {renderBasketLineItems()}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="font-semibold text-slate-900">Subtotal</span>
                    <span className="font-bold tabular-nums text-slate-900">GBP {subtotal.toFixed(2)}</span>
                  </div>
                  {orderingPaused ? (
                    <span
                      className={`block w-full text-center ${primaryButtonClass} cursor-not-allowed opacity-50`}
                      aria-disabled
                    >
                      Continue to checkout
                    </span>
                  ) : (
                    <Link
                      href="/order/checkout"
                      className={`w-full ${primaryButtonClass} hover:shadow-md`}
                    >
                      Continue to checkout
                    </Link>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {categoryPickerOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden" role="presentation">
          <div
            className={`absolute inset-0 cursor-default bg-slate-900/35 transition-opacity duration-300 ease-out ${
              categorySheetEntered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
            onClick={closeCategoryPicker}
          />
          <div
            id="order-category-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-picker-sheet-title"
            className={`absolute bottom-0 left-0 right-0 z-10 max-h-[min(70dvh,420px)] overflow-y-auto rounded-t-2xl border-t border-stone-200/80 bg-[#fbfaf7] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_32px_rgba(15,23,42,0.1)] transition-transform duration-300 ease-out ${
              categorySheetEntered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-1 flex justify-center" aria-hidden>
                <span className="h-1 w-8 rounded-full bg-stone-300/90" />
              </div>
              <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <h2 id="category-picker-sheet-title" className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Category
                </h2>
                <button
                  type="button"
                  onClick={closeCategoryPicker}
                  className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-stone-200/50 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <ul className="space-y-0.5 pb-1">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <li key={category}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          closeCategoryPicker();
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 ${
                          isSelected
                            ? 'border-stone-300/90 bg-white text-slate-900 shadow-sm'
                            : 'border-transparent text-slate-800 hover:border-stone-200/80 hover:bg-white/60'
                        }`}
                      >
                        <span className="truncate">{category}</span>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 shrink-0 text-slate-700"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {basket.length > 0 && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-slate-200/90 bg-white/95 px-5 py-4 shadow-[0_-10px_40px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md transition-[transform,opacity] duration-300 ease-out will-change-transform lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
            miniBarEntered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          role="region"
          aria-label="Basket summary"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-4 sm:gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {basketItemCount} {basketItemCount === 1 ? 'item' : 'items'}
              </p>
              <p className="text-xs text-gray-600">Subtotal GBP {subtotal.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={() => setBasketDrawerOpen(true)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            >
              Basket
            </button>
            {orderingPaused ? (
              <span
                className="inline-flex min-h-[44px] shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-slate-400 px-4 text-sm font-bold text-white opacity-80 shadow-md"
                aria-disabled
              >
                Checkout
              </span>
            ) : (
              <Link
                href="/order/checkout"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] active:bg-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
              >
                Checkout
              </Link>
            )}
          </div>
        </div>
      )}

      {basket.length > 0 && basketDrawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
          <div
            className={`absolute inset-0 cursor-default bg-slate-900/40 transition-opacity duration-300 ease-out ${
              basketSheetEntered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
            onClick={closeBasketDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-drawer-title"
            className={`absolute bottom-0 left-0 right-0 z-10 max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-2xl border-t border-slate-200/90 bg-slate-50/98 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_48px_rgba(15,23,42,0.15)] transition-transform duration-300 ease-out ${
              basketSheetEntered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-1 flex justify-center" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-slate-300/80" />
              </div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="basket-drawer-title" className="text-lg font-bold text-slate-900">
                  Basket
                </h2>
                <button
                  type="button"
                  onClick={closeBasketDrawer}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  aria-label="Close basket"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">{renderBasketLineItems()}</div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-semibold text-slate-900">Subtotal</span>
                <span className="text-lg font-bold tabular-nums text-slate-900">GBP {subtotal.toFixed(2)}</span>
              </div>
              {orderingPaused ? (
                <span
                  className={`mt-4 block w-full text-center ${primaryButtonClass} cursor-not-allowed opacity-50`}
                  aria-disabled
                >
                  Continue to checkout
                </span>
              ) : (
                <Link
                  href="/order/checkout"
                  onClick={closeBasketDrawer}
                  className={`mt-4 block w-full text-center ${primaryButtonClass} hover:shadow-md`}
                >
                  Continue to checkout
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
