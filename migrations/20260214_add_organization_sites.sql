-- Organization Micro-Sites Migration
-- Created: 2026-02-14
-- Description: Adds micro-site capabilities to organizations

-- 1. Extend organizations table with site fields
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS site_schema JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS site_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS site_template TEXT CHECK (site_template IN ('auto_detailer', 'race_shop', 'collector', 'custom'));

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Generate slugs for existing organizations (simple lowercase + hyphen version)
UPDATE public.organizations 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 2. Organization Services/Packages Table
CREATE TABLE IF NOT EXISTS public.org_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Basic Package", "Premium Detailing"
  description TEXT,
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view services"
  ON public.org_services FOR SELECT
  USING (true);

CREATE POLICY "Org owners can manage services"
  ON public.org_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_services_org_id ON public.org_services(org_id);

-- 3. Organization Bookings Table
CREATE TABLE IF NOT EXISTS public.org_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.org_services(id) ON DELETE SET NULL,
  
  -- Customer Info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Booking Details
  preferred_date DATE,
  preferred_time TEXT,
  vehicle_info JSONB DEFAULT '{}'::jsonb, -- { make, model, year, notes }
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view their bookings"
  ON public.org_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON public.org_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org owners can update bookings"
  ON public.org_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_bookings_org_id ON public.org_bookings(org_id);
CREATE INDEX IF NOT EXISTS idx_org_bookings_status ON public.org_bookings(status);

-- 4. Organization Gallery Table
CREATE TABLE IF NOT EXISTS public.org_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  category TEXT, -- e.g., "before", "after", "process"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gallery"
  ON public.org_gallery FOR SELECT
  USING (true);

CREATE POLICY "Org owners can manage gallery"
  ON public.org_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_gallery_org_id ON public.org_gallery(org_id);

-- 5. Organization Hours Table
CREATE TABLE IF NOT EXISTS public.org_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT, -- e.g., "By appointment only"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, day_of_week)
);

ALTER TABLE public.org_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hours"
  ON public.org_hours FOR SELECT
  USING (true);

CREATE POLICY "Org owners can manage hours"
  ON public.org_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_hours_org_id ON public.org_hours(org_id);

-- 6. Organization Social Links Table
CREATE TABLE IF NOT EXISTS public.org_social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'linkedin', 'website')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, platform)
);

ALTER TABLE public.org_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view social links"
  ON public.org_social_links FOR SELECT
  USING (true);

CREATE POLICY "Org owners can manage social links"
  ON public.org_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = org_id AND claimed_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_social_links_org_id ON public.org_social_links(org_id);
