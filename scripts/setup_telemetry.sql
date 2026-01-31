-- Create Telemetry Table
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'iracing', 'system'
  data jsonb NOT NULL, -- { speed: 100, rpm: 5000 ... }
  captured_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON telemetry_snapshots(device_id);

-- Enable Realtime (Crucial for the dashboard to update live)
ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_snapshots;

-- RLS Policies
ALTER TABLE telemetry_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow public read (for shared dashboards) or authenticated read
CREATE POLICY "Enable read access for all users"
ON telemetry_snapshots FOR SELECT
USING (true);

-- Allow Service Role insert (API uses service role, so this is implicit, but good to be clear)
-- No explicit insert policy needed for Service Role, it bypasses RLS.
