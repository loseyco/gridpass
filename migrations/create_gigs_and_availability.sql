
-- os_gigs: Short-term / Urgent needs
CREATE TABLE IF NOT EXISTS os_gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID, -- Keeping column but removing FK for now until os_organizations exists
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    role TEXT NOT NULL, -- "Suspension Mechanic", "Tire Specialist"
    description TEXT,
    location TEXT, -- "Daytona", "Shop"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    daily_rate NUMERIC,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled', 'completed')),
    requirements JSONB DEFAULT '[]'::jsonb, -- ["NASCAR License", "Passport"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- os_availability: User schedules
CREATE TABLE IF NOT EXISTS os_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES os_user_profiles(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('available', 'booked', 'unavailable')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE os_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_availability ENABLE ROW LEVEL SECURITY;

-- Policies for os_gigs
-- Everyone can view open gigs
CREATE POLICY "Anyone can view open gigs" ON os_gigs
    FOR SELECT USING (true);

-- Authenticated users can create gigs
CREATE POLICY "Authenticated users can create gigs" ON os_gigs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Creators can update their gigs
CREATE POLICY "Creators can update their gigs" ON os_gigs
    FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Policies for os_availability
-- Everyone can view availability (for matching)
CREATE POLICY "Anyone can view availability" ON os_availability
    FOR SELECT USING (true);

-- Users can manage their own availability
CREATE POLICY "Users can insert own availability" ON os_availability
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability" ON os_availability
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own availability" ON os_availability
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
