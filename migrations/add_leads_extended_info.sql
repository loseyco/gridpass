
-- Add extended recruitment fields to os_leads
ALTER TABLE os_leads
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS availability TEXT, -- e.g., "Immediate", "2 weeks notice", "YYYY-MM-DD"
ADD COLUMN IF NOT EXISTS relocation_prefs JSONB; -- { "willing": true, "locations": ["US", "Europe"] }

-- Add contact_phone to contact_info if not relying on JSONB structure alone, 
-- but os_leads.contact_info is already JSONB, so we can store phone/email there.
