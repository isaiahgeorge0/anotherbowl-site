import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role Supabase client added for production-safe staff operations.
export const getSupabaseServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('Supabase service client error: NEXT_PUBLIC_SUPABASE_URL is missing.');
    throw new Error('Supabase URL is not configured for service-role operations.');
  }

  if (!serviceRoleKey) {
    console.error('Supabase service client error: SERVER_SUPABASE_SERVICE_ROLE_KEY is missing.');
    throw new Error('SERVER_SUPABASE_SERVICE_ROLE_KEY is required for staff Supabase operations.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
};
