import { getCalendarDateInBusinessZone } from '@/lib/openingHours';
import { getMaxOrdersPerCollectionSlotFromDb } from '@/lib/orderingSettings';
import { listOrders } from '@/lib/ordersDb';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

const isServiceConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

type OrderRow = {
  collection_time: string | null;
  status: string;
  created_at: string;
};

/**
 * Count non-cancelled collection orders for the given business (London) day, by collection_time string (HH:mm).
 */
export async function getTodayCollectionOrderCountsBySlot(
  businessDate: string
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};

  if (isServiceConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      const { data, error } = await supabase
        .from('orders')
        .select('collection_time, status, created_at, order_type')
        .eq('order_type', 'collection');

      if (error) {
        console.warn('getTodayCollectionOrderCountsBySlot Supabase read failed, using SQLite backup.', error.message);
      } else {
        for (const row of (data ?? []) as OrderRow[]) {
          if (row.status === 'cancelled' || !row.collection_time) continue;
          if (getCalendarDateInBusinessZone(new Date(row.created_at)) !== businessDate) continue;
          const t = row.collection_time.trim();
          if (!/^\d{2}:\d{2}$/.test(t)) continue;
          out[t] = (out[t] ?? 0) + 1;
        }
        return out;
      }
    } catch (e) {
      console.warn('getTodayCollectionOrderCountsBySlot', e);
    }
  }

  for (const order of listOrders()) {
    if (order.orderType !== 'collection' || order.status === 'cancelled' || !order.collectionTime) continue;
    if (getCalendarDateInBusinessZone(new Date(order.createdAt)) !== businessDate) continue;
    const t = order.collectionTime.trim();
    if (!/^\d{2}:\d{2}$/.test(t)) continue;
    out[t] = (out[t] ?? 0) + 1;
  }

  return out;
}

export async function isCollectionSlotFull(
  businessDate: string,
  collectionTime: string,
  maxPerSlot: number
): Promise<boolean> {
  const counts = await getTodayCollectionOrderCountsBySlot(businessDate);
  return (counts[collectionTime] ?? 0) >= maxPerSlot;
}

/** True when the slot is at the configured cap for the current business day. */
export async function isCollectionTimeBookedOutForOrderNow(
  collectionTime: string
): Promise<boolean> {
  const businessDate = getCalendarDateInBusinessZone(new Date());
  const max = await getMaxOrdersPerCollectionSlotFromDb();
  return isCollectionSlotFull(businessDate, collectionTime, max);
}
