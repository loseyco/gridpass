-- Create social_accounts table for storing Facebook/social linkage
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('facebook')),
    provider_id TEXT NOT NULL, -- The Facebook User ID or Page ID
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,
    name TEXT, -- The name of the User or Page/Group
    image_url TEXT,
    account_type TEXT CHECK (account_type IN ('user', 'page', 'group')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one provider_id per user
    UNIQUE(user_id, provider, provider_id)
);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to view and manage their own social accounts
DROP POLICY IF EXISTS "Users can manage their own social accounts" ON public.social_accounts;
CREATE POLICY "Users can manage their own social accounts"
ON public.social_accounts
FOR ALL
USING (auth.uid() = user_id);
