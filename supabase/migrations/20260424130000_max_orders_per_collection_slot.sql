-- Max online collection orders per 15-minute slot. Staff-editable; default 4. Does not clobber an existing value.
insert into public.app_settings (key, value)
values ('max_orders_per_collection_slot', jsonb_build_object('max', 4))
on conflict (key) do nothing;

comment on column public.app_settings.value is
  'Arbitrary JSON. Keys include online_ordering_paused: {"paused": bool}, max_orders_per_collection_slot: {"max": number}, etc.';
