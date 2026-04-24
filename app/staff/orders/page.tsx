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
  'rounded-xl bg-primary px-4 py-2 font-semibold text-white shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-light active:scale-[0.98]';
const secondaryButtonClass =
  'rounded-xl border border-stone-200/90 bg-light/90 px-4 py-2 text-stone-800 shadow-sm transition-all duration-200 hover:border-stone-300/80 hover:bg-light focus:outline-none focus:ring-2 focus:ring-stone-400/40 focus:ring-offset-2';
const selectClass =
  'rounded-lg border border-stone-200/90 bg-light/90 px-3 py-2 font-medium text-stone-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25';
const noticeBoxClass = 'rounded-xl border border-amber-200/80 bg-amber-50/90 p-4 text-amber-900/90';
const statusOrder: StaffOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
const statusLabels: Record<StaffOrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const statusSectionClass: Record<StaffOrderStatus, string> = {
  new: 'border-brandPink/35 bg-brandPink/8',
  preparing: 'border-sky-300/50 bg-sky-50/60',
  ready: 'border-emerald-300/50 bg-emerald-50/70',
  completed: 'border-stone-200/70 bg-light/80',
  cancelled: 'border-rose-200/60 bg-rose-50/70',
};

const statusBannerLabel: Record<StaffOrderStatus, string> = {
  new: 'Pending (new order)',
  preparing: 'In kitchen — preparing',
  ready: 'Ready to hand over',
  completed: 'Done',
  cancelled: 'Cancelled',
};

/** Flash ring for quick feedback on status transition — pure UI, keyed by order id. */
const statusToFlashRing: Record<StaffOrderStatus, string> = {
  new: 'ring-2 ring-brandPink/50 ring-offset-1 ring-offset-light/95',
  preparing: 'ring-2 ring-sky-500/45 ring-offset-1 ring-offset-light/95',
  ready: 'ring-2 ring-emerald-500/50 ring-offset-1 ring-offset-light/95',
  completed: 'ring-2 ring-stone-500/40 ring-offset-1 ring-offset-light/95',
  cancelled: 'ring-2 ring-rose-500/50 ring-offset-1 ring-offset-light/95',
};

const touchActionButtonClass =
  'min-h-[44px] w-full min-w-0 sm:min-w-[7rem] sm:w-auto sm:grow-0 sm:shrink-0 inline-flex items-center justify-center px-4 text-center text-sm sm:text-base';

const touchPrimary = `${primaryButtonClass} ${touchActionButtonClass}`;
const touchSecondary = `${secondaryButtonClass} ${touchActionButtonClass}`;

