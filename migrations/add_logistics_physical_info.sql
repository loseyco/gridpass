
-- Add logistics/physical info columns to os_user_profiles
ALTER TABLE os_user_profiles
ADD COLUMN IF NOT EXISTS logistics_info JSONB,
ADD COLUMN IF NOT EXISTS physical_info JSONB;

-- Migrate logistics and physical info from profiles
UPDATE os_user_profiles o
SET 
    logistics_info = p.logistics_info, 
    physical_info = p.physical_info
FROM profiles p
WHERE o.id = p.id
AND (p.logistics_info IS NOT NULL OR p.physical_info IS NOT NULL);
