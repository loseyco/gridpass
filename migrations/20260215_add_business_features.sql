-- Create org_services table
CREATE TABLE IF NOT EXISTS public.org_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create org_bookings table
CREATE TABLE IF NOT EXISTS public.org_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.org_services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    vehicle_info JSONB DEFAULT '{}'::jsonb,
    requested_date DATE,
    requested_time TIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rejected')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'n/a')),
    stripe_payment_intent_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create org_hours table
CREATE TABLE IF NOT EXISTS public.org_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.org_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_hours ENABLE ROW LEVEL SECURITY;

-- Policies for org_services
CREATE POLICY "Public services are viewable by everyone" 
ON public.org_services FOR SELECT USING (true);

CREATE POLICY "Owners can manage services" 
ON public.org_services FOR ALL USING (
    auth.uid() IN (SELECT claimed_by FROM public.organizations WHERE id = org_id)
);

-- Policies for org_bookings
CREATE POLICY "Owners can view/manage bookings" 
ON public.org_bookings FOR ALL USING (
    auth.uid() IN (SELECT claimed_by FROM public.organizations WHERE id = org_id)
);

CREATE POLICY "Anyone can create bookings" 
ON public.org_bookings FOR INSERT WITH CHECK (true);

-- Policies for org_hours
CREATE POLICY "Public hours are viewable by everyone" 
ON public.org_hours FOR SELECT USING (true);

CREATE POLICY "Owners can manage hours" 
ON public.org_hours FOR ALL USING (
    auth.uid() IN (SELECT claimed_by FROM public.organizations WHERE id = org_id)
);
