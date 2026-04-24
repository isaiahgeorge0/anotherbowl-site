import { getSupabaseServiceClient } from '@/lib/supabaseService';

const KEY = 'online_ordering_paused';
const KEY_MAX_ORDERS_PER_SLOT = 'max_orders_per_collection_slot';

/** Default when DB row is missing or unparseable. */
export const MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT = 4;

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

function clampPositiveInt(n: number, fallback: number): number {
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(1000, Math.floor(n));
}

/**
 * Max allowed collection orders per 15-minute slot. Falls back to default if unset or on error.
 */
export async function getMaxOrdersPerCollectionSlotFromDb(): Promise<number> {
  if (!isServiceConfigured()) {
    return MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT;
  }
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', KEY_MAX_ORDERS_PER_SLOT)
      .maybeSingle();

    if (error) {
      console.warn('app_settings max_orders read failed, using default.', error.message);
      return MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT;
    }
    const v = data?.value;
    if (v == null) return MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT;
    if (typeof v === 'object' && v !== null && 'max' in (v as object)) {
      return clampPositiveInt(
        Number((v as { max?: unknown }).max),
        MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT
      );
    }
    if (typeof v === 'number') {
      return clampPositiveInt(v, MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT);
    }
    return MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT;
  } catch (e) {
    console.warn('getMaxOrdersPerCollectionSlotFromDb', e);
    return MAX_ORDERS_PER_COLLECTION_SLOT_DEFAULT;
  }
}

export async function setMaxOrdersPerCollectionSlotInDb(max: number): Promise<void> {
  if (!isServiceConfigured()) {
    throw new Error('Supabase service is not configured.');
  }
  const value = Math.max(1, Math.min(1000, Math.floor(max)));
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from('app_settings').upsert(
    {
      key: KEY_MAX_ORDERS_PER_SLOT,
      value: { max: value },
    },
    { onConflict: 'key' }
  );
  if (error) {
    throw error;
  }
}
