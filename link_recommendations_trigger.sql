-- Function to link past recommendations based on email
CREATE OR REPLACE FUNCTION link_past_recommendations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER -- Required to access auth.users
SET search_path = public -- Secure search path
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.id;

    -- If email found, update recommendations
    IF user_email IS NOT NULL THEN
        UPDATE recommendations
        SET author_id = NEW.id
        WHERE author_email = user_email
        AND author_id IS NULL; -- Only link if not already linked (though unlikely for anonymous)
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to run after profile creation
DROP TRIGGER IF EXISTS link_recommendations_trigger ON profiles;

CREATE TRIGGER link_recommendations_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION link_past_recommendations();
