-- Add metadata column to resume_leads table for flexible field storage
alter table public.resume_leads
add column if not exists metadata jsonb default '{}'::jsonb;
