import { NextResponse } from 'next/server';
import { getOnlineOrderingPausedFromDb } from '@/lib/orderingSettings';

/**
 * Public: whether online customer ordering is paused (staff-controlled).
 */
export async function GET() {
  const paused = await getOnlineOrderingPausedFromDb();
  return NextResponse.json({ paused });
}
