import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/ordersDb';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import type { StaffOrderStatus } from '@/types/order';

const ALLOWED_STATUSES: StaffOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

const isAuthorizedStaffRequest = (request: Request) => {
  // TEMPORARY SECURITY LAYER:
  // Replace this API key check with real staff authentication/authorization before launch.
  const expectedKey = process.env.STAFF_API_KEY;
  const providedKey = request.headers.get('x-staff-key');

  if (!expectedKey || !providedKey) return false;
  return providedKey === expectedKey;
};

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAuthorizedStaffRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: StaffOrderStatus };
    const forbiddenMutationKeys = ['total', 'items', 'prices'] as const;
    const hasForbiddenMutations = forbiddenMutationKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(body as Record<string, unknown>, key)
    );
    if (hasForbiddenMutations) {
      return NextResponse.json(
        { error: 'Only order status updates are allowed.' },
        { status: 400 }
      );
    }
    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabaseService = getSupabaseServiceClient();
        const { data, error } = await supabaseService
          .from('orders')
          .update({ status: body.status })
          .eq('id', id)
          .select('id')
          .maybeSingle();

        if (error) {
          console.error(`PATCH /api/orders/${id} Supabase service status update failed.`, error);
        } else if (data) {
          console.log(`PATCH /api/orders/${id} updated status to ${body.status} in Supabase.`);
          return NextResponse.json({ success: true });
        } else {
          return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }
      } catch (serviceError) {
        console.error(
          `PATCH /api/orders/${id} service client unavailable, using SQLite fallback.`,
          serviceError
        );
      }
    }

    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Invalid order id for SQLite fallback.' }, { status: 400 });
    }
    const updated = updateOrderStatus(orderId, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    console.log(`PATCH /api/orders/${id} updated status to ${body.status} in SQLite fallback.`);
    return NextResponse.json({ success: true });
  } catch {
    console.error('PATCH /api/orders/:id failed unexpectedly.');
    return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });
  }
}
