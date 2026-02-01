-- 1. Create Feature Votes table (for unique voting)
create table if not exists public.feature_votes (
    id uuid default gen_random_uuid() primary key,
    feature_id uuid references public.features(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(feature_id, user_id)
);

-- 2. RLS for feature_votes
alter table public.feature_votes enable row level security;

-- Allow users to view all votes (to see if they voted, though usually we filter)
create policy "Public can view votes" on public.feature_votes for select using (true);

-- Allow authenticated users to vote (insert their own)
create policy "Users can vote" on public.feature_votes for insert with check (auth.uid() = user_id);

-- Allow users to remove their vote
create policy "Users can remove vote" on public.feature_votes for delete using (auth.uid() = user_id);

-- 3. Trigger to update existing 'votes' column on features table
CREATE OR REPLACE FUNCTION update_feature_vote_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.features SET votes = votes + 1 WHERE id = NEW.feature_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.features SET votes = votes - 1 WHERE id = OLD.feature_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_feature_vote_count ON public.feature_votes;
CREATE TRIGGER tr_feature_vote_count
AFTER INSERT OR DELETE ON public.feature_votes
FOR EACH ROW
EXECUTE FUNCTION update_feature_vote_count();

-- 4. SECURITY FIX: Remove dangerous "authenticated users can update features" policy
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.features;

-- Add refined policy: Only Admins can update features
CREATE POLICY "Admins can manage features"
ON public.features
FOR UPDATE
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() 
    and profiles.role in ('superadmin', 'admin')
  )
);
