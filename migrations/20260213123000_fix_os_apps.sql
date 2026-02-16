-- Fix for os_apps table to ensure all columns exist
-- This handles the case where the table existed previously without these columns.

alter table public.os_apps add column if not exists description text;
alter table public.os_apps add column if not exists icon text;
alter table public.os_apps add column if not exists version text default '1.0.0';

-- Reload PostgREST schema cache to ensure API picks up changes
NOTIFY pgrst, 'reload schema';
