import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../_lib';

type CreateProductBody = {
  name?: string;
  price?: number;
  category?: string;
  is_active?: boolean;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function POST(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as CreateProductBody;
    const name = body.name?.trim();
    const price = body.price;
    const category = body.category?.trim();
    const isActive = body.is_active ?? true;

    if (!name || typeof price !== 'number' || Number.isNaN(price) || price < 0 || !category) {
      return NextResponse.json({ error: 'Invalid product payload.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { data: categoryRow, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category)
      .maybeSingle();

    if (categoryError || !categoryRow) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
    }

    const baseId = slugify(name);
    const suffix = Date.now().toString(36);
    const productId = `${baseId}-${suffix}`;

    const { data, error } = await supabase
      .from('products')
      .insert({
        id: productId,
        name,
        price: Math.round(price * 100) / 100,
        category,
        is_active: isActive,
      })
      .select('id,name,price,category,is_active,created_at')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Could not create product.' }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not create product.' }, { status: 500 });
  }
}
