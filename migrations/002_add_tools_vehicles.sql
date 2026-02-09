-- Add Tools and Vehicles to Profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tools TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vehicles TEXT[] DEFAULT '{}';

-- Comment on columns
COMMENT ON COLUMN public.profiles.tools IS 'List of tools/equipment owned by the user (e.g. Impact Wrench, Scales)';
COMMENT ON COLUMN public.profiles.vehicles IS 'List of vehicles owned by the user (e.g. Ford F-350, Trailer)';
