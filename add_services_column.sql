-- Add services column to profiles table for freelance offerings
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}';

COMMENT ON COLUMN profiles.services IS 'List of freelance services offered (e.g. Website Rebuild, SEO)';
