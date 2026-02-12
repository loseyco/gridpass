-- Add payment tracking fields to resume_leads
alter table public.resume_leads 
add column if not exists payment_status text default 'unpaid', -- 'unpaid', 'authorized', 'paid'
add column if not exists stripe_payment_intent text;

-- Index for faster lookups if needed (though we currently lookup by ID usually)
-- create index if not exists idx_resume_leads_payment_status on public.resume_leads(payment_status);
