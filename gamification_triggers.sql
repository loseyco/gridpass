-- Function to check for profile completion and award points
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if profile just became complete (Bio + Avatar populated)
    -- We check if previously it was incomplete (null/empty) and now it is complete
    IF (
        (OLD.bio IS NULL OR TRIM(OLD.bio) = '' OR OLD.avatar_url IS NULL OR TRIM(OLD.avatar_url) = '')
        AND 
        (NEW.bio IS NOT NULL AND TRIM(NEW.bio) <> '' AND NEW.avatar_url IS NOT NULL AND TRIM(NEW.avatar_url) <> '')
    ) THEN
        
        -- Check if bonus already awarded
        IF NOT EXISTS (
            SELECT 1 FROM point_transactions 
            WHERE user_id = NEW.id 
            AND reason = 'profile_completion'
        ) THEN
            PERFORM award_points(NEW.id, 250, 'profile_completion');
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- Trigger for Profile Completion
DROP TRIGGER IF EXISTS profile_completion_trigger ON profiles;

CREATE TRIGGER profile_completion_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_profile_completion();
