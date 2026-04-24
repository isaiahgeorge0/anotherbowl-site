'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { clearBasket, getBasket } from '@/lib/orderStorage';
import type { BasketItem, CheckoutDetails, CheckoutOrderType } from '@/types/order';

type CollectionSlotRow = { time: string; current: number; max: number; available: boolean; full: boolean };
type CollectionAvailability = {
  shopOpen: boolean;
  message: string | null;
  maxPerSlot: number;
  slots: CollectionSlotRow[];
};

type FormErrors = Partial<Record<keyof CheckoutDetails, string>>;
const primaryButtonClass =
  'inline-flex items-center justify-center px-6 py-4 rounded-2xl font-bold text-white bg-primary shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98] active:bg-primary/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-light';
const secondaryButtonClass =
  'px-4 py-2 rounded-xl border border-stone-200/90 text-stone-800 bg-light/90 shadow-sm transition-all duration-200 hover:border-stone-300/80 hover:bg-light active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/40 focus-visible:ring-offset-2';
const inputClass =
  'w-full min-w-0 max-w-full box-border rounded-xl border border-stone-200/80 bg-light/60 px-4 py-3 text-stone-900 shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-stone-400 hover:border-stone-300/90 focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-brandGreen/20 focus:ring-offset-0';
const noticeBoxClass =
  'rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-900/90';

