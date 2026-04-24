'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffLogoutButton from '@/components/StaffLogoutButton';
import { supabaseServer } from '@/lib/supabaseServer';
import type { PersistedOrder, StaffOrderStatus } from '@/types/order';
import type { PrintableDocumentType } from '@/types/printing';

const allStatuses: StaffOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
const primaryButtonClass =
  'px-4 py-2 rounded-lg font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400';
const secondaryButtonClass =
  'px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300';
const selectClass =
  'rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary';
const noticeBoxClass = 'rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900';
const statusOrder: StaffOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
const statusLabels: Record<StaffOrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const statusSectionClass: Record<StaffOrderStatus, string> = {
  new: 'border-brandPink/40 bg-brandPink/5',
  preparing: 'border-blue-200 bg-blue-50/50',
  ready: 'border-emerald-300 bg-emerald-50',
  completed: 'border-gray-200 bg-gray-50',
  cancelled: 'border-red-200 bg-red-50',
};

export default function StaffOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<PersistedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'active' | 'unavailable'>(
    'connecting'
  );
  const [newOrderNotice, setNewOrderNotice] = useState<string | null>(null);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const [onlineOrderingPaused, setOnlineOrderingPaused] = useState(false);
  const [orderingPauseLoading, setOrderingPauseLoading] = useState(false);
  const [orderingPauseError, setOrderingPauseError] = useState('');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedKnownOrdersRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  // Supabase auth gate replaces temporary route protection for operational security.
  // x-staff-key remains temporarily in API requests until backend auth migration is complete.

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

    const { data: authSubscription } = supabaseServer.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.replace('/staff/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  const playAlertTone = useCallback(async () => {
    // Preparation for future operational alerts only (not printer automation).
    if (!soundAlertsEnabled || !hasUserInteractedRef.current) return;
    try {
      await new Audio('/sounds/new-order.mp3').play();
    } catch {
      // Browser may block autoplay/resume if user gesture rules are not met.
    }
  }, [soundAlertsEnabled]);

  const getStaffAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {};
    const { data } = await supabaseServer.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    // Deprecated fallback during transition; remove once all staff clients send session auth.
    const legacyStaffKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
    if (legacyStaffKey) {
      headers['x-staff-key'] = legacyStaffKey;
    }
    return headers;
  }, []);

  const fetchOnlineOrderingPause = useCallback(async () => {
    if (!isAuthenticated) return;
    setOrderingPauseError('');
    setOrderingPauseLoading(true);
    try {
      const authHeaders = await getStaffAuthHeaders();
      const res = await fetch('/api/staff/ordering/pause', {
        cache: 'no-store',
        headers: { ...authHeaders, 'content-type': 'application/json' },
      });
      if (!res.ok) {
        setOrderingPauseError('Could not load online ordering status.');
        return;
      }
      const data = (await res.json()) as { paused?: boolean };
      setOnlineOrderingPaused(Boolean(data.paused));
    } catch {
      setOrderingPauseError('Could not load online ordering status.');
    } finally {
      setOrderingPauseLoading(false);
    }
  }, [getStaffAuthHeaders, isAuthenticated]);

  const setOnlineOrderingPause = useCallback(
    async (next: boolean) => {
      setOrderingPauseError('');
      setOrderingPauseLoading(true);
      try {
        const authHeaders = await getStaffAuthHeaders();
        const res = await fetch('/api/staff/ordering/pause', {
          method: 'POST',
          headers: { ...authHeaders, 'content-type': 'application/json' },
          body: JSON.stringify({ paused: next }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setOrderingPauseError(
            typeof (err as { error?: string }).error === 'string'
              ? (err as { error: string }).error
              : 'Could not update. Ensure `app_settings` exists in the database.'
          );
          return;
        }
        const data = (await res.json()) as { paused?: boolean };
        setOnlineOrderingPaused(Boolean(data.paused));
      } catch {
        setOrderingPauseError('Could not update online ordering status.');
      } finally {
        setOrderingPauseLoading(false);
      }
    },
    [getStaffAuthHeaders]
  );

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setError('');
      setLoading(true);
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/orders', {
        cache: 'no-store',
        headers: authHeaders,
      });
      if (!response.ok) {
        console.error('GET /api/orders failed.', {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error('Failed to fetch orders');
      }
      const data = (await response.json()) as {
        orders: Array<{ order: PersistedOrder; items: PersistedOrder['items'] }>;
      };
      setOrders(
        data.orders.map((entry) => ({
          ...entry.order,
          items: entry.items,
        }))
      );
    } catch {
      setError('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [getStaffAuthHeaders, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
  }, [fetchOrders, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchOnlineOrderingPause();
  }, [isAuthenticated, fetchOnlineOrderingPause]);

  useEffect(() => {
    const enableAudioAfterInteraction = () => {
      hasUserInteractedRef.current = true;
      window.removeEventListener('pointerdown', enableAudioAfterInteraction);
      window.removeEventListener('keydown', enableAudioAfterInteraction);
      window.removeEventListener('touchstart', enableAudioAfterInteraction);
    };

    window.addEventListener('pointerdown', enableAudioAfterInteraction, { passive: true });
    window.addEventListener('keydown', enableAudioAfterInteraction);
    window.addEventListener('touchstart', enableAudioAfterInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', enableAudioAfterInteraction);
      window.removeEventListener('keydown', enableAudioAfterInteraction);
      window.removeEventListener('touchstart', enableAudioAfterInteraction);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setRealtimeStatus('unavailable');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const channel: RealtimeChannel = supabase
      .channel('staff-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('active');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('unavailable');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders, isAuthenticated]);

  useEffect(() => {
    if (!newOrderNotice) return;
    const timer = window.setTimeout(() => setNewOrderNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [newOrderNotice]);

  useEffect(() => {
    // Detect genuinely new incoming orders by comparing IDs against a persisted seen-set.
    const currentIds = new Set(orders.map((order) => String(order.id)));
    if (!hasInitializedKnownOrdersRef.current) {
      knownOrderIdsRef.current = currentIds;
      hasInitializedKnownOrdersRef.current = true;
      return;
    }

    const newOrders = orders.filter(
      (order) => order.status === 'new' && !knownOrderIdsRef.current.has(String(order.id))
    );

    if (newOrders.length > 0) {
      // Sound alerts are intentionally tied to new incoming order IDs only.
      for (const order of newOrders) {
        console.log('🔔 New order detected:', order.id);
        void playAlertTone();
      }
      setNewOrderNotice(
        newOrders.length === 1
          ? `New order received: ${newOrders[0].orderNumber}`
          : `${newOrders.length} new orders received`
      );
    }

    knownOrderIdsRef.current = currentIds;
  }, [orders, playAlertTone]);

  const totals = useMemo(
    () => ({
      total: orders.length,
      active: orders.filter((order) => ['new', 'preparing', 'ready'].includes(order.status)).length,
    }),
    [orders]
  );

  const groupedOrders = useMemo(
    () =>
      statusOrder.reduce<Record<StaffOrderStatus, PersistedOrder[]>>((acc, status) => {
        acc[status] = orders.filter((order) => order.status === status);
        return acc;
      }, {} as Record<StaffOrderStatus, PersistedOrder[]>),
    [orders]
  );

  const updateStatus = async (orderId: string | number, status: StaffOrderStatus) => {
    const authHeaders = await getStaffAuthHeaders();
    const response = await fetch(`/api/orders/${encodeURIComponent(String(orderId))}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return;
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const renderQuickActions = (order: PersistedOrder) => {
    if (order.status === 'new') {
      return (
        <button
          onClick={() => updateStatus(order.id, 'preparing')}
          className={primaryButtonClass}
        >
          Start preparing
        </button>
      );
    }
    if (order.status === 'preparing') {
      return (
        <button onClick={() => updateStatus(order.id, 'ready')} className={primaryButtonClass}>
          Mark ready
        </button>
      );
    }
    if (order.status === 'ready') {
      return (
        <button onClick={() => updateStatus(order.id, 'completed')} className={primaryButtonClass}>
          Complete order
        </button>
      );
    }
    return null;
  };

  const openPrintDocumentWindow = (
    orderId: string | number,
    documentType: PrintableDocumentType,
    printMode: boolean
  ) => {
    const params = new URLSearchParams();
    if (documentType !== 'customer_receipt') {
      params.set('type', documentType);
    }
    if (printMode) {
      params.set('print', '1');
    }
    const query = params.toString();
    window.open(
      `/staff/orders/receipt/${encodeURIComponent(String(orderId))}${query ? `?${query}` : ''}`,
      '_blank'
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <p className="text-gray-700">Checking staff session...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Staff Orders</h1>
            <StaffLogoutButton className={secondaryButtonClass} />
          </div>
          <div className={`${noticeBoxClass} mb-6`}>
            <p className="text-sm font-semibold">Staff test view only.</p>
            <p className="text-sm mt-1">
              Staff route access now uses Supabase session auth. Legacy API-key fallback remains temporarily
              during migration.
            </p>
            <p className="text-sm mt-1">Live order updates enabled for testing.</p>
            {realtimeStatus !== 'active' && (
              <p className="text-sm mt-1">
                Realtime may be unavailable. Ensure Supabase Realtime is enabled for the `orders` table in
                the Supabase dashboard (Database {'>'} Replication/Publications).
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSoundAlertsEnabled(true)}
                disabled={soundAlertsEnabled}
                className={secondaryButtonClass}
              >
                {soundAlertsEnabled ? 'Sound alerts enabled 🔔' : 'Enable sound alerts'}
              </button>
              <span className="text-xs text-amber-900/90">
                Sound alerts may require prior user interaction in some browsers.
              </span>
            </div>
          </div>

          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Online customer ordering</p>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                  When paused, the public order page and checkout are blocked. This dashboard is unchanged;
                  you can still manage and print orders.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {orderingPauseLoading && (
                  <span className="text-xs text-slate-500">Updating…</span>
                )}
                {onlineOrderingPaused ? (
                  <button
                    type="button"
                    onClick={() => setOnlineOrderingPause(false)}
                    disabled={orderingPauseLoading}
                    className={primaryButtonClass}
                  >
                    Resume online ordering
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOnlineOrderingPause(true)}
                    disabled={orderingPauseLoading}
                    className="px-4 py-2 rounded-lg font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400"
                  >
                    Pause online ordering
                  </button>
                )}
                <span
                  className={`text-xs font-semibold ${
                    onlineOrderingPaused ? 'text-amber-800' : 'text-emerald-800'
                  }`}
                >
                  {onlineOrderingPaused ? 'Paused' : 'Accepting orders'}
                </span>
              </div>
            </div>
            {orderingPauseError && <p className="text-sm text-red-600 mt-3">{orderingPauseError}</p>}
          </div>

          {newOrderNotice && (
            <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
              <p className="font-semibold">{newOrderNotice}</p>
            </div>
          )}

          <div className="mb-6 rounded-lg border border-gray-200 p-4 bg-white flex flex-wrap items-center gap-4">
            <p className="text-gray-900">
              <span className="font-semibold">Total orders:</span> {totals.total}
            </p>
            <p className="text-gray-900">
              <span className="font-semibold">Active orders:</span> {totals.active}
            </p>
            <button
              onClick={fetchOrders}
              className={`ml-auto ${secondaryButtonClass}`}
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-gray-600 mb-4">Loading orders...</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          {!loading && orders.length === 0 && <p className="text-gray-600 mb-4">No orders yet.</p>}

          <div className="space-y-6">
            {statusOrder.map((status) => (
              <section key={status} className={`rounded-xl border p-4 sm:p-5 ${statusSectionClass[status]}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {statusLabels[status]} <span className="text-gray-600">({groupedOrders[status].length})</span>
                  </h2>
                </div>
                {groupedOrders[status].length === 0 ? (
                  <p className="text-sm text-gray-600">No {statusLabels[status].toLowerCase()} orders.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {groupedOrders[status].map((order) => (
                      <article
                        key={order.id}
                        className={`rounded-xl border bg-white p-5 ${
                          status === 'new'
                            ? 'border-brandPink/50 ring-1 ring-brandPink/20'
                            : status === 'ready'
                              ? 'border-emerald-400 ring-1 ring-emerald-200'
                              : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm font-semibold text-gray-800">{order.customerName}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-700 mb-3">
                          <p>
                            <span className="font-semibold">Order type:</span> {order.orderType}
                          </p>
                          <p>
                            <span className="font-semibold">
                              {order.orderType === 'table' ? 'Table number:' : 'Collection time:'}
                            </span>{' '}
                            {order.orderType === 'table' ? order.tableNumber || '-' : order.collectionTime || '-'}
                          </p>
                          <p>
                            <span className="font-semibold">Current status:</span> {order.status}
                          </p>
                          <p>
                            <span className="font-semibold">Payment status:</span> {order.paymentStatus} (placeholder)
                          </p>
                        </div>

                        {order.notes?.trim() && (
                          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                            <p className="text-xs font-bold uppercase tracking-wide">Special requests</p>
                            <p className="mt-1 text-sm font-medium whitespace-pre-wrap">{order.notes.trim()}</p>
                          </div>
                        )}

                        <ul className="mt-3 space-y-1 text-sm text-gray-700 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                          {order.items.map((item) => (
                            <li key={`${order.orderNumber}-${item.item.id}`} className="flex justify-between gap-3">
                              <span className="min-w-0">
                                {item.quantity} x {item.item.name}
                              </span>
                              <span className="font-medium">
                                GBP {(item.item.price * item.quantity).toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-gray-900">GBP {order.total.toFixed(2)}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {renderQuickActions(order)}
                          {['new', 'preparing', 'ready'].includes(order.status) && (
                            <button
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              className={secondaryButtonClass}
                            >
                              Cancel
                            </button>
                          )}
                          <select
                            value={order.status}
                            onChange={(event) => updateStatus(order.id, event.target.value as StaffOrderStatus)}
                            className={selectClass}
                            aria-label={`Update order ${order.orderNumber} status`}
                          >
                            {allStatuses.map((entryStatus) => (
                              <option key={entryStatus} value={entryStatus}>
                                {entryStatus}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() =>
                              openPrintDocumentWindow(order.id, 'customer_receipt', false)
                            }
                            className={secondaryButtonClass}
                          >
                            Preview receipt
                          </button>
                          <button
                            onClick={() =>
                              openPrintDocumentWindow(order.id, 'customer_receipt', true)
                            }
                            className={primaryButtonClass}
                          >
                            Print receipt
                          </button>
                          <button
                            onClick={() =>
                              openPrintDocumentWindow(order.id, 'kitchen_ticket', false)
                            }
                            className={secondaryButtonClass}
                          >
                            Preview kitchen ticket
                          </button>
                          <button
                            onClick={() =>
                              openPrintDocumentWindow(order.id, 'kitchen_ticket', true)
                            }
                            className={primaryButtonClass}
                          >
                            Print kitchen ticket
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
