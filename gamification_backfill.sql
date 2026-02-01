-- 1. Retroactive Signup Bonus (100 pts)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM profiles WHERE NOT EXISTS (
        SELECT 1 FROM point_transactions WHERE user_id = profiles.id AND reason = 'signup_bonus'
    ) LOOP
        PERFORM award_points(r.id, 100, 'signup_bonus');
    END LOOP;
END $$;

-- 2. Retroactive Founder Bonus (1000 pts)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Select users with Founder role
    FOR r IN 
        SELECT p.id 
        FROM profiles p
        LEFT JOIN roles r_role ON p.id = r_role.user_id AND r_role.role = 'Founder'
        WHERE (p.role = 'founder') -- Lowercase for enum match
        OR (r_role.role = 'Founder') -- Text column in roles table might be capitalized
        AND NOT EXISTS (
            SELECT 1 FROM point_transactions pt WHERE pt.user_id = p.id AND pt.reason = 'founder_bonus'
        )
    LOOP
        PERFORM award_points(r.id, 1000, 'founder_bonus');
    END LOOP;
END $$;

-- 3. Retroactive Profile Completion Bonus (250 pts)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT id 
        FROM profiles 
        WHERE (bio IS NOT NULL AND TRIM(bio) <> '')
        AND (avatar_url IS NOT NULL AND TRIM(avatar_url) <> '')
        AND NOT EXISTS (
            SELECT 1 FROM point_transactions pt WHERE pt.user_id = profiles.id AND pt.reason = 'profile_completion'
        )
    LOOP
        PERFORM award_points(r.id, 250, 'profile_completion');
    END LOOP;
END $$;
