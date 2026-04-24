# Supabase Production Security Plan

## 1) Current State Review

- **Anon key usage**
  - The app currently uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` for order inserts through server API routes.
  - This is acceptable for development/testing with permissive policies, but not sufficient by itself for production-grade access control.

- **Staff endpoint protection**
  - Staff-facing API reads/updates are currently gated by a temporary `STAFF_API_KEY` header check.
  - This is a transitional control and should be replaced by authenticated user identity + role checks.

- **Dev RLS posture**
  - `supabase/dev-rls-policies.sql` allows broad anonymous testing access.
  - These policies are explicitly for development/testing and are unsafe for production.

- **SQLite fallback**
  - SQLite fallback remains in place for resiliency during migration.
  - This should be retired after Supabase production flow is fully validated.

## 2) Production Security Requirements

### Customer Access

- Allow customer order creation via `POST /api/orders` only.
- Customer write path must always go through a server API route.
- Never expose Supabase service role key to client/browser.
- Enforce strict server-side payload validation (required fields, types, value ranges, allowed enums).
- Add request throttling/rate limiting and abuse controls (IP/session/device heuristics where possible).

### Staff Access

- Staff operations must require authenticated user identity.
- Replace header-only `STAFF_API_KEY` mechanism with real login/session flow.
- Restrict `GET /api/orders` and `PATCH /api/orders/:id` to authenticated staff users only.
- Apply role checks for staff/admin actions before database read/update operations.

### Database Security (Recommended Production RLS Model)

- `orders`
  - `INSERT`: server-managed only
  - `SELECT`: staff only
  - `UPDATE`: staff only

- `order_items`
  - `INSERT`: server-managed only
  - `SELECT`: staff only

Notes:
- Prefer policies based on authenticated role claims (`auth.uid()` + role mapping) rather than broad `anon` policies.
- Keep least-privilege defaults (deny by default, allow explicit operations only).

## 3) Service Role Usage Plan

- Service role key must only exist in secure server runtime environment variables.
- It should be used only in server-side code paths (API routes, server actions, background jobs).
- Do not expose service role key to browser/client bundles.
- Use service role only for operations that cannot be safely expressed through user-scoped RLS policies.

## 4) Deployment Safety Checklist

- Remove dev-open RLS policies before production rollout.
- Apply strict production RLS policies for `orders` and `order_items`.
- Rotate Supabase keys used during development/testing.
- Test production order insert/update flows end-to-end.
- Verify staff route/API protections with authenticated and unauthenticated scenarios.
- Confirm no sensitive keys are present in client-visible env vars.

## 5) Future Authentication Roadmap

- Implement Supabase Auth for staff login.
- Add role-based authorization (`staff`, `admin`) with explicit access rules.
- Replace static header key approach with token/session verification.
- Enforce staff role checks in both API routes and RLS policies.
- Add audit logging for sensitive staff actions (status updates, order reads/exports).
