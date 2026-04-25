'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

type CollectionSlotRow = { time: string; current: number; max: number; available: boolean; full: boolean };
type CollectionAvailability = {
  shopOpen: boolean;
  message: string | null;
  maxPerSlot: number;
  slots: CollectionSlotRow[];
};

const optionCardClass =
  'rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(28,26,24,0.08)] transition-all duration-200';
const modeButtonClass =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200';
const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function OrderStartPage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'collection' | 'table' | null>(null);
  const [availability, setAvailability] = useState<CollectionAvailability | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [collectionTime, setCollectionTime] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/ordering/collection-availability', { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setAvailability(null);
          return;
        }
        const payload = (await response.json()) as CollectionAvailability;
        if (!cancelled) setAvailability(payload);
      } catch {
        if (!cancelled) setAvailability(null);
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCollectionTimes = useMemo(
    () => (availability?.slots ?? []).filter((slot) => slot.available).map((slot) => slot.time),
    [availability]
  );

  useEffect(() => {
    if (!availableCollectionTimes.length) {
      setCollectionTime('');
      return;
    }
    if (!collectionTime || !availableCollectionTimes.includes(collectionTime)) {
      setCollectionTime(availableCollectionTimes[0]);
    }
  }, [availableCollectionTimes, collectionTime]);

  const continueToMenu = () => {
    if (selectedMode === 'collection') {
      if (!collectionTime.trim()) return;
      const query = new URLSearchParams({
        type: 'collection',
        collectionTime: collectionTime.trim(),
      });
      router.push(`/order?${query.toString()}`);
      return;
    }
    if (selectedMode === 'table') {
      const trimmed = tableNumber.trim();
      if (!trimmed) return;
      const query = new URLSearchParams({
        type: 'table',
        tableNumber: trimmed,
      });
      router.push(`/order?${query.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-12 sm:px-8 sm:pt-16">
        <section className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Start your order</h1>
          <p className="mt-3 max-w-2xl text-sm text-stone-600 sm:text-base">
            Choose how you want to place your order, then continue to the full menu.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            <section
              className={`${optionCardClass} ${
                selectedMode === 'collection'
                  ? 'border-stone-900 ring-1 ring-stone-900/20'
                  : 'hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_28px_rgba(28,26,24,0.12)]'
              }`}
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300/80 bg-stone-50 text-stone-700">
                <span aria-hidden>🛍️</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-stone-900">Collection</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Order ahead and collect from the cafe.
              </p>
              <button
                type="button"
                className={`${modeButtonClass} mt-5 ${
                  selectedMode === 'collection'
                    ? 'button-order'
                    : 'button-primary'
                }`}
                onClick={() => setSelectedMode('collection')}
              >
                Select collection
              </button>

              {selectedMode === 'collection' && (
                <div className="mt-4 space-y-2 rounded-xl border border-stone-200/80 bg-light/70 p-3">
                  <label htmlFor="collection-time" className="block text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Collection time
                  </label>
                  {availabilityLoading ? (
                    <p className="text-sm text-stone-600">Loading available times...</p>
                  ) : availableCollectionTimes.length > 0 ? (
                    <select
                      id="collection-time"
                      value={collectionTime}
                      onChange={(event) => setCollectionTime(event.target.value)}
                      className={inputClass}
                    >
                      {availableCollectionTimes.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-amber-800/95">
                      {availability?.message?.trim() ?? 'No collection slots available right now.'}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section
              className={`${optionCardClass} ${
                selectedMode === 'table'
                  ? 'border-stone-900 ring-1 ring-stone-900/20'
                  : 'hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-[0_12px_28px_rgba(28,26,24,0.12)]'
              }`}
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300/80 bg-stone-50 text-stone-700">
                <span aria-hidden>🍽️</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-stone-900">Table service</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Order from your table while you&apos;re here.
              </p>
              <button
                type="button"
                className={`${modeButtonClass} mt-5 ${
                  selectedMode === 'table' ? 'button-order' : 'button-primary'
                }`}
                onClick={() => setSelectedMode('table')}
              >
                Select table service
              </button>

              {selectedMode === 'table' && (
                <div className="mt-4 space-y-2 rounded-xl border border-stone-200/80 bg-light/70 p-3">
                  <label htmlFor="table-number" className="block text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Table number
                  </label>
                  <input
                    id="table-number"
                    value={tableNumber}
                    onChange={(event) => setTableNumber(event.target.value)}
                    className={inputClass}
                    placeholder="e.g. 4 or A3"
                  />
                </div>
              )}
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={continueToMenu}
              disabled={
                selectedMode === null ||
                (selectedMode === 'collection' && !collectionTime.trim()) ||
                (selectedMode === 'table' && !tableNumber.trim())
              }
              className={`inline-flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#E87AA2] px-8 py-3.5 text-base font-extrabold tracking-[0.01em] text-black shadow-[0_8px_22px_rgba(28,26,24,0.2)] transition-colors duration-200 ease-in-out sm:w-auto ${
                selectedMode === null ||
                (selectedMode === 'collection' && !collectionTime.trim()) ||
                (selectedMode === 'table' && !tableNumber.trim())
                  ? 'cursor-not-allowed opacity-55'
                  : 'cursor-pointer hover:bg-[#DC6A94]'
              }`}
            >
              Continue to menu
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
