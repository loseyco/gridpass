-- Add new columns to profiles table for extended professional info

-- Skills array
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';

-- Resume URL
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS resume_url text;

-- Job Preferences (stored as JSONB for flexibility)
-- Structure: { "looking_for": "Full-time", "relocation": true, "availability": "Immediate", "notice_period": "2 weeks" }
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_preferences jsonb DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN profiles.skills IS 'List of professional skills';
COMMENT ON COLUMN profiles.resume_url IS 'URL to the uploaded resume file';
COMMENT ON COLUMN profiles.job_preferences IS 'Job search preferences and availability';
