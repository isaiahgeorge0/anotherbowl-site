-- Operational key/value store (pause flags, feature toggles, etc.). Prefer updating via
-- service-role server APIs; browser clients have limited read access where explicitly allowed.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Older schema snapshots may have created this table with only (key, value). Bring them forward.
alter table public.app_settings add column if not exists updated_at timestamptz not null default now();
alter table public.app_settings
  alter column value set default '{}'::jsonb;

comment on table public.app_settings is
  'Server-managed operational settings (e.g. pausing online ordering for customers). Exposed to anonymous/authenticated clients only for keys with explicit RLS; writes use the service role from trusted APIs.';

comment on column public.app_settings.key is
  'Stable string identifier (e.g. online_ordering_paused).';
comment on column public.app_settings.value is
  'Arbitrary JSON payload. For online_ordering_paused, use shape {"paused": boolean}.';
comment on column public.app_settings.updated_at is
  'Last time this row was updated (set at insert; refresh via app if you add triggers later).';

insert into public.app_settings (key, value)
values ('online_ordering_paused', jsonb_build_object('paused', false))
on conflict (key) do nothing;
-- Re-runs: leave existing value (e.g. already toggled in production) unchanged.

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read_online_ordering_paused" on public.app_settings;

create policy "app_settings_public_read_online_ordering_paused"
  on public.app_settings
  for select
  to anon, authenticated
  using (key = 'online_ordering_paused');

-- Intentional: no insert/update/delete policies for anon or authenticated. Service role bypasses RLS.
