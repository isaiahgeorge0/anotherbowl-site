import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

export type StaffRole = 'owner' | 'staff';

type StaffAuthResult =
  | {
      ok: true;
      userId: string;
      email: string | null;
      role: StaffRole;
      matchedBy: 'id' | 'user_id' | 'email' | 'metadata' | 'legacy_staff_key';
      duplicateEmailRows: number;
      source: 'supabase_session' | 'legacy_staff_key';
    }
  | { ok: false };

const canonicalizeStaffRole = (value: unknown): StaffRole | null => {
  if (typeof value !== 'string') return null;
  const role = value.trim().toLowerCase();
  if (role === 'owner') return 'owner';
  if (role === 'staff') return 'staff';
  return null;
};

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

  if (bearerToken) {
    const { data, error } = await supabaseServer.auth.getUser(bearerToken);
    if (!error && data.user) {
      const email = data.user.email?.toLowerCase() ?? '';
      const metadataRole = canonicalizeStaffRole(data.user.user_metadata?.role);

      try {
        // Service-role client is server-only and bypasses RLS for protected staff authorization lookups.
        const supabaseService = getSupabaseServiceClient();

        const lookupBy = async (column: string, value: string) => {
          const { data: staffRow, error: staffLookupError } = await supabaseService
            .from('staff_users')
            .select('*')
            .eq(column, value)
            .maybeSingle();
          if (staffLookupError) {
            // Some projects may use id/email while others use user_id/email.
            // Ignore missing-column lookup errors and continue fallback resolution.
            const message = staffLookupError.message?.toLowerCase() ?? '';
            const details = staffLookupError.details?.toLowerCase() ?? '';
            const missingColumn = message.includes(column) || details.includes(column);
            if (!missingColumn) {
              console.error('[staffAuth] staff_users lookup failed:', staffLookupError.message);
            }
            return null;
          }
          return staffRow;
        };

        // Prefer auth user id resolution first, then fallback to email.
        let staffRow = await lookupBy('id', data.user.id);
        let matchedBy: 'id' | 'user_id' | 'email' | null = staffRow ? 'id' : null;
        if (!staffRow) {
          staffRow = await lookupBy('user_id', data.user.id);
          if (staffRow) matchedBy = 'user_id';
        }
        let duplicateEmailRows = 0;
        if (!staffRow && email) {
          const { data: emailRows, error: emailLookupError } = await supabaseService
            .from('staff_users')
            .select('*')
            .eq('email', email);
          if (emailLookupError) {
            const message = emailLookupError.message?.toLowerCase() ?? '';
            const details = emailLookupError.details?.toLowerCase() ?? '';
            const missingColumn = message.includes('email') || details.includes('email');
            if (!missingColumn) {
              console.error('[staffAuth] staff_users email lookup failed:', emailLookupError.message);
            }
          } else {
            duplicateEmailRows = Math.max((emailRows?.length ?? 0) - 1, 0);
            if (emailRows?.length) {
              // Deterministic fallback when UID columns are unavailable/unmatched:
              // prefer canonical owner rows first, then staff.
              const sorted = [...emailRows].sort((a, b) => {
                const aRole = canonicalizeStaffRole(a?.role) === 'owner' ? 1 : 0;
                const bRole = canonicalizeStaffRole(b?.role) === 'owner' ? 1 : 0;
                return bRole - aRole;
              });
              staffRow = sorted[0];
              matchedBy = 'email';
            }
          }
        }

        const dbRole = canonicalizeStaffRole(staffRow?.role);
        if (dbRole) {
          const rowEmail = typeof staffRow?.email === 'string' ? staffRow.email : data.user.email ?? null;
          return {
            ok: true,
            userId: data.user.id,
            email: rowEmail,
            role: dbRole,
            matchedBy: matchedBy ?? 'email',
            duplicateEmailRows,
            source: 'supabase_session',
          };
        }
      } catch (lookupError) {
        console.error('[staffAuth] staff_users lookup exception:', lookupError);
      }

      if (metadataRole) {
        return {
          ok: true,
          userId: data.user.id,
          email: data.user.email ?? null,
          role: metadataRole,
          matchedBy: 'metadata',
          duplicateEmailRows: 0,
          source: 'supabase_session',
        };
      }

      return { ok: false };
    }
    if (error) {
      console.error('[staffAuth] token verification failed:', error.message);
    }
  }

  if (hasLegacyStaffKey(request)) {
    // Keep legacy auth as lowest privilege during migration.
    return {
      ok: true,
      userId: 'legacy-staff-key',
      email: null,
      role: 'staff',
      matchedBy: 'legacy_staff_key',
      duplicateEmailRows: 0,
      source: 'legacy_staff_key',
    };
  }

  return { ok: false };
};

export const unauthorizedStaffResponse = () =>
  NextResponse.json({ error: 'User does not have staff permissions' }, { status: 403 });

export const unauthorizedOwnerResponse = () =>
  NextResponse.json({ error: 'Owner permissions required' }, { status: 403 });

export const requireOwnerRequest = async (request: Request) => {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return { ok: false as const, response: unauthorizedStaffResponse() };
  if (auth.role !== 'owner') return { ok: false as const, response: unauthorizedOwnerResponse() };
  return { ok: true as const, auth };
};
