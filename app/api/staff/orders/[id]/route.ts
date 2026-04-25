import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/ordersDb';
import { getSupabaseServiceClient } from '@/lib/supabaseService';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import type { StaffOrderStatus } from '@/types/order';

const ALLOWED_STATUSES: StaffOrderStatus[] = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

const isSupabaseServiceConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: StaffOrderStatus };

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    if (isSupabaseServiceConfigured()) {
      try {
        const supabaseService = getSupabaseServiceClient();
        const { data, error } = await supabaseService
          .from('orders')
          .update({ status: body.status })
          .eq('id', id)
          .select('id')
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true });
        }

        if (!error && !data) {
          return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
        }

        console.error(`PATCH /api/staff/orders/${id} Supabase update failed.`, error);
      } catch (error) {
        console.error(`PATCH /api/staff/orders/${id} unexpected Supabase error.`, error);
      }
    }

    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
    }

    const updated = updateOrderStatus(orderId, body.status);
    if (!updated) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });
  }
}
