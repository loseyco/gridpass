
-- Add source_type to os_leads to distinguish between manual leads and profiles
ALTER TABLE os_leads
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'lead';

-- No data migration needed as default handles existing rows
