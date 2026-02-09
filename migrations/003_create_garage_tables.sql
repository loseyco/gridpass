-- Create Vehicles Table
CREATE TABLE IF NOT EXISTS public.user_vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL, -- Sim Rig, Race Car, Trailer, etc.
  year smallint,
  make text,
  model text,
  photo_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create Tools Table
CREATE TABLE IF NOT EXISTS public.user_tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  category text, -- Hand Tools, Setup, Electronics
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies (Assuming basic authenticated access for now)
ALTER TABLE public.user_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vehicles" ON public.user_vehicles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tools" ON public.user_tools
  FOR ALL USING (auth.uid() = user_id);

-- Public Read Access (for Profile Page)
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_vehicles
  FOR SELECT USING (true);

CREATE POLICY "Public profiles are viewable by everyone" ON public.user_tools
  FOR SELECT USING (true);
