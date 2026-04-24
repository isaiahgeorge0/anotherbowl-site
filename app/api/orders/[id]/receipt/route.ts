import { NextResponse } from 'next/server';
import { listOrders } from '@/lib/ordersDb';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import { createReceiptSnapshot } from '@/lib/receipt';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import type { BasketItem, CheckoutOrderType, PersistedOrder, ReceiptSnapshot } from '@/types/order';
import type { PrintableOrderPayload } from '@/types/printing';

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

type ReceiptRow = {
  id: string;
  order_number: string;
  customer_name: string;
  order_type: CheckoutOrderType;
  table_number: string | null;
  collection_time: string | null;
  total: number;
  status: PersistedOrder['status'];
  payment_status: PersistedOrder['paymentStatus'];
  notes: string | null;
  created_at: string;
  receipt_snapshot: ReceiptSnapshot | null;
  order_items: Array<{
    item_id: string | null;
    item_name: string;
    price: number;
    quantity: number;
    modifiers: unknown;
  }>;
};

const mapToPrintablePayload = (params: {
  orderNumber: string;
  customerName: string;
  orderType: CheckoutOrderType;
  tableNumber: string | null;
  collectionTime: string | null;
  total: number;
  status: PersistedOrder['status'];
  paymentStatus: PersistedOrder['paymentStatus'];
  notes: string | null;
  timestamp: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers: string[];
  }>;
}): PrintableOrderPayload => {
  const normalizedItems = params.items.map((item) => ({
    ...item,
    lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
  }));
  const subtotal = Math.round(normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  return {
    restaurantName: 'Another Bowl',
    orderNumber: params.orderNumber,
    timestamp: params.timestamp,
    customerName: params.customerName,
    orderType: params.orderType,
    tableNumber: params.tableNumber,
    collectionTime: params.collectionTime,
    notes: params.notes,
    items: normalizedItems,
    subtotal,
    total: Math.round(params.total * 100) / 100,
    orderStatus: params.status,
    paymentStatus: params.paymentStatus,
    footerMessage: 'Thank you for your order',
  };
};

const FULL_RECEIPT_SELECT = `
  id,
  order_number,
  customer_name,
  order_type,
  table_number,
  collection_time,
  total,
  status,
  payment_status,
  notes,
  created_at,
  receipt_snapshot,
  order_items(
    item_id,
    item_name,
    price,
    quantity,
    modifiers
  )
`;

const LEGACY_RECEIPT_SELECT = `
  id,
  order_number,
  customer_name,
  order_type,
  table_number,
  collection_time,
  total,
  status,
  payment_status,
  notes,
  created_at,
  order_items(
    item_id,
    item_name,
    price,
    quantity,
    modifiers
  )
`;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }

  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      let { data, error } = await supabase
        .from('orders')
        .select(FULL_RECEIPT_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (error && String(error.message).includes('receipt_snapshot')) {
        ({ data, error } = await supabase
          .from('orders')
          .select(LEGACY_RECEIPT_SELECT)
          .eq('id', id)
          .maybeSingle());
      }

      if (!error && data) {
        const row = data as Partial<ReceiptRow> & Omit<ReceiptRow, 'receipt_snapshot'>;
        const rowItems = (row.order_items ?? []).map((item) => ({
          id: item.item_id ?? `legacy-${item.item_name}`,
          name: item.item_name,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          modifiers: Array.isArray(item.modifiers) ? (item.modifiers as string[]) : [],
        }));
        const printableOrder = mapToPrintablePayload({
          orderNumber: row.order_number,
          customerName: row.customer_name,
          orderType: row.order_type,
          tableNumber: row.table_number,
          collectionTime: row.collection_time,
          total: Number(row.total),
          status: row.status,
          paymentStatus: row.payment_status,
          notes: row.notes,
          timestamp: row.created_at,
          items: rowItems,
        });
        const receipt =
          ('receipt_snapshot' in row ? row.receipt_snapshot : null) ??
          createReceiptSnapshot({
            orderNumber: row.order_number,
            customerName: row.customer_name,
            orderType: row.order_type,
            tableNumber: row.table_number,
            collectionTime: row.collection_time,
            items: (row.order_items ?? []).map(
              (item): BasketItem => ({
                quantity: item.quantity,
                item: {
                  id: item.item_id ?? `legacy-${item.item_name}`,
                  name: item.item_name,
                  description: '',
                  price: Number(item.price),
                  category: 'ORDER',
                  available: true,
                  modifiers: [],
                  allergens: [],
                  dietaryTags: [],
                },
              })
            ),
            total: Number(row.total),
            status: row.status,
            paymentStatus: row.payment_status,
            timestamp: row.created_at,
          });
        return NextResponse.json({ receipt, printableOrder });
      }
      if (error) {
        console.error(`GET /api/orders/${id}/receipt Supabase read failed, checking SQLite fallback.`, error);
      }
    } catch {
      // Fall through to SQLite fallback.
    }
  }

  const fallbackOrder = listOrders().find((order) => String(order.id) === String(id));
  if (!fallbackOrder) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const receipt = createReceiptSnapshot({
    orderNumber: fallbackOrder.orderNumber,
    customerName: fallbackOrder.customerName,
    orderType: fallbackOrder.orderType,
    tableNumber: fallbackOrder.tableNumber,
    collectionTime: fallbackOrder.collectionTime,
    items: fallbackOrder.items,
    total: fallbackOrder.total,
    status: fallbackOrder.status,
    paymentStatus: fallbackOrder.paymentStatus,
    timestamp: fallbackOrder.createdAt,
  });

  const printableOrder = mapToPrintablePayload({
    orderNumber: fallbackOrder.orderNumber,
    customerName: fallbackOrder.customerName,
    orderType: fallbackOrder.orderType,
    tableNumber: fallbackOrder.tableNumber,
    collectionTime: fallbackOrder.collectionTime,
    total: fallbackOrder.total,
    status: fallbackOrder.status,
    paymentStatus: fallbackOrder.paymentStatus,
    notes: fallbackOrder.notes ?? null,
    timestamp: fallbackOrder.createdAt,
    items: fallbackOrder.items.map((item) => ({
      id: item.item.id,
      name: item.item.name,
      quantity: item.quantity,
      unitPrice: item.item.price,
      modifiers: item.item.modifiers ?? [],
    })),
  });

  return NextResponse.json({ receipt, printableOrder });
}
