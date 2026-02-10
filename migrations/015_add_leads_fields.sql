-- Add source and status columns to leads table
alter table public.leads
add column if not exists source text default 'manual',
add column if not exists status text default 'new';

-- Add unique constraint to contact_info->username to prevent duplicates?
-- Maybe not, valid username is unique in profiles, but leads is loose.
-- We'll handle uniqueness in code for now.
