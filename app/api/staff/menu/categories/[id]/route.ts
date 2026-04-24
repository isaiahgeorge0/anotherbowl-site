import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../../_lib';

type UpdateCategoryBody = {
  name?: string;
  display_order?: number;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateCategoryBody;
    const updates: Record<string, string | number> = {};

    if (typeof body.name !== 'undefined') {
      const trimmed = body.name.trim();
      if (!trimmed) return NextResponse.json({ error: 'Invalid category name.' }, { status: 400 });
      updates.name = trimmed;
    }

    if (typeof body.display_order !== 'undefined') {
      if (!Number.isInteger(body.display_order) || body.display_order < 0) {
        return NextResponse.json({ error: 'Invalid display order.' }, { status: 400 });
      }
      updates.display_order = body.display_order;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid update fields provided.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select('id,name,display_order,created_at')
      .maybeSingle();

    if (error) return NextResponse.json({ error: 'Could not update category.' }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    return NextResponse.json({ category: data });
  } catch {
    return NextResponse.json({ error: 'Could not update category.' }, { status: 500 });
  }
}
