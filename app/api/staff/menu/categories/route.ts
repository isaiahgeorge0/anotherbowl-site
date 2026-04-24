import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../_lib';

type CreateCategoryBody = {
  id?: string;
  name?: string;
  display_order?: number;
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
    const body = (await request.json()) as CreateCategoryBody;
    const name = body.name?.trim();
    const displayOrder = body.display_order ?? 0;
    const id = body.id?.trim() || (name ? slugify(name) : '');

    if (!name || !id || !Number.isInteger(displayOrder) || displayOrder < 0) {
      return NextResponse.json({ error: 'Invalid category payload.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert({ id, name, display_order: displayOrder })
      .select('id,name,display_order,created_at')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Could not create category.' }, { status: 500 });
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not create category.' }, { status: 500 });
  }
}
