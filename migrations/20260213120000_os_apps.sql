-- GridPass OS App Registry Migration
-- Created: 2026-02-13
-- Description: Establishes the "App Store" registry for dynamic schemas.

create table if not exists public.os_apps (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon text, -- Lucide icon name or URL
  version text default '1.0.0',
  schema jsonb not null, -- The GridRenderer schema
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.os_apps enable row level security;

-- Policies: Everyone can read apps, only admins (service role) can write for now
create policy "Public apps are viewable by everyone."
  on public.os_apps for select
  using ( true );

-- Index for fast lookup by slug
create index if not exists os_apps_slug_idx on public.os_apps (slug);
