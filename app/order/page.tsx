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
  'mt-4 flex min-h-[48px] w-full box-border items-center justify-center rounded-xl border-2 border-transparent px-4 py-3.5 text-center text-base font-bold text-white shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 focus:outline-none focus:ring-2 focus:ring-brandGreen/35 focus:ring-offset-2 focus:ring-offset-light';

const primaryButtonClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-primary px-4 py-3.5 font-bold text-white shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-light active:scale-[0.98]';
const secondaryButtonClass =
  'inline-flex items-center justify-center rounded-xl border border-stone-200/90 bg-light/90 px-4 py-2 text-stone-800 shadow-sm transition-all duration-200 hover:border-stone-300/80 hover:bg-light hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2';
const qtyButtonClass =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200/90 bg-light/90 text-lg font-semibold leading-none text-stone-800 shadow-sm transition-all duration-200 hover:border-stone-300/80 hover:bg-light hover:shadow-md active:scale-[0.92] active:bg-mint/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-2';
const noticeBoxClass = 'rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-900/90';

const menuItemCardClass =
  'group relative flex flex-col rounded-2xl border border-stone-200/80 bg-light/90 p-5 shadow-[0_2px_18px_rgba(28,26,24,0.05)] transition-all duration-200 hover:border-stone-300/80 hover:shadow-md active:scale-[0.99] active:shadow-sm';

