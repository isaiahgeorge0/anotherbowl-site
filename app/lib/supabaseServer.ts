import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This is intentionally non-fatal at import time to avoid breaking current SQLite flows.
  // API migration will enforce this when Supabase becomes the active persistence layer.
  console.warn('Supabase env vars are not set. SQLite local/dev flow remains active.');
}

export const supabaseServer = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
