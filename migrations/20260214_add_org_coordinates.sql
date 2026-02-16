-- Add coordinates to organizations table
ALTER TABLE organizations 
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;

-- Create index for faster location queries (optional but good practice)
CREATE INDEX idx_organizations_location ON organizations (latitude, longitude);

-- Grant access (if needed, though standard RLS usually covers columns on existing tables)
