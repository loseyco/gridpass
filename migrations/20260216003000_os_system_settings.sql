-- Create table for storing system-wide settings (like automation tokens)
CREATE TABLE IF NOT EXISTS os_system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE os_system_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (no public access needed for tokens)
-- CREATE POLICY "Allow service role" ON os_system_settings FOR ALL USING (true);
