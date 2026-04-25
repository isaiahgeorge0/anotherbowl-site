import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

type ValidateDiscountBody = {
  code?: string;
  subtotal?: number;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ValidateDiscountBody;
    const code = body.code?.trim().toUpperCase() ?? '';
    const subtotal = body.subtotal ?? 0;

    if (!code) return NextResponse.json({ error: 'Discount code is required.' }, { status: 400 });
    if (typeof subtotal !== 'number' || Number.isNaN(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: 'Invalid subtotal.' }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('discount_codes')
      .select(
        'id,code,description,discount_type,discount_value,is_active,starts_at,expires_at,max_uses,used_count,minimum_order_total'
      )
      .ilike('code', code)
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Could not validate discount code.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Discount code not found.' }, { status: 404 });
    if (!data.is_active) return NextResponse.json({ error: 'Discount code is inactive.' }, { status: 400 });

    const now = new Date();
    if (data.starts_at && now < new Date(data.starts_at)) {
      return NextResponse.json({ error: 'Discount code is not active yet.' }, { status: 400 });
    }
    if (data.expires_at && now > new Date(data.expires_at)) {
      return NextResponse.json({ error: 'Discount code has expired.' }, { status: 400 });
    }
    if (typeof data.max_uses === 'number' && data.used_count >= data.max_uses) {
      return NextResponse.json({ error: 'Discount code usage limit reached.' }, { status: 400 });
    }
    if (
      typeof data.minimum_order_total === 'number' &&
      roundCurrency(subtotal) < roundCurrency(data.minimum_order_total)
    ) {
      return NextResponse.json(
        {
          error: `Minimum order total for this code is GBP ${roundCurrency(data.minimum_order_total).toFixed(2)}.`,
        },
        { status: 400 }
      );
    }

    const discountAmount =
      data.discount_type === 'percent'
        ? roundCurrency(subtotal * (Number(data.discount_value) / 100))
        : roundCurrency(Number(data.discount_value));
    const cappedDiscount = Math.min(roundCurrency(subtotal), Math.max(discountAmount, 0));
    const discountedTotal = roundCurrency(subtotal - cappedDiscount);

    return NextResponse.json({
      valid: true,
      discount: {
        id: data.id,
        code: data.code,
        description: data.description,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
        discount_amount: cappedDiscount,
        discounted_total: discountedTotal,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Could not validate discount code.' }, { status: 500 });
  }
}
