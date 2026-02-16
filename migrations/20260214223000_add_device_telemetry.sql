-- Add telemetry column to os_devices for storing last known state
ALTER TABLE os_devices 
ADD COLUMN IF NOT EXISTS telemetry JSONB DEFAULT '{}'::jsonb;