const availabilityBadge = (available: boolean) => (
  <span
    className={`inline-flex w-fit shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      available
        ? 'bg-emerald-50/90 text-emerald-800/95 ring-1 ring-inset ring-emerald-600/15'
        : 'bg-stone-100/80 text-stone-600 ring-1 ring-inset ring-stone-400/20'
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
  const [mobileSummaryBarMounted, setMobileSummaryBarMounted] = useState(false);
  const [mobileSummaryBarEntered, setMobileSummaryBarEntered] = useState(false);
  const [basketDrawerOpen, setBasketDrawerOpen] = useState(false);
  const [basketSheetEntered, setBasketSheetEntered] = useState(false);
  const [orderingPaused, setOrderingPaused] = useState(false);
  /** Visual feedback only: brief pulse on mobile bar after an add (does not delay add). */
  const [basketBarPulse, setBasketBarPulse] = useState(false);
  /** Line item id whose quantity was just changed — micro-scale on the number (±). */
  const [quantityFlashId, setQuantityFlashId] = useState<string | null>(null);
  const addFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeDrawerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileSummaryBarExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const basketBarPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantityFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileCategoryTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const previousBasketLengthRef = useRef(0);

  const closeBasketDrawer = useCallback(() => {
    setBasketSheetEntered(false);
    if (closeDrawerTimeoutRef.current) clearTimeout(closeDrawerTimeoutRef.current);
    closeDrawerTimeoutRef.current = setTimeout(() => {
      setBasketDrawerOpen(false);
      closeDrawerTimeoutRef.current = null;
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
    if (basketBarPulseTimerRef.current) clearTimeout(basketBarPulseTimerRef.current);
    setBasketBarPulse(true);
    basketBarPulseTimerRef.current = setTimeout(() => {
      setBasketBarPulse(false);
      basketBarPulseTimerRef.current = null;
    }, 380);
    if (addFeedbackTimerRef.current) clearTimeout(addFeedbackTimerRef.current);
    addFeedbackTimerRef.current = setTimeout(() => setJustAddedId(null), 1500);
  };

  const updateQuantity = (itemId: string, nextQuantity: number) => {
    if (quantityFlashTimerRef.current) clearTimeout(quantityFlashTimerRef.current);
    setQuantityFlashId(itemId);
    setBasket((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((entry) => entry.item.id !== itemId);
      }
      return prev.map((entry) =>
        entry.item.id === itemId ? { ...entry, quantity: nextQuantity } : entry
      );
    });
    quantityFlashTimerRef.current = setTimeout(() => {
      setQuantityFlashId((current) => (current === itemId ? null : current));
      quantityFlashTimerRef.current = null;
    }, 220);
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

  useEffect(() => {
    const el = mobileCategoryTabRefs.current[selectedCategory];
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [selectedCategory]);

  const itemsForSelectedMobileCategory = useMemo(
    () =>
      selectedCategory && ORDER_MENU_BY_CATEGORY[selectedCategory]
        ? ORDER_MENU_BY_CATEGORY[selectedCategory]
        : null,
    [selectedCategory]
  );

  useEffect(() => {
    const n = basket.length;
    const prev = previousBasketLengthRef.current;
    if (mobileSummaryBarExitTimerRef.current) {
      clearTimeout(mobileSummaryBarExitTimerRef.current);
      mobileSummaryBarExitTimerRef.current = null;
    }
    if (n > 0 && prev === 0) {
      setMobileSummaryBarMounted(true);
      setMobileSummaryBarEntered(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMobileSummaryBarEntered(true));
      });
      previousBasketLengthRef.current = n;
      return () => cancelAnimationFrame(id);
    }
    if (n === 0 && prev > 0) {
      setMobileSummaryBarEntered(false);
      mobileSummaryBarExitTimerRef.current = setTimeout(() => {
        setMobileSummaryBarMounted(false);
        mobileSummaryBarExitTimerRef.current = null;
      }, 300);
      previousBasketLengthRef.current = n;
      return () => {
        if (mobileSummaryBarExitTimerRef.current) {
          clearTimeout(mobileSummaryBarExitTimerRef.current);
          mobileSummaryBarExitTimerRef.current = null;
        }
      };
    }
    previousBasketLengthRef.current = n;
  }, [basket.length]);

  useEffect(() => {
    return () => {
      if (addFeedbackTimerRef.current) clearTimeout(addFeedbackTimerRef.current);
      if (basketBarPulseTimerRef.current) clearTimeout(basketBarPulseTimerRef.current);
      if (quantityFlashTimerRef.current) clearTimeout(quantityFlashTimerRef.current);
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
    if (!basketDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (basketDrawerOpen) closeBasketDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [basketDrawerOpen, closeBasketDrawer]);

  useEffect(() => {
    if (basket.length === 0) {
      setBasketSheetEntered(false);
      setBasketDrawerOpen(false);
    }
  }, [basket.length]);

  useEffect(() => {
    return () => {
      if (closeDrawerTimeoutRef.current) clearTimeout(closeDrawerTimeoutRef.current);
    };
  }, []);

  const addButtonStateClass = (isAdded: boolean) =>
    isAdded
      ? 'border-emerald-500/40 bg-emerald-800/90 hover:border-emerald-400/50 hover:bg-emerald-800'
      : 'bg-primary hover:border-primary/30 hover:bg-primary/90 active:scale-[0.98] active:bg-primary/95 active:shadow-inner';

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
          <h3 className="min-w-0 flex-1 pr-1 text-base font-semibold leading-snug text-stone-900">
            {item.name}
          </h3>
          <p className="shrink-0 text-right text-base font-bold tabular-nums text-stone-900">GBP {item.price.toFixed(2)}</p>
        </div>
        <div className="mt-2.5">{availabilityBadge(item.available)}</div>
        {item.description && (
          <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.description}</p>
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
        className="rounded-xl border border-stone-200/80 bg-mint/15 p-3.5 shadow-sm"
      >
        <p className="font-semibold text-stone-900">{entry.item.name}</p>
        <p className="text-sm text-stone-600">GBP {entry.item.price.toFixed(2)} each</p>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)}
            className={qtyButtonClass}
            aria-label={`Decrease ${entry.item.name} quantity`}
          >
            -
          </button>
          <span
            className={`inline-block min-w-8 text-center text-sm font-semibold tabular-nums text-stone-900 transition-transform duration-200 will-change-transform ${
              quantityFlashId === entry.item.id ? 'scale-125' : 'scale-100'
            }`}
          >
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

  const emptyBasketContent = (
    <div className="flex flex-col items-center justify-center gap-3 py-2 text-center sm:py-4">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-stone-300/80 bg-stone-100/50 text-stone-500">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.25 0H4.5l-1.5 9h19.5l-1.5-9z"
          />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-800">Your basket is empty</p>
        <p className="mt-1 text-sm text-stone-600">Browse the menu to get started.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16 pb-28 lg:pb-16">
        <div className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="mb-3 text-3xl font-black text-stone-900 sm:text-4xl">Online Ordering</h1>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">
              Hidden pre-launch ordering foundation. This flow is for internal testing only.
            </p>
          </div>
          {orderingPaused && (
            <div
              className="mb-6 rounded-xl border border-rose-200/80 bg-rose-50/90 p-4 text-rose-900/95"
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
              {basket.length === 0 && (
                <div className="rounded-xl border border-dashed border-stone-200/80 bg-stone-50/40 p-4 sm:p-5 lg:hidden">
                  {emptyBasketContent}
                </div>
              )}
              <nav
                className="sticky top-16 z-20 -mx-6 mb-3 min-h-[3.25rem] border-b border-stone-200/60 bg-light/95 shadow-[0_1px_0_rgba(28,26,24,0.04)] backdrop-blur-sm supports-[backdrop-filter]:bg-light/88 sm:top-20 sm:-mx-8 lg:hidden"
                aria-label="Menu categories"
              >
                <p id="order-category-nav-label" className="sr-only">
                  Select menu category
                </p>
                <div
                  className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-4 py-2.5 [scrollbar-width:thin] sm:px-6 [scrollbar-color:rgba(148,163,184,0.45)_transparent]"
                  role="tablist"
                  aria-labelledby="order-category-nav-label"
                >
                  {categories.map((category) => {
                    const isActive = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        id={`order-category-tab-${slugifyCategory(category)}`}
                        aria-selected={isActive}
                        ref={(el) => {
                          mobileCategoryTabRefs.current[category] = el;
                        }}
                        aria-controls="order-category-panel"
                        onClick={() => setSelectedCategory(category)}
                        className={`shrink-0 select-none rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'border-primary/80 bg-primary text-white shadow-sm'
                            : 'border-stone-200/90 bg-light/90 text-stone-700 shadow-sm hover:border-stone-300/80 hover:bg-light active:scale-[0.98]'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="space-y-6 lg:hidden">
                {itemsForSelectedMobileCategory && selectedCategory && (
                  <div
                    id="order-category-panel"
                    role="tabpanel"
                    aria-labelledby={`order-category-tab-${slugifyCategory(selectedCategory)}`}
                    className="rounded-xl border border-stone-200/75 bg-light/60 p-4 sm:p-5"
                  >
                    <h2 className="mb-4 text-xl font-bold text-stone-900">{selectedCategory}</h2>
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
                    className="scroll-mt-28 sm:scroll-mt-32 rounded-xl border border-stone-200/75 bg-light/60 p-4 sm:p-5"
                  >
                    <h2 className="mb-4 text-xl font-bold text-stone-900">{category}</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                      {items.map((item) => renderMenuItemCard(item))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside
              id="order-basket"
              className="order-1 hidden min-h-0 max-h-[min(100vh-5.5rem,40rem)] flex-col rounded-2xl border-2 border-stone-200/80 bg-mint/25 p-5 shadow-[0_6px_24px_rgba(28,26,24,0.06)] sm:p-6 lg:order-2 lg:sticky lg:top-20 lg:flex lg:self-start"
            >
              <h2 className="shrink-0 text-xl font-bold text-stone-900">Basket</h2>
              {basket.length === 0 ? (
                <div className="mt-3 min-h-0 flex-1">{emptyBasketContent}</div>
              ) : (
                <>
                  <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]">
                    {renderBasketLineItems()}
                  </div>
                  <div className="mt-4 shrink-0 space-y-3 border-t border-stone-200/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">Subtotal</span>
                      <span className="font-bold tabular-nums text-stone-900">GBP {subtotal.toFixed(2)}</span>
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
                        className={`block w-full text-center ${primaryButtonClass} hover:shadow-md`}
                      >
                        Continue to checkout
                      </Link>
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>
        </div>
      </main>

      {mobileSummaryBarMounted && (
        <div
          className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 max-w-6xl mx-auto px-0 transition-[transform,opacity] duration-300 ease-out will-change-transform lg:hidden ${
            mobileSummaryBarEntered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
        >
          <div className="pointer-events-auto px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-0 sm:px-4">
            <button
              type="button"
              onClick={() => setBasketDrawerOpen(true)}
              className={`group flex min-h-[52px] w-full items-center justify-between gap-3 rounded-t-2xl border border-primary/30 bg-primary px-4 py-3.5 text-left text-white shadow-[0_-8px_32px_rgba(28,26,24,0.18)] transition-[transform,box-shadow,ring-width] duration-200 ease-out will-change-transform active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-primary ${
                basketBarPulse ? 'scale-[1.02] ring-2 ring-inset ring-white/25' : 'scale-100'
              }`}
              aria-label={`View basket: ${basketItemCount} ${basketItemCount === 1 ? 'item' : 'items'}, £${subtotal.toFixed(2)} total`}
            >
              <span className="inline-flex min-w-0 items-center gap-2.5 text-white/95">
                <span
                  className={`inline-flex shrink-0 -rotate-0 transition-transform duration-300 ease-out ${
                    basketBarPulse ? 'scale-110' : 'scale-100'
                  }`}
                  aria-hidden
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.25 0H4.5l-1.5 9h19.5l-1.5-9z"
                    />
                  </svg>
                </span>
                <span
                  className={`inline-block text-sm font-semibold tabular-nums tracking-tight transition-transform duration-300 ease-out ${
                    basketBarPulse ? 'scale-110' : 'scale-100'
                  }`}
                >
                  {basketItemCount} {basketItemCount === 1 ? 'item' : 'items'}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 items-center justify-end gap-3 pl-2">
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums text-white transition-transform duration-300 ${
                    basketBarPulse ? 'scale-105' : 'scale-100'
                  }`}
                >
                  £{subtotal.toFixed(2)}
                </span>
                <span className="shrink-0 text-sm font-medium text-white/90 transition-transform duration-200 group-active:translate-x-0.5">
                  View basket
                  <span className="ml-0.5" aria-hidden>
                    →
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      {basket.length > 0 && basketDrawerOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden" role="presentation">
          <div
            className={`absolute inset-0 cursor-default bg-stone-900/35 transition-opacity duration-300 ease-out ${
              basketSheetEntered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
            onClick={closeBasketDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-drawer-title"
            className={`absolute bottom-0 left-0 right-0 z-10 max-h-[min(88dvh,640px)] overflow-y-auto rounded-t-2xl border-t border-stone-200/80 bg-light/98 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(28,26,24,0.12)] transition-transform duration-300 ease-out ${
              basketSheetEntered ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="mx-auto w-full max-w-lg">
              <div className="mb-1 flex justify-center" aria-hidden>
                <span className="h-1 w-10 rounded-full bg-stone-300/80" />
              </div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 id="basket-drawer-title" className="text-lg font-bold text-stone-900">
                  Basket
                </h2>
                <button
                  type="button"
                  onClick={closeBasketDrawer}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200/50 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
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
              <div className="mt-4 flex items-center justify-between border-t border-stone-200/80 pt-4">
                <span className="font-semibold text-stone-900">Subtotal</span>
                <span className="text-lg font-bold tabular-nums text-stone-900">GBP {subtotal.toFixed(2)}</span>
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
