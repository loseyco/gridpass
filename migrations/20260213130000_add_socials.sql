-- Add social fields to os_user_profiles
alter table public.os_user_profiles 
add column if not exists social_links jsonb default '{}'::jsonb,
add column if not exists website text;

-- Notify to reload schema cache
NOTIFY pgrst, 'reload schema';
