import { NextResponse } from 'next/server';
import { getStaffMenuSupabase } from '../../menu/_lib';
import { requireOwnerRequest } from '@/lib/staffAuth';

type UpdateDiscountBody = {
  code?: string;
  description?: string;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  minimum_order_total?: number | null;
};

const normalizeCode = (code: string) => code.trim().toUpperCase();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ownerAuth = await requireOwnerRequest(request);
  if (!ownerAuth.ok) return ownerAuth.response;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateDiscountBody;
    const updates: Record<string, string | number | boolean | null> = {};

    if (typeof body.code !== 'undefined') {
      const code = normalizeCode(body.code);
      if (!code) return NextResponse.json({ error: 'Code cannot be empty.' }, { status: 400 });
      updates.code = code;
    }
    if (typeof body.description !== 'undefined') {
      updates.description = body.description.trim();
    }
    if (typeof body.discount_type !== 'undefined') {
      if (!['percent', 'fixed'].includes(body.discount_type)) {
        return NextResponse.json({ error: 'Invalid discount type.' }, { status: 400 });
      }
      updates.discount_type = body.discount_type;
    }
    if (typeof body.discount_value !== 'undefined') {
      if (
        typeof body.discount_value !== 'number' ||
        Number.isNaN(body.discount_value) ||
        body.discount_value <= 0
      ) {
        return NextResponse.json({ error: 'Discount value must be positive.' }, { status: 400 });
      }
      updates.discount_value = Math.round(body.discount_value * 100) / 100;
    }
    if (typeof body.is_active !== 'undefined') {
      updates.is_active = Boolean(body.is_active);
    }
    if (typeof body.max_uses !== 'undefined') {
      if (body.max_uses !== null && (!Number.isInteger(body.max_uses) || body.max_uses < 1)) {
        return NextResponse.json({ error: 'max_uses must be null or an integer greater than 0.' }, { status: 400 });
      }
      updates.max_uses = body.max_uses;
    }
    if (typeof body.minimum_order_total !== 'undefined') {
      if (
        body.minimum_order_total !== null &&
        (typeof body.minimum_order_total !== 'number' ||
          Number.isNaN(body.minimum_order_total) ||
          body.minimum_order_total < 0)
      ) {
        return NextResponse.json(
          { error: 'minimum_order_total must be null or a non-negative number.' },
          { status: 400 }
        );
      }
      updates.minimum_order_total =
        body.minimum_order_total === null
          ? null
          : Math.round(body.minimum_order_total * 100) / 100;
    }
    if (typeof body.starts_at !== 'undefined') {
      if (body.starts_at !== null && Number.isNaN(Date.parse(body.starts_at))) {
        return NextResponse.json({ error: 'Invalid starts_at value.' }, { status: 400 });
      }
      updates.starts_at = body.starts_at;
    }
    if (typeof body.expires_at !== 'undefined') {
      if (body.expires_at !== null && Number.isNaN(Date.parse(body.expires_at))) {
        return NextResponse.json({ error: 'Invalid expires_at value.' }, { status: 400 });
      }
      updates.expires_at = body.expires_at;
    }

    const startsAt = (updates.starts_at as string | null | undefined) ?? body.starts_at;
    const expiresAt = (updates.expires_at as string | null | undefined) ?? body.expires_at;
    if (startsAt && expiresAt && Date.parse(expiresAt) <= Date.parse(startsAt)) {
      return NextResponse.json({ error: 'expires_at must be later than starts_at.' }, { status: 400 });
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('discount_codes')
      .update(updates)
      .eq('id', id)
      .select(
        'id,code,description,discount_type,discount_value,is_active,starts_at,expires_at,max_uses,used_count,minimum_order_total,created_at,updated_at'
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Could not update discount code.' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Discount code not found.' }, { status: 404 });

    return NextResponse.json({ discountCode: data });
  } catch {
    return NextResponse.json({ error: 'Could not update discount code.' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ownerAuth = await requireOwnerRequest(request);
  if (!ownerAuth.ok) return ownerAuth.response;

  try {
    const { id } = await context.params;
    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Could not delete discount code.' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Discount code not found.' }, { status: 404 });

    return NextResponse.json({ deletedId: id });
  } catch {
    return NextResponse.json({ error: 'Could not delete discount code.' }, { status: 500 });
  }
}
