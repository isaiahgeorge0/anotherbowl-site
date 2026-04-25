'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffNav from '@/components/StaffNav';
import { supabaseServer } from '@/lib/supabaseServer';
import type { PersistedOrder, StaffOrderStatus } from '@/types/order';

const secondaryButtonClass =
  'button-staff inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2 text-sm shadow-sm';

const cardBase =
  'rounded-2xl border border-stone-200/70 bg-light/90 p-5 shadow-[0_4px_24px_rgba(28,26,24,0.05)] sm:p-6';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const statusPill: Record<StaffOrderStatus, string> = {
  new: 'bg-brandPink/15 text-stone-900 ring-1 ring-brandPink/35',
  preparing: 'bg-sky-100/80 text-sky-950 ring-1 ring-sky-400/45',
  ready: 'bg-emerald-100/80 text-emerald-950 ring-1 ring-emerald-500/45',
  completed: 'bg-stone-200/60 text-stone-900 ring-1 ring-stone-400/40',
  cancelled: 'bg-rose-100/80 text-rose-950 ring-1 ring-rose-500/40',
};

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday 00:00 of the week that contains `d` (local). */
function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + toMonday);
  x.setHours(0, 0, 0, 0);
  return x;
}

function orderCreatedDate(o: PersistedOrder): Date {
  return new Date(o.createdAt);
}

