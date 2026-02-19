
-- Add duration_type to os_gigs
ALTER TABLE os_gigs 
ADD COLUMN duration_type text NOT NULL DEFAULT 'event' 
CHECK (duration_type IN ('event', 'season', 'full_time', 'permanent', 'contract'));
