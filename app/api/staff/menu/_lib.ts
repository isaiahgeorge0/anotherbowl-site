import { getSupabaseServiceClient } from '@/lib/supabaseService';
import { authenticateStaffRequest, unauthorizedStaffResponse } from '@/lib/staffAuth';

export const authorizeStaffMenuRequest = async (request: Request) => {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return unauthorizedStaffResponse();
  return null;
};

export const getStaffMenuSupabase = () => {
  // SERVICE ROLE NOTE:
  // Service-role access stays strictly server-side in API routes. Never expose this key in browser code.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service configuration missing.');
  }
  return getSupabaseServiceClient();
};
