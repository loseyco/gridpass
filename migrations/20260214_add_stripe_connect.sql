-- Add Stripe Connect fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed boolean DEFAULT false;

-- Add index for stripe_account_id lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_account_id ON organizations(stripe_account_id);
