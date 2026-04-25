import { NextResponse } from 'next/server';
import {
  authorizeStaffMenuRequest,
  getStaffMenuSupabase,
  isMissingColumnError,
  logStaffMenuApiError,
} from '../_lib';

type CreateProductBody = {
  name?: string;
  price?: number;
  category?: string;
  is_active?: boolean;
  description?: string;
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
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';

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

    let createResult = await supabase
      .from('products')
      .insert({
        id: productId,
        name,
        price: Math.round(price * 100) / 100,
        category_id: category,
        is_active: isActive,
        description,
        display_order: 0,
      })
      .select('id,name,price,category:category_id,is_active,description,display_order,created_at')
      .single();

    if (createResult.error && isMissingColumnError(createResult.error, 'category_id')) {
      createResult = await supabase
        .from('products')
        .insert({
          id: productId,
          name,
          price: Math.round(price * 100) / 100,
          category,
          is_active: isActive,
          description,
        })
        .select('id,name,price,category,is_active,description,created_at')
        .single();
    }

    if (createResult.error || !createResult.data) {
      logStaffMenuApiError('create-product', createResult.error);
      return NextResponse.json({ error: 'Could not create product.' }, { status: 500 });
    }

    return NextResponse.json({ product: createResult.data }, { status: 201 });
  } catch (error) {
    logStaffMenuApiError('create-product-unhandled', error);
    return NextResponse.json({ error: 'Could not create product.' }, { status: 500 });
  }
}
