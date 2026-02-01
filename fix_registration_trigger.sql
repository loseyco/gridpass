-- 1. Safe Signup Bonus (Logs error but doesn't crash)
CREATE OR REPLACE FUNCTION award_signup_bonus()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Award 100 points for joining (Early Adopter / Signup Bonus)
    BEGIN
        PERFORM award_points(NEW.id, 100, 'signup_bonus');
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Signup bonus failed for user %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

-- 2. Robust Handle New User (Sets username, safe role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth 
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, username)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    'user', -- Matches 'user' enum label
    NEW.raw_user_meta_data->>'username'
  );
  
  -- Also ensure role exists in 'roles' table for future proofing
  BEGIN
      INSERT INTO public.roles (user_id, role)
      VALUES (NEW.id, 'Driver');
  EXCEPTION WHEN OTHERS THEN
      -- Ignore if already handled or logic fails
      NULL;
  END;

  RETURN NEW;
END;
$$;

-- 3. Re-enable Link Recommendations (it was disabled for testing)
ALTER TABLE public.profiles ENABLE TRIGGER link_recommendations_trigger;
