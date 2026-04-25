import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

type PublicCategoryRow = {
  id: string;
  name: string;
  display_order: number | null;
};

type PublicProductRow = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string;
  display_order: number | null;
  is_active: boolean;
};

export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from('categories')
        .select('id,name,display_order')
        .order('display_order')
        .order('name'),
      supabase
        .from('products')
        .select('id,name,price,description,category_id,display_order,is_active')
        .eq('is_active', true)
        .order('display_order')
        .order('name'),
    ]);

    if (categoriesResult.error) {
      console.error('Public menu API categories query failed', categoriesResult.error);
      return NextResponse.json({ error: 'Could not load menu categories.' }, { status: 500 });
    }

    if (productsResult.error) {
      console.error('Public menu API products query failed', productsResult.error);
      return NextResponse.json({ error: 'Could not load menu products.' }, { status: 500 });
    }

    return NextResponse.json({
      categories: (categoriesResult.data ?? []) as PublicCategoryRow[],
      products: (productsResult.data ?? []) as PublicProductRow[],
    });
  } catch (error) {
    console.error('Public menu API unavailable', error);
    return NextResponse.json({ error: 'Menu API unavailable.' }, { status: 500 });
  }
}
