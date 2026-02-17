-- Add thumbnail column to incidents table
ALTER TABLE os_stewards_incidents
ADD COLUMN IF NOT EXISTS thumbnail TEXT;
