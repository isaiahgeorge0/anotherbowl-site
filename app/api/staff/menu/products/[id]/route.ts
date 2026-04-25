import { NextResponse } from 'next/server';
import {
  authorizeStaffMenuRequest,
  getStaffMenuSupabase,
  isMissingColumnError,
  logStaffMenuApiError,
} from '../../_lib';

type UpdateProductBody = {
  name?: string;
  price?: number;
  category?: string;
  is_active?: boolean;
  description?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateProductBody;
    const updates: Record<string, string | number | boolean> = {};

    if (typeof body.name !== 'undefined') {
      const trimmed = body.name.trim();
      if (!trimmed) return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
      updates.name = trimmed;
    }

    if (typeof body.price !== 'undefined') {
      if (typeof body.price !== 'number' || Number.isNaN(body.price) || body.price < 0) {
        return NextResponse.json({ error: 'Invalid price.' }, { status: 400 });
      }
      updates.price = Math.round(body.price * 100) / 100;
    }

    if (typeof body.category !== 'undefined') {
      const category = body.category.trim();
      if (!category) {
        return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
      }
      const supabase = getStaffMenuSupabase();
      const { data: categoryRow } = await supabase
        .from('categories')
        .select('id')
        .eq('id', category)
        .maybeSingle();
      if (!categoryRow) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
      updates.category_id = category;
    }

    if (typeof body.is_active !== 'undefined') {
      updates.is_active = body.is_active;
    }

    if (typeof body.description !== 'undefined') {
      if (typeof body.description !== 'string') {
        return NextResponse.json({ error: 'Invalid description.' }, { status: 400 });
      }
      updates.description = body.description.trim();
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    let updateResult = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('id,name,price,category:category_id,is_active,description,display_order,created_at')
      .maybeSingle();

    if (updateResult.error && isMissingColumnError(updateResult.error, 'category_id')) {
      const legacyUpdates = { ...updates };
      if ('category_id' in legacyUpdates) {
        legacyUpdates.category = legacyUpdates.category_id;
        delete legacyUpdates.category_id;
      }
      updateResult = await supabase
        .from('products')
        .update(legacyUpdates)
        .eq('id', id)
        .select('id,name,price,category,is_active,description,created_at')
        .maybeSingle();
    }

    if (updateResult.error) {
      logStaffMenuApiError('update-product', updateResult.error);
      return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });
    }
    if (!updateResult.data) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    return NextResponse.json({ product: updateResult.data });
  } catch (error) {
    logStaffMenuApiError('update-product-unhandled', error);
    return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });
  }
}