const touchSelect = `${selectClass} min-h-[44px] w-full py-2.5 sm:min-w-[8rem] sm:w-full`;

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
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState(4);
  const [maxOrdersPerSlotInput, setMaxOrdersPerSlotInput] = useState('4');
  const [slotCapacityLoading, setSlotCapacityLoading] = useState(false);
  const [slotCapacityError, setSlotCapacityError] = useState('');
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedKnownOrdersRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  /** Key: order id string, value: target status just applied (UI flash only). */
  const [statusActionFlash, setStatusActionFlash] = useState<Partial<Record<string, StaffOrderStatus>>>({});
  const statusFlashClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  const fetchSlotCapacity = useCallback(async () => {
    if (!isAuthenticated) return;
    setSlotCapacityError('');
    setSlotCapacityLoading(true);
    try {
      const authHeaders = await getStaffAuthHeaders();
      const res = await fetch('/api/staff/ordering/slot-capacity', {
        cache: 'no-store',
        headers: { ...authHeaders, 'content-type': 'application/json' },
      });
      if (!res.ok) {
        setSlotCapacityError('Could not load collection slot capacity.');
        return;
      }
      const data = (await res.json()) as { max?: number };
      const m = typeof data.max === 'number' ? data.max : 4;
      setMaxOrdersPerSlot(m);
      setMaxOrdersPerSlotInput(String(m));
    } catch {
      setSlotCapacityError('Could not load collection slot capacity.');
    } finally {
      setSlotCapacityLoading(false);
    }
  }, [getStaffAuthHeaders, isAuthenticated]);

  const saveSlotCapacity = useCallback(async () => {
    const parsed = Number.parseInt(maxOrdersPerSlotInput.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 1000) {
      setSlotCapacityError('Enter a whole number between 1 and 1000.');
      return;
    }
    setSlotCapacityError('');
    setSlotCapacityLoading(true);
    try {
      const authHeaders = await getStaffAuthHeaders();
      const res = await fetch('/api/staff/ordering/slot-capacity', {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ max: parsed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSlotCapacityError(
          typeof (err as { error?: string }).error === 'string'
            ? (err as { error: string }).error
            : 'Could not save. Ensure `app_settings` exists in the database.'
        );
        return;
      }
      const data = (await res.json()) as { max?: number };
      const m = typeof data.max === 'number' ? data.max : parsed;
      setMaxOrdersPerSlot(m);
      setMaxOrdersPerSlotInput(String(m));
    } catch {
      setSlotCapacityError('Could not save collection slot capacity.');
    } finally {
      setSlotCapacityLoading(false);
    }
  }, [getStaffAuthHeaders, maxOrdersPerSlotInput]);

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
    if (!isAuthenticated) return;
    void fetchSlotCapacity();
  }, [isAuthenticated, fetchSlotCapacity]);

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

  /** Newest first within each status column (display only). */
  const displayOrdersByStatus = useMemo(() => {
    const sort = (list: PersistedOrder[]) =>
      [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return statusOrder.reduce<Record<StaffOrderStatus, PersistedOrder[]>>(
      (acc, st) => {
        acc[st] = sort(groupedOrders[st]);
        return acc;
      },
      {} as Record<StaffOrderStatus, PersistedOrder[]>
    );
  }, [groupedOrders]);

  const triggerStatusActionFlash = useCallback(
    (orderId: string | number, toStatus: StaffOrderStatus) => {
      const k = String(orderId);
      const prevT = statusFlashClearTimers.current[k];
      if (prevT) clearTimeout(prevT);
      setStatusActionFlash((m) => ({ ...m, [k]: toStatus }));
      statusFlashClearTimers.current[k] = setTimeout(() => {
        setStatusActionFlash((m) => {
          const n = { ...m };
          delete n[k];
          return n;
        });
        delete statusFlashClearTimers.current[k];
      }, 650);
    },
    []
  );

  useEffect(() => {
    return () => {
      Object.values(statusFlashClearTimers.current).forEach(clearTimeout);
    };
  }, []);

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

  const runStaffStatusAction = (orderId: string | number, toStatus: StaffOrderStatus) => {
    triggerStatusActionFlash(orderId, toStatus);
    void updateStatus(orderId, toStatus);
  };

  const renderQuickActions = (order: PersistedOrder) => {
    if (order.status === 'new') {
      return (
        <button
          type="button"
          onClick={() => runStaffStatusAction(order.id, 'preparing')}
          className={touchPrimary}
        >
          Start preparing
        </button>
      );
    }
    if (order.status === 'preparing') {
      return (
        <button type="button" onClick={() => runStaffStatusAction(order.id, 'ready')} className={touchPrimary}>
          Mark ready
        </button>
      );
    }
    if (order.status === 'ready') {
      return (
        <button type="button" onClick={() => runStaffStatusAction(order.id, 'completed')} className={touchPrimary}>
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
          <p className="text-stone-600">Checking staff session...</p>
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
        <div className="rounded-2xl border border-stone-200/70 bg-light/90 p-6 shadow-[0_8px_32px_rgba(28,26,24,0.06)] sm:p-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Staff Orders</h1>
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

          <div className="mb-6 rounded-xl border border-stone-200/80 bg-mint/25 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-stone-900">Online customer ordering</p>
                <p className="mt-1 max-w-2xl text-sm text-stone-600">
                  When paused, the public order page and checkout are blocked. This dashboard is unchanged;
                  you can still manage and print orders.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {orderingPauseLoading && <span className="text-xs text-stone-500">Updating…</span>}
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
                    className="rounded-xl bg-amber-600/95 px-4 py-2 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-amber-500/95 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 active:scale-[0.98]"
                  >
                    Pause online ordering
                  </button>
                )}
                <span
                  className={`text-xs font-semibold ${
                    onlineOrderingPaused ? 'text-amber-800/90' : 'text-emerald-800/90'
                  }`}
                >
                  {onlineOrderingPaused ? 'Paused' : 'Accepting orders'}
                </span>
              </div>
            </div>
            {orderingPauseError && <p className="text-sm text-red-600 mt-3">{orderingPauseError}</p>}
          </div>

          <div className="mb-6 rounded-xl border border-stone-200/80 bg-mint/20 p-4 sm:p-5">
            <p className="text-sm font-bold text-stone-900">Max orders per collection slot</p>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              Limits how many online collection orders can be booked for each 15-minute window. Full slots are
              hidden from customers at checkout. Default is 4 if not set in the database.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="min-w-0 flex-1 max-w-xs">
                <label
                  htmlFor="max-orders-per-slot"
                  className="mb-1 block text-xs font-semibold text-stone-800"
                >
                  Max per slot
                </label>
                <input
                  id="max-orders-per-slot"
                  type="number"
                  min={1}
                  max={1000}
                  inputMode="numeric"
                  value={maxOrdersPerSlotInput}
                  onChange={(e) => setMaxOrdersPerSlotInput(e.target.value)}
                  className="w-full rounded-lg border border-stone-200/90 bg-light/90 px-3 py-2 text-stone-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={slotCapacityLoading}
                />
              </div>
              <button
                type="button"
                onClick={() => void saveSlotCapacity()}
                disabled={slotCapacityLoading}
                className={primaryButtonClass}
              >
                {slotCapacityLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
            {slotCapacityError && <p className="text-sm text-red-600 mt-2">{slotCapacityError}</p>}
            {!slotCapacityError && maxOrdersPerSlot > 0 && (
              <p className="mt-2 text-xs text-stone-500">
                Current setting: {maxOrdersPerSlot} per slot (after save or load).
              </p>
            )}
          </div>

          {newOrderNotice && (
            <div className="mb-6 rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-4 text-emerald-900/95">
              <p className="font-semibold">{newOrderNotice}</p>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-stone-200/75 bg-light/80 p-4">
            <p className="text-stone-900">
              <span className="font-semibold">Total orders:</span> {totals.total}
            </p>
            <p className="text-stone-900">
              <span className="font-semibold">Active orders:</span> {totals.active}
            </p>
            <button
              type="button"
              onClick={fetchOrders}
              className={`ml-auto min-h-[44px] inline-flex items-center justify-center px-4 ${secondaryButtonClass}`}
            >
              Refresh
            </button>
          </div>

          {loading && <p className="mb-4 text-stone-600">Loading orders...</p>}
          {error && <p className="mb-4 text-red-600/90">{error}</p>}
          {!loading && orders.length === 0 && <p className="mb-4 text-stone-600">No orders yet.</p>}

          <div className="space-y-6">
            {statusOrder.map((status) => (
              <section key={status} className={`rounded-xl border p-4 sm:p-5 ${statusSectionClass[status]}`}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-stone-900">
                    {statusLabels[status]}{' '}
                    <span className="text-stone-600">({groupedOrders[status].length})</span>
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-stone-700">{statusBannerLabel[status]}</p>
                </div>
                {groupedOrders[status].length === 0 ? (
                  <p className="text-sm text-stone-600">No {statusLabels[status].toLowerCase()} orders.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {displayOrdersByStatus[status].map((order) => {
                      const orderKey = String(order.id);
                      const flashTo = statusActionFlash[orderKey];
                      const flashRing = flashTo ? statusToFlashRing[flashTo] : '';
                      const createdMs = new Date(order.createdAt).getTime();
                      const ageMin = (Date.now() - createdMs) / 60_000;
                      const isNewestInColumn = displayOrdersByStatus[status][0]?.id === order.id;
                      const isFreshNew = order.status === 'new' && ageMin < 4;
                      const ageFade =
                        ageMin > 35 ? 'opacity-80' : ageMin > 15 ? 'opacity-92' : 'opacity-100';
                      const manyItems = order.items.length >= 4;
                      return (
                        <article
                          key={order.id}
                          className={`rounded-xl border bg-light/95 ${
                            status === 'new'
                              ? 'border-brandPink/45 ring-1 ring-brandPink/15'
                              : status === 'ready'
                                ? 'border-emerald-400/70 ring-1 ring-emerald-200/50'
                                : 'border-stone-200/80'
                          } ${
                            isNewestInColumn
                              ? 'z-0 shadow-md shadow-stone-400/20'
                              : 'shadow-sm'
                          } ${isFreshNew ? 'ring-1 ring-amber-500/40' : ''} ${ageFade} ${
                            flashRing
                          } ${flashTo ? 'scale-[1.02] sm:scale-[1.01]' : 'scale-100'} transition-transform duration-200 ease-out`}
                        >
                          <div className="sticky top-0 z-10 -mx-px -mt-px mb-0 rounded-t-xl border-b border-stone-200/70 bg-light/95 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold leading-tight text-stone-900 sm:text-xl">
                                  {order.orderNumber}
                                </h3>
                                <p className="text-sm font-semibold text-stone-800">{order.customerName}</p>
                              </div>
                              <time
                                className="shrink-0 text-sm font-semibold text-stone-700 tabular-nums"
                                dateTime={order.createdAt}
                              >
                                {new Date(order.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </time>
                            </div>
                            <p className="mt-2 text-xs text-stone-600 sm:text-sm">
                              <span className="font-medium text-stone-700">Status: </span>
                              <span
                                className={`ml-1 inline-flex max-w-full items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-tight ${
                                  order.status === 'new'
                                    ? 'border-brandPink/50 bg-brandPink/15 text-stone-900'
                                    : order.status === 'preparing'
                                      ? 'border-sky-400/50 bg-sky-100/80 text-sky-950'
                                      : order.status === 'ready'
                                        ? 'border-emerald-500/50 bg-emerald-100/80 text-emerald-950'
                                        : order.status === 'completed'
                                          ? 'border-stone-400/60 bg-stone-200/50 text-stone-900'
                                          : 'border-rose-500/50 bg-rose-100/80 text-rose-950'
                                }`}
                              >
                                {statusBannerLabel[order.status]}
                              </span>
                            </p>
                          </div>

                          <div className="space-y-3 px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-3">
                            <div className="space-y-1 text-sm text-stone-700">
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
                                <span className="font-semibold">Payment status:</span> {order.paymentStatus}{' '}
                                (placeholder)
                              </p>
                            </div>

                            {order.notes?.trim() && (
                              <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-amber-900/90">
                                <p className="text-xs font-bold uppercase tracking-wide">Special requests</p>
                                <p className="mt-1 text-sm font-medium whitespace-pre-wrap">
                                  {order.notes.trim()}
                                </p>
                              </div>
                            )}

                            <ul
                              className={`space-y-2.5 rounded-lg border border-stone-200/60 bg-mint/20 p-3 text-sm text-stone-700 ${
                                manyItems ? 'max-h-[min(16rem,45dvh)] overflow-y-auto overflow-x-hidden' : ''
                              }`}
                            >
                              {order.items.map((item) => (
                                <li
                                  key={`${order.orderNumber}-${item.item.id}`}
                                  className="flex justify-between gap-3 border-b border-stone-200/40 pb-2.5 last:border-0 last:pb-0"
                                >
                                  <span className="min-w-0 break-words">
                                    <span className="font-bold tabular-nums text-stone-900">{item.quantity}×</span>{' '}
                                    {item.item.name}
                                  </span>
                                  <span className="shrink-0 font-medium tabular-nums">
                                    GBP {(item.item.price * item.quantity).toFixed(2)}
                                  </span>
                                </li>
                              ))}
                            </ul>

                            <div className="flex items-center justify-between border-t border-stone-200/80 pt-3">
                              <span className="font-semibold text-stone-900">Total</span>
                              <span className="font-bold tabular-nums text-stone-900">GBP {order.total.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {renderQuickActions(order)}
                              {['new', 'preparing', 'ready'].includes(order.status) && (
                                <button
                                  type="button"
                                  onClick={() => runStaffStatusAction(order.id, 'cancelled')}
                                  className={touchSecondary}
                                >
                                  Cancel
                                </button>
                              )}
                              <select
                                value={order.status}
                                onChange={(event) =>
                                  runStaffStatusAction(order.id, event.target.value as StaffOrderStatus)
                                }
                                className={touchSelect}
                                aria-label={`Update order ${order.orderNumber} status`}
                              >
                                {allStatuses.map((entryStatus) => (
                                  <option key={entryStatus} value={entryStatus}>
                                    {statusLabels[entryStatus]} ({entryStatus})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => openPrintDocumentWindow(order.id, 'customer_receipt', false)}
                                className={touchSecondary}
                              >
                                Preview receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => openPrintDocumentWindow(order.id, 'customer_receipt', true)}
                                className={touchPrimary}
                              >
                                Print receipt
                              </button>
                              <button
                                type="button"
                                onClick={() => openPrintDocumentWindow(order.id, 'kitchen_ticket', false)}
                                className={touchSecondary}
                              >
                                Preview kitchen ticket
                              </button>
                              <button
                                type="button"
                                onClick={() => openPrintDocumentWindow(order.id, 'kitchen_ticket', true)}
                                className={touchPrimary}
                              >
                                Print kitchen ticket
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
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
