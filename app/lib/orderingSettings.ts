import { getSupabaseServiceClient } from '@/lib/supabaseService';

const KEY = 'online_ordering_paused';

const isServiceConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY);

/**
 * Read pause flag from `public.app_settings`. Returns false if Supabase is unavailable
 * or the row is missing (keeps local/dev ordering working).
 */
export async function getOnlineOrderingPausedFromDb(): Promise<boolean> {
  if (!isServiceConfigured()) {
    return false;
  }
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', KEY).maybeSingle();

    if (error) {
      console.warn('app_settings read failed, treating as not paused.', error.message);
      return false;
    }
    const v = data?.value;
    if (v == null) return false;
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true' || v === '1';
    if (typeof v === 'object' && v !== null && 'paused' in (v as object)) {
      return Boolean((v as { paused?: boolean }).paused);
    }
    return false;
  } catch (e) {
    console.warn('getOnlineOrderingPausedFromDb', e);
    return false;
  }
}

export async function setOnlineOrderingPausedInDb(paused: boolean): Promise<void> {
  if (!isServiceConfigured()) {
    throw new Error('Supabase service is not configured.');
  }
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from('app_settings').upsert(
    {
      key: KEY,
      value: paused ? 'true' : 'false',
    },
    { onConflict: 'key' }
  );
  if (error) {
    throw error;
  }
}
