-- Supabase Storage setup for staff blog featured images.
-- Safe to run multiple times.
-- This creates a public bucket used by /staff/content image upload.

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update
set public = excluded.public;

-- Optional hardening notes:
-- - Staff uploads are performed server-side using service-role credentials,
--   so no additional insert policy is required for this app path.
-- - If you later allow direct browser uploads, add appropriate storage.objects policies.

