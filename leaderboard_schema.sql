-- Leaderboard & Analytics Tracking

-- 1. Profile Views Tracking
CREATE TABLE IF NOT EXISTS public.analytics_page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if anon
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Referrals / Invites for Platform Growth
CREATE TABLE IF NOT EXISTS public.analytics_referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Time Tracking (add to profiles for simplicity of sorting leaderboard)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_time_seconds BIGINT DEFAULT 0;

-- 4. Enable RLS
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_referrals ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can insert page views (captured by server action or api)
CREATE POLICY "Public insert page views" 
ON public.analytics_page_views FOR INSERT 
WITH CHECK (true);

-- Referrals: Users can view their own referrals
CREATE POLICY "Users view own referrals" 
ON public.analytics_referrals FOR SELECT 
USING (auth.uid() = referrer_id);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON public.analytics_page_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.analytics_referrals(referrer_id);

-- 6. Helper Functions & Views
create or replace function increment_time_on_site(user_id uuid, seconds int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set total_time_seconds = coalesce(total_time_seconds, 0) + seconds
  where id = user_id;
end;
$$;

create or replace view leaderboard_invites_with_profiles as
select 
  r.referrer_id as user_id, 
  p.username,
  p.full_name,
  p.avatar_url,
  count(r.id) as invite_count
from public.analytics_referrals r
join public.profiles p on r.referrer_id = p.id
group by r.referrer_id, p.id
order by invite_count desc;

create or replace view leaderboard_views_with_profiles as
select 
  v.profile_id as user_id, 
  p.username,
  p.full_name,
  p.avatar_url,
  count(v.id) as view_count
from public.analytics_page_views v
join public.profiles p on v.profile_id = p.id
group by v.profile_id, p.id
order by view_count desc;
