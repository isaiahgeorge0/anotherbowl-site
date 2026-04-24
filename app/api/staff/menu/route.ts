import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from './_lib';
import type { StaffCategory, StaffProduct } from '@/types/menuManagement';

export async function GET(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = getStaffMenuSupabase();
    const [categoriesResult, productsResult] = await Promise.all([
      supabase.from('categories').select('id,name,display_order,created_at').order('display_order'),
      supabase.from('products').select('id,name,price,category,is_active,created_at').order('name'),
    ]);

    if (categoriesResult.error) {
      return NextResponse.json({ error: 'Could not load categories.' }, { status: 500 });
    }
    if (productsResult.error) {
      return NextResponse.json({ error: 'Could not load products.' }, { status: 500 });
    }

    return NextResponse.json({
      categories: (categoriesResult.data ?? []) as StaffCategory[],
      products: (productsResult.data ?? []) as StaffProduct[],
    });
  } catch {
    return NextResponse.json({ error: 'Staff menu API unavailable.' }, { status: 500 });
  }
}
