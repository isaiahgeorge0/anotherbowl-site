import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/ordersDb';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import type { BasketItem, CheckoutOrderType, PersistedOrder } from '@/types/order';

const isSupabaseServiceConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

const mapRowToPersistedOrder = (row: {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string | null;
  order_type: CheckoutOrderType;
  table_number: string | null;
  collection_time: string | null;
  total: number;
  status: PersistedOrder['status'];
  payment_status: PersistedOrder['paymentStatus'];
  created_at: string;
  notes: string | null;
  order_items: Array<{
    item_id: string | null;
    item_name: string;
    price: number;
    quantity: number;
    modifiers: unknown;
  }>;
}): { order: PersistedOrder; items: BasketItem[] } => {
  const items: BasketItem[] = (row.order_items ?? []).map((item) => ({
    quantity: item.quantity,
    item: {
      id: item.item_id ?? `legacy-${item.item_name}`,
      name: item.item_name,
      description: '',
      price: item.price,
      category: 'ORDER',
      available: true,
      modifiers: Array.isArray(item.modifiers) ? (item.modifiers as string[]) : [],
      allergens: [],
      dietaryTags: [],
    },
  }));

  return {
    order: {
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      email: row.email,
      phone: row.phone ?? '',
      orderType: row.order_type,
      tableNumber: row.table_number,
      collectionTime: row.collection_time,
      items,
      total: row.total,
      status: row.status,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
      notes: row.notes,
    },
    items,
  };
};

export async function GET(request: Request) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }

  if (isSupabaseServiceConfigured()) {
    try {
      const supabaseService = getSupabaseServiceClient();
      const { data, error } = await supabaseService
        .from('orders')
        .select(
          `
            id,
            order_number,
            customer_name,
            email,
            phone,
            order_type,
            table_number,
            collection_time,
            total,
            status,
            payment_status,
            created_at,
            notes,
            order_items(
              item_id,
              item_name,
              price,
              quantity,
              modifiers
            )
          `
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (!error) {
        return NextResponse.json({ orders: (data ?? []).map(mapRowToPersistedOrder) });
      }

      console.error('GET /api/staff/orders Supabase read failed, using SQLite fallback.', error);
    } catch (error) {
      console.error('GET /api/staff/orders unexpected Supabase error, using SQLite fallback.', error);
    }
  }

  const fallbackOrders = listOrders().map((order) => ({ order, items: order.items }));
  return NextResponse.json({ orders: fallbackOrders });
}
