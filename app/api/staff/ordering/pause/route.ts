import { NextResponse } from 'next/server';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';
import { getOnlineOrderingPausedFromDb, setOnlineOrderingPausedInDb } from '@/lib/orderingSettings';

export async function GET(request: Request) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) {
    return unauthorizedStaffResponse();
  }
  const paused = await getOnlineOrderingPausedFromDb();
  return NextResponse.json({ paused });
}

type Body = { paused?: boolean };

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

  if (typeof body.paused !== 'boolean') {
    return NextResponse.json({ error: 'Expected { paused: boolean }.' }, { status: 400 });
  }

  try {
    await setOnlineOrderingPausedInDb(body.paused);
  } catch (e) {
    console.error('POST /api/staff/ordering/pause', e);
    return NextResponse.json(
      { error: 'Could not update setting. Is the app_settings table created?' },
      { status: 500 }
    );
  }

  return NextResponse.json({ paused: body.paused });
}
