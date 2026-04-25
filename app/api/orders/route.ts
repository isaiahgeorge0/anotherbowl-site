import { NextResponse } from 'next/server';
import { createOrder, listOrders } from '@/lib/ordersDb';
import { isCollectionTimeBookedOutForOrderNow } from '@/lib/collectionSlotCapacity';
import {
  isShopOpenForPublicOrderingNow,
  isValidCollectionTimeForOrderNow,
  getPublicOrderingClosedMessage,
} from '@/lib/openingHours';
import { getOnlineOrderingPausedFromDb } from '@/lib/orderingSettings';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import { createReceiptSnapshot } from '@/lib/receipt';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import { ORDER_MENU } from '@/data/orderMenu';
import type { BasketItem, CheckoutOrderType, PersistedOrder } from '@/types/order';
import { sendOrderConfirmationEmail } from '../../../lib/email/sendOrderConfirmation';

type CreateOrderBody = {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  orderType: CheckoutOrderType;
  tableNumber?: string;
  collectionTime?: string;
  items: BasketItem[];
  total: number;
  notes?: string;
  privacyAccepted?: boolean;
  marketingOptIn?: boolean;
  discount?: {
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    discountAmount: number;
  };
};

type ValidationResult =
  | {
      ok: true;
      normalizedItems: BasketItem[];
      calculatedTotal: number;
    }
  | {
      ok: false;
      invalidProductIds: string[];
      quantityErrors: Array<{ itemId: string; quantity: number }>;
      totalMismatch: { clientTotal: number; calculatedTotal: number } | null;
    };

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const isSupabaseServiceConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

const isAnySupabaseCatalogClientConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

const ORDER_MENU_MAP = new Map(
  ORDER_MENU.map((item) => [
    item.id,
    {
      id: item.id,
      name: item.name,
      price: item.price,
      modifiers: item.modifiers ?? [],
      description: item.description ?? '',
      category: item.category,
      dietaryTags: item.dietaryTags ?? [],
      allergens: item.allergens ?? [],
      available: item.available,
    },
  ])
);

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
};

const fetchTrustedProductsFromSupabase = async (itemIds: string[]) => {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (!ids.length || !isAnySupabaseCatalogClientConfigured()) {
    return null;
  }

  try {
    const productClient = isSupabaseServiceConfigured() ? getSupabaseServiceClient() : supabaseServer;
    const { data, error } = await productClient
      .from('products')
      .select('id,name,price,is_active')
      .in('id', ids);

    if (error) {
      console.error('POST /api/orders product catalog lookup failed, using static fallback.', error);
      return null;
    }

    return (data ?? []) as CatalogProduct[];
  } catch (error) {
    console.error('POST /api/orders product catalog unavailable, using static fallback.', error);
    return null;
  }
};

const validateAndNormalizeOrder = async (
  items: BasketItem[],
  clientTotal: number
): Promise<ValidationResult> => {
  const invalidProductIds: string[] = [];
  const quantityErrors: Array<{ itemId: string; quantity: number }> = [];
  const normalizedItems: BasketItem[] = [];
  const requestedItemIds = items.map((entry) => entry?.item?.id ?? '').filter(Boolean);
  const supabaseProducts = await fetchTrustedProductsFromSupabase(requestedItemIds);
  const productMap = supabaseProducts
    ? new Map(supabaseProducts.map((product) => [product.id, product]))
    : null;

  for (const entry of items) {
    const itemId = entry?.item?.id;
    const quantity = entry?.quantity;

    if (!itemId) {
      invalidProductIds.push(itemId ?? 'missing-item-id');
      continue;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      quantityErrors.push({ itemId, quantity: Number(quantity) });
      continue;
    }

    const trustedSupabaseItem = productMap?.get(itemId);
    if (productMap && (!trustedSupabaseItem || !trustedSupabaseItem.is_active)) {
      invalidProductIds.push(itemId);
      continue;
    }

    const trustedItem = trustedSupabaseItem
      ? {
          id: trustedSupabaseItem.id,
          name: trustedSupabaseItem.name,
          price: Number(trustedSupabaseItem.price),
          // Category is not security-sensitive; keep trusted pricing/name from DB,
          // and preserve the existing client-side grouping label for display/receipts.
          category: entry?.item?.category ?? 'MENU',
          available: trustedSupabaseItem.is_active,
          modifiers: [] as string[],
          description: '',
          dietaryTags: [] as string[],
          allergens: [] as string[],
        }
      : ORDER_MENU_MAP.get(itemId);

    if (!trustedItem || !trustedItem.available) {
      invalidProductIds.push(itemId);
      continue;
    }

    normalizedItems.push({
      quantity,
      item: {
        id: trustedItem.id,
        name: trustedItem.name,
        description: trustedItem.description,
        price: trustedItem.price,
        category: trustedItem.category,
        available: trustedItem.available,
        modifiers: trustedItem.modifiers,
        allergens: trustedItem.allergens,
        dietaryTags: trustedItem.dietaryTags,
      },
    });
  }

  const calculatedTotal = normalizedItems.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const roundedClientTotal = Math.round(clientTotal * 100) / 100;
  const roundedCalculatedTotal = Math.round(calculatedTotal * 100) / 100;
  const totalMismatch =
    roundedClientTotal !== roundedCalculatedTotal
      ? { clientTotal: roundedClientTotal, calculatedTotal: roundedCalculatedTotal }
      : null;

  if (invalidProductIds.length || quantityErrors.length || totalMismatch) {
    return { ok: false, invalidProductIds, quantityErrors, totalMismatch };
  }

  return { ok: true, normalizedItems, calculatedTotal: roundedCalculatedTotal };
};

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

  const order: PersistedOrder = {
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
  };

  return { order, items };
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('GET /api/orders Supabase service read failed, using SQLite fallback.', error);
      } else {
        const nestedOrders = (data ?? []).map(mapRowToPersistedOrder);
        return NextResponse.json({ orders: nestedOrders });
      }
    } catch (serviceError) {
      console.error('GET /api/orders service client unavailable, using SQLite fallback.', serviceError);
    }
  }

  const fallbackOrders = listOrders().map((order) => ({
    order,
    items: order.items,
  }));
  console.log(`GET /api/orders served ${fallbackOrders.length} SQLite fallback orders.`);
  return NextResponse.json({ orders: fallbackOrders });
}

