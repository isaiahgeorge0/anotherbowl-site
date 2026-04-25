-- Ordering System Relational Schema (Supabase/PostgreSQL)
--
-- Notes:
-- 1) SQLite remains in the app as local/development storage for now.
-- 2) Supabase/PostgreSQL is the intended production storage layer.
-- 3) Staff authentication/authorization must be added before launch.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  price numeric not null check (price >= 0),
  category_id text not null references public.categories(id),
  is_active boolean not null default true,
  display_order integer not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Backfill: existing projects created before these columns were added
alter table public.products
add column if not exists description text not null default '';
alter table public.products
add column if not exists category_id text references public.categories(id);
alter table public.products
add column if not exists display_order integer not null default 0;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  email text not null,
  phone text,
  order_type text not null check (order_type in ('collection', 'table')),
  table_number text,
  collection_time text,
  total numeric not null,
  status text not null default 'new',
  payment_status text not null default 'pending',
  notes text,
  receipt_snapshot jsonb,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists receipt_snapshot jsonb;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id text,
  item_name text not null,
  price numeric not null,
  quantity integer not null,
  line_total numeric not null,
  modifiers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_products_category_id on public.products(category_id);

-- Key/value settings (e.g. `online_ordering_paused`). Read/write from API with service role.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null
);
