-- Add lead_status and notes to organizations table

-- Create enum for lead status if it doesn't exist (or just use check constraint which is easier to manage in migrations sometimes)
-- Using check constraint for simplicity in direct SQL execution
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'prospect' CHECK (lead_status IN ('prospect', 'contacted', 'interested', 'client', 'rejected')),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_organizations_lead_status ON public.organizations(lead_status);
