import { NextResponse } from 'next/server';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import { getMaxOrdersPerCollectionSlotFromDb, setMaxOrdersPerCollectionSlotInDb } from '@/lib/orderingSettings';

export async function GET(request: Request) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }
  const max = await getMaxOrdersPerCollectionSlotFromDb();
  return NextResponse.json({ max });
}

type Body = { max?: number };

export async function POST(request: Request) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (typeof body.max !== 'number' || !Number.isFinite(body.max)) {
    return NextResponse.json({ error: 'Expected { max: number }.' }, { status: 400 });
  }

  if (body.max < 1 || body.max > 1000) {
    return NextResponse.json({ error: 'max must be between 1 and 1000.' }, { status: 400 });
  }

  try {
    await setMaxOrdersPerCollectionSlotInDb(body.max);
  } catch (e) {
    console.error('POST /api/staff/ordering/slot-capacity', e);
    return NextResponse.json(
      { error: 'Could not update setting. Is the app_settings table created?' },
      { status: 500 }
    );
  }

  return NextResponse.json({ max: Math.floor(body.max) });
}
