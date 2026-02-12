-- Migration: Add Pre-Auth Payment Support to Resume Leads
-- This migration adds columns needed for the new pre-authorization payment flow

-- Add user_id to link resume leads to user accounts (created after payment)
ALTER TABLE resume_leads 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add stripe_payment_intent_id to track the payment intent for capture
ALTER TABLE resume_leads 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Update payment_status to include 'authorized' state
ALTER TABLE resume_leads 
  DROP CONSTRAINT IF EXISTS resume_leads_payment_status_check;
  
ALTER TABLE resume_leads
  ADD CONSTRAINT resume_leads_payment_status_check 
  CHECK (payment_status IN ('unpaid', 'authorized', 'paid', 'refunded', 'failed'));

-- Add index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_leads_user_id ON resume_leads(user_id);

-- Add index on payment_intent_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_resume_leads_payment_intent ON resume_leads(stripe_payment_intent_id);

-- Add comment
COMMENT ON COLUMN resume_leads.user_id IS 'User account created after payment authorization';
COMMENT ON COLUMN resume_leads.stripe_payment_intent_id IS 'Stripe Payment Intent ID for manual capture';