export async function POST(request: Request) {
  try {
    const attemptTimestamp = new Date().toISOString();
    const body = (await request.json()) as CreateOrderBody;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[api/orders] incoming order payload summary', {
        orderType: body.orderType,
        tableNumber: body.tableNumber?.trim() || null,
        collectionTime: body.collectionTime?.trim() || null,
      });
    }

    if (
      !body.orderNumber ||
      !body.customerName ||
      !body.email ||
      !body.phone ||
      !body.orderType ||
      !Array.isArray(body.items) ||
      typeof body.total !== 'number' ||
      body.items.length === 0
    ) {
      return NextResponse.json({ error: 'Invalid order payload.' }, { status: 400 });
    }

    if (body.privacyAccepted !== true) {
      return NextResponse.json(
        { error: 'You must agree to the Privacy Policy and Terms & Conditions before placing your order.' },
        { status: 400 }
      );
    }

    if (await getOnlineOrderingPausedFromDb()) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[api/orders] blocked: ordering paused');
      }
      return NextResponse.json({ error: 'Ordering is currently paused.' }, { status: 403 });
    }

    if (body.orderType === 'collection') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[api/orders] collection validation branch entered', {
          collectionTime: body.collectionTime?.trim() || null,
        });
      }
      if (!isShopOpenForPublicOrderingNow()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[api/orders] blocked: collection ordering closed now');
        }
        return NextResponse.json(
          { error: getPublicOrderingClosedMessage() },
          { status: 400 }
        );
      }
      if (!body.collectionTime?.trim()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[api/orders] blocked: missing collectionTime for collection order');
        }
        return NextResponse.json(
          { error: 'Collection time is required for collection orders.' },
          { status: 400 }
        );
      }
      if (!isValidCollectionTimeForOrderNow(body.collectionTime)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[api/orders] blocked: invalid collectionTime');
        }
        return NextResponse.json(
          { error: 'That collection time is not available. Choose a time within opening hours.' },
          { status: 400 }
        );
      }
      if (body.collectionTime && (await isCollectionTimeBookedOutForOrderNow(body.collectionTime))) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[api/orders] blocked: collection slot fully booked');
        }
        return NextResponse.json(
          { error: 'That collection time is full. Please choose another time.' },
          { status: 400 }
        );
      }
    } else if (body.orderType === 'table') {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[api/orders] table validation branch entered', {
          tableNumber: body.tableNumber?.trim() || null,
          willRunCollectionChecks: false,
        });
      }
      if (!body.tableNumber?.trim()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[api/orders] blocked: missing tableNumber for table order');
        }
        return NextResponse.json(
          { error: 'Table number is required for table orders.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Order type must be either collection or table.' },
        { status: 400 }
      );
    }

    const validation = await validateAndNormalizeOrder(body.items, body.total);
    if (!validation.ok) {
      const hasInvalidItems = validation.invalidProductIds.length > 0;
      const hasQuantityIssues = validation.quantityErrors.length > 0;
      const hasTotalMismatch = Boolean(validation.totalMismatch);
      let validationMessage = 'Order validation failed. Please review your order and try again.';
      if (hasInvalidItems) {
        validationMessage =
          'Some basket items are no longer available. Please refresh the menu and try again.';
      } else if (hasQuantityIssues) {
        validationMessage =
          'One or more item quantities are invalid. Please update your basket and try again.';
      } else if (hasTotalMismatch) {
        validationMessage =
          'Your basket total changed. Please review your basket and try again.';
      }
      console.error('POST /api/orders validation failed.', {
        timestamp: attemptTimestamp,
        invalidProductIds: validation.invalidProductIds,
        quantityErrors: validation.quantityErrors,
        mismatchedTotals: validation.totalMismatch,
      });
      return NextResponse.json({ error: validationMessage }, { status: 400 });
    }

    const normalizedNotes = body.notes?.trim() ?? '';
    const discountNote = body.discount
      ? `Discount applied: ${body.discount.code} (${body.discount.discountType} ${body.discount.discountValue}) amount ${body.discount.discountAmount.toFixed(2)}`
      : '';
    const combinedNotes = [normalizedNotes, discountNote].filter(Boolean).join('\n');
    const emailPayload = {
      orderNumber: body.orderNumber,
      customerName: body.customerName,
      email: body.email,
      orderType: body.orderType,
      tableNumber: body.tableNumber ?? null,
      collectionTime: body.collectionTime ?? null,
      items: validation.normalizedItems,
      total: validation.calculatedTotal,
    };

    // Supabase insert flow verified in development; keep SQLite fallback during transition.
    if (isSupabaseConfigured()) {
      const receiptSnapshot = createReceiptSnapshot({
        orderNumber: body.orderNumber,
        customerName: body.customerName,
        orderType: body.orderType,
        tableNumber: body.tableNumber ?? null,
        collectionTime: body.collectionTime ?? null,
        items: validation.normalizedItems,
        total: validation.calculatedTotal,
        status: 'new',
        paymentStatus: 'pending',
        timestamp: new Date().toISOString(),
      });
      const baseInsertPayload = {
        order_number: body.orderNumber,
        customer_name: body.customerName,
        email: body.email,
        phone: body.phone,
        order_type: body.orderType,
        table_number: body.tableNumber ?? null,
        collection_time: body.collectionTime ?? null,
        total: validation.calculatedTotal,
        status: 'new' as const,
        payment_status: 'pending' as const,
        notes: combinedNotes || null,
        privacy_accepted: true,
        marketing_opt_in: Boolean(body.marketingOptIn),
      };
      let { data: insertedOrder, error: orderInsertError } = await supabaseServer
        .from('orders')
        .insert({
          ...baseInsertPayload,
          receipt_snapshot: receiptSnapshot,
        })
        .select('id')
        .single();

      if (orderInsertError && String(orderInsertError.message).includes('receipt_snapshot')) {
        ({ data: insertedOrder, error: orderInsertError } = await supabaseServer
          .from('orders')
          .insert(baseInsertPayload)
          .select('id')
          .single());
      }

      if (orderInsertError || !insertedOrder) {
        console.error('POST /api/orders Supabase order insert failed.', orderInsertError);
      } else {
        const orderItemsPayload = validation.normalizedItems.map((entry) => ({
          order_id: insertedOrder.id,
          item_id: entry.item.id,
          item_name: entry.item.name,
          price: entry.item.price,
          quantity: entry.quantity,
          line_total: entry.item.price * entry.quantity,
          modifiers: entry.item.modifiers ?? [],
        }));

        const { error: itemsInsertError } = await supabaseServer
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsInsertError) {
          console.error('POST /api/orders Supabase item insert failed.', itemsInsertError);
          await supabaseServer.from('orders').delete().eq('id', insertedOrder.id);
          return NextResponse.json({ error: 'Could not create order items.' }, { status: 500 });
        }

        console.log(`POST /api/orders inserted order ${body.orderNumber} in Supabase.`);
        try {
          await sendOrderConfirmationEmail(emailPayload);
        } catch (emailError) {
          console.error('Order confirmation email preview failed.', emailError);
        }
        return NextResponse.json({ id: insertedOrder.id, orderNumber: body.orderNumber }, { status: 201 });
      }
    }

    console.warn('POST /api/orders using SQLite fallback because Supabase path was unavailable.');
    const fallbackId = createOrder({
      ...body,
      items: validation.normalizedItems,
      total: validation.calculatedTotal,
      privacyAccepted: true,
      marketingOptIn: Boolean(body.marketingOptIn),
    });
    console.log(`POST /api/orders inserted order ${body.orderNumber} in SQLite fallback.`);
    try {
      await sendOrderConfirmationEmail(emailPayload);
    } catch (emailError) {
      console.error('Order confirmation email preview failed.', emailError);
    }
    return NextResponse.json({ id: fallbackId, orderNumber: body.orderNumber }, { status: 201 });
  } catch {
    console.error('POST /api/orders failed unexpectedly.');
    return NextResponse.json({ error: 'Could not create order.' }, { status: 500 });
  }
}
