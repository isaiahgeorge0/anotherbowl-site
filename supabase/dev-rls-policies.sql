-- DEV ONLY: Temporary Supabase RLS policies for local/testing use.
-- NOT SAFE FOR PRODUCTION.
-- Replace with proper server-side/service-role auth and least-privilege policies before launch.
--
-- Why this is needed:
-- With Row Level Security (RLS) enabled, Postgres denies anon/authenticated client access by default
-- unless explicit policies exist for each operation (select/insert/update/delete). Without policies,
-- anon inserts/selects/updates will be blocked even if table permissions are otherwise granted.

-- Ensure RLS is enabled
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Clean up previous dev policies if re-running
drop policy if exists "dev_orders_anon_insert" on public.orders;
drop policy if exists "dev_orders_anon_select" on public.orders;
drop policy if exists "dev_orders_anon_update" on public.orders;
drop policy if exists "dev_order_items_anon_insert" on public.order_items;
drop policy if exists "dev_order_items_anon_select" on public.order_items;

-- orders: allow anonymous insert/select/update (DEV ONLY)
create policy "dev_orders_anon_insert"
on public.orders
for insert
to anon
with check (true);

create policy "dev_orders_anon_select"
on public.orders
for select
to anon
using (true);

create policy "dev_orders_anon_update"
on public.orders
for update
to anon
using (true)
with check (true);

-- order_items: allow anonymous insert/select (DEV ONLY)
create policy "dev_order_items_anon_insert"
on public.order_items
for insert
to anon
with check (true);

create policy "dev_order_items_anon_select"
on public.order_items
for select
to anon
using (true);
