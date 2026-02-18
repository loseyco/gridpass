
-- Add cover_url column to os_user_profiles
ALTER TABLE os_user_profiles
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Migrate cover_url data from profiles
UPDATE os_user_profiles o
SET cover_url = p.cover_url
FROM profiles p
WHERE o.id = p.id
AND p.cover_url IS NOT NULL;
