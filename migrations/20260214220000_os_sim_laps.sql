-- Create table for storing sim racing laps
CREATE TABLE IF NOT EXISTS os_sim_laps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game TEXT NOT NULL,
    track TEXT NOT NULL,
    car TEXT NOT NULL,
    lap_time NUMERIC NOT NULL,
    sector1 NUMERIC,
    sector2 NUMERIC,
    sector3 NUMERIC,
    fuel_used NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE os_sim_laps ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own laps" ON os_sim_laps
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own laps" ON os_sim_laps
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_os_sim_laps_user_timestamp ON os_sim_laps(user_id, timestamp DESC);
