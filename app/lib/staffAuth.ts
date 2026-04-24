import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

type StaffAuthResult =
  | { ok: true; userId: string; source: 'supabase_session' | 'legacy_staff_key' }
  | { ok: false };

const STAFF_ROLES = new Set(['staff', 'admin', 'owner']);

const hasLegacyStaffKey = (request: Request) => {
  // DEPRECATED FALLBACK:
  // Keep temporary x-staff-key support during migration so staff pages remain operational.
  // Remove after all staff clients use Supabase session auth only.
  const expectedKey = process.env.STAFF_API_KEY;
  const providedKey = request.headers.get('x-staff-key');
  return Boolean(expectedKey && providedKey && expectedKey === providedKey);
};

export const authenticateStaffRequest = async (request: Request): Promise<StaffAuthResult> => {
  // Authentication checks identity (is this request tied to a real signed-in user?).
  // Authorization checks permission (does this user have an allowed staff role?).
  // Staff API access now enforces role-based authorization from Supabase user metadata.
  // Primary auth path: Supabase session token from Authorization: Bearer <access_token>.
  // This hardens staff API access without exposing server-only keys to the browser.
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  console.log('[staffAuth] bearer token received:', Boolean(bearerToken));

  if (bearerToken) {
    const { data, error } = await supabaseServer.auth.getUser(bearerToken);
    if (!error && data.user) {
      const email = data.user.email ?? '';
      console.log('[staffAuth] authenticated user email:', email || 'missing-email');
      const role = data.user.user_metadata?.role;
      if (typeof role === 'string' && STAFF_ROLES.has(role)) {
        console.log('[staffAuth] role authorized via user_metadata:', role);
        return { ok: true, userId: data.user.id, source: 'supabase_session' };
      }

      try {
        // Service-role client is server-only and bypasses RLS for protected staff authorization lookups.
        const supabaseService = getSupabaseServiceClient();
        const { data: staffRow, error: staffLookupError } = await supabaseService
          .from('staff_users')
          .select('role,email')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (staffLookupError) {
          console.error('[staffAuth] staff_users lookup failed:', staffLookupError.message);
        } else {
          const dbRole = staffRow?.role;
          console.log('[staffAuth] staff_users role lookup result:', dbRole ?? 'no-row');
          if (typeof dbRole === 'string' && STAFF_ROLES.has(dbRole)) {
            return { ok: true, userId: data.user.id, source: 'supabase_session' };
          }
        }
      } catch (lookupError) {
        console.error('[staffAuth] staff_users lookup exception:', lookupError);
      }

      console.log('[staffAuth] authorization denied: invalid or missing staff role');
      return { ok: false };
    }
    if (error) {
      console.error('[staffAuth] token verification failed:', error.message);
    }
  }

  if (hasLegacyStaffKey(request)) {
    console.log('[staffAuth] authorized via deprecated x-staff-key fallback');
    return { ok: true, userId: 'legacy-staff-key', source: 'legacy_staff_key' };
  }

  console.log('[staffAuth] authorization denied: no valid session or legacy key');
  return { ok: false };
};

export const unauthorizedStaffResponse = () =>
  NextResponse.json({ error: 'User does not have staff permissions' }, { status: 403 });
