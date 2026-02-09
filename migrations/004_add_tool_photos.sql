-- Add photo_url column to user_tools table
ALTER TABLE public.user_tools 
ADD COLUMN IF NOT EXISTS photo_url text;
