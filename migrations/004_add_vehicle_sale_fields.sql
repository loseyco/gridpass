-- Add sale fields to user_vehicles
ALTER TABLE public.user_vehicles 
ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS sale_description text;
