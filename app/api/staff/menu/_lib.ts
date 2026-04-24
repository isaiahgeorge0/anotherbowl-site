import { getSupabaseServiceClient } from '@/lib/supabaseService';

export const isAuthorizedStaffRequest = (request: Request) => {
  const expectedKey = process.env.STAFF_API_KEY;
  const providedKey = request.headers.get('x-staff-key');
  if (!expectedKey || !providedKey) return false;
  return providedKey === expectedKey;
};

export const getStaffMenuSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service configuration missing.');
  }
  return getSupabaseServiceClient();
};
