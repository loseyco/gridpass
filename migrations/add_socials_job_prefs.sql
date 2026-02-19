
-- Add social_links and job_preferences columns to os_user_profiles
ALTER TABLE os_user_profiles
ADD COLUMN IF NOT EXISTS social_links JSONB,
ADD COLUMN IF NOT EXISTS job_preferences JSONB;

-- Migrate social_links and job_preferences from profiles
UPDATE os_user_profiles o
SET 
    social_links = p.social_links, 
    job_preferences = p.job_preferences
FROM profiles p
WHERE o.id = p.id
AND (p.social_links IS NOT NULL OR p.job_preferences IS NOT NULL);
