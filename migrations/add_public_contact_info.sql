-- Add public contact info columns
-- Description: Adds public_phone, public_email, show_public_phone, show_public_email to os_user_profiles and profiles

-- 1. Update os_user_profiles
ALTER TABLE public.os_user_profiles 
ADD COLUMN IF NOT EXISTS public_phone text,
ADD COLUMN IF NOT EXISTS public_email text,
ADD COLUMN IF NOT EXISTS show_public_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_public_email boolean DEFAULT false;

-- 2. Update profiles (legacy/sync) - optional but good for consistency if they are still used
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_phone text,
ADD COLUMN IF NOT EXISTS public_email text,
ADD COLUMN IF NOT EXISTS show_public_phone boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_public_email boolean DEFAULT false;
