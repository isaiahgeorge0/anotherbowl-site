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

export const isMissingColumnError = (error: unknown, columnName: string) => {
  if (!error || typeof error !== 'object') return false;
  const maybeMessage =
    'message' in error && typeof error.message === 'string' ? error.message.toLowerCase() : '';
  const maybeDetails =
    'details' in error && typeof error.details === 'string' ? error.details.toLowerCase() : '';
  const needle = columnName.toLowerCase();
  return maybeMessage.includes(needle) || maybeDetails.includes(needle);
};

export const logStaffMenuApiError = (scope: string, error: unknown) => {
  if (!error || typeof error !== 'object') {
    console.error(`[staff-menu:${scope}] unknown error`);
    return;
  }

  const errorPayload = {
    code: 'code' in error ? error.code : undefined,
    message: 'message' in error ? error.message : undefined,
    details: 'details' in error ? error.details : undefined,
    hint: 'hint' in error ? error.hint : undefined,
  };
  console.error(`[staff-menu:${scope}] supabase error`, errorPayload);
};
