import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../menu/_lib';
import { requireOwnerRequest } from '@/lib/staffAuth';

type CreateDiscountBody = {
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

const validateDiscountPayload = (body: CreateDiscountBody) => {
  const code = typeof body.code === 'string' ? normalizeCode(body.code) : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const discountType = body.discount_type;
  const discountValue = body.discount_value;
  const isActive = body.is_active ?? true;
  const startsAt = body.starts_at ?? null;
  const expiresAt = body.expires_at ?? null;
  const maxUses = body.max_uses ?? null;
  const minimumOrderTotal = body.minimum_order_total ?? null;

  if (!code) return { error: 'Code is required.' };
  if (!discountType || !['percent', 'fixed'].includes(discountType)) {
    return { error: 'Discount type must be percent or fixed.' };
  }
  if (typeof discountValue !== 'number' || Number.isNaN(discountValue) || discountValue <= 0) {
    return { error: 'Discount value must be a positive number.' };
  }
  if (discountType === 'percent' && discountValue > 100) {
    return { error: 'Percent discount cannot exceed 100.' };
  }
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { error: 'Max uses must be null or an integer greater than 0.' };
  }
  if (
    minimumOrderTotal !== null &&
    (typeof minimumOrderTotal !== 'number' || Number.isNaN(minimumOrderTotal) || minimumOrderTotal < 0)
  ) {
    return { error: 'Minimum order total must be null or a non-negative number.' };
  }
  if (startsAt && Number.isNaN(Date.parse(startsAt))) return { error: 'Invalid starts_at value.' };
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) return { error: 'Invalid expires_at value.' };
  if (startsAt && expiresAt && Date.parse(expiresAt) <= Date.parse(startsAt)) {
    return { error: 'expires_at must be later than starts_at.' };
  }

  return {
    value: {
      code,
      description,
      discount_type: discountType,
      discount_value: Math.round(discountValue * 100) / 100,
      is_active: Boolean(isActive),
      starts_at: startsAt,
      expires_at: expiresAt,
      max_uses: maxUses,
      minimum_order_total:
        minimumOrderTotal === null ? null : Math.round(minimumOrderTotal * 100) / 100,
    },
  };
};

export async function GET(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('discount_codes')
      .select(
        'id,code,description,discount_type,discount_value,is_active,starts_at,expires_at,max_uses,used_count,minimum_order_total,created_at,updated_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Could not load discount codes.' }, { status: 500 });
    }

    return NextResponse.json({ discountCodes: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Could not load discount codes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ownerAuth = await requireOwnerRequest(request);
  if (!ownerAuth.ok) return ownerAuth.response;

  try {
    const body = (await request.json()) as CreateDiscountBody;
    const validated = validateDiscountPayload(body);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('discount_codes')
      .insert(validated.value)
      .select(
        'id,code,description,discount_type,discount_value,is_active,starts_at,expires_at,max_uses,used_count,minimum_order_total,created_at,updated_at'
      )
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Could not create discount code.' }, { status: 500 });
    }

    return NextResponse.json({ discountCode: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not create discount code.' }, { status: 500 });
  }
}