const FIELD_ID_ORDER: (keyof FormErrors)[] = [
  'customerName',
  'email',
  'phone',
  'tableNumber',
  'collectionTime',
];

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
  const [orderingPaused, setOrderingPaused] = useState(false);
  const [orderingStatusLoaded, setOrderingStatusLoaded] = useState(false);
  const [availability, setAvailability] = useState<CollectionAvailability | null>(null);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [placeOrderInView, setPlaceOrderInView] = useState(false);
  const [orderSuccessPhase, setOrderSuccessPhase] = useState(false);
  const [orderSuccessRevealing, setOrderSuccessRevealing] = useState(false);
  const [validationFieldHighlight, setValidationFieldHighlight] = useState<string | null>(null);
  const placeOrderButtonRef = useRef<HTMLButtonElement>(null);
  const placeOrderIORef = useRef<IntersectionObserver | null>(null);
  const validationHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableCollectionTimes = useMemo(
    () =>
      (availability?.slots ?? []).filter((s) => s.available).map((s) => s.time),
    [availability]
  );

  useEffect(() => {
    setBasket(getBasket());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statusRes, capRes] = await Promise.all([
          fetch('/api/ordering/status', { cache: 'no-store' }),
          fetch('/api/ordering/collection-availability', { cache: 'no-store' }),
        ]);
        const j = (await statusRes.json()) as { paused?: boolean };
        if (!cancelled) setOrderingPaused(Boolean(j.paused));
        if (capRes.ok) {
          const cap = (await capRes.json()) as CollectionAvailability;
          if (!cancelled) setAvailability(cap);
        } else if (!cancelled) {
          setAvailability(null);
        }
      } catch {
        if (!cancelled) {
          setOrderingPaused(false);
          setAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setOrderingStatusLoaded(true);
          setAvailabilityLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (details.orderType !== 'collection' || availableCollectionTimes.length === 0) return;
    const t = details.collectionTime ?? '';
    if (!t || !availableCollectionTimes.includes(t)) {
      setDetails((p) => ({ ...p, collectionTime: availableCollectionTimes[0] ?? '' }));
    }
  }, [details.orderType, details.collectionTime, availableCollectionTimes]);

  useEffect(() => {
    if (basket.length === 0 || !orderingStatusLoaded) return;
    if (orderingPaused) return;
    if (!availability?.shopOpen) {
      setPlaceOrderInView(false);
      return;
    }
    const t = window.setTimeout(() => {
      const el = placeOrderButtonRef.current;
      if (!el) return;
      placeOrderIORef.current?.disconnect();
      const ob = new IntersectionObserver(
        ([entry]) => {
          setPlaceOrderInView(entry.isIntersecting);
        },
        { root: null, rootMargin: '0px', threshold: 0.01 }
      );
      ob.observe(el);
      placeOrderIORef.current = ob;
    }, 0);
    return () => {
      window.clearTimeout(t);
      placeOrderIORef.current?.disconnect();
      placeOrderIORef.current = null;
    };
  }, [basket.length, orderingStatusLoaded, orderingPaused, availability?.shopOpen, availability]);

  const subtotal = useMemo(
    () => basket.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0),
    [basket]
  );

  const runValidation = useCallback((): { ok: boolean; errors: FormErrors } => {
    const nextErrors: FormErrors = {};

    if (!details.customerName.trim()) nextErrors.customerName = 'Name is required.';
    if (!details.email.trim()) nextErrors.email = 'Email is required.';
    if (!details.phone.trim()) nextErrors.phone = 'Phone is required.';

    if (details.orderType === 'table' && !details.tableNumber?.trim()) {
      nextErrors.tableNumber = 'Table number is required for table orders.';
    }
    if (details.orderType === 'collection') {
      if (availableCollectionTimes.length === 0) {
        nextErrors.collectionTime =
          availability?.message?.trim() ?? 'No collection times are available right now.';
      } else if (!details.collectionTime?.trim() || !availableCollectionTimes.includes(details.collectionTime)) {
        nextErrors.collectionTime = 'Please choose a valid collection time.';
      }
    }

    return { ok: Object.keys(nextErrors).length === 0, errors: nextErrors };
  }, [details, availableCollectionTimes, availability?.message]);

  const scrollToFirstError = useCallback(
    (next: FormErrors) => {
      for (const key of FIELD_ID_ORDER) {
        if (!next[key]) continue;
        if (key === 'tableNumber' && details.orderType !== 'table') continue;
        if (key === 'collectionTime' && details.orderType !== 'collection') continue;
        const fieldId =
          key === 'collectionTime' ? 'collectionTime' : key === 'tableNumber' ? 'tableNumber' : String(key);
        if (validationHighlightTimerRef.current) {
          clearTimeout(validationHighlightTimerRef.current);
          validationHighlightTimerRef.current = null;
        }
        requestAnimationFrame(() => {
          const el = document.getElementById(fieldId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if ('focus' in el && typeof (el as HTMLInputElement).focus === 'function') {
              (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus({
                preventScroll: true,
              });
            }
          }
        });
        setValidationFieldHighlight(fieldId);
        validationHighlightTimerRef.current = setTimeout(() => {
          setValidationFieldHighlight(null);
          validationHighlightTimerRef.current = null;
        }, 1800);
        break;
      }
    },
    [details.orderType]
  );

  const scrollFieldIntoViewOnFocus = useCallback((fieldId: string) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  const handleOrderTypeChange = (orderType: CheckoutOrderType) => {
    setDetails((prev) => ({
      ...prev,
      orderType,
      tableNumber: orderType === 'table' ? prev.tableNumber ?? '' : '',
      collectionTime: orderType === 'collection' ? prev.collectionTime ?? '' : '',
    }));
  };

  useEffect(() => {
    if (!orderSuccessPhase) {
      setOrderSuccessRevealing(false);
      return;
    }
    setOrderSuccessRevealing(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOrderSuccessRevealing(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [orderSuccessPhase]);

  useEffect(() => {
    return () => {
      if (validationHighlightTimerRef.current) clearTimeout(validationHighlightTimerRef.current);
      if (successNavTimerRef.current) clearTimeout(successNavTimerRef.current);
    };
  }, []);

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || orderSuccessPhase) return;
    if (basket.length === 0) return;
    if (!orderingStatusLoaded || !availabilityLoaded) return;
    if (orderingPaused) {
      setSubmitError('Online ordering is currently paused. Please try again later.');
      return;
    }
    if (!availability?.shopOpen) {
      setSubmitError(availability?.message?.trim() ?? 'Online ordering is not available right now.');
      return;
    }
    const { ok, errors: nextErrors } = runValidation();
    setErrors(nextErrors);
    if (!ok) {
      scrollToFirstError(nextErrors);
      return;
    }
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
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.status === 403) {
          setSubmitError(data.error ?? 'Online ordering is currently paused. Please try again later.');
        } else {
          setSubmitError(
            data.error ?? 'Could not place order. Please check your details and try again.'
          );
        }
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setOrderSuccessPhase(true);
      if (successNavTimerRef.current) clearTimeout(successNavTimerRef.current);
      successNavTimerRef.current = setTimeout(() => {
        clearBasket();
        router.push(`/order/confirmation?orderNumber=${encodeURIComponent(orderNumber)}&total=${subtotal.toFixed(2)}`);
        successNavTimerRef.current = null;
      }, 200);
    } catch {
      setSubmitError('Could not place order right now. Please try again.');
      setSubmitting(false);
    }
  };

  const canCheckout =
    orderingStatusLoaded &&
    availabilityLoaded &&
    !orderingPaused &&
    (availability?.shopOpen ?? false);
  const collectionNoSlots: boolean = Boolean(
    details.orderType === 'collection' &&
      (availableCollectionTimes.length === 0 || !availability?.shopOpen)
  );
  const canSubmitOrder = canCheckout && (details.orderType !== 'collection' || !collectionNoSlots);
  const showMobileSticky = Boolean(
    basket.length > 0 && canSubmitOrder && !placeOrderInView
  );

  const feeAmount = 0;
  const grandTotal = subtotal + feeAmount;
  const orderDisabled = submitting || orderSuccessPhase || !canSubmitOrder;

  const inputFor = (fieldId: string, hasError: boolean) =>
    [
      inputClass,
      'scroll-mt-24 max-md:min-h-[48px] md:scroll-mt-6',
      hasError ? 'border-rose-400/60 ring-1 ring-rose-200/50' : '',
      !hasError && validationFieldHighlight === fieldId
        ? 'ring-2 ring-primary/40 ring-offset-0'
        : '',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-4xl mx-auto min-w-0 px-6 sm:px-8 py-12 sm:py-16">
        <div className="min-w-0 max-w-full box-border overflow-hidden rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="mb-3 text-3xl font-black text-stone-900 sm:text-4xl">Checkout</h1>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Payment integration coming soon.</p>
            <p className="text-sm mt-1">Orders can be placed for testing, but payment is placeholder-only.</p>
          </div>

          {basket.length === 0 ? (
            <div className="rounded-xl border border-stone-200/80 bg-light/60 p-5">
              <p className="mb-3 text-stone-700">Your basket is currently empty.</p>
              <Link href="/order" className="text-primary font-semibold hover:underline">
                Back to order menu
              </Link>
            </div>
          ) : !orderingStatusLoaded || !availabilityLoaded ? (
            <div
              className="flex items-center gap-2 text-sm text-stone-600"
              role="status"
              aria-live="polite"
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full border-2 border-stone-300/80 border-t-stone-600/80 animate-spin"
                aria-hidden
              />
              Loading checkout options…
            </div>
          ) : orderingPaused ? (
            <div className="rounded-xl border border-amber-200/75 bg-amber-50/90 p-5 text-amber-900">
              <p className="font-semibold">Online ordering is currently paused</p>
              <p className="mt-2 text-sm">We are not taking new orders at the moment. Please check back later.</p>
              <Link href="/order" className="mt-4 inline-block font-semibold text-stone-900 hover:underline">
                Back to order menu
              </Link>
            </div>
          ) : !availability ? (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/85 p-5 text-rose-800/95">
              <p className="font-semibold">Could not load ordering options</p>
              <p className="text-sm mt-2">Please refresh the page and try again.</p>
            </div>
          ) : !availability.shopOpen ? (
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-5 text-stone-900">
              <p className="font-semibold">We are not taking online orders right now</p>
              <p className="mt-2 text-sm">
                {availability.message?.trim() ??
                  'The café is currently closed for online collection and table orders. Please check back when we are open.'}
              </p>
              <Link href="/order" className="mt-4 inline-block font-semibold text-stone-900 hover:underline">
                Back to order menu
              </Link>
            </div>
          ) : (
            <form
              id="checkout-form"
              onSubmit={submitOrder}
              className="space-y-5 pb-24 md:pb-0"
              noValidate
            >
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 max-w-full">
                  <label htmlFor="customerName" className="mb-2 block text-sm font-semibold text-stone-900">
                    Customer name
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    value={details.customerName}
                    onChange={(e) => setDetails((prev) => ({ ...prev, customerName: e.target.value }))}
                    onFocus={() => scrollFieldIntoViewOnFocus('customerName')}
                    autoComplete="name"
                    className={inputFor('customerName', Boolean(errors.customerName))}
                    aria-invalid={Boolean(errors.customerName) || undefined}
                    aria-describedby={errors.customerName ? 'customerName-error' : undefined}
                  />
                  {errors.customerName && (
                    <p id="customerName-error" className="mt-1 text-sm text-rose-700/90" role="alert">
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div className="min-w-0 max-w-full">
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-stone-900">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails((prev) => ({ ...prev, email: e.target.value }))}
                    onFocus={() => scrollFieldIntoViewOnFocus('email')}
                    autoComplete="email"
                    className={inputFor('email', Boolean(errors.email))}
                    aria-invalid={Boolean(errors.email) || undefined}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1 text-sm text-rose-700/90" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="min-w-0 max-w-full">
                <label htmlFor="phone" className="mb-2 block text-sm font-semibold text-stone-900">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={details.phone}
                  onChange={(e) => setDetails((prev) => ({ ...prev, phone: e.target.value }))}
                  onFocus={() => scrollFieldIntoViewOnFocus('phone')}
                  autoComplete="tel"
                  inputMode="tel"
                  className={inputFor('phone', Boolean(errors.phone))}
                  aria-invalid={Boolean(errors.phone) || undefined}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="mt-1 text-sm text-rose-700/90" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-stone-900">Order type</p>
                <div className="flex flex-wrap gap-3" role="group" aria-label="Order type">
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('collection')}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border px-5 font-semibold shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-light active:scale-[0.98] ${
                      details.orderType === 'collection'
                        ? 'border-primary bg-primary text-white shadow-md ring-1 ring-primary/25'
                        : 'border-stone-200/90 bg-light/80 text-stone-700 hover:border-stone-300/90 hover:bg-light hover:shadow-sm'
                    }`}
                  >
                    Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrderTypeChange('table')}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border px-5 font-semibold shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-light active:scale-[0.98] ${
                      details.orderType === 'table'
                        ? 'border-primary bg-primary text-white shadow-md ring-1 ring-primary/25'
                        : 'border-stone-200/90 bg-light/80 text-stone-700 hover:border-stone-300/90 hover:bg-light hover:shadow-sm'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>

              {details.orderType === 'table' ? (
                <div className="min-w-0 max-w-full">
                  <label htmlFor="tableNumber" className="mb-2 block text-sm font-semibold text-stone-900">
                    Table number
                  </label>
                  <input
                    id="tableNumber"
                    name="tableNumber"
                    value={details.tableNumber ?? ''}
                    onChange={(e) => setDetails((prev) => ({ ...prev, tableNumber: e.target.value }))}
                    onFocus={() => scrollFieldIntoViewOnFocus('tableNumber')}
                    className={inputFor('tableNumber', Boolean(errors.tableNumber))}
                    aria-invalid={Boolean(errors.tableNumber) || undefined}
                    aria-describedby={errors.tableNumber ? 'tableNumber-error' : undefined}
                  />
                  {errors.tableNumber && (
                    <p id="tableNumber-error" className="mt-1 text-sm text-rose-700/90" role="alert">
                      {errors.tableNumber}
                    </p>
                  )}
                </div>
              ) : (
                <div className="min-w-0 w-full max-w-full">
                    <label htmlFor="collectionTime" className="mb-2 block text-sm font-semibold text-stone-900">
                    Collection time
                  </label>
                  <p className="mb-2 text-xs text-stone-500">
                    Up to {availability?.maxPerSlot ?? 4} online orders per 15-minute slot. Full slots are not shown.
                  </p>
                  {availableCollectionTimes.length > 0 ? (
                    <select
                      id="collectionTime"
                      name="collectionTime"
                      value={details.collectionTime ?? availableCollectionTimes[0] ?? ''}
                      onChange={(e) => setDetails((prev) => ({ ...prev, collectionTime: e.target.value }))}
                      onFocus={() => scrollFieldIntoViewOnFocus('collectionTime')}
                      className={inputFor('collectionTime', Boolean(errors.collectionTime))}
                      aria-invalid={Boolean(errors.collectionTime) || undefined}
                      aria-describedby={errors.collectionTime ? 'collectionTime-error' : undefined}
                    >
                      {availableCollectionTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-amber-800/95">
                      {availability?.message?.trim() ?? 'All collection times are full or unavailable. Please try again later.'}
                    </p>
                  )}
                  {errors.collectionTime && (
                    <p id="collectionTime-error" className="mt-1 text-sm text-rose-700/90" role="alert">
                      {errors.collectionTime}
                    </p>
                  )}
                </div>
              )}

              <div className="min-w-0 max-w-full">
                <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-stone-900">
                  Order notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={details.notes ?? ''}
                  onChange={(e) => setDetails((prev) => ({ ...prev, notes: e.target.value }))}
                  onFocus={() => scrollFieldIntoViewOnFocus('notes')}
                  className={`${inputFor('notes', false)} min-h-[120px] resize-y`}
                />
              </div>

              <div className="space-y-3 rounded-xl border border-stone-200/75 bg-mint/25 p-4" aria-live="polite">
                <h2 className="font-bold text-stone-900">Order summary</h2>
                <ul className="space-y-1.5 text-sm text-stone-700">
                  {basket.map((entry) => (
                    <li key={entry.item.id} className="flex justify-between gap-3 text-left">
                      <span className="min-w-0 break-words">
                        {entry.quantity} × {entry.item.name}
                      </span>
                      <span className="shrink-0 tabular-nums">GBP {(entry.item.price * entry.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-stone-200/60 pt-2.5 text-sm text-stone-800">
                  <span className="font-medium">Subtotal</span>
                  <span className="tabular-nums">GBP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Fees (card processing, service)</span>
                  <span className="tabular-nums">GBP {feeAmount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-stone-500">No extra fee at checkout during testing. Payment is placeholder only.</p>
                <div className="mt-1 flex items-baseline justify-between border-t-2 border-stone-200/80 pt-3 text-lg text-stone-900">
                  <span className="text-base font-bold">Total to pay (when live)</span>
                  <span className="text-xl font-black tabular-nums tracking-tight">GBP {grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                ref={placeOrderButtonRef}
                type="submit"
                disabled={orderDisabled}
                aria-busy={submitting}
                className={`${primaryButtonClass} min-h-[44px] w-full ${
                  orderDisabled ? 'cursor-not-allowed opacity-80' : ''
                } ${submitting && !orderSuccessPhase ? 'cursor-wait' : ''}`}
              >
                {submitting && !orderSuccessPhase ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      aria-hidden
                    />
                    Placing order…
                  </span>
                ) : (
                  'Place order'
                )}
              </button>
              {submitError && (
                <p className="text-sm text-rose-700/90 md:block" role="alert">
                  {submitError}
                </p>
              )}
            </form>
          )}
        </div>
      </main>

      {basket.length > 0 && canSubmitOrder && !orderSuccessPhase && (
        <div
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-light/95 p-5 shadow-[0_-8px_32px_rgba(28,26,24,0.08)] backdrop-blur-md transition-[transform,opacity] duration-300 ease-out will-change-transform md:hidden pb-[max(1rem,env(safe-area-inset-bottom))] ${
            showMobileSticky
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          role="region"
          aria-label="Place order (shown when main button is not on screen)"
          aria-hidden={!showMobileSticky}
        >
          <button
            type="submit"
            form="checkout-form"
            disabled={orderDisabled}
            aria-busy={submitting}
            className={`${primaryButtonClass} min-h-[44px] w-full ${
              orderDisabled ? 'cursor-not-allowed opacity-80' : ''
            } ${submitting && !orderSuccessPhase ? 'cursor-wait' : ''}`}
          >
            {submitting && !orderSuccessPhase ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  aria-hidden
                />
                Placing order…
              </span>
            ) : (
              'Place order'
            )}
          </button>
          {submitError && (
            <p className="mt-2 text-center text-sm text-rose-700/90" role="alert">
              {submitError}
            </p>
          )}
        </div>
      )}

      {orderSuccessPhase && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-auto"
          role="alert"
          aria-live="assertive"
        >
          <div
            className={`absolute inset-0 bg-stone-900/20 transition-opacity duration-200 ${
              orderSuccessRevealing ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
          <div
            className={`relative w-full max-w-sm rounded-2xl border border-stone-200/80 bg-light/98 p-6 shadow-xl transition-all duration-200 ${
              orderSuccessRevealing ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
            }`}
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-stone-200/80 bg-mint/40 text-stone-800">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-bold text-stone-900">Order received</p>
            <p className="mt-1 text-sm text-stone-600">Taking you to the confirmation page…</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