/** e.g. "12:00 – 1:00 pm" in local format (busiest starting hour). */
function formatBusiestHourLabel(hour: number | null): string {
  if (hour === null) return '—';
  const a = new Date(2000, 0, 1, hour, 0, 0);
  const b = new Date(2000, 0, 1, hour + 1, 0, 0);
  return `${a.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – ${b.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

type LineAgg = { name: string; quantity: number; revenue: number };
type DaySlice = { count: number; ordersRevenue: number };

function aggregateLineItems(orders: PersistedOrder[]): Map<string, LineAgg> {
  const m = new Map<string, LineAgg>();
  for (const o of orders) {
    if (o.status === 'cancelled' || !o.items?.length) continue;
    for (const line of o.items) {
      const id = String(line.item.id);
      const add = line.quantity;
      const rev = line.item.price * line.quantity;
      const ex = m.get(id);
      if (ex) {
        m.set(id, {
          name: line.item.name,
          quantity: ex.quantity + add,
          revenue: ex.revenue + rev,
        });
      } else {
        m.set(id, { name: line.item.name, quantity: add, revenue: rev });
      }
    }
  }
  return m;
}

function topLines(map: Map<string, LineAgg>, n: number): LineAgg[] {
  return [...map.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, n);
}

function typedTotalLabel(col: number, table: number): string {
  if (col + table === 0) return 'No non-cancelled orders today';
  return `${col} collection · ${table} table`;
}

function weekListHasData(m: { byWeekday: number[]; revenueByDay: number[] }): boolean {
  return m.byWeekday.some((c) => c > 0) || m.revenueByDay.some((r) => r > 0);
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PersistedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const getStaffAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {};
    const { data } = await supabaseServer.auth.getSession();
    if (data.session?.access_token) {
      headers.authorization = `Bearer ${data.session.access_token}`;
    }
    const legacyStaffKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
    if (legacyStaffKey) headers['x-staff-key'] = legacyStaffKey;
    return headers;
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (!data.session) {
        router.replace('/staff/login');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    };
    checkSession();
    const { data: sub } = supabaseServer.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace('/staff/login');
      } else {
        setIsAuthenticated(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setError('');
    setLoading(true);
    try {
      const authHeaders = await getStaffAuthHeaders();
      const res = await fetch('/api/orders', { cache: 'no-store', headers: authHeaders });
      if (!res.ok) throw new Error('fetch');
      const data = (await res.json()) as {
        orders: Array<{ order: PersistedOrder; items: PersistedOrder['items'] }>;
      };
      setOrders(
        data.orders.map((e) => ({
          ...e.order,
          items: e.items,
        }))
      );
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [getStaffAuthHeaders, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) void fetchOrders();
  }, [fetchOrders, isAuthenticated]);

  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const todayEnd = addDays(todayStart, 1);
    const weekStart = startOfIsoWeek(now);
    const weekEnd = addDays(weekStart, 7);

    const inToday = (o: PersistedOrder) => {
      const t = orderCreatedDate(o);
      return t >= todayStart && t < todayEnd;
    };
    const inThisWeek = (o: PersistedOrder) => {
      const t = orderCreatedDate(o);
      return t >= weekStart && t < weekEnd;
    };
    const nonCancelled = (o: PersistedOrder) => o.status !== 'cancelled';

    const todayList = orders.filter(inToday);
    const todayExCancelled = todayList.filter(nonCancelled);

    const totalOrdersToday = todayList.length;
    const totalRevenueToday = todayExCancelled.reduce((s, o) => s + o.total, 0);
    const aovToday =
      todayExCancelled.length > 0 ? totalRevenueToday / todayExCancelled.length : 0;

    const ordersReadyToday = todayList.filter((o) => o.status === 'ready').length;
    const ordersPreparingToday = todayList.filter((o) => o.status === 'preparing').length;
    const ordersPendingToday = todayList.filter((o) => o.status === 'new').length;

    const weekList = orders.filter(inThisWeek);
    const weekExCancelled = weekList.filter(nonCancelled);
    const daySlices: DaySlice[] = Array.from({ length: 7 }, () => ({
      count: 0,
      ordersRevenue: 0,
    }));
    for (let i = 0; i < 7; i++) {
      const d0 = addDays(weekStart, i);
      const d1 = addDays(weekStart, i + 1);
      const d0t = d0.getTime();
      const d1t = d1.getTime();
      const inSlot = (o: PersistedOrder) => {
        const t = orderCreatedDate(o).getTime();
        return t >= d0t && t < d1t;
      };
      const slotOrders = weekList.filter(inSlot);
      const slotEx = slotOrders.filter(nonCancelled);
      daySlices[i] = {
        count: slotEx.length,
        ordersRevenue: slotEx.reduce((s, o) => s + o.total, 0),
      };
    }
    const byWeekdayClean = daySlices.map((d) => d.count);
    const revenueByDay = daySlices.map((d) => d.ordersRevenue);

    const hoursToday = new Map<number, number>();
    for (const o of todayList) {
      const h = orderCreatedDate(o).getHours();
      hoursToday.set(h, (hoursToday.get(h) ?? 0) + 1);
    }
    let busiestHour: number | null = null;
    let maxC = 0;
    for (const [h, c] of hoursToday) {
      if (c > maxC) {
        maxC = c;
        busiestHour = h;
      }
    }
    if (maxC === 0) busiestHour = null;

    const recentFive = [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const weekMax = Math.max(1, ...byWeekdayClean);
    const weekMaxRevenue = Math.max(0.01, ...revenueByDay);

    const topSellingToday = topLines(aggregateLineItems(todayExCancelled), 8);
    const topSellingWeek = topLines(aggregateLineItems(weekExCancelled), 8);

    const todayNonCX = todayList.filter(nonCancelled);
    const colToday = todayNonCX.filter((o) => o.orderType === 'collection').length;
    const tableToday = todayNonCX.filter((o) => o.orderType === 'table').length;
    const typedTotal = colToday + tableToday;
    const colPct = typedTotal > 0 ? Math.round((colToday / typedTotal) * 1000) / 10 : 0;
    const tablePct = typedTotal > 0 ? Math.round((tableToday / typedTotal) * 1000) / 10 : 0;

    const collectionTimesToday = new Map<string, number>();
    for (const o of todayExCancelled) {
      if (o.orderType !== 'collection') continue;
      const slot = (o.collectionTime && o.collectionTime.trim()) || 'Not set';
      collectionTimesToday.set(slot, (collectionTimesToday.get(slot) ?? 0) + 1);
    }
    const peakCollectionSlots = [...collectionTimesToday.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8);

    const cancelledToday = todayList.filter((o) => o.status === 'cancelled').length;
    const cancelledWeek = weekList.filter((o) => o.status === 'cancelled').length;
    const cancelledPctToday =
      todayList.length > 0 ? Math.round((cancelledToday / todayList.length) * 1000) / 10 : 0;

    const bestSellerToday = topSellingToday[0] ?? null;
    let mostActiveType: 'collection' | 'table' | 'tie' | 'none' = 'none';
    if (colToday + tableToday > 0) {
      if (colToday > tableToday) mostActiveType = 'collection';
      else if (tableToday > colToday) mostActiveType = 'table';
      else mostActiveType = 'tie';
    }

    return {
      totalOrdersToday,
      totalRevenueToday,
      aovToday,
      ordersReadyToday,
      ordersPreparingToday,
      ordersPendingToday,
      byWeekday: byWeekdayClean,
      revenueByDay,
      daySlices,
      weekMax,
      weekMaxRevenue,
      busiestHour,
      busiestLabel: formatBusiestHourLabel(busiestHour),
      weekStart,
      recentFive,
      topSellingToday,
      topSellingWeek,
      colToday,
      tableToday,
      colPct,
      tablePct,
      peakCollectionSlots,
      cancelledToday,
      cancelledWeek,
      cancelledPctToday,
      bestSellerToday,
      mostActiveType,
    };
  }, [orders]);

  if (authLoading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
          <p className="text-stone-600">Checking staff session…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white/80 to-light">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-16">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Owner dashboard</h1>
            <p className="mt-1 text-sm text-stone-600">Daily and weekly performance from your orders (read-only).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/staff/orders" className={secondaryButtonClass}>
              Open orders
            </Link>
            <button
              type="button"
              onClick={() => void fetchOrders()}
              className={secondaryButtonClass}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
        </div>

        <StaffNav />

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200/80 bg-rose-50/90 p-4 text-rose-900" role="alert">
            {error}
          </div>
        )}

        {loading && !orders.length ? (
          <p className="text-stone-600" role="status" aria-live="polite">
            Loading orders…
          </p>
        ) : (
          <>
            {orders.length === 0 && !error && (
              <div
                className="mb-8 rounded-2xl border border-dashed border-stone-200/90 bg-mint/15 p-8 text-center"
                role="status"
              >
                <p className="text-lg font-semibold text-stone-800">No order data yet</p>
                <p className="mt-2 max-w-md mx-auto text-sm text-stone-600">
                  When customers place orders, this dashboard will show sales, mix, and trends. You can open the live
                  orders view anytime.
                </p>
                <Link href="/staff/orders" className={`${secondaryButtonClass} mt-6`}>
                  Go to staff orders
                </Link>
              </div>
            )}

            <div className="mb-2 text-xs text-stone-500">
              Week of {metrics.weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (Mon–Sun,
              local time)
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className={`${cardBase} !p-4 border-l-4 border-l-amber-500/60`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Busiest time today</p>
                <p className="mt-1.5 text-lg font-bold leading-snug text-stone-900">
                  {metrics.totalOrdersToday > 0 && metrics.busiestHour !== null
                    ? metrics.busiestLabel
                    : '—'}
                </p>
              </div>
              <div className={`${cardBase} !p-4 border-l-4 border-l-primary/60`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Best seller today</p>
                <p className="mt-1.5 text-lg font-bold leading-snug text-stone-900 line-clamp-2">
                  {metrics.bestSellerToday ? metrics.bestSellerToday.name : '—'}
                </p>
                {metrics.bestSellerToday && (
                  <p className="mt-1 text-xs text-stone-500">
                    {metrics.bestSellerToday.quantity} sold · est. £{metrics.bestSellerToday.revenue.toFixed(2)}
                  </p>
                )}
              </div>
              <div className={`${cardBase} !p-4 border-l-4 border-l-accent/60`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Average order value</p>
                <p className="mt-1.5 text-2xl font-black tabular-nums text-stone-900">
                  {metrics.aovToday > 0 ? `£${metrics.aovToday.toFixed(2)}` : '—'}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">Today, excl. cancelled</p>
              </div>
              <div className={`${cardBase} !p-4 border-l-4 border-l-sky-500/60`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Most active (today)</p>
                <p className="mt-1.5 text-lg font-bold text-stone-900">
                  {metrics.mostActiveType === 'collection'
                    ? 'Collection'
                    : metrics.mostActiveType === 'table'
                      ? 'Table'
                      : metrics.mostActiveType === 'tie'
                        ? 'Tie'
                        : '—'}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {typedTotalLabel(metrics.colToday, metrics.tableToday)}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className={`${cardBase} border-l-4 border-l-stone-500/60`}>
                <p className="text-sm font-medium text-stone-600">Total orders today</p>
                <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-stone-900 sm:text-5xl">
                  {metrics.totalOrdersToday}
                </p>
              </div>
              <div className={`${cardBase} border-l-4 border-l-primary/70`}>
                <p className="text-sm font-medium text-stone-600">Total revenue today</p>
                <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-stone-900 sm:text-5xl">
                  £{metrics.totalRevenueToday.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-stone-500">Excludes cancelled (same basis as AOV)</p>
              </div>
              <div className={`${cardBase} border-l-4 border-l-accent/70`}>
                <p className="text-sm font-medium text-stone-600">Average order value</p>
                <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-stone-900 sm:text-5xl">
                  {metrics.aovToday > 0 ? `£${metrics.aovToday.toFixed(2)}` : '—'}
                </p>
              </div>
              <div className={`${cardBase} border-l-4 border-l-sky-500/70`}>
                <p className="text-sm font-medium text-stone-600">Preparing (today)</p>
                <p className="mt-2 text-4xl font-black tabular-nums text-sky-900 sm:text-5xl">
                  {metrics.ordersPreparingToday}
                </p>
              </div>
              <div className={`${cardBase} border-l-4 border-l-emerald-500/70`}>
                <p className="text-sm font-medium text-stone-600">Ready (today)</p>
                <p className="mt-2 text-4xl font-black tabular-nums text-emerald-900 sm:text-5xl">
                  {metrics.ordersReadyToday}
                </p>
              </div>
              <div className={`${cardBase} border-l-4 border-l-brandPink/50`}>
                <p className="text-sm font-medium text-stone-600">Pending (today)</p>
                <p className="mt-2 text-4xl font-black tabular-nums text-stone-900 sm:text-5xl">
                  {metrics.ordersPendingToday}
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={cardBase}>
                <h2 className="text-lg font-bold text-stone-900">Top selling today</h2>
                <p className="mb-3 text-sm text-stone-600">From line items, non-cancelled · revenue = price × qty</p>
                {metrics.topSellingToday.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200/80 bg-stone-50/50 py-6 text-center text-sm text-stone-600">
                    {metrics.totalOrdersToday === 0
                      ? 'No orders today — nothing to rank yet.'
                      : 'No item lines found for today’s non-cancelled orders, or all baskets were empty.'}
                  </p>
                ) : (
                  <ul className="space-y-2.5" aria-label="Top items today by quantity">
                    {metrics.topSellingToday.map((row, idx) => (
                      <li
                        key={`td-${row.name}-${idx}`}
                        className="flex items-baseline justify-between gap-2 border-b border-stone-200/60 pb-2.5 last:border-0"
                      >
                        <span className="min-w-0 font-medium text-stone-900 line-clamp-2">{row.name}</span>
                        <span className="shrink-0 text-right text-sm text-stone-600 tabular-nums">
                          <span className="font-bold text-stone-800">{row.quantity}×</span> · est. £
                          {row.revenue.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={cardBase}>
                <h2 className="text-lg font-bold text-stone-900">Top selling this week</h2>
                <p className="mb-3 text-sm text-stone-600">Mon–Sun window · same method as today</p>
                {metrics.topSellingWeek.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200/80 bg-stone-50/50 py-6 text-center text-sm text-stone-600">
                    {orders.length === 0
                      ? 'No order history in this week yet.'
                      : 'No line items in non-cancelled week orders, or all baskets empty.'}
                  </p>
                ) : (
                  <ul className="space-y-2.5" aria-label="Top items this week by quantity">
                    {metrics.topSellingWeek.map((row, idx) => (
                      <li
                        key={`tw-${row.name}-${idx}`}
                        className="flex items-baseline justify-between gap-2 border-b border-stone-200/60 pb-2.5 last:border-0"
                      >
                        <span className="min-w-0 font-medium text-stone-900 line-clamp-2">{row.name}</span>
                        <span className="shrink-0 text-right text-sm text-stone-600 tabular-nums">
                          <span className="font-bold text-stone-800">{row.quantity}×</span> · est. £
                          {row.revenue.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className={cardBase}>
                <h2 className="text-lg font-bold text-stone-900">Collection vs table (today)</h2>
                <p className="mb-3 text-sm text-stone-600">Non-cancelled orders only</p>
                {typedTotalLabel(metrics.colToday, metrics.tableToday).includes('No non-cancelled') ? (
                  <p className="rounded-xl border border-dashed border-stone-200/80 py-6 text-center text-sm text-stone-600">
                    No non-cancelled orders today — split not available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-700">Collection</span>
                      <span className="font-bold tabular-nums text-stone-900">
                        {metrics.colToday} ({metrics.colPct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: `${metrics.colPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-700">Table</span>
                      <span className="font-bold tabular-nums text-stone-900">
                        {metrics.tableToday} ({metrics.tablePct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80">
                      <div
                        className="h-full bg-amber-600/75"
                        style={{ width: `${metrics.tablePct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={cardBase}>
                <h2 className="text-lg font-bold text-stone-900">Peak collection slots (today)</h2>
                <p className="mb-3 text-sm text-stone-600">By requested slot · non-cancelled</p>
                {metrics.peakCollectionSlots.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200/80 py-6 text-center text-sm text-stone-600">
                    {metrics.colToday === 0
                      ? 'No collection orders today.'
                      : 'No collection times recorded on today’s orders yet.'}
                  </p>
                ) : (
                  <ul className="space-y-2" aria-label="Collection slot frequency today">
                    {metrics.peakCollectionSlots.map(([slot, n]) => (
                      <li key={slot} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-stone-800">{slot}</span>
                        <span className="rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-bold text-emerald-900 tabular-nums">
                          {n} {n === 1 ? 'order' : 'orders'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={`${cardBase} md:col-span-2 xl:col-span-1`}>
                <h2 className="text-lg font-bold text-stone-900">Cancelled</h2>
                <p className="mb-3 text-sm text-stone-600">Same-day share helps spot friction</p>
                {orders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200/80 py-6 text-center text-sm text-stone-600">
                    No orders loaded — no cancellation stats.
                  </p>
                ) : (
                  <ul className="space-y-3 text-sm text-stone-800">
                    <li className="flex justify-between border-b border-stone-200/50 pb-2">
                      <span>Cancelled today</span>
                      <span className="font-bold tabular-nums text-rose-800/95">{metrics.cancelledToday}</span>
                    </li>
                    <li className="flex justify-between border-b border-stone-200/50 pb-2">
                      <span>Share of today (all of today’s orders)</span>
                      <span className="font-bold tabular-nums text-rose-800/95">
                        {metrics.totalOrdersToday > 0 ? `${metrics.cancelledPctToday}%` : '—'}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Cancelled this week (Mon–Sun)</span>
                      <span className="font-bold tabular-nums text-rose-800/95">{metrics.cancelledWeek}</span>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            <div className={`${cardBase} mb-8`}>
              <h2 className="text-lg font-bold text-stone-900">This week: orders &amp; revenue by day</h2>
              <p className="mb-4 text-sm text-stone-600">
                Orders and revenue for non-cancelled day totals · Mon–Sun local
              </p>
              {weekListHasData(metrics) ? (
                <>
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-200/80 text-stone-600">
                          <th className="py-2 pr-2 font-semibold">Day</th>
                          <th className="py-2 pr-2 font-semibold">Orders (excl. canc.)</th>
                          <th className="py-2 font-semibold">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayLabels.map((d, i) => (
                          <tr key={d} className="border-b border-stone-200/50">
                            <td className="py-2 pr-2 font-medium text-stone-900">{d}</td>
                            <td className="py-2 pr-2 tabular-nums text-stone-800">
                              {metrics.daySlices[i].count}
                            </td>
                            <td className="py-2 tabular-nums text-stone-800">
                              £{metrics.revenueByDay[i].toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs font-semibold text-stone-500">Order count</div>
                  <div
                    className="mb-3 flex h-32 items-end gap-1.5 sm:gap-2"
                    role="img"
                    aria-label="Non-cancelled orders per day this week"
                  >
                    {metrics.byWeekday.map((count, i) => {
                      const h = metrics.weekMax > 0 ? Math.max(5, (count / metrics.weekMax) * 100) : 5;
                      return (
                        <div
                          key={dayLabels[i]}
                          className="flex min-w-0 flex-1 flex-col items-center justify-end"
                        >
                          <div
                            className="w-full max-w-14 rounded-t-md bg-primary/80 transition-all sm:max-w-none"
                            style={{ height: `${h}%` }}
                            title={`${dayLabels[i]}: ${count} orders`}
                          />
                          <span className="mt-1.5 w-full text-center text-[10px] font-bold tabular-nums text-stone-800 sm:text-xs">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs font-semibold text-stone-500">Revenue (scaled)</div>
                  <div
                    className="flex h-28 items-end gap-1.5 sm:gap-2"
                    role="img"
                    aria-label="Revenue by day this week"
                  >
                    {metrics.revenueByDay.map((rev, i) => {
                      const h =
                        metrics.weekMaxRevenue > 0 ? Math.max(5, (rev / metrics.weekMaxRevenue) * 100) : 5;
                      return (
                        <div
                          key={`r-${dayLabels[i]}`}
                          className="flex min-w-0 flex-1 flex-col items-center justify-end"
                        >
                          <div
                            className="w-full max-w-14 rounded-t-md bg-emerald-600/55 transition-all sm:max-w-none"
                            style={{ height: `${h}%` }}
                            title={`${dayLabels[i]}: £${rev.toFixed(2)}`}
                          />
                          <span className="mt-1.5 w-full text-center text-[9px] font-bold tabular-nums text-stone-700 sm:text-xs">
                            £{rev < 100 ? rev.toFixed(0) : Math.round(rev)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-stone-200/80 py-6 text-center text-sm text-stone-600">
                  No orders in the current week window.
                </p>
              )}
            </div>

            <div className={cardBase}>
              <h2 className="mb-4 text-lg font-bold text-stone-900">Recent activity</h2>
              <p className="mb-3 text-sm text-stone-600">Latest 5 orders (all time)</p>
              <ul className="divide-y divide-stone-200/80">
                {metrics.recentFive.length === 0 ? (
                  <li className="py-3 text-stone-600">No orders yet.</li>
                ) : (
                  metrics.recentFive.map((o) => (
                    <li
                      key={String(o.id)}
                      className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:items-center sm:gap-2"
                    >
                      <div className="sm:col-span-2">
                        <span className="font-mono text-sm font-bold text-stone-900">{o.orderNumber}</span>
                      </div>
                      <div className="min-w-0 sm:col-span-4">
                        <span className="truncate text-sm text-stone-800">{o.customerName}</span>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-stone-900 sm:col-span-2">
                        £{o.total.toFixed(2)}
                      </div>
                      <div className="sm:col-span-4 sm:text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusPill[o.status]}`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
