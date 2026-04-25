import { NextResponse } from 'next/server';
import {
  authorizeStaffMenuRequest,
  getStaffMenuSupabase,
  isMissingColumnError,
  logStaffMenuApiError,
} from './_lib';
import type { StaffCategory, StaffProduct } from '@/types/menuManagement';

export async function GET(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = getStaffMenuSupabase();
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from('categories').select('id,name,display_order,created_at').order('display_order'),
      supabase
        .from('products')
        .select('id,name,price,category:category_id,is_active,description,display_order,created_at')
        .order('display_order')
        .order('name'),
    ]);

    let normalizedProductsResult = productsResult;
    if (productsResult.error && isMissingColumnError(productsResult.error, 'category_id')) {
      const legacyProductsResult = await supabase
        .from('products')
        .select('id,name,price,category,is_active,description,created_at')
        .order('name');
      if (legacyProductsResult.error) {
        normalizedProductsResult = legacyProductsResult;
      } else {
        normalizedProductsResult = {
          ...legacyProductsResult,
          data: (legacyProductsResult.data ?? []).map((row) => ({
            ...row,
            display_order: null,
          })),
        };
      }
    }

    if (categoriesResult.error) {
      logStaffMenuApiError('get-categories', categoriesResult.error);
      return NextResponse.json({ error: 'Could not load categories.' }, { status: 500 });
    }
    if (normalizedProductsResult.error) {
      logStaffMenuApiError('get-products', normalizedProductsResult.error);
      return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
    }

    return NextResponse.json({
      categories: (categoriesResult.data ?? []) as StaffCategory[],
      products: (normalizedProductsResult.data ?? []) as StaffProduct[],
    });
  } catch (error) {
    logStaffMenuApiError('get-menu-unhandled', error);
    return NextResponse.json({ error: 'Staff menu API unavailable.' }, { status: 500 });
  }
}
