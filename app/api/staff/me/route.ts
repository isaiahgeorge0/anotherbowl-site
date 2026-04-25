import { NextResponse } from 'next/server';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';

export async function GET(request: Request) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return unauthorizedStaffResponse();

  return NextResponse.json({
    userId: auth.userId,
    email: auth.email,
    role: auth.role,
    matchedBy: auth.matchedBy,
    duplicateEmailRows: auth.duplicateEmailRows,
    source: auth.source,
  });
}
