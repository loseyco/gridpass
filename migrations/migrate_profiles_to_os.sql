
-- 1. Add missing columns to os_user_profiles
ALTER TABLE os_user_profiles 
ADD COLUMN IF NOT EXISTS target_role TEXT,
ADD COLUMN IF NOT EXISTS is_open_to_work BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- 2. Migrate basic data from profiles -> os_user_profiles
-- We use ON CONFLICT to update existing rows
INSERT INTO os_user_profiles (id, username, bio, avatar_url, target_role, is_open_to_work, cv_url)
SELECT 
    id, 
    username, 
    bio, 
    avatar_url, 
    role as target_role, -- map role to target_role
    COALESCE((job_preferences->>'is_open_to_work')::boolean, false),
    resume_url as cv_url
FROM profiles
ON CONFLICT (id) DO UPDATE SET
    bio = EXCLUDED.bio,
    avatar_url = EXCLUDED.avatar_url,
    target_role = EXCLUDED.target_role,
    is_open_to_work = EXCLUDED.is_open_to_work,
    cv_url = EXCLUDED.cv_url;

-- 3. Migrate Skills (Array -> Rows)
-- This is tricky in pure SQL for arrays, using UNNEST
INSERT INTO os_user_skills (user_id, skill, proficiency)
SELECT 
    p.id as user_id,
    s.skill,
    3 as proficiency -- Default proficiency
FROM profiles p
CROSS JOIN LATERAL unnest(p.skills) as s(skill)
ON CONFLICT DO NOTHING;
