-- GridPass Motorsports - Device Management & Telemetry
-- Migration: Create initial device and command tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DEVICE MANAGEMENT (GridPass OS App)
-- ============================================

-- Supported games (iRacing first, multi-game ready)
CREATE TABLE IF NOT EXISTS os_sim_racing_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  developer TEXT,
  api_integration BOOLEAN DEFAULT false,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tracks (multi-game)
CREATE TABLE IF NOT EXISTS os_sim_racing_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES os_sim_racing_games(id) ON DELETE CASCADE,
  external_id TEXT, -- Game's internal ID
  name TEXT NOT NULL,
  location TEXT,
  country TEXT,
  track_type TEXT, -- 'Road', 'Oval', 'Dirt'
  length_meters DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, external_id)
);

-- Track configurations (different layouts)
CREATE TABLE IF NOT EXISTS os_sim_racing_track_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES os_sim_racing_tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  external_id TEXT,
  length_meters DECIMAL,
  turns INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cars (multi-game)
CREATE TABLE IF NOT EXISTS os_sim_racing_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES os_sim_racing_games(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  manufacturer TEXT,
  class TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, external_id)
);

-- ============================================
-- DEVICE MANAGEMENT
-- ============================================

-- Registered devices (Windows PCs with GridPass Client installed)
CREATE TABLE IF NOT EXISTS os_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hardware_fingerprint TEXT UNIQUE NOT NULL,
  
  -- PC Info
  cpu_model TEXT,
  ram_gb INTEGER,
  gpu_model TEXT,
  os_version TEXT,
  
  -- Status
  status TEXT DEFAULT 'offline', -- 'online', 'offline', 'error'
  last_heartbeat TIMESTAMPTZ,
  client_version TEXT,
  ip_address INET,
  
  -- Settings
  remote_access_enabled BOOLEAN DEFAULT false,
  
  -- Enabled modules
  modules_enabled JSONB DEFAULT '{"sim_racing": true, "file_sync": false, "real_telemetry": false}'::JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster device lookups
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON os_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON os_devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_hardware ON os_devices(hardware_fingerprint);

-- ============================================
-- COMMAND EXECUTION
-- ============================================

-- Remote commands sent to devices
CREATE TABLE IF NOT EXISTS os_device_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES os_devices(id) ON DELETE CASCADE,
  issued_by UUID REFERENCES auth.users(id),
  
  command_type TEXT NOT NULL, -- 'enter_car', 'reset_car', 'ignition', etc.
  parameters JSONB DEFAULT '{}',
  
  status TEXT DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed'
  result JSONB,
  error_message TEXT,
  execution_log JSONB[] DEFAULT ARRAY[]::JSONB[], -- Array of log entries
  
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Index for polling pending commands
CREATE INDEX IF NOT EXISTS idx_commands_device_status ON os_device_commands(device_id, status);
CREATE INDEX IF NOT EXISTS idx_commands_created ON os_device_commands(created_at DESC);

-- ============================================
-- TELEMETRY & SESSIONS
-- ============================================

-- Racing sessions (time in sim)
CREATE TABLE IF NOT EXISTS os_device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES os_devices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  game_id UUID REFERENCES os_sim_racing_games(id),
  track_id UUID REFERENCES os_sim_racing_tracks(id),
  track_config_id UUID REFERENCES os_sim_racing_track_configs(id),
  car_id UUID REFERENCES os_sim_racing_cars(id),
  
  session_type TEXT, -- 'Practice', 'Qualify', 'Race'
  
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_laps INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_device ON os_device_sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON os_device_sessions(user_id);

-- Lap times and telemetry
CREATE TABLE IF NOT EXISTS os_device_laps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES os_device_sessions(id) ON DELETE CASCADE,
  device_id UUID REFERENCES os_devices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  game_id UUID REFERENCES os_sim_racing_games(id),
  track_id UUID REFERENCES os_sim_racing_tracks(id),
  track_config_id UUID REFERENCES os_sim_racing_track_configs(id),
  car_id UUID REFERENCES os_sim_racing_cars(id),
  
  lap_number INTEGER,
  lap_time_ms INTEGER, -- Milliseconds
  sector_times INTEGER[], -- Array of sector times in ms
  
  -- Telemetry snapshot
  top_speed_kph DECIMAL,
  avg_speed_kph DECIMAL,
  incidents INTEGER DEFAULT 0,
  
  -- Metadata
  weather_conditions JSONB,
  setup_name TEXT,
  
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_laps_session ON os_device_laps(session_id);
CREATE INDEX IF NOT EXISTS idx_laps_user ON os_device_laps(user_id);
CREATE INDEX IF NOT EXISTS idx_laps_track_car ON os_device_laps(track_id, car_id);
CREATE INDEX IF NOT EXISTS idx_laps_time ON os_device_laps(lap_time_ms);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE os_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_device_laps ENABLE ROW LEVEL SECURITY;

-- Devices: Users can only see/edit their own devices
CREATE POLICY "Users can view own devices"
  ON os_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON os_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON os_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON os_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Commands: Users can only command their own devices
CREATE POLICY "Users can view commands for own devices"
  ON os_device_commands FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM os_devices WHERE id = device_id
    )
  );

CREATE POLICY "Users can send commands to own devices"
  ON os_device_commands FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM os_devices WHERE id = device_id
    )
  );

-- Sessions & Laps: Users can view their own data
CREATE POLICY "Users can view own sessions"
  ON os_device_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON os_device_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own laps"
  ON os_device_laps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own laps"
  ON os_device_laps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public read access to game content tables
ALTER TABLE os_sim_racing_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_sim_racing_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_sim_racing_track_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_sim_racing_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view games"
  ON os_sim_racing_games FOR SELECT
  USING (true);

CREATE POLICY "Public can view tracks"
  ON os_sim_racing_tracks FOR SELECT
  USING (true);

CREATE POLICY "Public can view track configs"
  ON os_sim_racing_track_configs FOR SELECT
  USING (true);

CREATE POLICY "Public can view cars"
  ON os_sim_racing_cars FOR SELECT
  USING (true);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert iRacing as first game
INSERT INTO os_sim_racing_games (name, slug, developer, api_integration)
VALUES ('iRacing', 'iracing', 'iRacing.com Motorsport Simulations', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FUNCTIONS (for convenience)
-- ============================================

-- Function to update device heartbeat
CREATE OR REPLACE FUNCTION update_device_heartbeat(device_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE os_devices
  SET 
    last_heartbeat = now(),
    status = 'online',
    updated_at = now()
  WHERE id = device_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending commands for a device
CREATE OR REPLACE FUNCTION get_pending_commands(device_id_param UUID)
RETURNS TABLE (
  id UUID,
  command_type TEXT,
  parameters JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.command_type,
    c.parameters,
    c.created_at
  FROM os_device_commands c
  WHERE c.device_id = device_id_param
    AND c.status = 'pending'
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
