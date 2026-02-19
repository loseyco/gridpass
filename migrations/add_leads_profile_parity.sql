
-- Add Profile Parity fields to os_leads
ALTER TABLE os_leads
ADD COLUMN IF NOT EXISTS logistics_info JSONB, -- For passport, airport, etc.
ADD COLUMN IF NOT EXISTS physical_info JSONB, -- For gear sizes
ADD COLUMN IF NOT EXISTS social_links JSONB, -- For full social media map
ADD COLUMN IF NOT EXISTS work_history JSONB; -- For career history (stored as JSON array in leads for simplicity)

-- Note: os_leads already has resumes, salary, etc.
-- This ensures we can store the "entire profile" before they sign up.
