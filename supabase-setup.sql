-- Run this in Supabase Dashboard -> SQL Editor.
-- The server accesses this table with the service_role key; never expose that key in browser code.
create table if not exists public.site_content (
  id text primary key,
  html text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
-- Do not add public policies. Server-side service_role access bypasses RLS.

-- Create a Storage bucket named `icmes-media` in Dashboard -> Storage.
-- Set the bucket to Public so website visitors can see uploaded images/files.
