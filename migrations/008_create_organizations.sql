-- Create organizations table (Business Directory)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('shop', 'team', 'club', 'track', 'service')),
    description TEXT,
    location TEXT, -- formatted address or city/state
    coordinates POINT, -- optional for map
    website TEXT,
    contact_email TEXT,
    phone TEXT,
    logo_url TEXT,
    
    -- Claiming & Ownership
    claimed_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_claim', 'verified', 'archived')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Everyone can view active organizations
CREATE POLICY "Public can view active organizations" 
ON public.organizations FOR SELECT 
USING (status IN ('active', 'verified', 'pending_claim'));

-- 2. Authenticated users can create new organizations (for now, or maybe admin only?)
-- Let's allow users to "Suggest" a business, effectively creating it.
CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Owner can update their own organization
CREATE POLICY "Owners can update their organization" 
ON public.organizations FOR UPDATE 
TO authenticated 
USING (auth.uid() = claimed_by);

-- 4. Service Role (Admin) has full access
-- (Implicit if using service role key, but explicit policy for admin users if we have an admin role)
-- Assuming we stick to standard Supabase patterns where service_role bypasses RLS.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_claimed_by ON public.organizations(claimed_by);
